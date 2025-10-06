import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar,
    Clock,
    Bell,
    Plus,
    Filter,
    CheckCircle,
    Calendar as CalendarIcon,
    Award,
    Edit,
    Trash2,
    Eye,
    Download
} from 'lucide-react';
import Navbar from '../components/Navbar';
import StatsCard from '../components/StatsCard';
import TimelineView from '../components/TimelineView';
import CalendarView from '../components/CalendarView';
import LeaveRequestModal from '../components/LeaveRequestModal';
import NotificationSettings from '../components/NotificationSettings';
import Notifications from '../components/Notifications';
import { useAuth } from '../contexts/AuthContext';
import { shiftService, leaveService } from '../services/dataService';
import notificationService from '../services/notificationService';
import DeletionHelper from '../utils/deletionHelper';
import useAnalytics from '../hooks/useAnalytics';
import toast from 'react-hot-toast';

const StaffDashboard = () => {
    const { currentUser, userProfile } = useAuth();
    const analytics = useAnalytics();
    const [activeTab, setActiveTab] = useState('schedule');
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [editingRequest, setEditingRequest] = useState(null);
    const [viewingRequest, setViewingRequest] = useState(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showNotificationSettings, setShowNotificationSettings] = useState(false);
    const [dashboardData, setDashboardData] = useState({
        stats: {
            upcomingShifts: 0,
            hoursThisWeek: 0,
            pendingRequests: 0,
            completedShifts: 0
        },
        myShifts: [],
        availableShifts: [],
        notifications: [],
        leaveRequests: []
    });
    const [loading, setLoading] = useState(true);

    // Optimized stats calculation with memoization
    const calculateStats = useCallback((myShifts, leaveRequests) => {
        const now = new Date();
        const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

        return {
            upcomingShifts: myShifts.filter(s => {
                if (!s.startTime) return false;
                const startDate = new Date(s.startTime);
                return !isNaN(startDate.getTime()) && startDate > now;
            }).length,
            hoursThisWeek: myShifts
                .filter(s => {
                    if (!s.startTime) return false;
                    const startDate = new Date(s.startTime);
                    return !isNaN(startDate.getTime()) && startDate > oneWeekAgo;
                })
                .reduce((acc, s) => acc + (s.duration || 8), 0),
            pendingRequests: leaveRequests.filter(r => r.status === 'pending').length,
            completedShifts: myShifts.filter(s => s.status === 'completed').length
        };
    }, []);

    const fetchDashboardData = useCallback(async () => {
        if (!userProfile || !userProfile.id) {
            console.warn('No userProfile available for fetching dashboard data');
            return;
        }

        try {
            setLoading(true);

            // Optimized parallel data fetching with error handling
            const [myShiftsData, availableShiftsData, leaveRequestsData] = await Promise.allSettled([
                shiftService.getAll({ assignedTo: userProfile.id, sortBy: 'startTime', sortOrder: 'asc' }),
                shiftService.getAll({ status: 'available', department: userProfile.department, limit: 10 }),
                leaveService.getAll({ 'requestedBy.id': userProfile.id, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' })
            ]);

            // Safely extract data with fallbacks
            const myShifts = myShiftsData.status === 'fulfilled' ? (Array.isArray(myShiftsData.value) ? myShiftsData.value : []) : [];
            const availableShifts = availableShiftsData.status === 'fulfilled' ? (Array.isArray(availableShiftsData.value) ? availableShiftsData.value : []) : [];
            const leaveRequests = leaveRequestsData.status === 'fulfilled' ? (Array.isArray(leaveRequestsData.value) ? leaveRequestsData.value : []) : [];

            // Log errors for debugging
            if (myShiftsData.status === 'rejected') console.error('Error fetching myShifts:', myShiftsData.reason);
            if (availableShiftsData.status === 'rejected') console.error('Error fetching availableShifts:', availableShiftsData.reason);
            if (leaveRequestsData.status === 'rejected') console.error('Error fetching leaveRequests:', leaveRequestsData.reason);

            setDashboardData({
                stats: calculateStats(myShifts, leaveRequests),
                myShifts,
                availableShifts,
                leaveRequests,
                notifications: []
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, [userProfile, calculateStats]);

    useEffect(() => {
        if (userProfile && userProfile.id) {
            fetchDashboardData();
            // Track page view (only once per component mount)
            analytics.logPageView('staff_dashboard', userProfile.role);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userProfile, fetchDashboardData]);

    const handlePickupShift = useCallback(async (shiftId) => {
        if (!userProfile || !userProfile.id) {
            toast.error('User profile not available');
            return;
        }

        try {
            console.log('Picking up shift:', shiftId, 'for user:', userProfile.id);
            toast.loading('Picking up shift...', { id: 'pickup-shift' });

            // Find the shift data to send in notification
            const shiftData = dashboardData.availableShifts.find(shift => shift.id === shiftId);

            await shiftService.assignShift(shiftId, userProfile.id);

            // Send notification to the staff member
            try {
                if (shiftData) {
                    await notificationService.sendShiftPickupNotification(userProfile.id, shiftData);
                }
            } catch (notificationError) {
                console.warn('Failed to send notification:', notificationError);
                // Don't fail the main operation if notification fails
            }

            console.log('Shift assigned successfully, refreshing dashboard data...');
            toast.success('Shift added to your schedule!', { id: 'pickup-shift' });
            fetchDashboardData(); // Refresh data
        } catch (error) {
            console.error('Error picking up shift:', error);
            toast.error(error.message || 'Failed to pick up shift.');
        }
    }, [userProfile, dashboardData.availableShifts, fetchDashboardData]);

    const handleCreateRequest = () => {
        setEditingRequest(null);
        setViewingRequest(null);
        setShowLeaveModal(true);
    };

    const handleEditRequest = (request) => {
        setEditingRequest(request);
        setViewingRequest(null);
        setShowLeaveModal(true);
    };

    const handleViewRequest = (request) => {
        setViewingRequest(request);
        setEditingRequest(null);
        setShowLeaveModal(true);
    };

    const handleDeleteRequest = async (leaveRequest) => {
        if (DeletionHelper.confirmDeletion(leaveRequest.type || 'leave request', 'leave request')) {
            await DeletionHelper.deleteLeaveRequest(leaveRequest, {
                onSuccess: () => fetchDashboardData(),
                onError: (error) => console.error('Delete error:', error)
            });
        }
    };

    const handleModalSuccess = () => {
        fetchDashboardData();
        setShowLeaveModal(false);
        setEditingRequest(null);
        setViewingRequest(null);
    };

    const handleModalClose = () => {
        setShowLeaveModal(false);
        setEditingRequest(null);
        setViewingRequest(null);
    };


    const handleExportSchedule = () => {
        try {
            // Create CSV content
            const csvContent = [
                ['Date', 'Start Time', 'End Time', 'Department', 'Status'],
                ...dashboardData.myShifts.map(shift => {
                    const startDate = shift.startTime ? new Date(shift.startTime) : new Date();
                    const endDate = shift.endTime ? new Date(shift.endTime) : new Date();
                    return [
                        !isNaN(startDate.getTime()) ? startDate.toLocaleDateString() : 'Invalid Date',
                        !isNaN(startDate.getTime()) ? startDate.toLocaleTimeString() : 'Invalid Time',
                        !isNaN(endDate.getTime()) ? endDate.toLocaleTimeString() : 'Invalid Time',
                        shift.department || 'Unknown',
                        shift.status || 'Unknown'
                    ];
                })
            ].map(row => row.join(',')).join('\n');

            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `my-schedule-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            toast.success('Schedule exported successfully!');
        } catch (error) {
            console.error('Error exporting schedule:', error);
            toast.error('Failed to export schedule');
        }
    };

    const handleSwapRequest = async (shiftId) => {
        // This would open a modal to select a shift to swap with
        // For now, we'll just log it.
        console.log('Requesting shift swap for:', shiftId);
        toast('Shift swap functionality is under development.', {
            icon: 'ℹ️',
            duration: 3000,
        });
    };

    const tabs = [
        { id: 'schedule', label: 'My Schedule', icon: Calendar },
        { id: 'available', label: 'Available Shifts', icon: Plus },
        { id: 'requests', label: 'My Requests', icon: Clock },
        { id: 'notifications', label: 'Notifications', icon: Bell }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="spinner mx-auto mb-4"></div>
                        <p className="text-medical-gray">Loading your dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show empty state if no user profile
    if (!userProfile) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🏥</div>
                        <h2 className="text-2xl font-semibold text-medical-dark mb-2">Welcome to ShiftCheck</h2>
                        <p className="text-medical-gray">Please log in to access your dashboard</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="pt-16">
                {/* Header */}
                <div className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-6">
                            <div>
                                <h1 className="text-3xl font-display font-bold text-medical-dark">
                                    My Dashboard
                                </h1>
                                <p className="text-medical-gray mt-1">
                                    Welcome back, {currentUser?.name || 'Staff Member'}
                                </p>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <button
                                        onClick={() => setActiveTab('notifications')}
                                        className="p-2 text-medical-gray hover:text-medical-primary rounded-full hover:bg-medical-light transition-colors"
                                    >
                                        <Bell className="w-6 h-6" />
                                        {dashboardData.notifications.filter(n => !n.read).length > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                                {dashboardData.notifications.filter(n => !n.read).length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex space-x-8 -mb-px">
                            {tabs.map((tab) => {
                                const IconComponent = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                            ? 'border-medical-primary text-medical-primary'
                                            : 'border-transparent text-medical-gray hover:text-medical-dark hover:border-gray-300'
                                            }`}
                                    >
                                        <IconComponent className="w-4 h-4" />
                                        <span>{tab.label}</span>
                                        {tab.id === 'notifications' && dashboardData.notifications.filter(n => !n.read).length > 0 && (
                                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatsCard
                            title="Upcoming Shifts"
                            value={dashboardData.stats.upcomingShifts}
                            icon={Calendar}
                            color="blue"
                            subtitle="Next 7 days"
                        />
                        <StatsCard
                            title="Hours This Week"
                            value={dashboardData.stats.hoursThisWeek}
                            icon={Clock}
                            color="green"
                            subtitle="Out of 40 max"
                        />
                        <StatsCard
                            title="Pending Requests"
                            value={dashboardData.stats.pendingRequests}
                            icon={Clock}
                            color="orange"
                            subtitle="Awaiting approval"
                        />
                        <StatsCard
                            title="Completed Shifts"
                            value={dashboardData.stats.completedShifts}
                            icon={Award}
                            color="purple"
                            subtitle="This month"
                        />
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'schedule' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-medical-dark">My Schedule</h2>
                                <div className="flex items-center space-x-4">
                                    <select className="input-field text-sm">
                                        <option value="week">This Week</option>
                                        <option value="month">This Month</option>
                                        <option value="quarter">Next 3 Months</option>
                                    </select>
                                    <button
                                        onClick={() => setShowCalendar(!showCalendar)}
                                        className="btn-outline text-sm flex items-center space-x-1"
                                    >
                                        <CalendarIcon className="w-4 h-4" />
                                        <span>{showCalendar ? 'List View' : 'Calendar View'}</span>
                                    </button>
                                    <button
                                        onClick={handleExportSchedule}
                                        className="btn-outline text-sm flex items-center space-x-1"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>Export</span>
                                    </button>
                                </div>
                            </div>

                            {showCalendar ? (
                                <CalendarView
                                    shifts={dashboardData.myShifts}
                                    onSwapRequest={handleSwapRequest}
                                />
                            ) : (
                                <TimelineView
                                    shifts={dashboardData.myShifts}
                                    onSwapRequest={handleSwapRequest}
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'available' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-medical-dark">Available Shifts</h2>
                                <div className="flex items-center space-x-4">
                                    <select className="input-field text-sm">
                                        <option value="">All Departments</option>
                                        <option value="emergency">Emergency</option>
                                        <option value="icu">ICU</option>
                                        <option value="surgery">Surgery</option>
                                    </select>
                                    <button className="btn-outline text-sm flex items-center space-x-1">
                                        <Filter className="w-4 h-4" />
                                        <span>Filters</span>
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-6">
                                {dashboardData.availableShifts.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="text-4xl mb-4">📅</div>
                                        <h3 className="text-lg font-semibold text-medical-dark mb-2">No Available Shifts</h3>
                                        <p className="text-medical-gray">Check back later for new shift opportunities</p>
                                    </div>
                                ) : (
                                    dashboardData.availableShifts.map((shift) => (
                                        <div key={shift.id} className="card border-l-4 border-l-green-500">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <h3 className="text-lg font-semibold text-medical-dark">{shift.title}</h3>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${shift.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                                            shift.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                                                'bg-blue-100 text-blue-800'
                                                            }`}>
                                                            {shift.priority}
                                                        </span>
                                                        {shift.incentive && (
                                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                                                {shift.incentive}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-medical-gray mb-3">{shift.department}</p>

                                                    <div className="flex items-center space-x-6 text-sm text-medical-gray">
                                                        <span className="flex items-center space-x-1">
                                                            <CalendarIcon className="w-4 h-4" />
                                                            <span>{shift.startTime ? (() => {
                                                                const date = new Date(shift.startTime);
                                                                return !isNaN(date.getTime()) ? date.toLocaleDateString() : 'Invalid Date';
                                                            })() : 'No Date'}</span>
                                                        </span>
                                                        <span className="flex items-center space-x-1">
                                                            <Clock className="w-4 h-4" />
                                                            <span>
                                                                {shift.startTime && shift.endTime ? (() => {
                                                                    const startDate = new Date(shift.startTime);
                                                                    const endDate = new Date(shift.endTime);
                                                                    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                                                                        return `${startDate.toLocaleTimeString('en-US', {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })} - ${endDate.toLocaleTimeString('en-US', {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}`;
                                                                    }
                                                                    return 'Invalid Time';
                                                                })() : 'No Time'}
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handlePickupShift(shift.id)}
                                                    className="btn-primary flex items-center space-x-2"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    <span>Pick Up</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'requests' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-medical-dark">My Requests</h2>
                                <button
                                    onClick={handleCreateRequest}
                                    className="btn-primary flex items-center space-x-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>New Request</span>
                                </button>
                            </div>

                            <div className="grid gap-4">
                                {dashboardData.leaveRequests.map((request) => (
                                    <div key={request.id} className="card">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h3 className="font-semibold text-medical-dark capitalize">
                                                        {request.leaveType} Leave
                                                    </h3>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                        {request.status}
                                                    </span>
                                                </div>

                                                <p className="text-medical-gray mb-2">{request.reason}</p>

                                                <div className="flex items-center space-x-6 text-sm text-medical-gray">
                                                    <span>{request.startDate} - {request.endDate}</span>
                                                    <span>Submitted: {request.createdAt ? (() => {
                                                        const date = new Date(request.createdAt);
                                                        return !isNaN(date.getTime()) ? date.toLocaleDateString() : 'Invalid Date';
                                                    })() : 'No Date'}</span>
                                                    {request.reviewedBy && (
                                                        <span>Reviewed by: {request.reviewedBy.name} ({request.reviewedBy.role})</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                {request.status === 'approved' && (
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                )}
                                                {request.status === 'pending' && (
                                                    <Clock className="w-5 h-5 text-yellow-600" />
                                                )}

                                                <div className="flex items-center space-x-1">
                                                    <button
                                                        onClick={() => handleViewRequest(request)}
                                                        className="btn-outline text-sm"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {request.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleEditRequest(request)}
                                                            className="btn-outline text-sm"
                                                            title="Edit Request"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {request.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleDeleteRequest(request)}
                                                            className="btn-outline text-red-600 hover:bg-red-50 text-sm"
                                                            title="Delete Request"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <Notifications />
                    )}
                </div>
            </div>

            {/* Leave Request Modal */}
            {showLeaveModal && (
                <LeaveRequestModal
                    isOpen={showLeaveModal}
                    onClose={handleModalClose}
                    onSuccess={handleModalSuccess}
                    leaveRequest={editingRequest || viewingRequest}
                    isViewing={!!viewingRequest}
                />
            )}

            {/* Notification Settings Modal */}
            {showNotificationSettings && (
                <NotificationSettings
                    isOpen={showNotificationSettings}
                    onClose={() => setShowNotificationSettings(false)}
                />
            )}

        </div>
    );
};

export default StaffDashboard;
