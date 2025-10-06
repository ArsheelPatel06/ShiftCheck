/**
 * Firebase Analytics Service
 * Comprehensive analytics tracking for healthcare shift manager
 */

import { analytics } from '../firebase/config';
import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';

class AnalyticsService {
    constructor() {
        this.analytics = analytics;
        this.isEnabled = !!analytics;
    }

    // Check if analytics is available
    isAvailable() {
        return this.isEnabled && typeof window !== 'undefined';
    }

    // Set user ID for analytics
    setUserId(userId) {
        if (!this.isAvailable()) return;

        try {
            setUserId(this.analytics, userId);
            console.log('📊 Analytics: User ID set to', userId);
        } catch (error) {
            console.error('Analytics setUserId error:', error);
        }
    }

    // Set user properties
    setUserProperties(properties) {
        if (!this.isAvailable()) return;

        try {
            setUserProperties(this.analytics, properties);
            console.log('📊 Analytics: User properties set', properties);
        } catch (error) {
            console.error('Analytics setUserProperties error:', error);
        }
    }

    // Log custom events
    logEvent(eventName, parameters = {}) {
        if (!this.isAvailable()) return;

        try {
            logEvent(this.analytics, eventName, parameters);
            console.log('📊 Analytics Event:', eventName, parameters);
        } catch (error) {
            console.error('Analytics logEvent error:', error);
        }
    }

    // Healthcare-specific events
    logUserLogin(userRole, department) {
        this.logEvent('user_login', {
            user_role: userRole,
            department: department,
            timestamp: new Date().toISOString()
        });
    }

    logUserLogout(userRole) {
        this.logEvent('user_logout', {
            user_role: userRole,
            timestamp: new Date().toISOString()
        });
    }

    logShiftAssigned(shiftId, department, shiftType, assignedTo) {
        this.logEvent('shift_assigned', {
            shift_id: shiftId,
            department: department,
            shift_type: shiftType,
            assigned_to: assignedTo,
            timestamp: new Date().toISOString()
        });
    }

    logShiftPickedUp(shiftId, department, shiftType, pickedUpBy) {
        this.logEvent('shift_picked_up', {
            shift_id: shiftId,
            department: department,
            shift_type: shiftType,
            picked_up_by: pickedUpBy,
            timestamp: new Date().toISOString()
        });
    }

    logLeaveRequestCreated(requestId, requestType, startDate, endDate, requestedBy) {
        this.logEvent('leave_request_created', {
            request_id: requestId,
            request_type: requestType,
            start_date: startDate,
            end_date: endDate,
            requested_by: requestedBy,
            timestamp: new Date().toISOString()
        });
    }

    logLeaveRequestApproved(requestId, requestType, approvedBy) {
        this.logEvent('leave_request_approved', {
            request_id: requestId,
            request_type: requestType,
            approved_by: approvedBy,
            timestamp: new Date().toISOString()
        });
    }

    logLeaveRequestRejected(requestId, requestType, rejectedBy) {
        this.logEvent('leave_request_rejected', {
            request_id: requestId,
            request_type: requestType,
            rejected_by: rejectedBy,
            timestamp: new Date().toISOString()
        });
    }

    logNotificationSent(notificationType, recipientRole, department) {
        this.logEvent('notification_sent', {
            notification_type: notificationType,
            recipient_role: recipientRole,
            department: department,
            timestamp: new Date().toISOString()
        });
    }

    logNotificationClicked(notificationType, userRole) {
        this.logEvent('notification_clicked', {
            notification_type: notificationType,
            user_role: userRole,
            timestamp: new Date().toISOString()
        });
    }

    logPageView(pageName, userRole) {
        this.logEvent('page_view', {
            page_name: pageName,
            user_role: userRole,
            timestamp: new Date().toISOString()
        });
    }

    logFeatureUsed(featureName, userRole, department) {
        this.logEvent('feature_used', {
            feature_name: featureName,
            user_role: userRole,
            department: department,
            timestamp: new Date().toISOString()
        });
    }

