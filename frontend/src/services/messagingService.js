/**
 * Firebase Cloud Messaging Service
 * Handles push notifications for the healthcare shift manager
 */

import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import { db } from '../firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

class MessagingService {
    constructor() {
        this.messaging = null;
        this.currentToken = null;
        this.isSupported = false;
        this.init();
    }

    async init() {
        try {
            // Check if messaging is supported
            if ('Notification' in window && 'serviceWorker' in navigator) {
                this.messaging = getMessaging();
                this.isSupported = true;

                // Request notification permission
                await this.requestPermission();

                // Get FCM token
                await this.getToken();

                // Set up message listener
                this.setupMessageListener();
            } else {
                console.warn('Firebase Cloud Messaging is not supported in this browser');
            }
        } catch (error) {
            console.error('Error initializing messaging service:', error);
        }
    }

    async requestPermission() {
        try {
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                console.log('Notification permission granted');
                return true;
            } else if (permission === 'denied') {
                console.warn('Notification permission denied');
                toast.error('Notifications are blocked. Please enable them in your browser settings.');
                return false;
            } else {
                console.warn('Notification permission dismissed');
                return false;
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    async getToken() {
        try {
            if (!this.messaging) return null;

            const token = await getToken(this.messaging, {
                vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
            });

            if (token) {
                this.currentToken = token;
                console.log('FCM Token:', token);

                // Save token to user profile in Firestore
                await this.saveTokenToUser(token);

                return token;
            } else {
                console.warn('No registration token available');
                return null;
            }
        } catch (error) {
            console.error('Error getting FCM token:', error);
            return null;
        }
    }

    async saveTokenToUser(token) {
        try {
            // Get current user ID from localStorage or context
            const userId = localStorage.getItem('currentUserId');
            if (!userId) {
                console.warn('No current user ID found for FCM token storage');
                return;
            }

            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                fcmToken: token,
                tokenUpdatedAt: new Date(),
                notificationSettings: {
                    push: true,
                    email: true,
                    sms: false
                }
            });

            console.log('FCM token saved to user profile:', userId);
            return true;
        } catch (error) {
            console.error('Error saving FCM token:', error);
            return false;
        }
    }

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

