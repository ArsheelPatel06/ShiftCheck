import React, { useState, useEffect } from 'react';
import { Bell, Save, X } from 'lucide-react';
import messagingService from '../services/messagingService';
import toast from 'react-hot-toast';

const NotificationSettings = ({ isOpen, onClose }) => {
    const [settings, setSettings] = useState({
        shiftAssignments: true,
        leaveUpdates: true,
        scheduleChanges: true,
        emergencyAlerts: true,
        reminders: true
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadSettings();
        }
    }, [isOpen]);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const userSettings = await messagingService.getNotificationSettings();
            if (userSettings) {
                setSettings(userSettings);
            }
        } catch (error) {
            console.error('Error loading notification settings:', error);
            toast.error('Failed to load notification settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = (setting, value) => {
        setSettings(prev => ({
            ...prev,
            [setting]: value
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const success = await messagingService.updateNotificationSettings(settings);

            if (success) {
                toast.success('Notification settings saved successfully!');
                onClose();
            } else {
                toast.error('Failed to save notification settings');
            }
        } catch (error) {
            console.error('Error saving notification settings:', error);
            toast.error('Failed to save notification settings');
        } finally {
            setSaving(false);
        }
    };

    const handleTestNotification = async () => {
        try {
            // Request permission if not granted
            const permission = await messagingService.requestPermission();
            if (permission) {
                toast.success('Test notification sent!');
            } else {
                toast.error('Please enable notifications in your browser settings');
            }
        } catch (error) {
            console.error('Error sending test notification:', error);
            toast.error('Failed to send test notification');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                    onClick={onClose}
                ></div>

                {/* Modal */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-medical-primary to-medical-secondary px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                    <Bell className="w-4 h-4 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">Notification Settings</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="spinner"></div>
                                <span className="ml-2 text-medical-gray">Loading settings...</span>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Notification Types */}
                                <div className="space-y-4">
                                    <h4 className="text-md font-medium text-medical-dark">Notification Types</h4>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Bell className="w-5 h-5 text-blue-600" />
                                                <div>
                                                    <p className="font-medium text-medical-dark">Shift Assignments</p>
                                                    <p className="text-sm text-medical-gray">Get notified when you're assigned to new shifts</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.shiftAssignments}
                                                    onChange={(e) => handleSettingChange('shiftAssignments', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Bell className="w-5 h-5 text-green-600" />
                                                <div>
                                                    <p className="font-medium text-medical-dark">Leave Updates</p>
                                                    <p className="text-sm text-medical-gray">Get notified about leave request approvals/rejections</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.leaveUpdates}
                                                    onChange={(e) => handleSettingChange('leaveUpdates', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Bell className="w-5 h-5 text-orange-600" />
                                                <div>
                                                    <p className="font-medium text-medical-dark">Schedule Changes</p>
                                                    <p className="text-sm text-medical-gray">Get notified when your schedule is modified</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.scheduleChanges}
                                                    onChange={(e) => handleSettingChange('scheduleChanges', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Bell className="w-5 h-5 text-red-600" />
                                                <div>
                                                    <p className="font-medium text-medical-dark">Emergency Alerts</p>
                                                    <p className="text-sm text-medical-gray">Get notified about urgent situations</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.emergencyAlerts}
                                                    onChange={(e) => handleSettingChange('emergencyAlerts', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Bell className="w-5 h-5 text-purple-600" />
                                                <div>
                                                    <p className="font-medium text-medical-dark">Reminders</p>
                                                    <p className="text-sm text-medical-gray">Get reminded about upcoming shifts</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.reminders}
                                                    onChange={(e) => handleSettingChange('reminders', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Test Notification */}
                                <div className="border-t pt-4">
                                    <button
                                        onClick={handleTestNotification}
                                        className="btn-outline w-full flex items-center justify-center space-x-2"
                                    >
                                        <Bell className="w-4 h-4" />
                                        <span>Send Test Notification</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between px-6 py-4 bg-gray-50">
                        <button
                            onClick={onClose}
                            className="btn-outline"
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="btn-primary flex items-center space-x-2"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <div className="spinner"></div>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Save Settings</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettings;
