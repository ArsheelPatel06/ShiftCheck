import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { currentUser, userProfile, loading } = useAuth();

    // Show loading while authentication state is being determined
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-medical-light via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary mx-auto mb-4"></div>
                    <p className="text-medical-gray">Loading...</p>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // Wait for user profile to load
    if (!userProfile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-medical-light via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary mx-auto mb-4"></div>
                    <p className="text-medical-gray">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (requiredRole && userProfile.role !== requiredRole) {
        // Redirect based on user role from Firestore
        const redirectPath = userProfile.role === 'admin' ? '/admin-dashboard' : '/staff-dashboard';
        return <Navigate to={redirectPath} replace />;
    }

    return children;
};

export default ProtectedRoute;