    async deleteUserFCMToken(userId) {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                fcmToken: null,
                tokenUpdatedAt: new Date()
            });

            console.log('FCM token deleted for user:', userId);
            return true;
        } catch (error) {
            console.error('Error deleting FCM token:', error);
            return false;
        }
    }

    setupMessageListener() {
        if (!this.messaging) return;

        onMessage(this.messaging, (payload) => {
            console.log('Message received:', payload);

            // Show notification using browser's notification API
            this.showNotification(payload);

            // Show toast notification
            this.showToastNotification(payload);
        });
    }

    showNotification(payload) {
        const { notification, data } = payload;

        if (Notification.permission === 'granted') {
            const notificationOptions = {
                body: notification.body,
                icon: '/logo192.png', // App icon
                badge: '/logo192.png',
                tag: data?.type || 'general',
                data: data,
                actions: this.getNotificationActions(data?.type),
                requireInteraction: data?.priority === 'high'
            };

            const notificationObj = new Notification(notification.title, notificationOptions);

            // Handle notification click
            notificationObj.onclick = () => {
                window.focus();
                notificationObj.close();

                // Handle different notification types
                this.handleNotificationClick(data);
            };

            // Auto-close after 5 seconds for low priority notifications
            if (data?.priority !== 'high') {
                setTimeout(() => {
                    notificationObj.close();
                }, 5000);
            }
        }
    }

    showToastNotification(payload) {
        const { notification, data } = payload;

        const toastOptions = {
            duration: data?.priority === 'high' ? 0 : 4000, // High priority = persistent
            icon: this.getNotificationIcon(data?.type),
            style: {
                background: this.getNotificationColor(data?.type),
                color: 'white'
            }
        };

        toast(notification.body, toastOptions);
    }

    getNotificationActions(type) {
        const actions = [];

        switch (type) {
            case 'shift_assigned':
                actions.push(
                    { action: 'view', title: 'View Shift' },
                    { action: 'decline', title: 'Decline' }
                );
                break;
            case 'leave_request':
                actions.push(
                    { action: 'approve', title: 'Approve' },
                    { action: 'reject', title: 'Reject' }
                );
                break;
            case 'schedule_change':
                actions.push(
                    { action: 'view', title: 'View Changes' }
                );
                break;
            default:
                // No additional actions for other notification types
                break;
        }

        return actions;
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'shift_assigned': return '📅';
            case 'leave_approved': return '✅';
            case 'leave_rejected': return '❌';
            case 'schedule_change': return '🔄';
            case 'emergency': return '🚨';
            default: return '🔔';
        }
    }

    getNotificationColor(type) {
        switch (type) {
            case 'shift_assigned': return '#3B82F6'; // Blue
            case 'leave_approved': return '#10B981'; // Green
            case 'leave_rejected': return '#EF4444'; // Red
            case 'schedule_change': return '#F59E0B'; // Orange
            case 'emergency': return '#DC2626'; // Red
            default: return '#6B7280'; // Gray
        }
    }

    handleNotificationClick(data) {
        if (!data) return;

        switch (data.type) {
            case 'shift_assigned':
                // Navigate to schedule page
                window.location.href = '/staff-dashboard?tab=schedule';
                break;
            case 'leave_request':
                // Navigate to requests page
                window.location.href = '/admin-dashboard?tab=requests';
                break;
            case 'schedule_change':
                // Navigate to schedule page
                window.location.href = '/staff-dashboard?tab=schedule';
                break;
            default:
                // Navigate to notifications page
                window.location.href = '/staff-dashboard?tab=notifications';
        }
    }

    async deleteToken() {
        try {
            if (this.messaging && this.currentToken) {
                await deleteToken(this.messaging);
                this.currentToken = null;
                console.log('FCM token deleted');
            }
        } catch (error) {
            console.error('Error deleting FCM token:', error);
        }
    }

    // Send notification to specific user (for admin use)
    async sendNotificationToUser(userId, notification) {
        try {
            // This would typically be handled by your backend
            // For now, we'll just log it
            console.log('Sending notification to user:', userId, notification);

            // In a real implementation, you would:
            // 1. Get the user's FCM token from Firestore
            // 2. Send the notification via your backend API
            // 3. The backend would use Firebase Admin SDK to send the notification

            return true;
        } catch (error) {
            console.error('Error sending notification:', error);
            return false;
        }
    }

    // Send notification to all users in a department
    async sendNotificationToDepartment(department, notification) {
        try {
            console.log('Sending notification to department:', department, notification);
            return true;
        } catch (error) {
            console.error('Error sending department notification:', error);
            return false;
        }
    }

    // Send emergency notification to all users
    async sendEmergencyNotification(notification) {
        try {
            console.log('Sending emergency notification:', notification);
            return true;
        } catch (error) {
            console.error('Error sending emergency notification:', error);
            return false;
        }
    }

    // Get notification settings for current user
    async getNotificationSettings() {
        try {
            const userId = localStorage.getItem('currentUserId');
            if (!userId) return null;

            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                return userDoc.data().notificationSettings || {
                    shiftAssignments: true,
                    leaveUpdates: true,
                    scheduleChanges: true,
                    emergencyAlerts: true,
                    reminders: true
                };
            }

            return null;
        } catch (error) {
            console.error('Error getting notification settings:', error);
            return null;
        }
    }

    // Update notification settings for current user
    async updateNotificationSettings(settings) {
        try {
            const userId = localStorage.getItem('currentUserId');
            if (!userId) return false;

            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                notificationSettings: settings,
                settingsUpdatedAt: new Date()
            });

            console.log('Notification settings updated');
            return true;
        } catch (error) {
            console.error('Error updating notification settings:', error);
            return false;
        }
    }
}

// Create singleton instance
const messagingService = new MessagingService();

export default messagingService;
