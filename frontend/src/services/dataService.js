/**
 * Unified Data Service Layer
 * Intelligently routes operations between Firebase (real-time) and MongoDB (complex operations)
 * Provides a single interface for all CRUD operations
 */

import { userAPI, shiftAPI, leaveAPI, analyticsAPI } from './api';
import { firebaseUserService, firebaseShiftService, firebaseLeaveService } from './firebaseService';
import { AutoAssignService } from './autoAssignService';
import quotaService from './quotaService';
import toast from 'react-hot-toast';

// Configuration for which operations use which service
const SERVICE_CONFIG = {
    // Use Firebase as primary, MongoDB as fallback
    users: {
        create: 'firebase',     // Firebase first for real-time
        read: 'firebase',       // Firebase first for real-time
        update: 'firebase',     // Firebase first for real-time
        delete: 'firebase',     // Firebase first for real-time
        realtime: 'firebase'    // Live updates
    },
    shifts: {
        create: 'firebase',     // Firebase first for real-time
        read: 'firebase',       // Firebase first for real-time
        update: 'firebase',     // Firebase first for real-time
        delete: 'firebase',     // Firebase first for real-time
        assign: 'firebase',     // Firebase first for real-time
        realtime: 'firebase'    // Live shift updates
    },
    leaves: {
        create: 'firebase',     // Firebase first for real-time
        read: 'firebase',       // Firebase first for real-time
        update: 'firebase',     // Firebase first for real-time
        delete: 'firebase',     // Firebase first for real-time
        approve: 'firebase',     // Firebase first for real-time
        realtime: 'firebase'    // Live status updates
    }
};

class DataService {
    constructor() {
        this.mongoAvailable = true;
        this.firebaseAvailable = true;
        this.checkServices();
    }

    async checkServices() {
        try {
            // Test Firebase connection first (primary service)
            if (firebaseUserService && typeof firebaseUserService.getAll === 'function') {
                this.firebaseAvailable = true;
                console.log('✅ Firebase service available (primary)');
            } else {
                throw new Error('Firebase service not properly initialized');
            }
        } catch (error) {
            console.warn('❌ Firebase service unavailable, falling back to MongoDB');
            this.firebaseAvailable = false;
        }

        // Skip MongoDB test to avoid CORS issues
        this.mongoAvailable = false;
        console.log('ℹ️ MongoDB service disabled (no backend server)');
    }

