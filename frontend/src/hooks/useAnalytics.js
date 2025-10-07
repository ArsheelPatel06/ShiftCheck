/**
 * Custom React Hook for Firebase Analytics
 * Provides easy-to-use analytics functions in React components
 */

import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import analyticsService from '../services/analyticsService';

export const useAnalytics = () => {
    const { currentUser, userProfile } = useAuth();

    // Set user properties when user changes
    useEffect(() => {
        if (currentUser && userProfile) {
            analyticsService.setUserId(currentUser.uid);
            analyticsService.setUserProperties({
                user_role: userProfile.role,
                department: userProfile.department,
                email: currentUser.email,
                created_at: userProfile.createdAt
            });
        }
    }, [currentUser, userProfile]);

    return {
        // User events
        logLogin: (userRole, department) => {
            analyticsService.logUserLogin(userRole, department);
        },
        logLogout: (userRole) => {
            analyticsService.logUserLogout(userRole);
        },

        // Shift events
        logShiftAssigned: (shiftId, department, shiftType, assignedTo) => {
            analyticsService.logShiftAssigned(shiftId, department, shiftType, assignedTo);
        },
        logShiftPickedUp: (shiftId, department, shiftType, pickedUpBy) => {
            analyticsService.logShiftPickedUp(shiftId, department, shiftType, pickedUpBy);
        },

        // Leave request events
        logLeaveRequestCreated: (requestId, requestType, startDate, endDate, requestedBy) => {
            analyticsService.logLeaveRequestCreated(requestId, requestType, startDate, endDate, requestedBy);
        },
        logLeaveRequestApproved: (requestId, requestType, approvedBy) => {
            analyticsService.logLeaveRequestApproved(requestId, requestType, approvedBy);
        },
        logLeaveRequestRejected: (requestId, requestType, rejectedBy) => {
            analyticsService.logLeaveRequestRejected(requestId, requestType, rejectedBy);
        },

        // Notification events
        logNotificationSent: (notificationType, recipientRole, department) => {
            analyticsService.logNotificationSent(notificationType, recipientRole, department);
        },
        logNotificationClicked: (notificationType, userRole) => {
            analyticsService.logNotificationClicked(notificationType, userRole);
        },

        // Page and feature events
        logPageView: (pageName, userRole) => {
            analyticsService.logPageView(pageName, userRole);
        },
        logFeatureUsed: (featureName, userRole, department) => {
            analyticsService.logFeatureUsed(featureName, userRole, department);
        },

        // Error tracking
        logError: (errorType, errorMessage, userRole, pageName) => {
            analyticsService.logError(errorType, errorMessage, userRole, pageName);
        },

        // Performance tracking
        logPerformance: (metricName, value, unit) => {
            analyticsService.logPerformanceMetric(metricName, value, unit);
        },

        // User engagement
        logEngagement: (action, duration, userRole) => {
            analyticsService.logUserEngagement(action, duration, userRole);
        },

        // Shift swap events
        logShiftSwapRequested: (shiftId, requestedBy, requestedFrom) => {
            analyticsService.logShiftSwapRequested(shiftId, requestedBy, requestedFrom);
        },
        logShiftSwapApproved: (shiftId, approvedBy) => {
            analyticsService.logShiftSwapApproved(shiftId, approvedBy);
        },

        // Auto assignment
        logAutoAssignment: (shiftId, department, assignmentCount) => {
            analyticsService.logAutoAssignmentUsed(shiftId, department, assignmentCount);
        },

        // Export events
        logExport: (exportType, recordCount, userRole) => {
            analyticsService.logScheduleExported(exportType, recordCount, userRole);
        },

        // Calendar events
        logCalendarView: (viewType, userRole) => {
            analyticsService.logCalendarViewUsed(viewType, userRole);
        },

        // Search and filter events
        logSearch: (searchTerm, resultsCount, userRole) => {
            analyticsService.logSearchPerformed(searchTerm, resultsCount, userRole);
        },
        logFilter: (filterType, filterValue, userRole) => {
            analyticsService.logFilterApplied(filterType, filterValue, userRole);
        },

        // Healthcare metrics
        logStaffUtilization: (department, utilizationPercentage, date) => {
            analyticsService.logStaffUtilization(department, utilizationPercentage, date);
        },
        logOvertime: (department, overtimeHours, date) => {
            analyticsService.logOvertimeHours(department, overtimeHours, date);
        },
        logCoverageGap: (department, gapDuration, shiftType) => {
            analyticsService.logCoverageGap(department, gapDuration, shiftType);
        },

        // App performance
        logAppStartup: (duration, userRole) => {
            analyticsService.logAppStartup(duration, userRole);
        },
        logDataLoad: (dataType, duration, recordCount) => {
            analyticsService.logDataLoadTime(dataType, duration, recordCount);
        },

        // Session tracking
        logSessionStart: (userRole, department) => {
            analyticsService.logSessionStart(userRole, department);
        },
        logSessionEnd: (sessionDuration, userRole, pagesViewed) => {
            analyticsService.logSessionEnd(sessionDuration, userRole, pagesViewed);
        },

        // Custom events
        logCustomEvent: (eventName, parameters) => {
            analyticsService.logEvent(eventName, parameters);
        }
    };
};

export default useAnalytics;

