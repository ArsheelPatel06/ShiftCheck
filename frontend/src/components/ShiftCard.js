import React from 'react';
import {
    Clock,
    MapPin,
    User,
    AlertTriangle,
    CheckCircle,
    Zap,
    Calendar,
    Users,
    Trash2,
    Edit
} from 'lucide-react';

const ShiftCard = ({ shift, onAutoAssign, compact = false, onEdit, onDelete }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'open':
                return 'bg-orange-100 text-orange-800';
            case 'scheduled':
                return 'bg-green-100 text-green-800';
            case 'completed':
                return 'bg-blue-100 text-blue-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'critical':
                return 'border-l-red-500 bg-red-50';
            case 'high':
                return 'border-l-orange-500 bg-orange-50';
            case 'medium':
                return 'border-l-blue-500 bg-blue-50';
            case 'low':
                return 'border-l-green-500 bg-green-50';
            default:
                return 'border-l-gray-500 bg-gray-50';
        }
    };

    const formatTime = (date) => {
        if (!date) return 'No Time';
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return 'Invalid Time';
        return dateObj.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (date) => {
        if (!date) return 'No Date';
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return 'Invalid Date';
        return dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getDuration = () => {
        if (!shift.startTime || !shift.endTime) return '0h';
        const start = new Date(shift.startTime);
        const end = new Date(shift.endTime);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return '0h';
        const hours = Math.abs(end - start) / 36e5;
        return `${Math.round(hours)}h`;
    };

    if (compact) {
        return (
            <div className={`border-l-4 ${getPriorityColor(shift.priority)} p-4 rounded-r-lg`}>
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-medical-dark">{shift.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shift.status)}`}>
                                {shift.status}
                            </span>
                        </div>
                        <p className="text-sm text-medical-gray">{shift.department}</p>
                        <div className="flex items-center space-x-4 text-xs text-medical-gray mt-2">
                            <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(shift.startTime)}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(shift.startTime)} - {formatTime(shift.endTime)}</span>
                            </span>
                        </div>
                    </div>

                    {shift.status === 'open' && (
                        <button
                            onClick={() => onAutoAssign(shift._id)}
                            className="btn-primary text-xs px-3 py-1 flex items-center space-x-1"
                        >
                            <Zap className="w-3 h-3" />
                            <span>Auto Assign</span>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`card border-l-4 ${getPriorityColor(shift.priority)}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-medical-dark">{shift.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(shift.status)}`}>
                            {shift.status}
                        </span>
                        {shift.priority === 'critical' && (
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        )}
                    </div>

                    <p className="text-medical-gray mb-3">{shift.department}</p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2 text-medical-gray">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(shift.startTime)}</span>
                        </div>

                        <div className="flex items-center space-x-2 text-medical-gray">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(shift.startTime)} - {formatTime(shift.endTime)}</span>
                        </div>

                        <div className="flex items-center space-x-2 text-medical-gray">
                            <Users className="w-4 h-4" />
                            <span>Duration: {getDuration()}</span>
                        </div>

                        {shift.location && (
                            <div className="flex items-center space-x-2 text-medical-gray">
                                <MapPin className="w-4 h-4" />
                                <span>{shift.location}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                    {shift.assignedTo ? (
                        <div className="flex items-center space-x-2 text-sm">
                            <div className="w-8 h-8 bg-medical-primary rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="font-medium text-medical-dark">{shift.assignedTo.name}</p>
                                <p className="text-xs text-medical-gray">Assigned</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-sm text-medical-gray mb-2">Unassigned</p>
                            <button
                                onClick={() => onAutoAssign(shift._id)}
                                className="btn-primary text-sm px-4 py-2 flex items-center space-x-2"
                            >
                                <Zap className="w-4 h-4" />
                                <span>Auto Assign</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {shift.requiredSkills && shift.requiredSkills.length > 0 && (
                <div className="border-t pt-4">
                    <p className="text-sm font-medium text-medical-dark mb-2">Required Skills:</p>
                    <div className="flex flex-wrap gap-2">
                        {shift.requiredSkills.map((skill, index) => (
                            <span
                                key={index}
                                className="px-2 py-1 bg-medical-light text-medical-primary text-xs rounded-full"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center space-x-4 text-sm text-medical-gray">
                    <span className="capitalize">Priority: {shift.priority}</span>
                    {shift.status === 'scheduled' && (
                        <span className="flex items-center space-x-1 text-medical-success">
                            <CheckCircle className="w-4 h-4" />
                            <span>Ready</span>
                        </span>
                    )}
                </div>

                <div className="flex space-x-2">
                    <button onClick={() => onEdit(shift)} className="text-medical-primary hover:text-medical-secondary text-sm font-medium flex items-center space-x-1">
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                    </button>
                    <button onClick={() => onDelete(shift._id)} className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center space-x-1">
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShiftCard;

