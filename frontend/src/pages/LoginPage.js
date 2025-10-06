import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import Logo from '../components/Logo';
import PasswordResetModal from '../components/PasswordResetModal';
import AdminCreator from '../components/AdminCreator';
import toast from 'react-hot-toast';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPasswordReset, setShowPasswordReset] = useState(false);
    const [showAdminCreator, setShowAdminCreator] = useState(false);

    const { login, currentUser, userProfile } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        console.log('LoginPage useEffect - currentUser:', currentUser, 'userProfile:', userProfile);
        if (currentUser && userProfile) {
            const redirectPath = userProfile.role === 'admin' ? '/admin-dashboard' : '/staff-dashboard';
            console.log('Redirecting to:', redirectPath);
            navigate(redirectPath, { replace: true });
        } else if (currentUser && !userProfile) {
            // User is authenticated but no profile exists
            console.log('User authenticated but no profile found - this might be a new user or profile setup issue');
            console.log('Waiting for profile to load...');
            // Don't show error immediately, wait a bit for profile to load
            setTimeout(() => {
                if (!userProfile) {
                    toast.error('Profile not found. Please contact an administrator to set up your account.');
                }
            }, 3000);
        }
    }, [currentUser, userProfile, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsLoading(true);

        try {
            await login(formData.email, formData.password);
            // Navigation will be handled by the useEffect hook
        } catch (error) {
            console.error('Login failed:', error);
            // Error handling is done in the AuthContext
        } finally {
            setIsLoading(false);
        }
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const isFormValid = formData.email && formData.password && validateEmail(formData.email);

    return (
        <div className="min-h-screen bg-gradient-to-br from-medical-light via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <Link to="/" className="inline-flex items-center text-medical-primary hover:text-medical-secondary transition-colors mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Link>

                    <Logo size="lg" className="justify-center mb-6" />

                    <h2 className="text-3xl font-display font-bold text-medical-dark">
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-medical-gray">
                        Sign in to your ShiftCheck account
                    </p>
                </div>


                {/* Login Form */}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-medical-dark mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-medical-gray" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`input-field-with-icon ${formData.email && !validateEmail(formData.email)
                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                        : ''
                                        }`}
                                    placeholder="Enter your email"
                                />
                                {formData.email && !validateEmail(formData.email) && (
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                    </div>
                                )}
                            </div>
                            {formData.email && !validateEmail(formData.email) && (
                                <p className="mt-1 text-sm text-red-600">Please enter a valid email address</p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-medical-dark mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-medical-gray" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="input-field-with-icons"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-medical-gray hover:text-medical-primary" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-medical-gray hover:text-medical-primary" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Forgot Password & Admin Creation Links */}
                    <div className="flex items-center justify-between">
                        <div className="text-sm space-x-4">
                            <button
                                type="button"
                                onClick={() => setShowPasswordReset(true)}
                                className="text-medical-primary hover:text-medical-secondary transition-colors font-medium"
                            >
                                Forgot your password?
                            </button>
                            <span className="text-medical-gray">•</span>
                            <button
                                type="button"
                                onClick={() => setShowAdminCreator(true)}
                                className="text-medical-primary hover:text-medical-secondary transition-colors font-medium"
                            >
                                Create Admin Account
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div>
                        <button
                            type="submit"
                            disabled={!isFormValid || isLoading}
                            className={`w-full btn-primary ${!isFormValid || isLoading
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-blue-700 transform hover:scale-105'
                                }`}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Signing In...
                                </div>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </div>

                    {/* Sign Up Link */}
                    <div className="text-center">
                        <p className="text-sm text-medical-gray">
                            Don't have an account?{' '}
                            <Link
                                to="/signup"
                                className="font-medium text-medical-primary hover:text-medical-secondary transition-colors"
                            >
                                Sign up here
                            </Link>
                        </p>
                    </div>
                </form>

                {/* Enhanced Password Reset Modal */}
                <PasswordResetModal
                    isOpen={showPasswordReset}
                    onClose={() => setShowPasswordReset(false)}
                />

                {/* Admin Creator Modal */}
                {showAdminCreator && (
                    <AdminCreator
                        isOpen={showAdminCreator}
                        onClose={() => setShowAdminCreator(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default LoginPage;