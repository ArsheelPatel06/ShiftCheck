/**
 * Firebase Quota Management Service
 * Handles quota exceeded errors and prevents further Firebase operations
 */

class QuotaService {
    constructor() {
        this.quotaExceeded = false;
        this.lastQuotaError = null;
        this.retryAfter = null;
    }

    // Check if quota is exceeded
    isQuotaExceeded() {
        return this.quotaExceeded;
    }

    // Handle quota exceeded error
    handleQuotaError(error) {
        if (error.code === 'resource-exhausted') {
            this.quotaExceeded = true;
            this.lastQuotaError = new Date();
            console.warn('🚨 Firebase quota exceeded. Disabling Firebase operations.');

            // Set retry after 1 hour
            this.retryAfter = new Date(Date.now() + 60 * 60 * 1000);

            return true;
        }
        return false;
    }

    // Check if we should retry Firebase operations
    shouldRetry() {
        if (!this.quotaExceeded) return true;

        if (this.retryAfter && new Date() > this.retryAfter) {
            console.log('🔄 Retrying Firebase operations after quota reset period');
            this.quotaExceeded = false;
            this.retryAfter = null;
            return true;
        }

        return false;
    }

    // Reset quota status (for testing or manual reset)
    reset() {
        this.quotaExceeded = false;
        this.lastQuotaError = null;
        this.retryAfter = null;
        console.log('✅ Firebase quota status reset');
    }

    // Get quota status info
    getStatus() {
        return {
            quotaExceeded: this.quotaExceeded,
            lastError: this.lastQuotaError,
            retryAfter: this.retryAfter,
            canRetry: this.shouldRetry()
        };
    }
}

// Create singleton instance
const quotaService = new QuotaService();

export default quotaService;
