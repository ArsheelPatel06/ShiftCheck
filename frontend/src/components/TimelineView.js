import React from 'react';
import {
    Clock,
    MapPin,
    Calendar,
    RefreshCw,
    MoreVertical,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

const TimelineView = ({ shifts, onSwapRequest }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled':
                return 'bg-blue-500';
            case 'in_progress':
                return 'bg-green-500';
            case 'completed':
                return 'bg-gray-500';
            case 'cancelled':
                return 'bg-red-500';
            default:
                return 'bg-gray-400';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'scheduled':
                return <Clock className="w-4 h-4 text-white" />;
            case 'in_progress':
                return <CheckCircle className="w-4 h-4 text-white" />;
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-white" />;
            case 'cancelled':
                return <AlertCircle className="w-4 h-4 text-white" />;
            default:
                return <Clock className="w-4 h-4 text-white" />;
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
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });
    };

    const getDuration = (start, end) => {
        if (!start || !end) return '0h';
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '0h';
        const hours = Math.abs(endDate - startDate) / 36e5;
        return `${Math.round(hours)}h`;
    };

    const isToday = (date) => {
        if (!date) return false;
        const today = new Date();
        const shiftDate = new Date(date);
        if (isNaN(shiftDate.getTime())) return false;
        return today.toDateString() === shiftDate.toDateString();
    };

    const isTomorrow = (date) => {
        if (!date) return false;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const shiftDate = new Date(date);
        if (isNaN(shiftDate.getTime())) return false;
        return tomorrow.toDateString() === shiftDate.toDateString();
    };

    const getDateLabel = (date) => {
        if (isToday(date)) return 'Today';
        if (isTomorrow(date)) return 'Tomorrow';
        return formatDate(date);
    };

    // Group shifts by date
    const groupedShifts = shifts.reduce((groups, shift) => {
        if (!shift.startTime) return groups;
        const shiftDate = new Date(shift.startTime);
        if (isNaN(shiftDate.getTime())) return groups;
        const dateKey = shiftDate.toDateString();
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(shift);
        return groups;
    }, {});

    // Sort dates
    const sortedDates = Object.keys(groupedShifts).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
        return dateA - dateB;
    });

    if (shifts.length === 0) {
        return (
            <div className="card text-center py-12">
                <Calendar className="w-16 h-16 text-medical-gray mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-medical-dark mb-2">No Shifts Scheduled</h3>
                <p className="text-medical-gray">You don't have any upcoming shifts. Check available shifts to pick up extra hours.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {sortedDates.map((dateKey) => {
                const dateShifts = groupedShifts[dateKey];
                const date = new Date(dateKey);

                return (
                    <div key={dateKey} className="relative">
                        {/* Date Header */}
                        <div className="flex items-center mb-6">
                            <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${isToday(date) ? 'bg-medical-primary' :
                                    isTomorrow(date) ? 'bg-medical-secondary' :
                                        'bg-gray-300'
                                    }`}></div>
                                <h3 className="text-lg font-semibold text-medical-dark">
                                    {getDateLabel(date)}
                                </h3>
                                <span className="text-sm text-medical-gray">
                                    {formatDate(date)}
                                </span>
                            </div>
                            <div className="flex-1 h-px bg-gray-200 ml-6"></div>
                        </div>

                        {/* Shifts for this date */}
                        <div className="space-y-4 ml-6">
                            {dateShifts.map((shift, index) => (
                                <div key={shift.id} className="relative">
                                    {/* Timeline connector */}
                                    {index < dateShifts.length - 1 && (
                                        <div className="absolute left-6 top-16 w-px h-8 bg-gray-200"></div>
                                    )}

                                    {/* Shift Card */}
                                    <div className="flex items-start space-x-4">
                                        {/* Status Indicator */}
                                        <div className={`w-12 h-12 rounded-full ${getStatusColor(shift.status)} flex items-center justify-center flex-shrink-0`}>
                                            {getStatusIcon(shift.status)}
                                        </div>

                                        {/* Shift Details */}
                                        <div className="flex-1 card hover:shadow-lg transition-shadow">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <h4 className="text-lg font-semibold text-medical-dark">
                                                            {shift.title}
                                                        </h4>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${shift.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                                            shift.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                                                                shift.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                                                    'bg-red-100 text-red-800'
                                                            }`}>
                                                            {shift.status.replace('_', ' ')}
                                                        </span>
                                                    </div>

                                                    <p className="text-medical-gray mb-3">{shift.department}</p>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                        <div className="flex items-center space-x-2 text-medical-gray">
                                                            <Clock className="w-4 h-4" />
                                                            <span>
                                                                {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center space-x-2 text-medical-gray">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>Duration: {getDuration(shift.startTime, shift.endTime)}</span>
                                                        </div>

                                                        {shift.location && (
                                                            <div className="flex items-center space-x-2 text-medical-gray">
                                                                <MapPin className="w-4 h-4" />
                                                                <span>{shift.location}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center space-x-2">
                                                    {shift.status === 'scheduled' && (
                                                        <button
                                                            onClick={() => onSwapRequest(shift.id)}
                                                            className="btn-outline text-sm px-3 py-1 flex items-center space-x-1"
                                                        >
                                                            <RefreshCw className="w-3 h-3" />
                                                            <span>Swap</span>
                                                        </button>
                                                    )}

                                                    <button className="p-2 text-medical-gray hover:text-medical-dark rounded-full hover:bg-gray-100">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Additional Info */}
                                            {shift.status === 'scheduled' && isToday(shift.startTime) && (
                                                <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-l-blue-500">
                                                    <div className="flex items-center space-x-2">
                                                        <CheckCircle className="w-4 h-4 text-blue-600" />
                                                        <span className="text-sm font-medium text-blue-800">
                                                            Shift starts in {shift.startTime ? (() => {
                                                                const startDate = new Date(shift.startTime);
                                                                const now = new Date();
                                                                if (isNaN(startDate.getTime())) return 'Invalid Time';
                                                                const hours = Math.ceil((startDate - now) / (1000 * 60 * 60));
                                                                return hours > 0 ? `${hours} hours` : 'Started';
                                                            })() : 'No Time'}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {shift.status === 'in_progress' && (
                                                <div className="mt-4 p-3 bg-green-50 rounded-lg border-l-4 border-l-green-500">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                        <span className="text-sm font-medium text-green-800">
                                                            Currently on duty
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* Summary */}
            <div className="card bg-gradient-to-r from-medical-light to-blue-50 border-l-4 border-l-medical-primary">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-semibold text-medical-dark mb-1">Week Summary</h4>
                        <p className="text-sm text-medical-gray">
                            {shifts.length} shifts • {shifts.reduce((total, shift) => {
                                if (!shift.startTime || !shift.endTime) return total;
                                const startDate = new Date(shift.startTime);
                                const endDate = new Date(shift.endTime);
                                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return total;
                                const hours = Math.abs(endDate - startDate) / 36e5;
                                return total + hours;
                            }, 0)} total hours
                        </p>
                    </div>

                    <div className="text-right">
                        <div className="text-2xl font-bold text-medical-primary">
                            {shifts.filter(s => s.status === 'completed').length}/{shifts.length}
                        </div>
                        <div className="text-xs text-medical-gray">Completed</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimelineView;

