import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Building, ArrowLeft, CheckCircle } from 'lucide-react';
import Logo from '../components/Logo';
import toast from 'react-hot-toast';

const SignupPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'staff',
        department: '',
        skills: []
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const { signup, currentUser, userProfile } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        console.log('SignupPage useEffect - currentUser:', currentUser, 'userProfile:', userProfile);
        if (currentUser && userProfile) {
            const redirectPath = userProfile.role === 'admin' ? '/admin-dashboard' : '/staff-dashboard';
            console.log('Redirecting to:', redirectPath);
            navigate(redirectPath, { replace: true });
        } else if (currentUser && !userProfile) {
            console.log('User authenticated but no profile found - waiting for profile to load...');
            // Wait a bit for profile to load
            setTimeout(() => {
                if (!userProfile) {
                    console.error('Profile not found after signup');
                    toast.error('Profile not found. Please try logging in again.');
                }
            }, 5000);
        }
    }, [currentUser, userProfile, navigate]);

    const departments = [
        'Emergency Department',
        'Intensive Care Unit',
        'Surgery',
        'Pediatrics',
        'Cardiology',
        'Radiology',
        'Laboratory',
        'Pharmacy',
        'Other'
    ];

    const skillOptions = [
        'CPR Certified',
        'BLS Certified',
        'ACLS Certified',
        'PALS Certified',
        'Registered Nurse',
        'Licensed Practical Nurse',
        'Certified Nursing Assistant',
        'Phlebotomy',
        'IV Therapy',
        'Medication Administration'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        // Calculate password strength
        if (name === 'password') {
            calculatePasswordStrength(value);
        }
    };

    const handleSkillChange = (skill) => {
        const updatedSkills = formData.skills.includes(skill)
            ? formData.skills.filter(s => s !== skill)
            : [...formData.skills, skill];

        setFormData({
            ...formData,
            skills: updatedSkills
        });
    };

    const calculatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        setPasswordStrength(strength);
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength <= 2) return 'bg-red-500';
        if (passwordStrength <= 3) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getPasswordStrengthText = () => {
        if (passwordStrength <= 2) return 'Weak';
        if (passwordStrength <= 3) return 'Medium';
        return 'Strong';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        if (passwordStrength < 3) {
            alert('Please choose a stronger password');
            return;
        }

        setIsLoading(true);

        try {
            console.log('Starting signup process...');
            // Always create as staff user
            await signup(formData.email, formData.password, {
                name: formData.name,
                role: 'staff',
                department: formData.department,
                skills: formData.skills
            });
            console.log('Signup completed, waiting for profile to load...');
            // Navigation will be handled by the useEffect hook
        } catch (error) {
            console.error('Signup failed:', error);
            toast.error('Signup failed: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-medical-light via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center text-medical-primary hover:text-medical-secondary transition-colors mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Link>

                    <Logo size="lg" className="justify-center mb-6" />

                    <h2 className="text-3xl font-display font-bold text-medical-dark">
                        Join ShiftCheck
                    </h2>
                    <p className="mt-2 text-medical-gray">
                        Create your healthcare staff account and start managing shifts efficiently
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Need admin access?</strong> Go to the{' '}
                            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium underline">
                                login page
                            </Link>{' '}
                            and click "Create Admin Account"
                        </p>
                    </div>
                </div>

                {/* Signup Form */}
                <form className="card space-y-6" onSubmit={handleSubmit}>
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Name Field */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-medical-dark mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-medical-gray" />
                                </div>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="input-field-with-icon"
                                    placeholder="Enter your full name"
                                />
                            </div>
                        </div>

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
                                    className="input-field-with-icon"
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
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
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="input-field-with-icons"
                                    placeholder="Create a password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-medical-gray hover:text-medical-dark" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-medical-gray hover:text-medical-dark" />
                                    )}
                                </button>
                            </div>
                            {formData.password && (
                                <div className="mt-2">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                                                style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs text-medical-gray">
                                            {getPasswordStrengthText()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-medical-dark mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-medical-gray" />
                                </div>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="input-field-with-icons"
                                    placeholder="Confirm your password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5 text-medical-gray hover:text-medical-dark" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-medical-gray hover:text-medical-dark" />
                                    )}
                                </button>
                            </div>
                            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                            )}
                        </div>
                    </div>

                    {/* Department Field */}
                    <div>
                        <label htmlFor="department" className="block text-sm font-medium text-medical-dark mb-2">
                            Department
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Building className="h-5 w-5 text-medical-gray" />
                            </div>
                            <select
                                id="department"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                className="select-field-with-icon"
                                required
                            >
                                <option value="">Select Department</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                    </div>


                    {/* Skills Selection */}
                    <div>
                        <label className="block text-sm font-medium text-medical-dark mb-3">
                            Skills & Certifications (Optional)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {skillOptions.map(skill => (
                                <label key={skill} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.skills.includes(skill)}
                                        onChange={() => handleSkillChange(skill)}
                                        className="w-4 h-4 text-medical-primary focus:ring-medical-primary border-gray-300 rounded"
                                    />
                                    <span className="text-sm text-medical-dark">{skill}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Terms and Conditions */}
                    <div className="flex items-start space-x-2">
                        <input
                            id="terms"
                            name="terms"
                            type="checkbox"
                            required
                            className="mt-1 w-4 h-4 text-medical-primary focus:ring-medical-primary border-gray-300 rounded"
                        />
                        <label htmlFor="terms" className="text-sm text-medical-gray">
                            I agree to the{' '}
                            <Link to="/terms" className="text-medical-primary hover:text-medical-secondary">
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link to="/privacy" className="text-medical-primary hover:text-medical-secondary">
                                Privacy Policy
                            </Link>
                        </label>
                    </div>

                    {/* Submit Button */}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading || formData.password !== formData.confirmPassword || passwordStrength < 3}
                            className="w-full btn-primary py-3 text-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <div className="spinner"></div>
                                    <span>Creating Account...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Create Account</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Sign In Link */}
                    <div className="text-center">
                        <p className="text-medical-gray">
                            Already have an account?{' '}
                            <Link to="/login" className="text-medical-primary hover:text-medical-secondary font-medium transition-colors">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </form>

                {/* Security Features */}
                <div className="mt-8 text-center">
                    <div className="flex items-center justify-center space-x-6 text-sm text-medical-gray">
                        <div className="flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4 text-medical-success" />
                            <span>HIPAA Compliant</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4 text-medical-success" />
                            <span>256-bit Encryption</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4 text-medical-success" />
                            <span>SOC 2 Certified</span>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
};

export default SignupPage;

