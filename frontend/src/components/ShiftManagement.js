import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Search,
    Calendar,
    Clock,
    Users,
    Edit,
    Trash2,
    Zap
} from 'lucide-react';
import { shiftService } from '../services/dataService';
import DeletionHelper from '../utils/deletionHelper';
import AddShiftModal from './AddShiftModal';
import toast from 'react-hot-toast';

const ShiftManagement = () => {
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingShift, setEditingShift] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        department: '',
        search: ''
    });

    const fetchShifts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await shiftService.getAll(filters);
            const shiftsData = response.shifts || response || [];
            setShifts(Array.isArray(shiftsData) ? shiftsData : []);
        } catch (error) {
            console.error('Error fetching shifts:', error);
            toast.error('Failed to load shifts');
            setShifts([]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchShifts();
    }, [fetchShifts]);

    const handleAutoAssign = async (shiftId) => {
        try {
            toast.loading('Auto-assigning shift...', { id: 'auto-assign' });
            await shiftService.autoAssign(shiftId);
            toast.success('Shift auto-assigned successfully!', { id: 'auto-assign' });
            fetchShifts();
        } catch (error) {
            console.error('Error auto-assigning shift:', error);
            toast.error('Failed to auto-assign shift', { id: 'auto-assign' });
        }
    };

    const handleEdit = (shift) => {
        setEditingShift(shift);
        setShowAddModal(true);
    };

    const handleDelete = async (shift) => {
        if (DeletionHelper.confirmDeletion(shift.title || 'shift', 'shift')) {
            await DeletionHelper.deleteShift(shift, {
                onSuccess: () => fetchShifts(),
                onError: (error) => console.error('Delete error:', error)
            });
        }
    };

    const handleModalSuccess = () => {
        fetchShifts();
        setShowAddModal(false);
        setEditingShift(null);
    };

    const handleModalClose = () => {
        setShowAddModal(false);
        setEditingShift(null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'bg-green-100 text-green-800';
            case 'open': return 'bg-orange-100 text-orange-800';
            case 'completed': return 'bg-blue-100 text-blue-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'critical': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4"></div>
                    <p className="text-medical-gray">Loading shifts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-medical-dark">Shift Management</h2>
                    <p className="text-medical-gray">Manage and assign shifts to your staff</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Shift</span>
                </button>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="flex items-center space-x-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-medical-gray w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search shifts..."
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
                        <option value="open">Open</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <select
                        className="input-field"
                        value={filters.department}
                        onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                    >
                        <option value="">All Departments</option>
                        <option value="Emergency Department">Emergency Department</option>
                        <option value="Intensive Care Unit">Intensive Care Unit</option>
                        <option value="Surgery">Surgery</option>
                    </select>
                </div>
            </div>

            {/* Shifts List */}
            <div className="grid gap-4">
                {shifts.map((shift) => (
                    <div key={shift._id || shift.id} className="card">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                    <h3 className="text-lg font-semibold text-medical-dark">
                                        {shift.title}
                                    </h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shift.status)}`}>
                                        {shift.status}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(shift.priority)}`}>
                                        {shift.priority}
                                    </span>
                                </div>

                                <p className="text-medical-gray mb-3">{shift.department}</p>

                                <div className="flex items-center space-x-6 text-sm text-medical-gray mb-3">
                                    <span className="flex items-center space-x-1">
                                        <Calendar className="w-4 h-4" />
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
                                    <span className="flex items-center space-x-1">
                                        <Users className="w-4 h-4" />
                                        <span>{shift.duration}h duration</span>
                                    </span>
                                </div>

                                {shift.assignedTo && (
                                    <div className="flex items-center space-x-2 text-sm">
                                        <span className="text-medical-gray">Assigned to:</span>
                                        <span className="font-medium text-medical-dark">
                                            {shift.assignedTo.name}
                                        </span>
                                    </div>
                                )}

                                {shift.requiredSkills && shift.requiredSkills.length > 0 && (
                                    <div className="mt-2">
                                        <span className="text-sm text-medical-gray">Required skills:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {shift.requiredSkills.map((skill, index) => (
                                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center space-x-2">
                                {shift.status === 'open' && (
                                    <button
                                        onClick={() => handleAutoAssign(shift._id || shift.id)}
                                        className="btn-outline flex items-center space-x-1 text-sm"
                                    >
                                        <Zap className="w-4 h-4" />
                                        <span>Auto Assign</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => handleEdit(shift)}
                                    className="btn-outline text-sm"
                                    title="Edit Shift"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(shift)}
                                    className="btn-outline text-red-600 hover:bg-red-50 text-sm"
                                    title="Delete Shift"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {shifts.length === 0 && (
                <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-medical-gray mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-medical-dark mb-2">No shifts found</h3>
                    <p className="text-medical-gray">Create your first shift to get started.</p>
                </div>
            )}

            {/* Add/Edit Shift Modal */}
            {showAddModal && (
                <AddShiftModal
                    isOpen={showAddModal}
                    onClose={handleModalClose}
                    onSuccess={handleModalSuccess}
                    editingShift={editingShift}
                />
            )}
        </div>
    );
};

export default ShiftManagement;
