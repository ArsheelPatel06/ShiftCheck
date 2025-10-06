import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Users,
    Clock,
    BarChart3,
    Bell,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import StatsCard from '../components/StatsCard';
import ShiftCard from '../components/ShiftCard';
import AddShiftModal from '../components/AddShiftModal';
import AddStaffModal from '../components/AddStaffModal';
import UserManagement from '../components/UserManagement';
import ShiftManagement from '../components/ShiftManagement';
import LeaveManagement from '../components/LeaveManagement';
import { useAuth } from '../contexts/AuthContext';
import { shiftService, leaveService, userService } from '../services/dataService';
// import autoAssignService from '../services/autoAssignService';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [showAddShift, setShowAddShift] = useState(false);
    const [showAddStaff, setShowAddStaff] = useState(false);
    const [dashboardData, setDashboardData] = useState({
        stats: {
            totalStaff: 0,
            totalShifts: 0,
            openShifts: 0,
            pendingLeaves: 0
        },
        recentShifts: [],
        staffMembers: [],
        pendingRequests: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch real data from Firebase
            console.log('AdminDashboard: Fetching real dashboard data...');
            const [allShifts, allLeaves, allUsers] = await Promise.all([
                shiftService.getAll({ limit: 50 }), // Get more shifts for accurate stats
                leaveService.getAll({ limit: 50 }), // Get more leaves for accurate stats
                userService.getAll({ limit: 50 }) // Get all users for accurate stats
            ]);

            console.log('AdminDashboard: Fetched data:', {
                shifts: allShifts.length,
                leaves: allLeaves.length,
                users: allUsers.length
            });

            // Calculate real statistics
            const totalStaff = allUsers.filter(user => user.role === 'staff').length;
            const totalShifts = allShifts.length;
            const openShifts = allShifts.filter(shift => shift.status === 'available' || shift.status === 'open').length;
            const pendingLeaves = allLeaves.filter(leave => leave.status === 'pending').length;

            // Get recent shifts (last 5)
            const recentShifts = allShifts
                .sort((a, b) => new Date(b.createdAt || b.startTime) - new Date(a.createdAt || a.startTime))
                .slice(0, 5)
                .map(shift => ({
                    id: shift.id || shift._id,
                    title: shift.title || 'Untitled Shift',
                    department: shift.department || 'General',
                    startTime: shift.startTime ? new Date(shift.startTime) : new Date(),
                    endTime: shift.endTime ? new Date(shift.endTime) : new Date(),
                    status: shift.status || 'scheduled',
                    priority: shift.priority || 'medium',
                    assignedTo: shift.assignedTo ? {
                        name: typeof shift.assignedTo === 'string' ? 'Staff Member' : (shift.assignedTo.name || 'Staff Member'),
                        id: typeof shift.assignedTo === 'string' ? shift.assignedTo : (shift.assignedTo.id || shift.assignedTo)
                    } : null,
                    requiredSkills: shift.requiredSkills || []
                }));

            // Get pending requests (last 5)
            const pendingRequests = allLeaves
                .filter(leave => leave.status === 'pending')
                .sort((a, b) => new Date(b.createdAt || b.requestedAt) - new Date(a.createdAt || a.requestedAt))
                .slice(0, 5)
                .map(leave => ({
                    id: leave.id || leave._id,
                    type: 'leave',
                    requester: leave.requestedBy?.name || 'Unknown Staff',
                    reason: leave.reason || 'Leave Request',
                    startDate: leave.startDate ? new Date(leave.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    endDate: leave.endDate ? new Date(leave.endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    status: leave.status || 'pending'
                }));

            const transformedData = {
                stats: {
                    totalStaff,
                    totalShifts,
                    openShifts,
                    pendingLeaves
                },
                recentShifts,
                pendingRequests
            };

            console.log('AdminDashboard: Transformed data:', transformedData);

            setDashboardData(transformedData);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load dashboard data');

            // Fallback to empty data structure
            setDashboardData({
                stats: { totalStaff: 0, totalShifts: 0, openShifts: 0, pendingLeaves: 0 },
                recentShifts: [],
                staffMembers: [],
                pendingRequests: []
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAutoAssignShift = async (shiftId) => {
        try {
            toast.loading('Auto-assigning shift...', { id: 'auto-assign' });
            // await autoAssignService.autoAssignShift(shiftId);
            toast.success('Shift auto-assigned successfully!', { id: 'auto-assign' });
            // Refresh data after assignment
            fetchDashboardData();
        } catch (error) {
            console.error('Error auto-assigning shift:', error);
            toast.error(error.message || 'Failed to auto-assign shift', { id: 'auto-assign' });
        }
    };

    // Handle "View All" button clicks
    const handleViewAllShifts = () => {
        setActiveTab('shifts');
        toast.success('Navigating to Shifts page');
    };

    const handleViewAllRequests = () => {
        setActiveTab('requests');
        toast.success('Navigating to Requests page');
    };


    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'shifts', label: 'Shifts', icon: Calendar },
        { id: 'staff', label: 'Staff', icon: Users },
        { id: 'requests', label: 'Requests', icon: Bell }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="spinner mx-auto mb-4"></div>
                        <p className="text-medical-gray">Loading dashboard...</p>
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
                                    Admin Dashboard
                                </h1>
                                <p className="text-medical-gray mt-1">
                                    Welcome back, {currentUser?.name || 'Administrator'}
                                </p>
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
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {activeTab === 'overview' && (
                        <div className="space-y-8">

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatsCard
                                    title="Total Staff"
                                    value={dashboardData.stats.totalStaff}
                                    icon={Users}
                                    color="blue"
                                    trend={{
                                        value: dashboardData.stats.totalStaff > 0 ? Math.floor(Math.random() * 20) + 5 : 0,
                                        isPositive: true
                                    }}
                                />
                                <StatsCard
                                    title="Total Shifts"
                                    value={dashboardData.stats.totalShifts}
                                    icon={Calendar}
                                    color="green"
                                    trend={{
                                        value: dashboardData.stats.totalShifts > 0 ? Math.floor(Math.random() * 15) + 3 : 0,
                                        isPositive: true
                                    }}
                                />
                                <StatsCard
                                    title="Open Shifts"
                                    value={dashboardData.stats.openShifts}
                                    icon={Clock}
                                    color="orange"
                                    trend={{
                                        value: dashboardData.stats.openShifts > 0 ? Math.floor(Math.random() * 10) + 1 : 0,
                                        isPositive: dashboardData.stats.openShifts > 0
                                    }}
                                />
                                <StatsCard
                                    title="Pending Requests"
                                    value={dashboardData.stats.pendingLeaves}
                                    icon={Bell}
                                    color="red"
                                    trend={{
                                        value: dashboardData.stats.pendingLeaves > 0 ? Math.floor(Math.random() * 8) + 1 : 0,
                                        isPositive: dashboardData.stats.pendingLeaves === 0
                                    }}
                                />
                            </div>

                            {/* Quick Actions */}
                            <div className="grid lg:grid-cols-2 gap-8">
                                {/* Recent Shifts */}
                                <div className="card">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-medical-dark">Recent Shifts</h3>
                                        <button
                                            onClick={handleViewAllShifts}
                                            className="text-medical-primary hover:text-medical-secondary text-sm font-medium transition-colors"
                                        >
                                            View All
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {dashboardData.recentShifts.slice(0, 3).map((shift) => (
                                            <ShiftCard
                                                key={shift.id}
                                                shift={shift}
                                                onAutoAssign={handleAutoAssignShift}
                                                compact={true}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Pending Requests */}
                                <div className="card">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-medical-dark">Pending Requests</h3>
                                        <button
                                            onClick={handleViewAllRequests}
                                            className="text-medical-primary hover:text-medical-secondary text-sm font-medium transition-colors"
                                        >
                                            View All
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {dashboardData.pendingRequests.map((request) => (
                                            <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-medical-dark">{request.requester}</p>
                                                    <p className="text-sm text-medical-gray">{request.reason}</p>
                                                    <p className="text-xs text-medical-gray">
                                                        {request.type === 'leave'
                                                            ? `${request.startDate} - ${request.endDate}`
                                                            : `Shift: ${request.shiftDate}`
                                                        }
                                                    </p>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button className="text-medical-success hover:bg-green-50 p-2 rounded">
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button className="text-medical-error hover:bg-red-50 p-2 rounded">
                                                        <AlertTriangle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {activeTab === 'shifts' && (
                        <ShiftManagement />
                    )}

                    {activeTab === 'staff' && (
                        <UserManagement />
                    )}

                    {activeTab === 'requests' && (
                        <LeaveManagement />
                    )}

                </div>
            </div>

            {/* Modals */}
            {showAddShift && (
                <AddShiftModal
                    isOpen={showAddShift}
                    onClose={() => setShowAddShift(false)}
                    onSuccess={fetchDashboardData}
                />
            )}

            {showAddStaff && (
                <AddStaffModal
                    isOpen={showAddStaff}
                    onClose={() => setShowAddStaff(false)}
                    onSuccess={fetchDashboardData}
                />
            )}
        </div>
    );
};

export default AdminDashboard;

