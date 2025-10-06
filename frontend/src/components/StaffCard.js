import React from 'react';
import {
    Mail,
    MapPin,
    Award,
    Clock,
    TrendingUp,
    MoreVertical,
    Edit,
    Eye
} from 'lucide-react';

const StaffCard = ({ staff }) => {
    const getWorkloadColor = (workload) => {
        if (workload < 20) return 'text-green-600 bg-green-100';
        if (workload < 35) return 'text-blue-600 bg-blue-100';
        if (workload < 45) return 'text-orange-600 bg-orange-100';
        return 'text-red-600 bg-red-100';
    };

    const getWorkloadLevel = (workload) => {
        if (workload < 20) return 'Light';
        if (workload < 35) return 'Normal';
        if (workload < 45) return 'Heavy';
        return 'Overloaded';
    };

    const getWorkloadPercentage = (workload) => {
        return Math.min((workload / 50) * 100, 100); // Assuming 50 hours is max
    };

    return (
        <div className="card hover:scale-105 transition-all duration-200">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-medical-primary to-medical-secondary rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                            {staff.name.split(' ').map(n => n[0]).join('')}
                        </span>
                    </div>

                    <div>
                        <h3 className="font-semibold text-medical-dark">{staff.name}</h3>
                        <p className="text-sm text-medical-gray capitalize">{staff.role}</p>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${staff.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {staff.isActive ? 'Active' : 'Inactive'}
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <button className="p-2 hover:bg-gray-100 rounded-full">
                        <MoreVertical className="w-4 h-4 text-medical-gray" />
                    </button>
                </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-medical-gray">
                    <Mail className="w-4 h-4" />
                    <span>{staff.email}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-medical-gray">
                    <MapPin className="w-4 h-4" />
                    <span>{staff.department}</span>
                </div>
            </div>

            {/* Workload */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-medical-dark">Current Workload</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getWorkloadColor(staff.currentWorkload)}`}>
                        {getWorkloadLevel(staff.currentWorkload)}
                    </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all duration-300 ${staff.currentWorkload < 20 ? 'bg-green-500' :
                            staff.currentWorkload < 35 ? 'bg-blue-500' :
                                staff.currentWorkload < 45 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                        style={{ width: `${getWorkloadPercentage(staff.currentWorkload)}%` }}
                    ></div>
                </div>

                <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-medical-gray">{staff.currentWorkload}h this week</span>
                    <div className="flex items-center space-x-1 text-xs text-medical-gray">
                        <Clock className="w-3 h-3" />
                        <span>Weekly</span>
                    </div>
                </div>
            </div>

            {/* Skills */}
            {staff.skills && staff.skills.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <Award className="w-4 h-4 text-medical-primary" />
                        <span className="text-sm font-medium text-medical-dark">Skills & Certifications</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                        {staff.skills.slice(0, 3).map((skill, index) => (
                            <span
                                key={index}
                                className="px-2 py-1 bg-medical-light text-medical-primary text-xs rounded-full"
                            >
                                {skill}
                            </span>
                        ))}
                        {staff.skills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-medical-gray text-xs rounded-full">
                                +{staff.skills.length - 3} more
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Performance Indicator */}
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-medical-dark">Performance</p>
                        <p className="text-xs text-medical-gray">Last 30 days</p>
                    </div>
                    <div className="flex items-center space-x-1 text-medical-success">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-semibold">Excellent</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-4 border-t">
                <button className="flex-1 btn-outline text-sm py-2 flex items-center justify-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>View Profile</span>
                </button>

                <button className="flex-1 btn-primary text-sm py-2 flex items-center justify-center space-x-1">
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                </button>
            </div>
        </div>
    );
};

export default StaffCard;

