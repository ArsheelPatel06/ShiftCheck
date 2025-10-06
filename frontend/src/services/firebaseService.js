import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    limit,
    onSnapshot,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Firebase User Service
export const firebaseUserService = {
    async getAll(filters = {}) {
        try {
            const usersRef = collection(db, 'users');
            let q = usersRef;

            // Use only simple queries to avoid index requirements
            if (filters.role) {
                q = query(q, where('role', '==', filters.role));
            } else if (filters.department) {
                q = query(q, where('department', '==', filters.department));
            } else if (filters.isActive !== undefined) {
                q = query(q, where('isActive', '==', filters.isActive));
            }

            if (filters.limit) {
                q = query(q, limit(filters.limit));
            }

            const querySnapshot = await getDocs(q);
            let results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Optimized client-side sorting
            if (filters.sortBy) {
                results = this.sortResults(results, filters.sortBy, filters.sortOrder);
            }

            return results;
        } catch (error) {
            console.error('Error fetching users from Firebase:', error);
            // Return empty array instead of throwing to prevent app crashes
            return [];
        }
    },

    // Optimized sorting method
    sortResults(results, sortBy, sortOrder = 'asc') {
        return results.sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];

            // Handle different data types
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
            }

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
            }

            // Default comparison
            if (sortOrder === 'desc') {
                return bVal > aVal ? 1 : -1;
            }
            return aVal > bVal ? 1 : -1;
        });
    },

    async getById(id) {
        try {
            const userDoc = await getDoc(doc(db, 'users', id));
            if (userDoc.exists()) {
                return { id: userDoc.id, ...userDoc.data() };
            }
            return null;
        } catch (error) {
            console.error('Error fetching user by ID:', error);
            throw error;
        }
    },

    async create(userData) {
        try {
            const docRef = await addDoc(collection(db, 'users'), {
                ...userData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { id: docRef.id, ...userData };
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },

    async update(id, userData) {
        try {
            await updateDoc(doc(db, 'users', id), {
                ...userData,
                updatedAt: serverTimestamp()
            });
            return { id, ...userData };
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    },

    async delete(id) {
        try {
            await deleteDoc(doc(db, 'users', id));
            return id;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    async getByDepartment(department) {
        try {
            const q = query(
                collection(db, 'users'),
                where('department', '==', department),
                where('isActive', '==', true)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error fetching users by department:', error);
            throw error;
        }
    },

    async updateWorkload(id, hoursWorked) {
        try {
            await updateDoc(doc(db, 'users', id), {
                'workloadMetrics.totalHoursWorked': hoursWorked,
                updatedAt: serverTimestamp()
            });
            return { id, hoursWorked };
        } catch (error) {
            console.error('Error updating workload:', error);
            throw error;
        }
    },

    subscribe(callback, filters = {}) {
        try {
            const usersRef = collection(db, 'users');
            let q = usersRef;

            if (filters.role) {
                q = query(q, where('role', '==', filters.role));
            }
            if (filters.department) {
                q = query(q, where('department', '==', filters.department));
            }

            return onSnapshot(q, (querySnapshot) => {
                const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback(users);
            });
        } catch (error) {
            console.error('Error setting up user subscription:', error);
            return null;
        }
    }
};

// Firebase Shift Service
export const firebaseShiftService = {
    async getAll(filters = {}) {
        try {
            const shiftsRef = collection(db, 'shifts');
            let q = shiftsRef;

            // Use only simple queries to avoid index requirements
            if (filters.status) {
                q = query(q, where('status', '==', filters.status));
            } else if (filters.department) {
                q = query(q, where('department', '==', filters.department));
            } else if (filters.assignedTo) {
                q = query(q, where('assignedTo', '==', filters.assignedTo));
            }

            if (filters.limit) {
                q = query(q, limit(filters.limit));
            }

            const querySnapshot = await getDocs(q);
            let results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Client-side sorting to avoid index requirements
            if (filters.sortBy) {
                results = results.sort((a, b) => {
                    const aVal = a[filters.sortBy];
                    const bVal = b[filters.sortBy];
                    if (filters.sortOrder === 'desc') {
                        return bVal > aVal ? 1 : -1;
                    }
                    return aVal > bVal ? 1 : -1;
                });
            }

            return results;
        } catch (error) {
            console.error('Error fetching shifts from Firebase:', error);
            throw error;
        }
    },

    async getById(id) {
        try {
            const shiftDoc = await getDoc(doc(db, 'shifts', id));
            if (shiftDoc.exists()) {
                return { id: shiftDoc.id, ...shiftDoc.data() };
            }
            return null;
        } catch (error) {
            console.error('Error fetching shift by ID:', error);
            throw error;
        }
    },

    async create(shiftData) {
        try {
            const docRef = await addDoc(collection(db, 'shifts'), {
                ...shiftData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { id: docRef.id, ...shiftData };
        } catch (error) {
            console.error('Error creating shift:', error);
            throw error;
        }
    },

    async update(id, shiftData) {
        try {
            await updateDoc(doc(db, 'shifts', id), {
                ...shiftData,
                updatedAt: serverTimestamp()
            });
            return { id, ...shiftData };
        } catch (error) {
            console.error('Error updating shift:', error);
            throw error;
        }
    },

    async delete(id) {
        try {
            console.log('FirebaseShiftService: Attempting to delete shift with ID:', id);
            console.log('FirebaseShiftService: Document path: shifts/' + id);
            await deleteDoc(doc(db, 'shifts', id));
            console.log('FirebaseShiftService: Successfully deleted shift:', id);
            return id;
        } catch (error) {
            console.error('FirebaseShiftService: Error deleting shift:', error);
            console.error('FirebaseShiftService: Error details:', {
                id,
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            throw error;
        }
    },

    async assignShift(shiftId, userId) {
        try {
            await updateDoc(doc(db, 'shifts', shiftId), {
                assignedTo: userId, // Store as direct user ID, not object
                status: 'scheduled',
                updatedAt: serverTimestamp()
            });
            return { shiftId, userId };
        } catch (error) {
            console.error('Error assigning shift:', error);
            throw error;
        }
    },

    async unassignShift(shiftId) {
        try {
            await updateDoc(doc(db, 'shifts', shiftId), {
                assignedTo: null,
                status: 'open',
                updatedAt: serverTimestamp()
            });
            return { shiftId };
        } catch (error) {
            console.error('Error unassigning shift:', error);
            throw error;
        }
    },

    subscribe(callback, filters = {}) {
        try {
            const shiftsRef = collection(db, 'shifts');
            let q = shiftsRef;

            if (filters.status) {
                q = query(q, where('status', '==', filters.status));
            }
            if (filters.department) {
                q = query(q, where('department', '==', filters.department));
            }

            return onSnapshot(q, (querySnapshot) => {
                const shifts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback(shifts);
            });
        } catch (error) {
            console.error('Error setting up shift subscription:', error);
            return null;
        }
    }
};

// Firebase Leave Service
export const firebaseLeaveService = {
    async getAll(filters = {}) {
        try {
            const leavesRef = collection(db, 'leaves');
            let q = leavesRef;

            // Use only simple queries to avoid index requirements
            if (filters.status) {
                q = query(q, where('status', '==', filters.status));
            } else if (filters.requestedBy) {
                q = query(q, where('requestedBy', '==', filters.requestedBy));
            }

            if (filters.limit) {
                q = query(q, limit(filters.limit));
            }

            const querySnapshot = await getDocs(q);
            let results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Client-side sorting to avoid index requirements
            if (filters.sortBy) {
                results = results.sort((a, b) => {
                    const aVal = a[filters.sortBy];
                    const bVal = b[filters.sortBy];
                    if (filters.sortOrder === 'desc') {
                        return bVal > aVal ? 1 : -1;
                    }
                    return aVal > bVal ? 1 : -1;
                });
            }

            return results;
        } catch (error) {
            console.error('Error fetching leaves from Firebase:', error);
            throw error;
        }
    },

    async getById(id) {
        try {
            const leaveDoc = await getDoc(doc(db, 'leaves', id));
            if (leaveDoc.exists()) {
                return { id: leaveDoc.id, ...leaveDoc.data() };
            }
            return null;
        } catch (error) {
            console.error('Error fetching leave by ID:', error);
            throw error;
        }
    },

    async create(leaveData) {
        try {
            const docRef = await addDoc(collection(db, 'leaves'), {
                ...leaveData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { id: docRef.id, ...leaveData };
        } catch (error) {
            console.error('Error creating leave:', error);
            throw error;
        }
    },

    async update(id, leaveData) {
        try {
            await updateDoc(doc(db, 'leaves', id), {
                ...leaveData,
                updatedAt: serverTimestamp()
            });
            return { id, ...leaveData };
        } catch (error) {
            console.error('Error updating leave:', error);
            throw error;
        }
    },

    async delete(id) {
        try {
            console.log('FirebaseLeaveService: Attempting to delete leave with ID:', id);
            console.log('FirebaseLeaveService: Document path: leaves/' + id);
            await deleteDoc(doc(db, 'leaves', id));
            console.log('FirebaseLeaveService: Successfully deleted leave:', id);
            return id;
        } catch (error) {
            console.error('FirebaseLeaveService: Error deleting leave:', error);
            console.error('FirebaseLeaveService: Error details:', {
                id,
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            throw error;
        }
    },

    async approveRequest(id, reviewData) {
        try {
            await updateDoc(doc(db, 'leaves', id), {
                status: 'approved',
                reviewedBy: reviewData.reviewedBy,
                reviewedAt: serverTimestamp(),
                reviewNotes: reviewData.notes,
                updatedAt: serverTimestamp()
            });
            return { id, status: 'approved' };
        } catch (error) {
            console.error('Error approving leave:', error);
            throw error;
        }
    },

    async rejectRequest(id, reviewData) {
        try {
            await updateDoc(doc(db, 'leaves', id), {
                status: 'rejected',
                reviewedBy: reviewData.reviewedBy,
                reviewedAt: serverTimestamp(),
                reviewNotes: reviewData.notes,
                updatedAt: serverTimestamp()
            });
            return { id, status: 'rejected' };
        } catch (error) {
            console.error('Error rejecting leave:', error);
            throw error;
        }
    },

    subscribe(callback, filters = {}) {
        try {
            const leavesRef = collection(db, 'leaves');
            let q = leavesRef;

            if (filters.status) {
                q = query(q, where('status', '==', filters.status));
            }
            if (filters.requestedBy) {
                q = query(q, where('requestedBy.id', '==', filters.requestedBy));
            }

            return onSnapshot(q, (querySnapshot) => {
                const leaves = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback(leaves);
            });
        } catch (error) {
            console.error('Error setting up leave subscription:', error);
            return null;
        }
    }
};

// Additional services
export const shiftSwapService = {
    async requestSwap(shiftId, targetShiftId, requesterId) {
        try {
            const docRef = await addDoc(collection(db, 'shiftSwaps'), {
                originalShiftId: shiftId,
                targetShiftId: targetShiftId,
                requesterId: requesterId,
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { id: docRef.id };
        } catch (error) {
            console.error('Error requesting shift swap:', error);
            throw error;
        }
    },

    async approveSwap(swapId, approverId) {
        try {
            await updateDoc(doc(db, 'shiftSwaps', swapId), {
                status: 'approved',
                approvedBy: approverId,
                approvedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { id: swapId, status: 'approved' };
        } catch (error) {
            console.error('Error approving shift swap:', error);
            throw error;
        }
    }
};

export const notificationService = {
    async sendNotification(userId, notification) {
        try {
            const docRef = await addDoc(collection(db, 'notifications'), {
                userId: userId,
                ...notification,
                read: false,
                createdAt: serverTimestamp()
            });
            return { id: docRef.id };
        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    },

    async markAsRead(notificationId) {
        try {
            await updateDoc(doc(db, 'notifications', notificationId), {
                read: true,
                readAt: serverTimestamp()
            });
            return { id: notificationId, read: true };
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }
};