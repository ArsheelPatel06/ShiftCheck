import React, { useState } from 'react';
import {
    Shield,
    Mail,
    Phone,
    FileText,
    X,
    Send,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { gsap } from 'gsap';

const AdminRequestModal = ({ isOpen, onClose }) => {
    const { currentUser, userProfile } = useAuth();
    const [formData, setFormData] = useState({
        name: userProfile?.name || '',
        email: currentUser?.email || '',
        phone: '',
        currentRole: userProfile?.role || 'staff',
        reason: '',
        department: userProfile?.department || '',
        experience: '',
        additionalInfo: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.reason.trim()) {
            toast.error('Please provide a reason for admin access');
            return;
        }

        setIsSubmitting(true);

        try {
            const requestData = {
                userId: currentUser.uid,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                currentRole: formData.currentRole,
                reason: formData.reason,
                department: formData.department,
                experience: formData.experience,
                additionalInfo: formData.additionalInfo,
                status: 'pending',
                createdAt: serverTimestamp(),
                requestedAt: new Date().toISOString()
            };

            await addDoc(collection(db, 'adminRequests'), requestData);

            setIsSubmitted(true);
            toast.success('Admin request submitted successfully!');

            // Auto-close after 3 seconds
            setTimeout(() => {
                onClose();
                setIsSubmitted(false);
                setFormData({
                    name: userProfile?.name || '',
                    email: currentUser?.email || '',
                    phone: '',
                    currentRole: userProfile?.role || 'staff',
                    reason: '',
                    department: userProfile?.department || '',
                    experience: '',
                    additionalInfo: ''
                });
            }, 3000);

        } catch (error) {
            console.error('Error submitting admin request:', error);
            toast.error('Failed to submit admin request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        onClose();
        setIsSubmitted(false);
        setFormData({
            name: userProfile?.name || '',
            email: currentUser?.email || '',
            phone: '',
            currentRole: userProfile?.role || 'staff',
            reason: '',
            department: userProfile?.department || '',
            experience: '',
            additionalInfo: ''
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClose}></div>

                <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-medical-primary rounded-lg">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-medical-dark">
                                    {isSubmitted ? 'Request Submitted' : 'Request Admin Access'}
                                </h3>
                                <p className="text-sm text-medical-gray">
                                    {isSubmitted
                                        ? 'Your request has been sent for approval'
                                        : 'Submit a request to become an administrator'
                                    }
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {isSubmitted ? (
                        /* Success State */
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h4 className="text-lg font-semibold text-medical-dark mb-2">
                                Request Submitted Successfully!
                            </h4>
                            <p className="text-medical-gray mb-4">
                                Your admin access request has been sent to existing administrators for review.
                            </p>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="flex items-start space-x-3">
                                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div className="text-left">
                                        <p className="text-sm text-blue-800 font-medium">What happens next?</p>
                                        <ul className="text-sm text-blue-700 mt-2 space-y-1">
                                            <li>• An existing admin will review your request</li>
                                            <li>• You'll receive a notification about the decision</li>
                                            <li>• If approved, you'll gain admin access immediately</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Form State */
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Personal Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-medical-dark mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-medical-dark mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-medical-dark mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                                        placeholder="+91 98765 43210"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-medical-dark mb-2">
                                        Department
                                    </label>
                                    <input
                                        type="text"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                                        placeholder="e.g., Emergency, ICU, Surgery"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-medical-dark mb-2">
                                    Healthcare Experience
                                </label>
                                <input
                                    type="text"
                                    name="experience"
                                    value={formData.experience}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                                    placeholder="e.g., 5 years in Emergency Medicine"
                                />
                            </div>

                            {/* Reason for Admin Access */}
                            <div>
                                <label className="block text-sm font-medium text-medical-dark mb-2">
                                    Reason for Admin Access *
                                </label>
                                <textarea
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                                    placeholder="Please explain why you need admin access and how you will use it responsibly..."
                                    required
                                />
                            </div>

                            {/* Additional Information */}
                            <div>
                                <label className="block text-sm font-medium text-medical-dark mb-2">
                                    Additional Information
                                </label>
                                <textarea
                                    name="additionalInfo"
                                    value={formData.additionalInfo}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                                    placeholder="Any additional information that might help with the approval process..."
                                />
                            </div>

                            {/* Warning Notice */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-medium text-yellow-800">Important Notice</h4>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            Admin access provides full control over the system. Please ensure you understand the responsibilities and use this access appropriately.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex items-center justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-medical-primary border border-transparent rounded-lg hover:bg-medical-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-medical-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            <span>Submit Request</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminRequestModal;
