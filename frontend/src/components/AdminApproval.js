import React, { useState, useEffect, useCallback } from 'react';
import {
    Users,
    CheckCircle,
    XCircle,
    Shield,
    Mail,
    Phone,
    Calendar,
    UserCheck,
    UserX
} from 'lucide-react';
import { collection, query, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import firebaseErrorHandler from '../utils/firebaseErrorHandler';

const AdminApproval = () => {
    const { currentUser, userProfile } = useAuth();
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(new Set());
    const [filters, setFilters] = useState({
        status: 'pending',
        search: ''
    });

    // Fetch pending admin requests
    const fetchPendingRequests = useCallback(() => {
        try {
            const requestsRef = collection(db, 'adminRequests');
            // Simplified query - get all requests and filter client-side
            const q = query(requestsRef);

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const allRequests = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(doc.data().requestedAt) || new Date()
                }));

                // Filter for pending requests and sort by requestedAt
                const pendingRequests = allRequests
                    .filter(request => request.status === 'pending')
                    .sort((a, b) => {
                        const dateA = new Date(a.requestedAt || a.createdAt);
                        const dateB = new Date(b.requestedAt || b.createdAt);
                        return dateB - dateA; // Descending order
                    });

                setPendingRequests(pendingRequests);
                setLoading(false);
            }, (error) => {
                firebaseErrorHandler.handle(error, 'Fetching admin requests', {
                    returnValue: null
                });
                setLoading(false);
            });

            return unsubscribe;
        } catch (error) {
            console.error('Error fetching admin requests:', error);
            toast.error('Failed to load admin requests');
            setLoading(false);
        }
    }, []);

    // Approve admin request
    const handleApprove = async (requestId, userData) => {
        if (processing.has(requestId)) return;

        setProcessing(prev => new Set(prev).add(requestId));

        try {
            // Update user role to admin in users collection
            const userRef = doc(db, 'users', userData.userId);
            await updateDoc(userRef, {
                role: 'admin',
                approvedBy: currentUser.uid,
                approvedAt: new Date().toISOString(),
                status: 'active'
            });

            // Update admin request status
            const requestRef = doc(db, 'adminRequests', requestId);
            await updateDoc(requestRef, {
                status: 'approved',
                approvedBy: currentUser.uid,
                approvedAt: new Date().toISOString(),
                approvedByName: userProfile?.name || 'Admin'
            });

            toast.success(`Admin access approved for ${userData.name}`);

            // Send notification to approved user
            await sendApprovalNotification(userData, 'approved');

        } catch (error) {
            console.error('Error approving admin request:', error);
            toast.error('Failed to approve admin request');
        } finally {
            setProcessing(prev => {
                const newSet = new Set(prev);
                newSet.delete(requestId);
                return newSet;
            });
        }
    };

    // Reject admin request
    const handleReject = async (requestId, userData) => {
        if (processing.has(requestId)) return;

        setProcessing(prev => new Set(prev).add(requestId));

        try {
            // Update admin request status
            const requestRef = doc(db, 'adminRequests', requestId);
            await updateDoc(requestRef, {
                status: 'rejected',
                rejectedBy: currentUser.uid,
                rejectedAt: new Date().toISOString(),
                rejectedByName: userProfile?.name || 'Admin',
                rejectionReason: 'Admin approval required'
            });

            toast.success(`Admin request rejected for ${userData.name}`);

            // Send notification to rejected user
            await sendApprovalNotification(userData, 'rejected');

        } catch (error) {
            console.error('Error rejecting admin request:', error);
            toast.error('Failed to reject admin request');
        } finally {
            setProcessing(prev => {
                const newSet = new Set(prev);
                newSet.delete(requestId);
                return newSet;
            });
        }
    };

    // Send notification to user about approval status
    const sendApprovalNotification = async (userData, status) => {
        try {
            const notificationData = {
                userId: userData.userId,
                title: status === 'approved' ? 'Admin Access Approved' : 'Admin Request Rejected',
                message: status === 'approved'
                    ? 'Congratulations! Your admin access has been approved. You can now access admin features.'
                    : 'Your admin request has been rejected. Please contact an existing admin for more information.',
                type: status === 'approved' ? 'success' : 'info',
                isRead: false,
                createdAt: new Date().toISOString(),
                actionUrl: status === 'approved' ? '/admin' : '/staff'
            };

            await addDoc(collection(db, 'notifications'), notificationData);
        } catch (error) {
            console.error('Error sending approval notification:', error);
        }
    };

    // Format date for Indian timezone
    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Initialize
    useEffect(() => {
        const unsubscribe = fetchPendingRequests();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [fetchPendingRequests]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4"></div>
                    <p className="text-medical-gray">Loading admin requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-medical-dark">Admin Approval</h2>
                    <p className="text-medical-gray">Review and approve admin access requests</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Shield className="w-6 h-6 text-medical-primary" />
                    <span className="text-sm font-medium text-medical-primary">
                        {pendingRequests.length} Pending Requests
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-medical-dark">Status:</label>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                    >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>

                <div className="flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="w-full px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                    />
                </div>
            </div>

            {/* Requests List */}
            {pendingRequests.length === 0 ? (
                <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-medical-dark mb-2">No Pending Requests</h3>
                    <p className="text-medical-gray">All admin requests have been processed.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {pendingRequests.map((request) => (
                        <div key={request.id} className="card">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="p-2 bg-medical-primary rounded-lg">
                                            <Users className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-medical-dark">
                                                {request.name}
                                            </h3>
                                            <p className="text-sm text-medical-gray">{request.email}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="flex items-center space-x-2">
                                            <Mail className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-700">{request.email}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Phone className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-700">{request.phone || 'Not provided'}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-700">
                                                Requested: {formatDate(request.createdAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Shield className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-700">Current Role: {request.currentRole}</span>
                                        </div>
                                    </div>

                                    {request.reason && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-medical-dark mb-2">Reason for Admin Access:</h4>
                                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                                {request.reason}
                                            </p>
                                        </div>
                                    )}

                                    {request.status === 'pending' && (
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={() => handleApprove(request.id, request)}
                                                disabled={processing.has(request.id)}
                                                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {processing.has(request.id) ? (
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <UserCheck className="w-4 h-4" />
                                                )}
                                                <span>Approve</span>
                                            </button>

                                            <button
                                                onClick={() => handleReject(request.id, request)}
                                                disabled={processing.has(request.id)}
                                                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {processing.has(request.id) ? (
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <UserX className="w-4 h-4" />
                                                )}
                                                <span>Reject</span>
                                            </button>
                                        </div>
                                    )}

                                    {request.status === 'approved' && (
                                        <div className="flex items-center space-x-2 text-green-600">
                                            <CheckCircle className="w-5 h-5" />
                                            <span className="text-sm font-medium">
                                                Approved by {request.approvedByName} on {formatDate(request.approvedAt)}
                                            </span>
                                        </div>
                                    )}

                                    {request.status === 'rejected' && (
                                        <div className="flex items-center space-x-2 text-red-600">
                                            <XCircle className="w-5 h-5" />
                                            <span className="text-sm font-medium">
                                                Rejected by {request.rejectedByName} on {formatDate(request.rejectedAt)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminApproval;
