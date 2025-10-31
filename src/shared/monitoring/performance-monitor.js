/**
 * eDEX-UI Performance Monitor
 * Tracks application performance metrics in real-time
 * 
 * Usage:
 *   const monitor = require('./shared/monitoring/performance-monitor');
 *   monitor.start();
 *   
 *   // Record custom metric
 *   monitor.recordMetric('terminal-render-time', 16.5);
 *   
 *   // Get current metrics
 *   const metrics = monitor.getMetrics();
 */

const { createLogger } = require('../logger');
const logger = createLogger('performance-monitor');

class PerformanceMonitor {
    constructor(config = {}) {
        this.enabled = config.enabled !== false;
        this.sampleInterval = config.sampleInterval || 1000; // 1 second
        this.maxSamples = config.maxSamples || 300; // 5 minutes at 1s intervals
        
        this.metrics = {
            fps: [],
            memory: [],
            cpu: [],
            renderTime: [],
            inputLatency: [],
            custom: {}
        };
        
        this.intervals = [];
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
    }
    
    start() {
        if (!this.enabled) {
            logger.info('Performance monitoring disabled');
            return;
        }
        
        logger.info('Starting performance monitoring');
        
        // FPS monitoring
        this.startFPSMonitoring();
        
        // Memory monitoring
        if (typeof performance !== 'undefined' && performance.memory) {
            this.startMemoryMonitoring();
        }
        
        // Periodic metrics logging
        this.intervals.push(setInterval(() => {
            this.logCurrentMetrics();
        }, 30000)); // Log every 30 seconds
    }
    
    stop() {
        logger.info('Stopping performance monitoring');
        
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
        
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
    
    startFPSMonitoring() {
        const measureFPS = () => {
            const now = performance.now();
            const delta = now - this.lastFrameTime;
            
            this.frameCount++;
            
            // Calculate FPS every second
            if (delta >= 1000) {
                const fps = Math.round((this.frameCount * 1000) / delta);
                this.recordSample('fps', fps);
                
                this.frameCount = 0;
                this.lastFrameTime = now;
            }
            
            this.rafId = requestAnimationFrame(measureFPS);
        };
        
        this.rafId = requestAnimationFrame(measureFPS);
    }
    
    startMemoryMonitoring() {
        this.intervals.push(setInterval(() => {
            if (performance.memory) {
                const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
                this.recordSample('memory', memoryMB);
                
                // Warn if memory usage is high
                if (memoryMB > 500) {
                    logger.warn('High memory usage detected', { memoryMB });
                }
            }
        }, this.sampleInterval));
    }
    
    recordSample(metricName, value) {
        if (!this.metrics[metricName]) {
            this.metrics[metricName] = [];
        }
        
        this.metrics[metricName].push({
            timestamp: Date.now(),
            value
        });
        
        // Keep only recent samples
        if (this.metrics[metricName].length > this.maxSamples) {
            this.metrics[metricName].shift();
        }
    }
    
    recordMetric(name, value, metadata = {}) {
        if (!this.enabled) return;
        
        if (!this.metrics.custom[name]) {
            this.metrics.custom[name] = [];
        }
        
        this.metrics.custom[name].push({
            timestamp: Date.now(),
            value,
            ...metadata
        });
        
        // Keep only recent samples
        if (this.metrics.custom[name].length > this.maxSamples) {
            this.metrics.custom[name].shift();
        }
    }
    
    calculateStats(samples) {
        if (!samples || samples.length === 0) {
            return null;
        }
        
        const values = samples.map(s => s.value);
        const sorted = [...values].sort((a, b) => a - b);
        
        return {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            median: sorted[Math.floor(sorted.length / 2)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)],
            count: values.length
        };
    }
    