    logError(errorType, errorMessage, userRole, pageName) {
        this.logEvent('app_error', {
            error_type: errorType,
            error_message: errorMessage,
            user_role: userRole,
            page_name: pageName,
            timestamp: new Date().toISOString()
        });
    }

    logPerformanceMetric(metricName, value, unit) {
        this.logEvent('performance_metric', {
            metric_name: metricName,
            value: value,
            unit: unit,
            timestamp: new Date().toISOString()
        });
    }

    logUserEngagement(action, duration, userRole) {
        this.logEvent('user_engagement', {
            action: action,
            duration_seconds: duration,
            user_role: userRole,
            timestamp: new Date().toISOString()
        });
    }

    logShiftSwapRequested(shiftId, requestedBy, requestedFrom) {
        this.logEvent('shift_swap_requested', {
            shift_id: shiftId,
            requested_by: requestedBy,
            requested_from: requestedFrom,
            timestamp: new Date().toISOString()
        });
    }

    logShiftSwapApproved(shiftId, approvedBy) {
        this.logEvent('shift_swap_approved', {
            shift_id: shiftId,
            approved_by: approvedBy,
            timestamp: new Date().toISOString()
        });
    }

    logAutoAssignmentUsed(shiftId, department, assignmentCount) {
        this.logEvent('auto_assignment_used', {
            shift_id: shiftId,
            department: department,
            assignment_count: assignmentCount,
            timestamp: new Date().toISOString()
        });
    }

    logScheduleExported(exportType, recordCount, userRole) {
        this.logEvent('schedule_exported', {
            export_type: exportType,
            record_count: recordCount,
            user_role: userRole,
            timestamp: new Date().toISOString()
        });
    }

    logCalendarViewUsed(viewType, userRole) {
        this.logEvent('calendar_view_used', {
            view_type: viewType,
            user_role: userRole,
            timestamp: new Date().toISOString()
        });
    }

    logSearchPerformed(searchTerm, resultsCount, userRole) {
        this.logEvent('search_performed', {
            search_term: searchTerm,
            results_count: resultsCount,
            user_role: userRole,
            timestamp: new Date().toISOString()
        });
    }

    logFilterApplied(filterType, filterValue, userRole) {
        this.logEvent('filter_applied', {
            filter_type: filterType,
            filter_value: filterValue,
            user_role: userRole,
            timestamp: new Date().toISOString()
        });
    }

    // Healthcare-specific metrics
    logStaffUtilization(department, utilizationPercentage, date) {
        this.logEvent('staff_utilization', {
            department: department,
            utilization_percentage: utilizationPercentage,
            date: date,
            timestamp: new Date().toISOString()
        });
    }

    logOvertimeHours(department, overtimeHours, date) {
        this.logEvent('overtime_hours', {
            department: department,
            overtime_hours: overtimeHours,
            date: date,
            timestamp: new Date().toISOString()
        });
    }

    logCoverageGap(department, gapDuration, shiftType) {
        this.logEvent('coverage_gap', {
            department: department,
            gap_duration_hours: gapDuration,
            shift_type: shiftType,
            timestamp: new Date().toISOString()
        });
    }

    // App performance tracking
    logAppStartup(duration, userRole) {
        this.logEvent('app_startup', {
            duration_ms: duration,
            user_role: userRole,
            timestamp: new Date().toISOString()
        });
    }

    logDataLoadTime(dataType, duration, recordCount) {
        this.logEvent('data_load_time', {
            data_type: dataType,
            duration_ms: duration,
            record_count: recordCount,
            timestamp: new Date().toISOString()
        });
    }

    // User behavior tracking
    logSessionStart(userRole, department) {
        this.logEvent('session_start', {
            user_role: userRole,
            department: department,
            timestamp: new Date().toISOString()
        });
    }

    logSessionEnd(sessionDuration, userRole, pagesViewed) {
        this.logEvent('session_end', {
            session_duration_seconds: sessionDuration,
            user_role: userRole,
            pages_viewed: pagesViewed,
            timestamp: new Date().toISOString()
        });
    }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

export default analyticsService;
