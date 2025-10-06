import toast from 'react-hot-toast';

/**
 * Centralized Firebase error handler
 * Handles common Firebase errors and provides user-friendly messages
 */
export const firebaseErrorHandler = {
    /**
     * Handle Firebase errors with user-friendly messages
     * @param {Error} error - The Firebase error
     * @param {string} context - Context of where the error occurred
     * @param {Object} options - Additional options
     */
    handle(error, context = 'Firebase operation', options = {}) {
        console.error(`Error in ${context}:`, error);

        // Default options
        const {
            showToast = true,
            fallbackMessage = 'An unexpected error occurred',
            returnValue = null
        } = options;

        let userMessage = fallbackMessage;
        let shouldShowToast = showToast;

        // Handle specific Firebase error codes
        switch (error.code) {
            case 'permission-denied':
                userMessage = 'You do not have permission to perform this action';
                console.warn('Permission denied:', context);
                break;

            case 'unavailable':
                userMessage = 'Service temporarily unavailable. Please try again later';
                console.warn('Firebase service unavailable:', context);
                break;

            case 'unauthenticated':
                userMessage = 'Please log in to continue';
                console.warn('User not authenticated:', context);
                break;

            case 'not-found':
                userMessage = 'The requested resource was not found';
                console.warn('Resource not found:', context);
                break;

            case 'already-exists':
                userMessage = 'This resource already exists';
                console.warn('Resource already exists:', context);
                break;

            case 'failed-precondition':
                userMessage = 'Database index required. Please contact support';
                console.warn('Database index required:', context);
                break;

            case 'resource-exhausted':
                userMessage = 'Service quota exceeded. Please try again later';
                console.warn('Service quota exceeded:', context);
                break;

            case 'cancelled':
                userMessage = 'Operation was cancelled';
                console.warn('Operation cancelled:', context);
                shouldShowToast = false; // Don't show toast for cancelled operations
                break;

            default:
                // For unknown errors, show the original error message if available
                if (error.message) {
                    userMessage = error.message;
                }
                console.error('Unknown Firebase error:', error);
        }

        // Show toast notification if enabled
        if (shouldShowToast) {
            toast.error(userMessage);
        }

        // Return the specified fallback value
        return returnValue;
    },

    /**
     * Handle permission errors specifically
     * @param {Error} error - The Firebase error
     * @param {string} resource - The resource being accessed
     */
    handlePermissionError(error, resource = 'resource') {
        return this.handle(error, `Accessing ${resource}`, {
            fallbackMessage: `You do not have permission to access ${resource}`,
            showToast: true
        });
    },

    /**
     * Handle authentication errors
     * @param {Error} error - The Firebase error
     */
    handleAuthError(error) {
        return this.handle(error, 'Authentication', {
            fallbackMessage: 'Please log in to continue',
            showToast: true
        });
    },

    /**
     * Handle network/service errors
     * @param {Error} error - The Firebase error
     */
    handleNetworkError(error) {
        return this.handle(error, 'Network operation', {
            fallbackMessage: 'Network error. Please check your connection',
            showToast: true
        });
    }
};

export default firebaseErrorHandler;
