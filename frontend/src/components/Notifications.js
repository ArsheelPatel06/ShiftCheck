import React, { useState, useEffect, useCallback } from 'react';
import {
    Bell,
    CheckCircle,
    XCircle,
    Calendar,
    Clock,
    Trash2,
    Check,
    Search,
    AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import notificationService from '../services/notificationService';
import DeletionHelper from '../utils/deletionHelper';
import quotaManager from '../services/quotaManager';
import toast from 'react-hot-toast';

const Notifications = () => {
    const { userProfile } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, read
    const [searchTerm, setSearchTerm] = useState('');
    const [quotaStatus, setQuotaStatus] = useState(null);
    const [deletingNotifications, setDeletingNotifications] = useState(new Set());
    const [selectedNotifications, setSelectedNotifications] = useState(new Set());
    const [forceUpdate, setForceUpdate] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!userProfile) {
            console.log('No userProfile available for fetching notifications');
            return;
        }

        try {
            console.log('Fetching notifications for user:', userProfile.id);
            setLoading(true);

            // Check quota status
            const quotaInfo = quotaManager.getQuotaStatus();
            setQuotaStatus(quotaInfo);

            const userNotifications = await notificationService.getUserNotifications(userProfile.id, {
                limit: 100
            });
            console.log('Fetched notifications:', userNotifications);
            setNotifications(userNotifications);

            // Show quota warning if exceeded
            if (quotaInfo.status === 'exceeded') {
                toast.warning('Firebase quota exceeded. Some features may be limited.', {
                    duration: 5000
                });
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);

            // Check if it's a quota error
            if (error.message.includes('quota exceeded') || error.code === 'resource-exhausted') {
                toast.error('Firebase quota exceeded. Using local notifications only.');
                const localNotifications = notificationService.getLocalNotifications(userProfile.id);
                setNotifications(localNotifications);
            } else {
                toast.error('Failed to load notifications: ' + error.message);

                // Add a fallback notification to show the UI is working
                const fallbackNotification = {
                    id: 'fallback-' + Date.now(),
                    userId: userProfile.id,
                    type: 'error',
                    title: 'Firebase Connection Issue',
                    message: 'Unable to load notifications from Firebase. This might be due to missing indexes or connection issues.',
                    read: false,
                    createdAt: new Date(),
                    data: { fallback: true }
                };

                setNotifications([fallbackNotification]);
            }
        } finally {
            setLoading(false);
        }
    }, [userProfile]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Clear selections when notifications change
    useEffect(() => {
        // Clear selections for notifications that no longer exist
        setSelectedNotifications(prev => {
            const newSet = new Set();
            prev.forEach(id => {
                if (notifications.some(notif => notif.id === id)) {
                    newSet.add(id);
                }
            });
            return newSet;
        });
    }, [notifications]);

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationService.markAsRead(notificationId);
            setNotifications(prev =>
                prev.map(notif =>
                    notif.id === notificationId
                        ? { ...notif, read: true }
                        : notif
                )
            );
            toast.success('Notification marked as read');
        } catch (error) {
            console.error('Error marking notification as read:', error);
            toast.error('Failed to mark notification as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead(userProfile.id);
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, read: true }))
            );
            toast.success('All notifications marked as read');
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            toast.error('Failed to mark all notifications as read');
        }
    };

    const handleDeleteNotification = async (notification) => {
        if (DeletionHelper.confirmDeletion(notification.title || 'notification', 'notification')) {
            setDeletingNotifications(prev => new Set([...prev, notification.id]));

            await DeletionHelper.deleteNotification(notification, {
                onSuccess: (notificationId) => {
                    setNotifications(prev =>
                        prev.filter(notif => notif.id !== notificationId)
                    );
                    // Clear selection if this notification was selected
                    setSelectedNotifications(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(notificationId);
                        return newSet;
                    });
                    setDeletingNotifications(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(notificationId);
                        return newSet;
                    });
                },
                onError: (error) => {
                    console.error('Delete error:', error);
                    setDeletingNotifications(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(notification.id);
                        return newSet;
                    });
                }
            });
        }
    };

    const handleBulkDelete = async () => {
        if (selectedNotifications.size === 0) {
            toast.error('Please select notifications to delete');
            return;
        }

        if (DeletionHelper.confirmDeletion(`${selectedNotifications.size} notifications`, 'notifications')) {
            const selectedArray = Array.from(selectedNotifications);
            setDeletingNotifications(prev => new Set([...prev, ...selectedArray]));

            try {
                const results = await DeletionHelper.batchDelete(
                    notifications.filter(n => selectedNotifications.has(n.id)),
                    'notification',
                    { showToast: true }
                );

                // Update local state
                const successfulDeletes = results.filter(r => r.success).map(r => r.item.id);
                setNotifications(prev => prev.filter(notif => !successfulDeletes.includes(notif.id)));

                // Clear selected notifications and deleting state
                setSelectedNotifications(new Set());
                setDeletingNotifications(prev => {
                    const newSet = new Set(prev);
                    selectedArray.forEach(id => newSet.delete(id));
                    return newSet;
                });

            } catch (error) {
                console.error('Bulk delete error:', error);
                setDeletingNotifications(prev => {
                    const newSet = new Set(prev);
                    selectedArray.forEach(id => newSet.delete(id));
                    return newSet;
                });
            }
        }
    };

    const handleSelectNotification = (notificationId) => {
        setSelectedNotifications(prev => {
            const newSet = new Set(prev);
            if (newSet.has(notificationId)) {
                newSet.delete(notificationId);
            } else {
                newSet.add(notificationId);
            }
            return newSet;
        });
        // Force re-render to ensure checkboxes update
        setForceUpdate(prev => prev + 1);
    };

    const handleSelectAll = () => {
        if (selectedNotifications.size === filteredNotifications.length) {
            setSelectedNotifications(new Set());
        } else {
            setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
        }
    };

    const clearAllSelections = () => {
        setSelectedNotifications(new Set());
        setForceUpdate(prev => prev + 1);
    };

    const handleTestNotification = async () => {
        if (!userProfile) {
            toast.error('No user profile available');
            return;
        }

        try {
            console.log('Creating test notification for user:', userProfile.id);
            const notificationId = await notificationService.sendGeneralNotification(
                userProfile.id,
                'Test Notification',
                'This is a test notification to verify the system is working.',
                'test',
                { test: true }
            );
            console.log('Test notification created with ID:', notificationId);
            toast.success('Test notification created!');
            // Refresh notifications
            setTimeout(() => {
                fetchNotifications();
            }, 1000);
        } catch (error) {
            console.error('Error creating test notification:', error);
            toast.error('Failed to create test notification: ' + error.message);

            // Add a local test notification as fallback
            const testNotification = {
                id: 'test-' + Date.now(),
                userId: userProfile.id,
                type: 'test',
                title: 'Test Notification (Local)',
                message: 'This is a local test notification since Firebase failed.',
                read: false,
                createdAt: new Date(),
                data: { test: true, local: true }
            };

            setNotifications(prev => [testNotification, ...prev]);
            toast.success('Added local test notification');
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'leave_approved':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'leave_rejected':
                return <XCircle className="w-5 h-5 text-red-600" />;
            case 'shift_picked_up':
            case 'shift_assigned':
                return <Calendar className="w-5 h-5 text-blue-600" />;
            case 'general':
            default:
                return <Bell className="w-5 h-5 text-gray-600" />;
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'leave_approved':
                return 'bg-green-50 border-l-green-500';
            case 'leave_rejected':
                return 'bg-red-50 border-l-red-500';
            case 'shift_picked_up':
            case 'shift_assigned':
                return 'bg-blue-50 border-l-blue-500';
            default:
                return 'bg-gray-50 border-l-gray-500';
        }
    };

    const filteredNotifications = notifications.filter(notification => {
        // Filter by read status
        if (filter === 'unread' && notification.read) return false;
        if (filter === 'read' && !notification.read) return false;

        // Filter by search term
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
                notification.title.toLowerCase().includes(searchLower) ||
                notification.message.toLowerCase().includes(searchLower)
            );
        }

        return true;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4"></div>
                    <p className="text-medical-gray">Loading notifications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center space-x-4 mb-2">
                        <h2 className="text-xl font-semibold text-medical-dark">Notifications</h2>
                        {filteredNotifications.length > 0 && (
                            <label className="flex items-center space-x-2 text-sm text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
                                    ref={(el) => {
                                        if (el) {
                                            el.indeterminate = selectedNotifications.size > 0 && selectedNotifications.size < filteredNotifications.length;
                                        }
                                    }}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span>Select All</span>
                            </label>
                        )}
                    </div>
                    <p className="text-medical-gray">
                        {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                    </p>
                    <p className="text-xs text-gray-500">
                        User ID: {userProfile?.id || 'No user'} | Total: {notifications.length} | Selected: {selectedNotifications.size}
                        {quotaStatus?.status === 'exceeded' && (
                            <span className="text-orange-600 ml-2">⚠️ Quota Exceeded</span>
                        )}
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="btn-outline flex items-center space-x-2"
                        >
                            <Check className="w-4 h-4" />
                            <span>Mark All Read</span>
                        </button>
                    )}
                    {selectedNotifications.size > 0 && (
                        <>
                            <button
                                onClick={clearAllSelections}
                                className="btn-outline text-gray-600 hover:bg-gray-50 flex items-center space-x-2"
                            >
                                <XCircle className="w-4 h-4" />
                                <span>Clear Selection</span>
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={deletingNotifications.size > 0}
                                className="btn-outline text-red-600 hover:bg-red-50 flex items-center space-x-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete Selected ({selectedNotifications.size})</span>
                            </button>
                        </>
                    )}
                    <button
                        onClick={handleTestNotification}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <Bell className="w-4 h-4" />
                        <span>Test Notification</span>
                    </button>
                </div>
            </div>

            {/* Quota Status Banner */}
            {quotaStatus?.status === 'exceeded' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        <div>
                            <h3 className="font-semibold text-orange-800">Firebase Quota Exceeded</h3>
                            <p className="text-sm text-orange-700">
                                {quotaStatus.message} Some features may be limited until the quota resets.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters and Search */}
            <div className="card">
                <div className="flex items-center space-x-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-medical-gray w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search notifications..."
                                className="input-field pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <select
                        className="input-field"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All Notifications</option>
                        <option value="unread">Unread Only</option>
                        <option value="read">Read Only</option>
                    </select>
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                    <div className="text-center py-12">
                        <Bell className="w-16 h-16 text-medical-gray mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-medical-dark mb-2">
                            {filter === 'unread' ? 'No Unread Notifications' :
                                filter === 'read' ? 'No Read Notifications' :
                                    'No Notifications'}
                        </h3>
                        <p className="text-medical-gray">
                            {filter === 'unread' ? 'You\'re all caught up!' :
                                filter === 'read' ? 'No read notifications yet' :
                                    'You\'ll see notifications here when you receive them.'}
                        </p>
                    </div>
                ) : (
                    filteredNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`card border-l-4 ${getNotificationColor(notification.type)} ${!notification.read ? 'ring-2 ring-blue-100' : ''
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                    <div className="flex-shrink-0 mt-1">
                                        <input
                                            key={`checkbox-${notification.id}-${forceUpdate}`}
                                            type="checkbox"
                                            checked={selectedNotifications.has(notification.id)}
                                            onChange={() => handleSelectNotification(notification.id)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="flex-shrink-0 mt-1">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <h3 className="font-semibold text-medical-dark">
                                                {notification.title}
                                            </h3>
                                            {!notification.read && (
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                            )}
                                        </div>
                                        <p className="text-medical-gray mb-2">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center space-x-4 text-xs text-medical-gray">
                                            <span className="flex items-center space-x-1">
                                                <Clock className="w-3 h-3" />
                                                <span>
                                                    {notification.createdAt ? (() => {
                                                        // Handle both Firestore timestamp and regular date
                                                        let date;
                                                        if (notification.createdAt.seconds) {
                                                            date = new Date(notification.createdAt.seconds * 1000);
                                                        } else if (notification.createdAt.toDate) {
                                                            date = notification.createdAt.toDate();
                                                        } else {
                                                            date = new Date(notification.createdAt);
                                                        }
                                                        return !isNaN(date.getTime()) ? date.toLocaleString() : 'Unknown time';
                                                    })() : 'Unknown time'}
                                                </span>
                                            </span>
                                            <span className="capitalize">
                                                {notification.type.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    {!notification.read && (
                                        <button
                                            onClick={() => handleMarkAsRead(notification.id)}
                                            className="btn-outline text-sm"
                                            title="Mark as read"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteNotification(notification)}
                                        disabled={deletingNotifications.has(notification.id)}
                                        className={`btn-outline text-red-600 hover:bg-red-50 text-sm ${deletingNotifications.has(notification.id) ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                        title="Delete notification"
                                    >
                                        {deletingNotifications.has(notification.id) ? (
                                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notifications;
