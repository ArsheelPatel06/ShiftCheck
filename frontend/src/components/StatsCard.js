import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ title, value, icon: Icon, color = 'blue', trend, subtitle }) => {
    const colorClasses = {
        blue: {
            bg: 'bg-blue-50',
            icon: 'text-blue-600',
            text: 'text-blue-600'
        },
        green: {
            bg: 'bg-green-50',
            icon: 'text-green-600',
            text: 'text-green-600'
        },
        orange: {
            bg: 'bg-orange-50',
            icon: 'text-orange-600',
            text: 'text-orange-600'
        },
        red: {
            bg: 'bg-red-50',
            icon: 'text-red-600',
            text: 'text-red-600'
        },
        purple: {
            bg: 'bg-purple-50',
            icon: 'text-purple-600',
            text: 'text-purple-600'
        }
    };

    const colors = colorClasses[color];

    return (
        <div className="card hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-medical-gray mb-1">{title}</p>
                    <p className="text-3xl font-bold text-medical-dark">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-medical-gray mt-1">{subtitle}</p>
                    )}
                </div>

                <div className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
            </div>

            {trend && (
                <div className="mt-4 flex items-center">
                    <div className={`flex items-center space-x-1 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {trend.isPositive ? (
                            <TrendingUp className="w-4 h-4" />
                        ) : (
                            <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="font-medium">{trend.value}%</span>
                    </div>
                    <span className="text-medical-gray text-sm ml-2">vs last month</span>
                </div>
            )}
        </div>
    );
};

export default StatsCard;