    getMetrics() {
        const result = {
            timestamp: Date.now(),
            fps: this.calculateStats(this.metrics.fps),
            memory: this.calculateStats(this.metrics.memory),
            cpu: this.calculateStats(this.metrics.cpu),
            renderTime: this.calculateStats(this.metrics.renderTime),
            inputLatency: this.calculateStats(this.metrics.inputLatency),
            custom: {}
        };
        
        // Add custom metrics
        for (const [name, samples] of Object.entries(this.metrics.custom)) {
            result.custom[name] = this.calculateStats(samples);
        }
        
        return result;
    }
    
    logCurrentMetrics() {
        const metrics = this.getMetrics();
        
        logger.info('Performance metrics', {
            fps: metrics.fps?.avg?.toFixed(1),
            memory: metrics.memory?.avg?.toFixed(0) + 'MB',
            customMetrics: Object.keys(metrics.custom).length
        });
    }
    
    // Measure function execution time
    async measureAsync(name, fn) {
        const start = performance.now();
        
        try {
            const result = await fn();
            const duration = performance.now() - start;
            
            this.recordMetric(name, duration);
            
            if (duration > 100) {
                logger.warn('Slow operation detected', { name, durationMs: duration.toFixed(2) });
            }
            
            return result;
        } catch (error) {
            const duration = performance.now() - start;
            this.recordMetric(name, duration, { error: true });
            throw error;
        }
    }
    
    measure(name, fn) {
        const start = performance.now();
        
        try {
            const result = fn();
            const duration = performance.now() - start;
            
            this.recordMetric(name, duration);
            
            if (duration > 100) {
                logger.warn('Slow operation detected', { name, durationMs: duration.toFixed(2) });
            }
            
            return result;
        } catch (error) {
            const duration = performance.now() - start;
            this.recordMetric(name, duration, { error: true });
            throw error;
        }
    }
    
    // Mark a point in time for later measurement
    mark(name) {
        if (typeof performance !== 'undefined' && performance.mark) {
            performance.mark(name);
        }
    }
    
    // Measure between two marks
    measureBetween(name, startMark, endMark) {
        if (typeof performance !== 'undefined' && performance.measure) {
            try {
                performance.measure(name, startMark, endMark);
                
                const entry = performance.getEntriesByName(name, 'measure')[0];
                if (entry) {
                    this.recordMetric(name, entry.duration);
                }
            } catch (e) {
                logger.error('Failed to measure between marks', { name, error: e.message });
            }
        }
    }
    
    // Get health status
    getHealthStatus() {
        const metrics = this.getMetrics();
        const issues = [];
        
        // Check FPS
        if (metrics.fps && metrics.fps.avg < 30) {
            issues.push({
                type: 'performance',
                severity: 'warning',
                message: 'Low FPS detected',
                value: metrics.fps.avg.toFixed(1)
            });
        }
        
        // Check memory
        if (metrics.memory && metrics.memory.avg > 500) {
            issues.push({
                type: 'memory',
                severity: 'warning',
                message: 'High memory usage',
                value: metrics.memory.avg.toFixed(0) + 'MB'
            });
        }
        
        return {
            healthy: issues.length === 0,
            issues,
            metrics: {
                fps: metrics.fps?.avg,
                memory: metrics.memory?.avg
            }
        };
    }
}

// Global monitor instance
let globalMonitor = null;

function initialize(config = {}) {
    globalMonitor = new PerformanceMonitor(config);
    return globalMonitor;
}

function getMonitor() {
    if (!globalMonitor) {
        globalMonitor = new PerformanceMonitor();
    }
    return globalMonitor;
}

module.exports = {
    PerformanceMonitor,
    initialize,
    getMonitor,
    // Convenience exports
    start: () => getMonitor().start(),
    stop: () => getMonitor().stop(),
    recordMetric: (name, value, metadata) => getMonitor().recordMetric(name, value, metadata),
    measureAsync: (name, fn) => getMonitor().measureAsync(name, fn),
    measure: (name, fn) => getMonitor().measure(name, fn),
    mark: (name) => getMonitor().mark(name),
    measureBetween: (name, start, end) => getMonitor().measureBetween(name, start, end),
    getMetrics: () => getMonitor().getMetrics(),
    getHealthStatus: () => getMonitor().getHealthStatus()
};
