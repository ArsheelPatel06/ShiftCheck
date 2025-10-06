/**
 * Enhanced Deletion Service
 * Handles all deletion operations with proper error handling and user feedback
 */

import { userService, shiftService, leaveService } from './dataService';
import notificationService from './notificationService';
import quotaService from './quotaService';
import toast from 'react-hot-toast';

class DeletionService {
    constructor() {
        this.deletionHistory = [];
        this.maxHistorySize = 50;
    }

    /**
     * Delete a shift with enhanced error handling
     */
    async deleteShift(shiftId, options = {}) {
        const { showToast = true } = options;

        try {
            console.log('DeletionService: Starting shift deletion for ID:', shiftId);

            // Check quota before deletion
            if (quotaService.isQuotaExceeded()) {
                console.log('DeletionService: Quota exceeded, cannot delete');
                throw new Error('Firebase quota exceeded. Cannot delete at this time.');
            }

            if (showToast) {
                toast.loading('Deleting shift...', { id: 'delete-shift' });
            }

            console.log('DeletionService: Calling shiftService.delete with ID:', shiftId);
            const result = await shiftService.delete(shiftId);
            console.log('DeletionService: shiftService.delete result:', result);

            // Log deletion
            this.logDeletion('shift', shiftId);

            if (showToast) {
                toast.success('Shift deleted successfully!', { id: 'delete-shift' });
            }

            return { success: true, id: shiftId };
        } catch (error) {
            console.error('DeletionService: Error deleting shift:', error);
            console.error('DeletionService: Error details:', {
                message: error.message,
                code: error.code,
                shiftId: shiftId
            });

            if (showToast) {
                if (error.message.includes('quota exceeded')) {
                    toast.error('Firebase quota exceeded. Please try again later.', { id: 'delete-shift' });
                } else {
                    toast.error('Failed to delete shift: ' + error.message, { id: 'delete-shift' });
                }
            }

            return { success: false, error: error.message };
        }
    }

    /**
     * Delete a user with enhanced error handling
     */
    async deleteUser(userId, options = {}) {
        const { showToast = true } = options;

        try {
            // Check quota before deletion
            if (quotaService.isQuotaExceeded()) {
                throw new Error('Firebase quota exceeded. Cannot delete at this time.');
            }

            if (showToast) {
                toast.loading('Deleting user...', { id: 'delete-user' });
            }

            await userService.deleteCompletely(userId);

            // Log deletion
            this.logDeletion('user', userId);

            if (showToast) {
                toast.success('User deleted successfully!', { id: 'delete-user' });
            }

            return { success: true, id: userId };
        } catch (error) {
            console.error('Error deleting user:', error);

            if (showToast) {
                if (error.message.includes('quota exceeded')) {
                    toast.error('Firebase quota exceeded. Please try again later.', { id: 'delete-user' });
                } else {
                    toast.error('Failed to delete user: ' + error.message, { id: 'delete-user' });
                }
            }

            return { success: false, error: error.message };
        }
    }

    /**
     * Delete a leave request with enhanced error handling
     */
    async deleteLeaveRequest(leaveId, options = {}) {
        const { showToast = true } = options;

        try {
            // Check quota before deletion
            if (quotaService.isQuotaExceeded()) {
                throw new Error('Firebase quota exceeded. Cannot delete at this time.');
            }

            if (showToast) {
                toast.loading('Deleting leave request...', { id: 'delete-leave' });
            }

            await leaveService.delete(leaveId);

            // Log deletion
            this.logDeletion('leave', leaveId);

            if (showToast) {
                toast.success('Leave request deleted successfully!', { id: 'delete-leave' });
            }

            return { success: true, id: leaveId };
        } catch (error) {
            console.error('Error deleting leave request:', error);

            if (showToast) {
                if (error.message.includes('quota exceeded')) {
                    toast.error('Firebase quota exceeded. Please try again later.', { id: 'delete-leave' });
                } else {
                    toast.error('Failed to delete leave request: ' + error.message, { id: 'delete-leave' });
                }
            }

            return { success: false, error: error.message };
        }
    }

