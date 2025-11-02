/**
 * eDEX-UI Error Tracker
 * Centralized error tracking and reporting
 * 
 * Usage:
 *   const errorTracker = require('./shared/monitoring/error-tracker');
 *   errorTracker.start();
 *   
 *   // Errors are automatically tracked via global handlers
 *   // Manual error tracking:
 *   errorTracker.trackError(error, { module: 'terminal', context: 'initialization' });
 */

const { createLogger } = require("../logger");
const logger = createLogger("error-tracker");

class ErrorTracker {
    constructor(config = {}) {
        this.enabled = config.enabled !== false;
        this.maxErrors = config.maxErrors || 100;
        this.errors = [];
        this.errorCounts = new Map();
    }
    
    start() {
        if (!this.enabled) {
            logger.info("Error tracking disabled");
            return;
        }
        
        logger.info("Starting error tracking");
        
        // Global error handler
        if (typeof window !== "undefined") {
            window.addEventListener("error", (event) => {
                this.handleGlobalError({
                    type: "uncaught-error",
                    message: event.message,
                    filename: event.filename,
                    line: event.lineno,
                    column: event.colno,
                    stack: event.error?.stack
                });
            });
            
            window.addEventListener("unhandledrejection", (event) => {
                this.handleGlobalError({
                    type: "unhandled-promise",
                    reason: event.reason,
                    promise: event.promise
                });
            });
        }
        
        // Process error handler (Node.js)
        if (typeof process !== "undefined") {
            process.on("uncaughtException", (error) => {
                this.handleGlobalError({
                    type: "uncaught-exception",
                    message: error.message,
                    stack: error.stack,
                    code: error.code
                });
            });
            
            process.on("unhandledRejection", (reason, promise) => {
                this.handleGlobalError({
                    type: "unhandled-rejection",
                    reason: reason,
                    promise: promise
                });
            });
        }
    }
    
    handleGlobalError(errorInfo) {
        const error = {
            timestamp: Date.now(),
            ...errorInfo
        };
        
        this.trackError(error);
        
        logger.error("Global error caught", error);
    }
    
    trackError(error, context = {}) {
        if (!this.enabled) return;
        
        const errorRecord = {
            timestamp: Date.now(),
            message: error.message || String(error),
            stack: error.stack,
            type: error.type || "error",
            ...context
        };
        
        // Add to error list
        this.errors.push(errorRecord);
        
        // Maintain max size
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }
        
        // Update error counts
        const errorKey = errorRecord.message;
        this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
        
        // Log the error
        logger.error("Error tracked", {
            type: errorRecord.type,
            message: errorRecord.message,
            count: this.errorCounts.get(errorKey)
        });
    }
    
    getErrors(filter = {}) {
        let filtered = [...this.errors];
        
        if (filter.type) {
            filtered = filtered.filter(e => e.type === filter.type);
        }
        
        if (filter.since) {
            filtered = filtered.filter(e => e.timestamp >= filter.since);
        }
        
        if (filter.limit) {
            filtered = filtered.slice(-filter.limit);
        }
        
        return filtered;
    }
    
    getErrorSummary() {
        const summary = {
            totalErrors: this.errors.length,
            recentErrors: this.errors.slice(-10),
            topErrors: []
        };
        
        // Get top 5 most frequent errors
        const sorted = Array.from(this.errorCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        summary.topErrors = sorted.map(([message, count]) => ({
            message,
            count
        }));
        
        return summary;
    }
    
    clearErrors() {
        this.errors = [];
        this.errorCounts.clear();
        logger.info("Error history cleared");
    }
}

// Global tracker instance
let globalTracker = null;

function initialize(config = {}) {
    globalTracker = new ErrorTracker(config);
    return globalTracker;
}

function getTracker() {
    if (!globalTracker) {
        globalTracker = new ErrorTracker();
    }
    return globalTracker;
}

module.exports = {
    ErrorTracker,
    initialize,
    getTracker,
    // Convenience exports
    start: () => getTracker().start(),
    trackError: (error, context) => getTracker().trackError(error, context),
    getErrors: (filter) => getTracker().getErrors(filter),
    getErrorSummary: () => getTracker().getErrorSummary(),
    clearErrors: () => getTracker().clearErrors()
};