    // Method to populate Firebase from MongoDB (for initial setup)
    async populateFirebaseFromMongoDB(entity, limit = 10) {
        if (!this.mongoAvailable || !this.firebaseAvailable) {
            console.warn(`Cannot populate Firebase: MongoDB(${this.mongoAvailable}) Firebase(${this.firebaseAvailable})`);
            return;
        }

        try {
            console.log(`🔄 Populating Firebase ${entity} from MongoDB...`);
            const mongoService = this.getMongoService(entity);
            const data = await mongoService.getAll({ limit });

            // Get the actual data array from the response
            const items = data.users || data.shifts || data.leaveRequests || data.data || data;

            if (Array.isArray(items) && items.length > 0) {
                // Sync each item individually to avoid overwhelming Firebase
                for (const item of items.slice(0, 5)) { // Limit to 5 items to avoid rate limits
                    await this.syncToFirebase(entity, item, false);
                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                console.log(`✅ Populated ${Math.min(items.length, 5)} ${entity} items to Firebase`);
            }
        } catch (error) {
            console.warn(`Failed to populate Firebase ${entity}:`, error.message);
        }
    }

    getService(entity, operation) {
        const config = SERVICE_CONFIG[entity];
        if (!config) throw new Error(`Unknown entity: ${entity}`);

        const preferredService = config[operation];

        // Fallback logic - prioritize Firebase
        if (preferredService === 'firebase' && !this.firebaseAvailable) {
            return 'mongodb';
        }
        if (preferredService === 'mongodb' && !this.mongoAvailable) {
            return 'firebase';
        }

        return preferredService;
    }

    async syncToFirebase(entity, data, showToast = false) {
        if (!this.firebaseAvailable) return;

        try {
            const firebaseService = this.getFirebaseService(entity);

            // Clean the data for Firebase (remove MongoDB-specific fields)
            const cleanData = this.cleanDataForFirebase(data);

            if (data.id || data._id) {
                // Update existing
                await firebaseService.update(data.id || data._id, cleanData);
            } else {
                // Create new
                await firebaseService.create(cleanData);
            }
        } catch (error) {
            console.warn(`Failed to sync ${entity} to Firebase:`, error.message);
            if (showToast) {
                // Only show toast for critical sync failures, not during bulk operations
                toast.error(`Failed to sync ${entity} data`);
            }
        }
    }

    cleanDataForFirebase(data) {
        if (!data) return data;

        // Remove MongoDB-specific fields and clean the data
        const cleaned = { ...data };
        delete cleaned._id;
        delete cleaned.__v;
        delete cleaned.createdAt;
        delete cleaned.updatedAt;

        // Ensure we have an id field for Firebase
        if (data._id && !cleaned.id) {
            cleaned.id = data._id.toString();
        }

        return cleaned;
    }

    getMongoService(entity) {
        switch (entity) {
            case 'users': return userAPI;
            case 'shifts': return shiftAPI;
            case 'leaves': return leaveAPI;
            default: throw new Error(`Unknown entity: ${entity}`);
        }
    }

    getFirebaseService(entity) {
        switch (entity) {
            case 'users': return firebaseUserService;
            case 'shifts': return firebaseShiftService;
            case 'leaves': return firebaseLeaveService;
            default: throw new Error(`Unknown entity: ${entity}`);
        }
    }

    // Generic CRUD operations
    async create(entity, data) {
        const serviceType = this.getService(entity, 'create');

        try {
            let result;

            if (serviceType === 'mongodb') {
                const mongoService = this.getMongoService(entity);
                result = await mongoService.create(data);

                // Sync to Firebase for real-time updates (only show toast on critical failures)
                await this.syncToFirebase(entity, result, false);
            } else {
                const firebaseService = this.getFirebaseService(entity);
                result = await firebaseService.create(data);
            }

            return result;
        } catch (error) {
            console.error(`Error creating ${entity}:`, error);
            throw error;
        }
    }

    async getAll(entity, filters = {}) {
        const serviceType = this.getService(entity, 'read');

        // Skip Firebase operations if quota is exceeded
        if (serviceType === 'firebase' && quotaService.isQuotaExceeded()) {
            console.warn('Skipping Firebase operation due to quota exceeded');
            return [];
        }

        try {
            if (serviceType === 'mongodb') {
                const mongoService = this.getMongoService(entity);
                const response = await mongoService.getAll(filters);
                // Handle different response formats
                return response.users || response.shifts || response.leaveRequests || response.data || response;
            } else {
                const firebaseService = this.getFirebaseService(entity);
                return await firebaseService.getAll(filters);
            }
        } catch (error) {
            console.error(`Error fetching ${entity}:`, error);

            // Handle Firebase quota exceeded error
            if (quotaService.handleQuotaError(error)) {
                console.warn('Firebase quota exceeded, returning empty data');
                return [];
            }

            // Return empty data structure instead of throwing
            if (entity === 'shifts') return [];
            if (entity === 'users') return [];
            if (entity === 'leaves') return [];
            return [];
        }
    }

    async getById(entity, id) {
        const serviceType = this.getService(entity, 'read');

        try {
            if (serviceType === 'mongodb') {
                const mongoService = this.getMongoService(entity);
                return await mongoService.getById(id);
            } else {
                const firebaseService = this.getFirebaseService(entity);
                return await firebaseService.getById(id);
            }
        } catch (error) {
            console.error(`Error fetching ${entity} by ID:`, error);
            throw error;
        }
    }

    async update(entity, id, data) {
        const serviceType = this.getService(entity, 'update');

        try {
            let result;

            if (serviceType === 'mongodb') {
                const mongoService = this.getMongoService(entity);
                result = await mongoService.update(id, data);

                // Sync to Firebase (only show toast on critical failures)
                await this.syncToFirebase(entity, { ...result, id }, false);
            } else {
                const firebaseService = this.getFirebaseService(entity);
                result = await firebaseService.update(id, data);
            }

            return result;
        } catch (error) {
            console.error(`Error updating ${entity}:`, error);
            throw error;
        }
    }

    async delete(entity, id) {
        console.log(`DataService: Starting delete for entity: ${entity}, id: ${id}`);
        const serviceType = this.getService(entity, 'delete');
        console.log(`DataService: Service type: ${serviceType}`);

        // Skip Firebase operations if quota is exceeded
        if (serviceType === 'firebase' && quotaService.isQuotaExceeded()) {
            console.warn('Skipping Firebase delete operation due to quota exceeded');
            throw new Error('Firebase quota exceeded. Cannot delete at this time.');
        }

        try {
            if (serviceType === 'mongodb') {
                console.log('DataService: Using MongoDB service for deletion');
                const mongoService = this.getMongoService(entity);
                await mongoService.delete(id);

                // Sync deletion to Firebase
                if (this.firebaseAvailable) {
                    try {
                        const firebaseService = this.getFirebaseService(entity);
                        await firebaseService.delete(id);
                    } catch (error) {
                        console.warn('Failed to sync deletion to Firebase:', error);
                    }
                }
            } else {
                console.log('DataService: Using Firebase service for deletion');
                const firebaseService = this.getFirebaseService(entity);
                console.log('DataService: Firebase service:', firebaseService);
                console.log('DataService: Calling firebaseService.delete with id:', id);
                const result = await firebaseService.delete(id);
                console.log('DataService: Firebase delete result:', result);
            }

            console.log(`DataService: Successfully deleted ${entity} with id: ${id}`);
            return id;
        } catch (error) {
            console.error(`DataService: Error deleting ${entity}:`, error);
            console.error(`DataService: Error details:`, {
                entity,
                id,
                message: error.message,
                code: error.code,
                stack: error.stack
            });

            // Handle Firebase quota exceeded error
            if (quotaService.handleQuotaError(error)) {
                console.warn('Firebase quota exceeded during deletion');
                throw new Error('Firebase quota exceeded. Please try again later.');
            }

            throw error;
        }
    }

    // Real-time subscriptions (always use Firebase)
    subscribe(entity, callback, filters = {}) {
        if (!this.firebaseAvailable) {
            console.warn('Firebase not available for real-time updates');
            return null;
        }

        const firebaseService = this.getFirebaseService(entity);
        return firebaseService.subscribe(callback, filters);
    }

    unsubscribe(listenerId) {
        if (this.firebaseAvailable) {
            const firebaseService = this.getFirebaseService('users'); // Any service works for unsubscribe
            firebaseService.unsubscribe?.(listenerId);
        }
    }
}

// Create singleton instance
const dataService = new DataService();

// Specific service interfaces
export const userService = {
    create: (userData) => dataService.create('users', userData),
    getAll: (filters) => dataService.getAll('users', filters),
    getById: (id) => dataService.getById('users', id),
    update: (id, userData) => dataService.update('users', id, userData),
    delete: (id) => dataService.delete('users', id),
    subscribe: (callback, filters) => dataService.subscribe('users', callback, filters),

    // User-specific methods
    async getByDepartment(department) {
        try {
            if (dataService.mongoAvailable) {
                return await userAPI.getByDepartment(department);
            } else {
                return await firebaseUserService.getByDepartment(department);
            }
        } catch (error) {
            console.error('Error getting users by department:', error);
            throw error;
        }
    },

    async updateWorkload(id, hoursWorked) {
        try {
            if (dataService.mongoAvailable) {
                return await userAPI.updateWorkload(id, { hoursWorked });
            } else {
                return await firebaseUserService.updateWorkload(id, hoursWorked);
            }
        } catch (error) {
            console.error('Error updating workload:', error);
            throw error;
        }
    }
};

export const shiftService = {
    create: (shiftData) => dataService.create('shifts', shiftData),
    getAll: (filters) => dataService.getAll('shifts', filters),
    getById: (id) => dataService.getById('shifts', id),
    update: (id, shiftData) => dataService.update('shifts', id, shiftData),
    delete: (id) => dataService.delete('shifts', id),
    subscribe: (callback, filters) => dataService.subscribe('shifts', callback, filters),

    // Shift-specific methods
    async assignShift(shiftId, userId) {
        try {
            if (dataService.mongoAvailable) {
                return await shiftAPI.assign(shiftId, { assignedTo: userId });
            } else {
                return await firebaseShiftService.assignShift(shiftId, userId);
            }
        } catch (error) {
            console.error('Error assigning shift:', error);
            throw error;
        }
    },

    async unassignShift(shiftId) {
        try {
            if (dataService.mongoAvailable) {
                return await shiftAPI.unassign(shiftId);
            } else {
                return await firebaseShiftService.unassignShift(shiftId);
            }
        } catch (error) {
            console.error('Error unassigning shift:', error);
            throw error;
        }
    },

    async autoAssign(shiftId) {
        try {
            // Use our intelligent auto-assignment algorithm
            return await AutoAssignService.autoAssignShift(shiftId);
        } catch (error) {
            console.error('Error auto-assigning shift:', error);
            throw error;
        }
    },

    async getAssignmentSuggestions(shiftId) {
        try {
            return await AutoAssignService.getAssignmentSuggestions(shiftId);
        } catch (error) {
            console.error('Error getting assignment suggestions:', error);
            throw error;
        }
    }
};

export const leaveService = {
    create: (leaveData) => dataService.create('leaves', leaveData),
    getAll: (filters) => dataService.getAll('leaves', filters),
    getById: (id) => dataService.getById('leaves', id),
    update: (id, leaveData) => dataService.update('leaves', id, leaveData),
    delete: (id) => dataService.delete('leaves', id),
    subscribe: (callback, filters) => dataService.subscribe('leaves', callback, filters),

    // Leave-specific methods
    async approve(id, reviewData) {
        try {
            if (dataService.mongoAvailable) {
                return await leaveAPI.approve(id, reviewData);
            } else {
                return await firebaseLeaveService.approveRequest(id, reviewData);
            }
        } catch (error) {
            console.error('Error approving leave:', error);
            throw error;
        }
    },

    async reject(id, reviewData) {
        try {
            if (dataService.mongoAvailable) {
                return await leaveAPI.reject(id, reviewData);
            } else {
                return await firebaseLeaveService.rejectRequest(id, reviewData);
            }
        } catch (error) {
            console.error('Error rejecting leave:', error);
            throw error;
        }
    }
};

// Export additional services that are only available in Firebase
export { shiftSwapService, notificationService } from './firebaseService';

// Export analytics API
export { analyticsAPI };

// Export utility functions
export const populateFirebase = {
    users: () => dataService.populateFirebaseFromMongoDB('users'),
    shifts: () => dataService.populateFirebaseFromMongoDB('shifts'),
    leaves: () => dataService.populateFirebaseFromMongoDB('leaves'),
    all: async () => {
        await dataService.populateFirebaseFromMongoDB('users');
        await dataService.populateFirebaseFromMongoDB('shifts');
        await dataService.populateFirebaseFromMongoDB('leaves');
    }
};

export default dataService;

