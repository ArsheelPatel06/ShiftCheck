import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { gsap } from 'gsap';
import { leaveService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import notificationService from '../services/notificationService';
import toast from 'react-hot-toast';

const LeaveRequestModal = ({ isOpen, onClose, onSuccess, leaveRequest, isViewing = false }) => {
    const { userProfile } = useAuth();
    const [formData, setFormData] = useState({
        type: '',
        startDate: '',
        endDate: '',
        reason: '',
        emergencyContact: '',
        attachments: []
    });

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Animate modal entrance
            gsap.fromTo('.modal-content',
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
            );
        }
    }, [isOpen]);

    useEffect(() => {
        if (leaveRequest) {
            setFormData({
                type: leaveRequest.type || '',
                startDate: leaveRequest.startDate ? (() => {
                    const date = new Date(leaveRequest.startDate);
                    return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
                })() : '',
                endDate: leaveRequest.endDate ? (() => {
                    const date = new Date(leaveRequest.endDate);
                    return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
                })() : '',
                reason: leaveRequest.reason || '',
                emergencyContact: leaveRequest.emergencyContact || '',
                attachments: leaveRequest.attachments || []
            });
        }
    }, [leaveRequest, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isViewing) {
            onClose();
            return;
        }

        setIsLoading(true);

        try {
            // Prepare leave request data
            const leaveData = {
                ...formData,
                status: 'pending',
                requestedBy: {
                    id: userProfile.id,
                    name: userProfile.name,
                    email: userProfile.email,
                    department: userProfile.department
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (leaveRequest) {
                console.log('Updating leave request:', leaveData);
                await leaveService.update(leaveRequest.id, leaveData);
                toast.success('Leave request updated successfully!');
            } else {
                console.log('Creating leave request:', leaveData);
                const createdRequest = await leaveService.create(leaveData);

                // Send notification to staff member about request submission
                try {
                    await notificationService.sendGeneralNotification(
                        userProfile.id,
                        'Leave Request Submitted',
                        `Your ${leaveData.type} leave request has been submitted and is pending approval.`,
                        'leave_submitted',
                        { requestId: createdRequest.id }
                    );
                } catch (notificationError) {
                    console.warn('Failed to send notification:', notificationError);
                    // Don't fail the main operation if notification fails
                }

                toast.success('Leave request submitted successfully!');
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving leave request:', error);
            toast.error('Failed to save leave request: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'pending': return <Clock className="w-5 h-5 text-yellow-600" />;
            case 'rejected': return <XCircle className="w-5 h-5 text-red-600" />;
            case 'cancelled': return <AlertTriangle className="w-5 h-5 text-gray-600" />;
            default: return <Clock className="w-5 h-5 text-gray-600" />;
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

    const calculateDuration = (startDate, endDate) => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
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
                <div className="modal-content inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-medical-primary to-medical-secondary px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">
                                    {isViewing ? 'View Leave Request' : leaveRequest ? 'Edit Leave Request' : 'Create Leave Request'}
                                </h3>
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
                    <div className="px-6 py-6 space-y-6">
                        {/* Request Info */}
                        {leaveRequest && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        {getStatusIcon(leaveRequest.status)}
                                        <div>
                                            <h4 className="text-lg font-semibold text-medical-dark">
                                                {leaveRequest.requestedBy?.name || 'Unknown User'}
                                            </h4>
                                            <p className="text-sm text-medical-gray">
                                                {leaveRequest.requestedBy?.department || 'Unknown Department'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(leaveRequest.status)}`}>
                                            {leaveRequest.status}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(leaveRequest.type)}`}>
                                            {leaveRequest.type}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="w-4 h-4 text-medical-gray" />
                                        <span>
                                            {leaveRequest.startDate && leaveRequest.endDate ? (() => {
                                                const startDate = new Date(leaveRequest.startDate);
                                                const endDate = new Date(leaveRequest.endDate);
                                                if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                                                    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
                                                }
                                                return 'Invalid Date';
                                            })() : 'No Date'}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Clock className="w-4 h-4 text-medical-gray" />
                                        <span>{calculateDuration(leaveRequest.startDate, leaveRequest.endDate)} days</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Leave Type */}
                            <div>
                                <label className="block text-sm font-medium text-medical-dark mb-2">
                                    Leave Type
                                </label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="input-field"
                                    disabled={isViewing}
                                >
                                    <option value="">Select Leave Type</option>
                                    <option value="sick">Sick Leave</option>
                                    <option value="vacation">Vacation</option>
                                    <option value="personal">Personal</option>
                                    <option value="emergency">Emergency</option>
                                </select>
                            </div>

                            {/* Date Range */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-medical-dark mb-2">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        className="input-field"
                                        disabled={isViewing}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-medical-dark mb-2">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        className="input-field"
                                        disabled={isViewing}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-medium text-medical-dark mb-2">
                                    Reason
                                </label>
                                <textarea
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleChange}
                                    rows={3}
                                    className="input-field"
                                    placeholder="Please provide a reason for your leave request..."
                                    disabled={isViewing}
                                />
                            </div>

                            {/* Emergency Contact */}
                            <div>
                                <label className="block text-sm font-medium text-medical-dark mb-2">
                                    Emergency Contact
                                </label>
                                <input
                                    type="text"
                                    name="emergencyContact"
                                    value={formData.emergencyContact}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="Emergency contact information"
                                    disabled={isViewing}
                                />
                            </div>

                            {/* Attachments */}
                            {formData.attachments && formData.attachments.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-medical-dark mb-2">
                                        Attachments
                                    </label>
                                    <div className="space-y-2">
                                        {formData.attachments.map((attachment, index) => (
                                            <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                                                <FileText className="w-4 h-4 text-medical-gray" />
                                                <span className="text-sm text-medical-dark">{attachment.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-6 border-t">
                                <div className="flex items-center space-x-2 text-sm text-medical-gray">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>All fields marked with * are required</span>
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="btn-outline"
                                        disabled={isLoading}
                                    >
                                        {isViewing ? 'Close' : 'Cancel'}
                                    </button>

                                    {!isViewing && (
                                        <button
                                            type="submit"
                                            className="btn-primary flex items-center space-x-2"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <div className="spinner"></div>
                                                    <span>{leaveRequest ? 'Updating...' : 'Creating...'}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FileText className="w-4 h-4" />
                                                    <span>{leaveRequest ? 'Update Request' : 'Create Request'}</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaveRequestModal;