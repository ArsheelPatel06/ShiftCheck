/**
 * Chat Service for Global Chat System
 * Handles real-time messaging, file uploads, and chat management
 */

import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    where,
    limit,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    getDoc
} from 'firebase/firestore';
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'firebase/storage';
import { db, storage } from '../firebase/config';
import toast from 'react-hot-toast';

class ChatService {
    constructor() {
        this.messagesRef = collection(db, 'chatMessages');
        this.storageRef = ref(storage, 'chat-attachments');
    }

    /**
     * Send a new message
     */
    async sendMessage(messageData) {
        try {
            const message = {
                ...messageData,
                timestamp: serverTimestamp(),
                isRead: false,
                createdAt: new Date().toISOString()
            };

            const docRef = await addDoc(this.messagesRef, message);

            // Track analytics
            this.trackMessageSent(message.type);

            return { id: docRef.id, ...message };
        } catch (error) {
            console.error('Error sending message:', error);
            throw new Error('Failed to send message');
        }
    }

    /**
     * Get real-time messages subscription
     */
    subscribeToMessages(callback, messageType = null) {
        try {
            let q = query(
                this.messagesRef,
                orderBy('timestamp', 'desc'),
                limit(100)
            );

            if (messageType) {
                q = query(
                    this.messagesRef,
                    where('type', '==', messageType),
                    orderBy('timestamp', 'desc'),
                    limit(100)
                );
            }

            return onSnapshot(q, (snapshot) => {
                const messages = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toDate() || new Date()
                }));
                callback(messages.reverse());
            });
        } catch (error) {
            console.error('Error subscribing to messages:', error);
            throw new Error('Failed to load messages');
        }
    }

    /**
     * Upload file attachment
     */
    async uploadAttachment(file, messageId) {
        try {
            const fileName = `${messageId}_${Date.now()}_${file.name}`;
            const fileRef = ref(this.storageRef, fileName);

            const snapshot = await uploadBytes(fileRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            return {
                name: file.name,
                type: file.type,
                size: file.size,
                url: downloadURL,
                fileName: fileName
            };
        } catch (error) {
            console.error('Error uploading attachment:', error);
            throw new Error('Failed to upload file');
        }
    }

    /**
     * Delete a message
     */
    async deleteMessage(messageId, userId) {
        try {
            const messageDoc = doc(this.messagesRef, messageId);
            const messageSnap = await getDoc(messageDoc);

            if (!messageSnap.exists()) {
                throw new Error('Message not found');
            }

            const messageData = messageSnap.data();

            // Only allow sender or admin to delete
            if (messageData.senderId !== userId && !this.isAdmin(userId)) {
                throw new Error('Unauthorized to delete message');
            }

            // Delete attachments if any
            if (messageData.attachments && messageData.attachments.length > 0) {
                for (const attachment of messageData.attachments) {
                    if (attachment.fileName) {
                        try {
                            const attachmentRef = ref(this.storageRef, attachment.fileName);
                            await deleteObject(attachmentRef);
                        } catch (error) {
                            console.warn('Failed to delete attachment:', error);
                        }
                    }
                }
            }

            await deleteDoc(messageDoc);
            return true;
        } catch (error) {
            console.error('Error deleting message:', error);
            throw new Error('Failed to delete message');
        }
    }

    /**
     * Mark message as read
     */
    async markAsRead(messageId, userId) {
        try {
            const messageDoc = doc(this.messagesRef, messageId);
            await updateDoc(messageDoc, {
                readBy: {
                    [userId]: {
                        readAt: serverTimestamp(),
                        readBy: userId
                    }
                }
            });
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    }

    /**
     * Get message statistics
     */
    async getMessageStats() {
        try {
            const q = query(this.messagesRef, orderBy('timestamp', 'desc'));
            const snapshot = await getDocs(q);

            const stats = {
                totalMessages: snapshot.size,
                messagesByType: {},
                messagesByUser: {},
                recentActivity: []
            };

            snapshot.docs.forEach(doc => {
                const data = doc.data();

                // Count by type
                stats.messagesByType[data.type] = (stats.messagesByType[data.type] || 0) + 1;

                // Count by user
                stats.messagesByUser[data.senderId] = (stats.messagesByUser[data.senderId] || 0) + 1;

                // Recent activity
                if (data.timestamp) {
                    stats.recentActivity.push({
                        id: doc.id,
                        type: data.type,
                        sender: data.senderName,
                        timestamp: data.timestamp.toDate(),
                        text: data.text
                    });
                }
            });

            return stats;
        } catch (error) {
            console.error('Error getting message stats:', error);
            return null;
        }
    }

    /**
     * Search messages
     */
    async searchMessages(searchTerm, messageType = null) {
        try {
            let q = query(this.messagesRef, orderBy('timestamp', 'desc'));

            if (messageType) {
                q = query(
                    this.messagesRef,
                    where('type', '==', messageType),
                    orderBy('timestamp', 'desc')
                );
            }

            const snapshot = await getDocs(q);
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date()
            }));

            // Client-side search (Firestore doesn't support full-text search)
            const filteredMessages = messages.filter(message =>
                message.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                message.senderName.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return filteredMessages;
        } catch (error) {
            console.error('Error searching messages:', error);
            return [];
        }
    }

    /**
     * Get online users (placeholder - would need presence system)
     */
    async getOnlineUsers() {
        // This would typically use Firebase Realtime Database for presence
        // For now, return mock data
        return [
            { id: '1', name: 'Admin User', role: 'admin', isOnline: true },
            { id: '2', name: 'Staff Member', role: 'staff', isOnline: true }
        ];
    }

    /**
     * Check if user is admin
     */
    isAdmin(userId) {
        // This would check user role from Firestore
        // For now, return false
        return false;
    }

    /**
     * Track message analytics
     */
    trackMessageSent(messageType) {
        // Track analytics for message types
        const analytics = {
            event: 'message_sent',
            messageType: messageType,
            timestamp: new Date().toISOString()
        };

        // Send to analytics service
        console.log('Message analytics:', analytics);
    }

    /**
     * Get message templates for Indian healthcare
     */
    getMessageTemplates() {
        return {
            urgent: [
                "🚨 URGENT: Immediate attention required",
                "⚠️ Critical situation - all hands on deck",
                "🔴 Emergency protocol activated"
            ],
            shift: [
                "📋 Shift change reminder",
                "⏰ Shift starting in 30 minutes",
                "🔄 Shift handover complete",
                "📅 Schedule updated"
            ],
            info: [
                "📢 Important announcement",
                "ℹ️ Policy update",
                "📋 Training session scheduled",
                "🎉 Team achievement"
            ],
            general: [
                "👋 Good morning team!",
                "💪 Great work today!",
                "🤝 Team collaboration",
                "📞 Meeting reminder"
            ]
        };
    }

    /**
     * Validate message content
     */
    validateMessage(text, type) {
        const errors = [];

        if (!text || text.trim().length === 0) {
            errors.push('Message cannot be empty');
        }

        if (text.length > 1000) {
            errors.push('Message too long (max 1000 characters)');
        }

        if (type === 'urgent' && text.length < 10) {
            errors.push('Urgent messages should be more descriptive');
        }

        return errors;
    }

    /**
     * Format message for display
     */
    formatMessage(message) {
        return {
            ...message,
            displayText: message.text,
            isUrgent: message.type === 'urgent',
            isShiftUpdate: message.type === 'shift',
            isInfo: message.type === 'info',
            isGeneral: message.type === 'general'
        };
    }
}

// Create singleton instance
const chatService = new ChatService();
export default chatService;

