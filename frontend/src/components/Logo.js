import React from 'react';
import { Check } from 'lucide-react';

const Logo = ({ size = 'md', animated = false, className = '' }) => {
    const sizes = {
        sm: { text: 'text-xl', icon: 'w-6 h-6', container: 'w-8 h-8' },
        md: { text: 'text-2xl', icon: 'w-6 h-6', container: 'w-10 h-10' },
        lg: { text: 'text-4xl', icon: 'w-8 h-8', container: 'w-12 h-12' },
        xl: { text: 'text-6xl', icon: 'w-12 h-12', container: 'w-16 h-16' }
    };

    const currentSize = sizes[size];

    return (
        <div className={`flex items-center space-x-3 ${className}`}>
            <div className={`relative ${animated ? 'animate-pulse-glow' : ''}`}>
                <div className={`${currentSize.container} bg-medical-primary rounded-full flex items-center justify-center ${animated ? 'animate-bounce-in' : ''}`}>
                    <Check
                        className={`${currentSize.icon} text-white`}
                        strokeWidth={3}
                    />
                </div>
                {animated && (
                    <div className="absolute inset-0 bg-medical-primary rounded-full opacity-20 blur-sm animate-pulse"></div>
                )}
            </div>
            <span className={`font-display font-bold ${currentSize.text} gradient-text ${animated ? 'animate-slide-up' : ''}`}>
                Shift<span className="text-medical-secondary">Check</span>
            </span>
        </div>
    );
};

export default Logo;