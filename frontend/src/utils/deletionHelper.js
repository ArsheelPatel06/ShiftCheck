/**
 * Deletion Helper Utility
 * Provides consistent deletion functionality across the application
 */

import { shiftService, leaveService } from '../services/dataService';
import notificationService from '../services/notificationService';
import toast from 'react-hot-toast';

class DeletionHelper {
    /**
     * Get the correct ID for deletion (handles both MongoDB _id and Firebase id)
     */
    static getCorrectId(item) {
        if (!item) return null;

        // Firebase uses 'id', MongoDB uses '_id'
        return item.id || item._id || null;
    }

    /**
     * Delete a shift with proper error handling
     */
    static async deleteShift(shift, options = {}) {
        const { showToast = true, onSuccess, onError } = options;
        const shiftId = this.getCorrectId(shift);

        if (!shiftId) {
            const error = 'Invalid shift ID';
            console.error('DeletionHelper: ' + error);
            if (showToast) toast.error(error);
            if (onError) onError(error);
            return { success: false, error };
        }

        try {
            console.log('DeletionHelper: Deleting shift with ID:', shiftId);

            if (showToast) {
                toast.loading('Deleting shift...', { id: 'delete-shift' });
            }

            await shiftService.delete(shiftId);

            if (showToast) {
                toast.success('Shift deleted successfully!', { id: 'delete-shift' });
            }

            if (onSuccess) onSuccess(shiftId);
            return { success: true, id: shiftId };

        } catch (error) {
            console.error('DeletionHelper: Error deleting shift:', error);
            const errorMessage = error.message || 'Failed to delete shift';

            if (showToast) {
                toast.error(errorMessage, { id: 'delete-shift' });
            }

            if (onError) onError(error);
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Delete a leave request with proper error handling
     */
    static async deleteLeaveRequest(leaveRequest, options = {}) {
        const { showToast = true, onSuccess, onError } = options;
        const requestId = this.getCorrectId(leaveRequest);

        if (!requestId) {
            const error = 'Invalid leave request ID';
            console.error('DeletionHelper: ' + error);
            if (showToast) toast.error(error);
            if (onError) onError(error);
            return { success: false, error };
        }

        try {
            console.log('DeletionHelper: Deleting leave request with ID:', requestId);

            if (showToast) {
                toast.loading('Deleting leave request...', { id: 'delete-leave' });
            }

            await leaveService.delete(requestId);

            if (showToast) {
                toast.success('Leave request deleted successfully!', { id: 'delete-leave' });
            }

            if (onSuccess) onSuccess(requestId);
            return { success: true, id: requestId };

        } catch (error) {
            console.error('DeletionHelper: Error deleting leave request:', error);
            const errorMessage = error.message || 'Failed to delete leave request';

            if (showToast) {
                toast.error(errorMessage, { id: 'delete-leave' });
            }

            if (onError) onError(error);
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Delete a notification with proper error handling
     */
    static async deleteNotification(notification, options = {}) {
        const { showToast = true, onSuccess, onError } = options;
        const notificationId = this.getCorrectId(notification);

        if (!notificationId) {
            const error = 'Invalid notification ID';
            console.error('DeletionHelper: ' + error);
            if (showToast) toast.error(error);
            if (onError) onError(error);
            return { success: false, error };
        }

        try {
            console.log('DeletionHelper: Deleting notification with ID:', notificationId);

            if (showToast) {
                toast.loading('Deleting notification...', { id: 'delete-notification' });
            }

            await notificationService.deleteNotification(notificationId);

            if (showToast) {
                toast.success('Notification deleted successfully!', { id: 'delete-notification' });
            }

            if (onSuccess) onSuccess(notificationId);
            return { success: true, id: notificationId };

        } catch (error) {
            console.error('DeletionHelper: Error deleting notification:', error);
            const errorMessage = error.message || 'Failed to delete notification';

            if (showToast) {
                toast.error(errorMessage, { id: 'delete-notification' });
            }

            if (onError) onError(error);
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Batch delete multiple items
     */
    static async batchDelete(items, type, options = {}) {
        const { showToast = true, onProgress } = options;

        if (showToast) {
            toast.loading(`Deleting ${items.length} ${type}s...`, { id: 'batch-delete' });
        }

        // Optimized parallel deletion for better performance
        const deletePromises = items.map(async (item, index) => {
            try {
                let result;
                switch (type) {
                    case 'shift':
                        result = await this.deleteShift(item, { showToast: false });
                        break;
                    case 'leave':
                        result = await this.deleteLeaveRequest(item, { showToast: false });
                        break;
                    case 'notification':
                        result = await this.deleteNotification(item, { showToast: false });
                        break;
                    default:
                        throw new Error(`Unknown type: ${type}`);
                }

                if (onProgress) {
                    onProgress(index + 1, items.length, result);
                }

                return { item, ...result };
            } catch (error) {
                console.error(`DeletionHelper: Error deleting ${type}:`, error);
                return {
                    item,
                    success: false,
                    error: error.message
                };
            }
        });

        // Execute all deletions in parallel
        const results = await Promise.all(deletePromises);

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
     * Confirm deletion with user
     */
    static confirmDeletion(itemName, itemType = 'item') {
        return window.confirm(
            `Are you sure you want to delete this ${itemType}? This action cannot be undone.`
        );
    }
}

export default DeletionHelper;
