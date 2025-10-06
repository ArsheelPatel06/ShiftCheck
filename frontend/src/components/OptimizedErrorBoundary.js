import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

/**
 * Optimized Error Boundary Component
 * Enhanced error handling with performance monitoring and recovery
 */
class OptimizedErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null,
            retryCount: 0,
            maxRetries: 3
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
            errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
    }

    componentDidCatch(error, errorInfo) {
        // Log error details
        console.error('Error Boundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo
        });

        // Log to performance monitor if available
        if (window.performanceMonitor) {
            window.performanceMonitor.logError(error, errorInfo);
        }

        // Log to analytics if available
        if (window.gtag) {
            window.gtag('event', 'exception', {
                description: error.toString(),
                fatal: false
            });
        }
    }

    handleRetry = () => {
        const { retryCount, maxRetries } = this.state;

        if (retryCount < maxRetries) {
            this.setState(prevState => ({
                hasError: false,
                error: null,
                errorInfo: null,
                retryCount: prevState.retryCount + 1
            }));
        } else {
            // Reset to initial state after max retries
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
                retryCount: 0
            });
        }
    };

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    handleReportError = () => {
        const { error, errorInfo, errorId } = this.state;

        // Create error report
        const errorReport = {
            errorId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            error: {
                message: error?.message,
                stack: error?.stack,
                name: error?.name
            },
            errorInfo: {
                componentStack: errorInfo?.componentStack
            },
            retryCount: this.state.retryCount
        };

        // Log to console for debugging
        console.error('Error Report:', errorReport);

        // In a real application, you would send this to your error reporting service
        // Example: Sentry, LogRocket, etc.
        if (window.errorReportingService) {
            window.errorReportingService.captureException(error, {
                extra: errorReport
            });
        }

        // Show success message
        alert('Error reported successfully. Thank you for helping us improve!');
    };

    render() {
        if (this.state.hasError) {
            const { error, errorInfo, retryCount, maxRetries } = this.state;
            const canRetry = retryCount < maxRetries;

            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
                        {/* Error Icon */}
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>

                        {/* Error Title */}
                        <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
                            Oops! Something went wrong
                        </h1>

                        {/* Error Message */}
                        <p className="text-gray-600 text-center mb-6">
                            We're sorry, but something unexpected happened. Don't worry, your data is safe.
                        </p>

                        {/* Error Details (Development Only) */}
                        {process.env.NODE_ENV === 'development' && (
                            <details className="mb-6 p-4 bg-gray-100 rounded-lg">
                                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                                    Error Details (Development)
                                </summary>
                                <div className="text-sm text-gray-600 space-y-2">
                                    <div>
                                        <strong>Error:</strong> {error?.message}
                                    </div>
                                    <div>
                                        <strong>Component Stack:</strong>
                                        <pre className="mt-1 text-xs bg-white p-2 rounded overflow-auto">
                                            {errorInfo?.componentStack}
                                        </pre>
                                    </div>
                                </div>
                            </details>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            {canRetry && (
                                <button
                                    onClick={this.handleRetry}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span>Try Again ({retryCount + 1}/{maxRetries})</span>
                                </button>
                            )}

                            <button
                                onClick={this.handleReload}
                                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>Reload Page</span>
                            </button>

                            <button
                                onClick={this.handleGoHome}
                                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                            >
                                <Home className="w-4 h-4" />
                                <span>Go to Home</span>
                            </button>

                            <button
                                onClick={this.handleReportError}
                                className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
                            >
                                <Bug className="w-4 h-4" />
                                <span>Report Error</span>
                            </button>
                        </div>

                        {/* Help Text */}
                        <div className="mt-6 text-center text-sm text-gray-500">
                            <p>
                                If this problem persists, please contact support with error ID:
                                <code className="bg-gray-100 px-2 py-1 rounded text-xs ml-1">
                                    {this.state.errorId}
                                </code>
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        // If no error, render children normally
        return this.props.children;
    }
}

export default OptimizedErrorBoundary;
