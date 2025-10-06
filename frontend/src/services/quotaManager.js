class QuotaManager {
    constructor() {
        this.quotaExceeded = false;
        this.lastQuotaError = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.quotaResetTime = null;
    }

    /**
     * Check if quota is exceeded
     */
    isQuotaExceeded() {
        return this.quotaExceeded;
    }

    /**
     * Handle quota exceeded error
     */
    handleQuotaError(error) {
        console.warn('Firebase quota exceeded:', error);
        this.quotaExceeded = true;
        this.lastQuotaError = new Date();
        this.retryCount++;

        // Set reset time (Firebase quotas typically reset daily)
        this.quotaResetTime = new Date();
        this.quotaResetTime.setHours(24, 0, 0, 0); // Reset at midnight

        return {
            quotaExceeded: true,
            retryAfter: this.quotaResetTime,
            message: 'Firebase quota exceeded. Some features may be limited until quota resets.'
        };
    }

    /**
     * Check if we should retry an operation
     */
    shouldRetry() {
        if (!this.quotaExceeded) return true;

        // Don't retry if we've exceeded max retries
        if (this.retryCount >= this.maxRetries) return false;

        // Don't retry if quota hasn't reset yet
        if (this.quotaResetTime && new Date() < this.quotaResetTime) return false;

        return true;
    }

    /**
     * Reset quota status (call when quota resets)
     */
    resetQuotaStatus() {
        this.quotaExceeded = false;
        this.retryCount = 0;
        this.quotaResetTime = null;
        this.lastQuotaError = null;
    }

    /**
     * Get quota status message
     */
    getQuotaStatus() {
        if (!this.quotaExceeded) {
            return { status: 'ok', message: 'Firebase quota is available' };
        }

        const timeUntilReset = this.quotaResetTime ?
            Math.max(0, this.quotaResetTime - new Date()) : 0;

        return {
            status: 'exceeded',
            message: 'Firebase quota exceeded. Some features may be limited.',
            retryAfter: this.quotaResetTime,
            timeUntilReset: timeUntilReset
        };
    }

    /**
     * Execute operation with quota handling
     */
    async executeWithQuotaHandling(operation, fallback = null) {
        if (this.quotaExceeded && !this.shouldRetry()) {
            console.warn('Skipping operation due to quota exceeded');
            if (fallback) {
                return await fallback();
            }
            throw new Error('Firebase quota exceeded. Operation skipped.');
        }

        try {
            const result = await operation();
            // Reset retry count on successful operation
            this.retryCount = 0;
            return result;
        } catch (error) {
            if (error.code === 'resource-exhausted') {
                this.handleQuotaError(error);
                if (fallback) {
                    console.log('Using fallback due to quota exceeded');
                    return await fallback();
                }
                throw error;
            }
            throw error;
        }
    }
}

// Create singleton instance
const quotaManager = new QuotaManager();
export default quotaManager;