    /**
     * Delete a notification with enhanced error handling
     */
    async deleteNotification(notificationId, options = {}) {
        const { showToast = true } = options;

        try {
            console.log('DeletionService: Starting notification deletion for ID:', notificationId);

            if (showToast) {
                toast.loading('Deleting notification...', { id: 'delete-notification' });
            }

            console.log('DeletionService: Calling notificationService.deleteNotification with ID:', notificationId);
            await notificationService.deleteNotification(notificationId);
            console.log('DeletionService: notificationService.deleteNotification completed');

            // Log deletion
            this.logDeletion('notification', notificationId);

            if (showToast) {
                toast.success('Notification deleted successfully!', { id: 'delete-notification' });
            }

            return { success: true, id: notificationId };
        } catch (error) {
            console.error('DeletionService: Error deleting notification:', error);
            console.error('DeletionService: Error details:', {
                message: error.message,
                code: error.code,
                notificationId: notificationId
            });

            if (showToast) {
                toast.error('Failed to delete notification: ' + error.message, { id: 'delete-notification' });
            }

            return { success: false, error: error.message };
        }
    }

    /**
     * Batch delete multiple items
     */
    async batchDelete(type, ids, options = {}) {
        const { showToast = true } = options;
        const results = [];

        if (showToast) {
            toast.loading(`Deleting ${ids.length} ${type}s...`, { id: 'batch-delete' });
        }

        for (const id of ids) {
            try {
                let result;
                switch (type) {
                    case 'shift':
                        result = await this.deleteShift(id, { showToast: false });
                        break;
                    case 'user':
                        result = await this.deleteUser(id, { showToast: false });
                        break;
                    case 'leave':
                        result = await this.deleteLeaveRequest(id, { showToast: false });
                        break;
                    case 'notification':
                        result = await this.deleteNotification(id, { showToast: false });
                        break;
                    default:
                        throw new Error(`Unknown type: ${type}`);
                }
                results.push({ id, ...result });
            } catch (error) {
                results.push({ id, success: false, error: error.message });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;

        if (showToast) {
            if (failureCount === 0) {
                toast.success(`Successfully deleted ${successCount} ${type}s!`, { id: 'batch-delete' });
            } else {
                toast.error(`Deleted ${successCount} ${type}s, ${failureCount} failed`, { id: 'batch-delete' });
            }
        }

        return results;
    }

    /**
     * Log deletion for audit trail
     */
    logDeletion(type, id) {
        const deletion = {
            type,
            id,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.deletionHistory.unshift(deletion);

        // Keep only recent deletions
        if (this.deletionHistory.length > this.maxHistorySize) {
            this.deletionHistory = this.deletionHistory.slice(0, this.maxHistorySize);
        }

        // Store in localStorage for persistence
        try {
            localStorage.setItem('deletionHistory', JSON.stringify(this.deletionHistory));
        } catch (error) {
            console.warn('Failed to store deletion history:', error);
        }
    }

    /**
     * Get deletion history
     */
    getDeletionHistory() {
        try {
            const stored = localStorage.getItem('deletionHistory');
            if (stored) {
                this.deletionHistory = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load deletion history:', error);
        }

        return this.deletionHistory;
    }

    /**
     * Clear deletion history
     */
    clearDeletionHistory() {
        this.deletionHistory = [];
        localStorage.removeItem('deletionHistory');
    }

    /**
     * Get deletion statistics
     */
    getDeletionStats() {
        const history = this.getDeletionHistory();
        const stats = {
            total: history.length,
            byType: {},
            recent: history.slice(0, 10)
        };

        history.forEach(deletion => {
            stats.byType[deletion.type] = (stats.byType[deletion.type] || 0) + 1;
        });

        return stats;
    }

    /**
     * Check if deletion is allowed (quota, permissions, etc.)
     */
    canDelete(type, id) {
        // Check quota
        if (quotaService.isQuotaExceeded()) {
            return { allowed: false, reason: 'Firebase quota exceeded' };
        }

        // Add other checks as needed
        return { allowed: true };
    }
}

// Create singleton instance
const deletionService = new DeletionService();

export default deletionService;
