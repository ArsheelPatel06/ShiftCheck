import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    Calendar,
    Users,
    Clock,
    Shield,
    BarChart3,
    Bell,
    Smartphone,
    CheckCircle,
    ArrowRight,
    Star,
    Zap,
    Heart,
    Award
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Logo from '../components/Logo';

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
    const heroRef = useRef();
    const featuresRef = useRef();
    const statsRef = useRef();
    const ctaRef = useRef();

    useEffect(() => {
        // Hero animations
        const tl = gsap.timeline();

        tl.fromTo('.hero-title',
            { y: 100, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
        )
            .fromTo('.hero-subtitle',
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
                '-=0.5'
            )
            .fromTo('.hero-buttons',
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
                '-=0.3'
            )
            .fromTo('.hero-image',
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 1, duration: 1, ease: 'power3.out' },
                '-=0.8'
            );

        // Feature cards animation
        gsap.fromTo('.feature-card',
            { y: 80, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.2,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: featuresRef.current,
                    start: 'top 80%',
                }
            }
        );

        // Stats animation
        gsap.fromTo('.stat-item',
            { scale: 0.5, opacity: 0 },
            {
                scale: 1,
                opacity: 1,
                duration: 0.6,
                stagger: 0.1,
                ease: 'back.out(1.7)',
                scrollTrigger: {
                    trigger: statsRef.current,
                    start: 'top 80%',
                }
            }
        );

        // Floating animation for hero elements
        gsap.to('.float-1', {
            y: -20,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: 'power2.inOut'
        });

        gsap.to('.float-2', {
            y: -15,
            duration: 2.5,
            repeat: -1,
            yoyo: true,
            ease: 'power2.inOut',
            delay: 0.5
        });

        gsap.to('.float-3', {
            y: -25,
            duration: 3.5,
            repeat: -1,
            yoyo: true,
            ease: 'power2.inOut',
            delay: 1
        });

    }, []);

    const features = [
        {
            icon: Calendar,
            title: 'Smart Scheduling',
            description: 'AI-powered shift allocation using priority queues for optimal staff distribution.',
            color: 'text-blue-600'
        },
        {
            icon: Users,
            title: 'Staff Management',
            description: 'Comprehensive staff profiles with skills tracking and certification management.',
            color: 'text-green-600'
        },
        {
            icon: Bell,
            title: 'Real-time Notifications',
            description: 'Instant updates for shift changes, requests, and important announcements.',
            color: 'text-purple-600'
        },
        {
            icon: BarChart3,
            title: 'Advanced Analytics',
            description: 'Detailed insights into workload distribution, performance metrics, and trends.',
            color: 'text-orange-600'
        },
        {
            icon: Smartphone,
            title: 'Mobile First',
            description: 'Fully responsive design optimized for mobile devices and tablets.',
            color: 'text-pink-600'
        },
        {
            icon: Shield,
            title: 'HIPAA Compliant',
            description: 'Enterprise-grade security with healthcare compliance and data protection.',
            color: 'text-red-600'
        }
    ];

    const stats = [
        { number: '500+', label: 'Healthcare Facilities', icon: Heart },
        { number: '10K+', label: 'Active Staff Members', icon: Users },
        { number: '99.9%', label: 'Uptime Guarantee', icon: Shield },
        { number: '24/7', label: 'Support Available', icon: Clock }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-medical-light via-white to-blue-50">
            <Navbar transparent={true} />

            {/* Hero Section */}
            <section ref={heroRef} className="relative pt-20 pb-16 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen">
                        {/* Left Column */}
                        <div className="text-center lg:text-left">
                            <div className="hero-title mb-6">
                                <h1 className="text-5xl lg:text-7xl font-display font-bold text-medical-dark leading-tight">
                                    Healthcare Shift
                                    <span className="block gradient-text">Management</span>
                                    <span className="block text-medical-secondary">Reimagined</span>
                                </h1>
                            </div>

                            <p className="hero-subtitle text-xl lg:text-2xl text-medical-gray mb-8 max-w-2xl mx-auto lg:mx-0">
                                Streamline your healthcare facility's scheduling with AI-powered automation,
                                real-time collaboration, and intelligent workforce optimization.
                            </p>

                            <div className="hero-buttons flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Link
                                    to="/signup"
                                    className="btn-primary text-lg px-8 py-4 flex items-center justify-center space-x-2 group"
                                >
                                    <span>Start Free Trial</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    to="/login"
                                    className="btn-outline text-lg px-8 py-4 flex items-center justify-center space-x-2"
                                >
                                    <span>Sign In</span>
                                </Link>
                            </div>

                            <div className="mt-8 flex items-center justify-center lg:justify-start space-x-6 text-sm text-medical-gray">
                                <div className="flex items-center space-x-1">
                                    <CheckCircle className="w-4 h-4 text-medical-success" />
                                    <span>No Credit Card Required</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <CheckCircle className="w-4 h-4 text-medical-success" />
                                    <span>14-Day Free Trial</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Hero Image/Animation */}
                        <div className="hero-image relative">
                            <div className="relative z-10">
                                {/* Main Dashboard Preview */}
                                <div className="bg-white rounded-2xl shadow-2xl p-6 float-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        </div>
                                        <div className="text-xs text-gray-500">ShiftCheck Dashboard</div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="h-8 bg-gradient-to-r from-medical-primary to-medical-secondary rounded"></div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="h-16 bg-blue-100 rounded flex items-center justify-center">
                                                <Calendar className="w-6 h-6 text-medical-primary" />
                                            </div>
                                            <div className="h-16 bg-green-100 rounded flex items-center justify-center">
                                                <Users className="w-6 h-6 text-medical-secondary" />
                                            </div>
                                            <div className="h-16 bg-purple-100 rounded flex items-center justify-center">
                                                <BarChart3 className="w-6 h-6 text-purple-600" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Cards */}
                                <div className="absolute -top-4 -right-4 bg-medical-success text-white p-3 rounded-lg shadow-lg float-2">
                                    <Bell className="w-5 h-5" />
                                </div>

                                <div className="absolute -bottom-4 -left-4 bg-medical-primary text-white p-3 rounded-lg shadow-lg float-3">
                                    <Zap className="w-5 h-5" />
                                </div>
                            </div>

                            {/* Background Elements */}
                            <div className="absolute inset-0 -z-10">
                                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-medical-primary/10 rounded-full blur-xl"></div>
                                <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-medical-secondary/10 rounded-full blur-xl"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section ref={statsRef} className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat, index) => {
                            const IconComponent = stat.icon;
                            return (
                                <div key={index} className="stat-item text-center">
                                    <div className="flex justify-center mb-4">
                                        <div className="w-16 h-16 bg-medical-light rounded-full flex items-center justify-center">
                                            <IconComponent className="w-8 h-8 text-medical-primary" />
                                        </div>
                                    </div>
                                    <div className="text-3xl lg:text-4xl font-bold text-medical-dark mb-2">
                                        {stat.number}
                                    </div>
                                    <div className="text-medical-gray font-medium">
                                        {stat.label}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section ref={featuresRef} className="py-20 bg-gradient-to-br from-gray-50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl lg:text-5xl font-display font-bold text-medical-dark mb-6">
                            Powerful Features for
                            <span className="block gradient-text">Modern Healthcare</span>
                        </h2>
                        <p className="text-xl text-medical-gray max-w-3xl mx-auto">
                            Everything you need to manage shifts, staff, and operations with
                            cutting-edge technology and intelligent automation.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => {
                            const IconComponent = feature.icon;
                            return (
                                <div key={index} className="feature-card card hover:scale-105 group">
                                    <div className="flex items-center mb-4">
                                        <div className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                            <IconComponent className={`w-6 h-6 ${feature.color}`} />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-semibold text-medical-dark mb-3">
                                        {feature.title}
                                    </h3>
                                    <p className="text-medical-gray leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section ref={ctaRef} className="py-20 gradient-bg">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="mb-8">
                        <Award className="w-16 h-16 text-white mx-auto mb-6 animate-bounce-in" />
                        <h2 className="text-4xl lg:text-5xl font-display font-bold text-white mb-6">
                            Ready to Transform Your
                            <span className="block">Healthcare Operations?</span>
                        </h2>
                        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                            Join thousands of healthcare facilities already using ShiftCheck
                            to optimize their workforce management and improve patient care.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                        <Link
                            to="/signup"
                            className="bg-white text-medical-primary hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
                        >
                            <span>Start Your Free Trial</span>
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            to="/login"
                            className="border-2 border-white text-white hover:bg-white hover:text-medical-primary font-semibold py-4 px-8 rounded-lg transition-all duration-200"
                        >
                            Sign In Now
                        </Link>
                    </div>

                    <div className="flex items-center justify-center space-x-8 text-blue-100 text-sm">
                        <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4 fill-current" />
                            <span>4.9/5 Rating</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4" />
                            <span>HIPAA Compliant</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>No Setup Fees</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-medical-dark text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div className="md:col-span-2">
                            <Logo size="md" className="mb-4" />
                            <p className="text-gray-300 mb-4 max-w-md">
                                Revolutionizing healthcare workforce management with intelligent
                                automation and modern design.
                            </p>
                            <div className="flex space-x-4">
                                <div className="w-10 h-10 bg-medical-primary rounded-full flex items-center justify-center">
                                    <Heart className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-gray-300">
                                <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                                <li><Link to="/security" className="hover:text-white transition-colors">Security</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4">Support</h4>
                            <ul className="space-y-2 text-gray-300">
                                <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                                <li><Link to="/status" className="hover:text-white transition-colors">System Status</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2024 ShiftCheck. All rights reserved. Built with ❤️ for healthcare heroes.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

