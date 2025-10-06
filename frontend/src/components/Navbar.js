import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';

const Navbar = ({ transparent = false, hideLogo = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { currentUser, userProfile, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const navClass = transparent && !scrolled
        ? 'bg-transparent'
        : 'bg-white/95 backdrop-blur-md shadow-medical';

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navClass}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    {!hideLogo && (
                        <Link to="/" className="flex-shrink-0">
                            <Logo size="lg" animated={false} />
                        </Link>
                    )}
                    {hideLogo && (
                        <div className="flex-shrink-0">
                            {/* Spacer for alignment when logo is hidden */}
                        </div>
                    )}

                    {/* Desktop Navigation */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            {!currentUser ? (
                                <>
                                    <Link
                                        to="/"
                                        className="text-medical-dark hover:text-medical-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        Home
                                    </Link>
                                    <Link
                                        to="/login"
                                        className="text-medical-dark hover:text-medical-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="btn-primary"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to={userProfile?.role === 'admin' ? '/admin-dashboard' : '/staff-dashboard'}
                                        className="text-medical-dark hover:text-medical-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        Dashboard
                                    </Link>
                                    {userProfile?.role === 'admin' && (
                                        <Link
                                            to="/analytics"
                                            className="text-medical-dark hover:text-medical-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                        >
                                            Analytics
                                        </Link>
                                    )}
                                    <div className="flex items-center space-x-2">
                                        <User className="w-4 h-4 text-medical-gray" />
                                        <span className="text-sm text-medical-gray">{currentUser.email}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center space-x-1 text-medical-dark hover:text-medical-error px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Logout</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-medical-dark hover:text-medical-primary p-2 rounded-md transition-colors"
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white rounded-lg shadow-lg mt-2">
                            {!currentUser ? (
                                <>
                                    <Link
                                        to="/"
                                        className="block text-medical-dark hover:text-medical-primary px-3 py-2 rounded-md text-base font-medium transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Home
                                    </Link>
                                    <Link
                                        to="/login"
                                        className="block text-medical-dark hover:text-medical-primary px-3 py-2 rounded-md text-base font-medium transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="block btn-primary text-center"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Get Started
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to={userProfile?.role === 'admin' ? '/admin-dashboard' : '/staff-dashboard'}
                                        className="block text-medical-dark hover:text-medical-primary px-3 py-2 rounded-md text-base font-medium transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    {userProfile?.role === 'admin' && (
                                        <Link
                                            to="/analytics"
                                            className="block text-medical-dark hover:text-medical-primary px-3 py-2 rounded-md text-base font-medium transition-colors"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Analytics
                                        </Link>
                                    )}
                                    <div className="px-3 py-2 text-sm text-medical-gray">
                                        {currentUser.email}
                                    </div>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsOpen(false);
                                        }}
                                        className="block w-full text-left text-medical-error hover:bg-red-50 px-3 py-2 rounded-md text-base font-medium transition-colors"
                                    >
                                        Logout
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;

