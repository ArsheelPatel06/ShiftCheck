import React, { useState, useEffect, useCallback } from 'react';
import {
    CheckCircle,
    AlertTriangle,
    Calendar,
    Search,
    Clock,
    XCircle,
    CalendarDays,
    User,
    Eye,
    Edit,
    Trash2,
    FileText
} from 'lucide-react';
import { leaveService } from '../services/dataService';
import deletionService from '../services/deletionService';
import { useAuth } from '../contexts/AuthContext';
import notificationService from '../services/notificationService';
import LeaveRequestModal from './LeaveRequestModal';
import toast from 'react-hot-toast';

const LeaveManagement = () => {
    const { userProfile } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingLeave, setViewingLeave] = useState(null);
    const [editingLeave, setEditingLeave] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        type: '',
        search: ''
    });

    const fetchLeaves = useCallback(async () => {
        try {
            setLoading(true);
            const response = await leaveService.getAll(filters);
            const leavesData = response.leaveRequests || response || [];
            setLeaves(Array.isArray(leavesData) ? leavesData : []);
        } catch (error) {
            console.error('Error fetching leaves:', error);
            toast.error('Failed to load leave requests');
            setLeaves([]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchLeaves();
    }, [fetchLeaves]);

    const handleStatusUpdate = async (leaveId, newStatus) => {
        try {
            toast.loading('Updating leave request...', { id: 'update-leave' });

            // Find the leave request to get staff details
            const leaveRequest = leaves.find(leave => (leave._id || leave.id) === leaveId);
            if (!leaveRequest) {
                throw new Error('Leave request not found');
            }

            // Prepare update data with admin details
            const updateData = {
                status: newStatus,
                reviewedBy: {
                    id: userProfile.id,
                    name: userProfile.name,
                    email: userProfile.email,
                    role: userProfile.role
                },
                reviewedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await leaveService.update(leaveId, updateData);

            // Send notification to the staff member
            try {
                if (newStatus === 'approved') {
                    await notificationService.sendLeaveApprovalNotification(
                        leaveRequest.requestedBy.id,
                        leaveRequest
                    );
                } else if (newStatus === 'rejected') {
                    await notificationService.sendLeaveRejectionNotification(
                        leaveRequest.requestedBy.id,
                        leaveRequest
                    );
                }
            } catch (notificationError) {
                console.warn('Failed to send notification:', notificationError);
                // Don't fail the main operation if notification fails
            }

            // Show success message with action taken
            const actionMessage = newStatus === 'approved' ? 'approved' : 'rejected';
            toast.success(`Leave request ${actionMessage} successfully!`, { id: 'update-leave' });

            // Refresh the list to show updated status
            fetchLeaves();
        } catch (error) {
            console.error('Error updating leave:', error);
            toast.error('Failed to update leave request', { id: 'update-leave' });
        }
    };

    const handleView = (leave) => {
        setViewingLeave(leave);
    };

    const handleEdit = (leave) => {
        setEditingLeave(leave);
    };

    const handleDelete = async (leaveId) => {
        if (window.confirm('Are you sure you want to delete this leave request? This action cannot be undone.')) {
            const result = await deletionService.deleteLeaveRequest(leaveId);
            if (result.success) {
                fetchLeaves();
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'cancelled': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'sick': return 'bg-red-100 text-red-800';
            case 'vacation': return 'bg-blue-100 text-blue-800';
            case 'personal': return 'bg-purple-100 text-purple-800';
            case 'emergency': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return <CheckCircle className="w-4 h-4" />;
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'rejected': return <XCircle className="w-4 h-4" />;
            case 'cancelled': return <AlertTriangle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const calculateDuration = (startDate, endDate) => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4"></div>
                    <p className="text-medical-gray">Loading leave requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-medical-dark">Leave Management</h2>
                    <p className="text-medical-gray">Review and manage staff leave requests</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="flex items-center space-x-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-medical-gray w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search leave requests..."
                                className="input-field pl-10"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                    </div>
                    <select
                        className="input-field"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <select
                        className="input-field"
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    >
                        <option value="">All Types</option>
                        <option value="sick">Sick Leave</option>
                        <option value="vacation">Vacation</option>
                        <option value="personal">Personal</option>
                        <option value="emergency">Emergency</option>
                    </select>
                </div>
            </div>

            {/* Leave Requests List */}
            <div className="grid gap-4">
                {leaves.map((leave) => (
                    <div key={leave._id || leave.id} className="card">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="flex items-center space-x-2">
                                        {getStatusIcon(leave.status)}
                                        <h3 className="text-lg font-semibold text-medical-dark">
                                            {leave.requestedBy?.name || 'Unknown User'}
                                        </h3>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                                        {leave.status}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(leave.type)}`}>
                                        {leave.type}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                    <div className="flex items-center space-x-2 text-sm text-medical-gray">
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                            {leave.startDate && leave.endDate ? (() => {
                                                const startDate = new Date(leave.startDate);
                                                const endDate = new Date(leave.endDate);
                                                if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                                                    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
                                                }
                                                return 'Invalid Date';
                                            })() : 'No Date'}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-medical-gray">
                                        <CalendarDays className="w-4 h-4" />
                                        <span>{calculateDuration(leave.startDate, leave.endDate)} days</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-medical-gray">
                                        <User className="w-4 h-4" />
                                        <span>{leave.requestedBy?.department || 'Unknown Department'}</span>
                                    </div>
                                </div>

                                {leave.reason && (
                                    <div className="mb-3">
                                        <span className="text-sm text-medical-gray">Reason:</span>
                                        <p className="text-sm text-medical-dark mt-1">{leave.reason}</p>
                                    </div>
                                )}

                                {leave.affectedShifts && leave.affectedShifts.length > 0 && (
                                    <div className="mb-3">
                                        <span className="text-sm text-medical-gray">Affected Shifts:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {leave.affectedShifts.map((shift, index) => (
                                                <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                                                    {shift.title || `Shift ${index + 1}`}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center space-x-4 text-xs text-medical-gray">
                                    <span>Requested: {leave.createdAt || leave.requestedAt ? (() => {
                                        const date = new Date(leave.createdAt || leave.requestedAt);
                                        return !isNaN(date.getTime()) ? date.toLocaleDateString() : 'Invalid Date';
                                    })() : 'No Date'}</span>
                                    {leave.reviewedBy && (
                                        <span>Reviewed by: {leave.reviewedBy.name} ({leave.reviewedBy.role})</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                {leave.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleStatusUpdate(leave._id || leave.id, 'approved')}
                                            className="btn-outline text-green-600 hover:bg-green-50 text-sm"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-1" />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(leave._id || leave.id, 'rejected')}
                                            className="btn-outline text-red-600 hover:bg-red-50 text-sm"
                                        >
                                            <XCircle className="w-4 h-4 mr-1" />
                                            Reject
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => handleView(leave)}
                                    className="btn-outline text-sm"
                                    title="View Details"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleEdit(leave)}
                                    className="btn-outline text-sm"
                                    title="Edit Leave Request"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(leave._id || leave.id)}
                                    className="btn-outline text-red-600 hover:bg-red-50 text-sm"
                                    title="Delete Leave Request"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {leaves.length === 0 && (
                <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-medical-gray mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-medical-dark mb-2">No leave requests found</h3>
                    <p className="text-medical-gray">Leave requests will appear here when staff submit them.</p>
                </div>
            )}

            {/* Leave Request Modal */}
            {(viewingLeave || editingLeave) && (
                <LeaveRequestModal
                    isOpen={!!(viewingLeave || editingLeave)}
                    onClose={() => {
                        setViewingLeave(null);
                        setEditingLeave(null);
                    }}
                    leaveRequest={viewingLeave || editingLeave}
                    isViewing={!!viewingLeave}
                />
            )}
        </div>
    );
};

export default LeaveManagement;
