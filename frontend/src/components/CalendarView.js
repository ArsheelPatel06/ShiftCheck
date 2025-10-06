import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';

const CalendarView = ({ shifts, onSwapRequest }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const getShiftsForDate = (date) => {
        if (!date) return [];
        return shifts.filter(shift => {
            if (!shift.startTime) return false;
            const shiftDate = new Date(shift.startTime);
            if (isNaN(shiftDate.getTime())) return false;
            return shiftDate.toDateString() === date.toDateString();
        });
    };

    const navigateMonth = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'bg-green-100 text-green-800 border-green-200';
            case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const days = getDaysInMonth(currentDate);
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <h3 className="text-lg font-semibold text-medical-dark">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>

                <button
                    onClick={() => navigateMonth(1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 border-b border-gray-200">
                        {day}
                    </div>
                ))}

                {/* Calendar Days */}
                {days.map((day, index) => {
                    const dayShifts = getShiftsForDate(day);

                    return (
                        <div
                            key={index}
                            className={`min-h-[120px] p-2 border-r border-b border-gray-200 ${day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                                }`}
                        >
                            {day && (
                                <>
                                    <div className="text-sm font-medium text-gray-900 mb-2">
                                        {day.getDate()}
                                    </div>

                                    <div className="space-y-1">
                                        {dayShifts.slice(0, 2).map((shift, shiftIndex) => (
                                            <div
                                                key={shiftIndex}
                                                className={`text-xs p-1 rounded border ${getStatusColor(shift.status)}`}
                                            >
                                                <div className="flex items-center space-x-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span className="font-medium">
                                                        {shift.startTime ? (() => {
                                                            const date = new Date(shift.startTime);
                                                            return !isNaN(date.getTime()) ? date.toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            }) : 'Invalid Time';
                                                        })() : 'No Time'}
                                                    </span>
                                                </div>
                                                <div className="text-xs truncate" title={shift.title}>
                                                    {shift.title}
                                                </div>
                                                <div className="flex items-center space-x-1 text-xs">
                                                    <MapPin className="w-3 h-3" />
                                                    <span className="truncate">{shift.department}</span>
                                                </div>
                                            </div>
                                        ))}

                                        {dayShifts.length > 2 && (
                                            <div className="text-xs text-gray-500 text-center">
                                                +{dayShifts.length - 2} more
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                        <span className="text-gray-600">Scheduled</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                        <span className="text-gray-600">Completed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                        <span className="text-gray-600">Cancelled</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
