import { collection, addDoc, query, where, getDocs, limit, updateDoc, doc, serverTimestamp, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import messagingService from './messagingService';
import quotaManager from './quotaManager';

class NotificationService {
    constructor() {
        this.collection = 'notifications';
    }

    /**
     * Create a new notification
     * @param {Object} notificationData - The notification data
     * @returns {Promise<string>} - The notification ID
     */
    async createNotification(notificationData) {
        return await quotaManager.executeWithQuotaHandling(
            async () => {
                console.log('Creating notification with data:', notificationData);

                const notification = {
                    ...notificationData,
                    read: false,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };

                console.log('Notification object to save:', notification);
                const docRef = await addDoc(collection(db, this.collection), notification);
                console.log('Notification created with ID:', docRef.id);

                // Send push notification if user has FCM token
                await this.sendPushNotification(notificationData.userId, notificationData);

                return docRef.id;
            },
            // Fallback: return a local ID for offline functionality
            async () => {
                console.log('Using fallback for notification creation due to quota exceeded');
                const localId = 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

                // Store in localStorage as fallback
                const localNotification = {
                    id: localId,
                    ...notificationData,
                    read: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    local: true
                };

                const localNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
                localNotifications.push(localNotification);
                localStorage.setItem('localNotifications', JSON.stringify(localNotifications));

                return localId;
            }
        );
    }

    /**
     * Send push notification via FCM
     * @param {string} userId - The user ID to send notification to
     * @param {Object} notificationData - The notification data
     */
    async sendPushNotification(userId, notificationData) {
        try {
            // Get user's FCM token (this would be stored when user logs in)
            const userToken = await this.getUserFCMToken(userId);

            if (userToken) {
                const message = {
                    title: notificationData.title,
                    body: notificationData.message,
                    data: {
                        type: notificationData.type,
                        id: notificationData.id,
                        userId: userId
                    }
                };

                await messagingService.sendNotificationToUser(userId, message);
                console.log('Push notification sent to user:', userId);
            } else {
                console.log('No FCM token found for user:', userId);
            }
        } catch (error) {
            console.error('Error sending push notification:', error);
            // Don't throw error - notification creation should still succeed
        }
    }

    /**
     * Get user's FCM token from Firestore
     * @param {string} userId - The user ID
     * @returns {Promise<string|null>} - The FCM token or null
     */
    async getUserFCMToken(userId) {
        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                return userData.fcmToken || null;
            }

            return null;
        } catch (error) {
            console.error('Error getting user FCM token:', error);
            return null;
        }
    }

    /**
     * Get notifications for a specific user
     * @param {string} userId - The user ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} - Array of notifications
     */
    async getUserNotifications(userId, options = {}) {
        return await quotaManager.executeWithQuotaHandling(
            async () => {
                const { limit: limitCount = 50 } = options;

                // Optimized query with caching
                const cacheKey = `notifications_${userId}_${JSON.stringify(options)}`;
                const cached = this.getCachedNotifications(cacheKey);
                if (cached && Date.now() - cached.timestamp < 30000) { // 30 second cache
                    return cached.data;
                }

                // Use the simplest possible query to avoid index requirements
                const q = query(
                    collection(db, this.collection),
                    where('userId', '==', userId),
                    limit(limitCount)
                );

                const querySnapshot = await getDocs(q);

                const notifications = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Get local notifications as well
                const localNotifications = this.getLocalNotifications(userId);
                const allNotifications = [...notifications, ...localNotifications];

                // Optimized filtering and sorting
                const processedNotifications = this.processNotifications(allNotifications, options);

                // Cache the result
                this.setCachedNotifications(cacheKey, processedNotifications);

                return processedNotifications;
            },
            // Fallback: return only local notifications
            async () => {
                console.log('Using local notifications due to quota exceeded');
                const localNotifications = this.getLocalNotifications(userId);
                return this.processNotifications(localNotifications, options);
            }
        );
    }

    // Optimized notification processing
    processNotifications(notifications, options = {}) {
        const { unreadOnly = false } = options;

        // Filter by read status if needed
        let filteredNotifications = notifications;
        if (unreadOnly) {
            filteredNotifications = filteredNotifications.filter(notif => !notif.read);
        }

        // Optimized sorting with better date handling
        return filteredNotifications.sort((a, b) => {
            const dateA = this.parseDate(a.createdAt);
            const dateB = this.parseDate(b.createdAt);
            return dateB - dateA; // Descending order (newest first)
        });
    }

    // Optimized date parsing
    parseDate(dateInput) {
        if (!dateInput) return 0;

        if (dateInput.seconds) {
            return dateInput.seconds * 1000;
        } else if (dateInput.toDate) {
            return dateInput.toDate().getTime();
        } else {
            const date = new Date(dateInput);
            return isNaN(date.getTime()) ? 0 : date.getTime();
        }
    }

    // Simple caching mechanism
    getCachedNotifications(key) {
        try {
            const cached = localStorage.getItem(`cache_${key}`);
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    }

    setCachedNotifications(key, data) {
        try {
            localStorage.setItem(`cache_${key}`, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch {
            // Ignore cache errors
        }
    }

    /**
     * Mark notification as read
     * @param {string} notificationId - The notification ID
     */
    async markAsRead(notificationId) {
        try {
            await updateDoc(doc(db, this.collection, notificationId), {
                read: true,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read for a user
     * @param {string} userId - The user ID
     */
    async markAllAsRead(userId) {
        try {
            const notifications = await this.getUserNotifications(userId, { unreadOnly: true });
            const updatePromises = notifications.map(notification =>
                this.markAsRead(notification.id)
            );
            await Promise.all(updatePromises);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }

    /**
     * Get local notifications from localStorage
     * @param {string} userId - The user ID
     * @returns {Array} - Array of local notifications
     */
    getLocalNotifications(userId) {
        try {
            const localNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
            return localNotifications.filter(notif => notif.userId === userId);
        } catch (error) {
            console.error('Error getting local notifications:', error);
            return [];
        }
    }

    /**
     * Delete a notification
     * @param {string} notificationId - The notification ID
     */
    async deleteNotification(notificationId) {
        // Optimized deletion with minimal logging
        try {
            // Check if it's a local notification first
            if (notificationId.startsWith('local-')) {
                this.deleteLocalNotification(notificationId);
                return;
            }

            // Direct Firebase deletion without quota manager overhead
            await deleteDoc(doc(db, this.collection, notificationId));
        } catch (error) {
            // Fallback to local storage if Firebase fails
            console.warn('Firebase deletion failed, using local storage:', error.message);
            this.deleteLocalNotification(notificationId);
        }
    }

    /**
     * Delete local notification
     * @param {string} notificationId - The notification ID
     */
    deleteLocalNotification(notificationId) {
        try {
            const localNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
            const filteredNotifications = localNotifications.filter(notif => notif.id !== notificationId);
            localStorage.setItem('localNotifications', JSON.stringify(filteredNotifications));
        } catch (error) {
            console.error('Error deleting local notification:', error);
        }
    }

    // Specific notification types
    /**
     * Send leave request approval notification
     * @param {string} userId - The user ID
     * @param {Object} requestData - The leave request data
     */
    async sendLeaveApprovalNotification(userId, requestData) {
        const notification = {
            userId,
            type: 'leave_approved',
            title: 'Leave Request Approved',
            message: `Your ${requestData.type} leave request from ${requestData.startDate} to ${requestData.endDate} has been approved.`,
            data: {
                requestId: requestData.id,
                type: 'leave_approved'
            }
        };

        return await this.createNotification(notification);
    }

    /**
     * Send leave request rejection notification
     * @param {string} userId - The user ID
     * @param {Object} requestData - The leave request data
     */
    async sendLeaveRejectionNotification(userId, requestData) {
        const notification = {
            userId,
            type: 'leave_rejected',
            title: 'Leave Request Rejected',
            message: `Your ${requestData.type} leave request from ${requestData.startDate} to ${requestData.endDate} has been rejected.`,
            data: {
                requestId: requestData.id,
                type: 'leave_rejected'
            }
        };

        return await this.createNotification(notification);
    }

    /**
     * Send shift pickup confirmation notification
     * @param {string} userId - The user ID
     * @param {Object} shiftData - The shift data
     */
    async sendShiftPickupNotification(userId, shiftData) {
        const notification = {
            userId,
            type: 'shift_picked_up',
            title: 'Shift Added to Schedule',
            message: `You have successfully picked up the ${shiftData.title} shift on ${new Date(shiftData.startTime).toLocaleDateString()}.`,
            data: {
                shiftId: shiftData.id,
                type: 'shift_picked_up'
            }
        };

        return await this.createNotification(notification);
    }

    /**
     * Send shift assignment notification
     * @param {string} userId - The user ID
     * @param {Object} shiftData - The shift data
     */
    async sendShiftAssignmentNotification(userId, shiftData) {
        const notification = {
            userId,
            type: 'shift_assigned',
            title: 'New Shift Assignment',
            message: `You have been assigned to ${shiftData.title} on ${new Date(shiftData.startTime).toLocaleDateString()}.`,
            data: {
                shiftId: shiftData.id,
                type: 'shift_assigned'
            }
        };

        return await this.createNotification(notification);
    }

    /**
     * Send general notification
     * @param {string} userId - The user ID
     * @param {string} title - The notification title
     * @param {string} message - The notification message
     * @param {string} type - The notification type
     * @param {Object} data - Additional data
     */
    async sendGeneralNotification(userId, title, message, type = 'general', data = {}) {
        const notification = {
            userId,
            type,
            title,
            message,
            data
        };

        return await this.createNotification(notification);
    }
}

// Create singleton instance
const notificationService = new NotificationService();
export default notificationService;
