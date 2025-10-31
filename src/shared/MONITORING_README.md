# eDEX-UI Logging and Monitoring System

Comprehensive logging, performance monitoring, error tracking, and health check system for eDEX-UI.

## Overview

This system provides production-grade observability for eDEX-UI with:
- **Structured Logging** - Multi-level, module-specific logging
- **Performance Monitoring** - FPS, memory, custom metrics tracking
- **Error Tracking** - Centralized error collection and analysis
- **Health Checks** - Module-level health monitoring

## Quick Start

### Basic Setup

```javascript
// In your main process (_boot.js)
const logger = require('./shared/logger');
const performanceMonitor = require('./shared/monitoring/performance-monitor');
const errorTracker = require('./shared/monitoring/error-tracker');
const healthCheck = require('./shared/monitoring/health-check');

// Initialize logging
logger.initialize({
    level: logger.LogLevel.INFO,
    outputs: ['console', 'file']
});

// Start monitoring
performanceMonitor.start();
errorTracker.start();
healthCheck.startPeriodicChecks();
```

## Logging

### Creating Module Loggers

```javascript
const { createLogger } = require('./shared/logger');
const logger = createLogger('terminal');

// Log messages
logger.info('Terminal initialized', { cols: 80, rows: 24 });
logger.warn('Terminal resize slow', { duration: 150 });
logger.error('Terminal crash', { error: 'Connection lost' });
logger.debug('Processing input', { data: input });
```

### Log Levels

- **ERROR** (0) - Error messages
- **WARN** (1) - Warning messages
- **INFO** (2) - Informational messages (default)
- **DEBUG** (3) - Debug messages
- **TRACE** (4) - Trace messages

### Configuration

```javascript
const logger = require('./shared/logger');

logger.initialize({
    level: logger.LogLevel.DEBUG,     // Set log level
    outputs: ['console', 'file'],      // Where to output
    logDir: '/custom/path/logs',       // Custom log directory
    maxLogSize: 10 * 1024 * 1024,      // 10MB max file size
    maxLogFiles: 5                     // Keep 5 rotated logs
});
```

### Log Files

Logs are stored in:
- **Location:** `<userData>/logs/edex-ui.log`
- **Format:** JSON (for file), colored text (for console)
- **Rotation:** Automatic when file exceeds `maxLogSize`
- **Retention:** Last `maxLogFiles` kept

### Environment Variables

```bash
# Set log level via environment
LOG_LEVEL=DEBUG npm start

# Production mode (file logging only)
NODE_ENV=production npm start
```

## Performance Monitoring

### Starting Monitoring

```javascript
const monitor = require('./shared/monitoring/performance-monitor');

// Start automatic monitoring
monitor.start();

// Stop monitoring
monitor.stop();
```

### Recording Custom Metrics

```javascript
// Record a simple metric
monitor.recordMetric('terminal-render-time', 16.5);

// Record with metadata
monitor.recordMetric('file-load-time', 250, {
    filename: 'large-file.txt',
    size: 10485760
});
```

### Measuring Function Performance

```javascript
// Measure synchronous function
const result = monitor.measure('complex-calculation', () => {
    return performComplexCalculation();
});

// Measure async function
const data = await monitor.measureAsync('fetch-data', async () => {
    return await fetchDataFromServer();
});
```

### Using Performance Marks

```javascript
// Mark significant points
monitor.mark('terminal-start');
// ... do work ...
monitor.mark('terminal-ready');

// Measure between marks
monitor.measureBetween('terminal-init-time', 'terminal-start', 'terminal-ready');
```

### Getting Metrics

```javascript
const metrics = monitor.getMetrics();

console.log('Average FPS:', metrics.fps.avg);
console.log('Memory usage:', metrics.memory.avg, 'MB');
console.log('Custom metrics:', metrics.custom);
```

### Health Status

```javascript
const health = monitor.getHealthStatus();

if (!health.healthy) {
    console.log('Performance issues:', health.issues);
}
```

### Automatic Monitoring

The monitor automatically tracks:
- **FPS** - Frame rate (updated every second)
- **Memory** - Heap memory usage (if available)
- **Warnings** - Logs slow operations (>100ms)

## Error Tracking

### Automatic Error Tracking

```javascript
const errorTracker = require('./shared/monitoring/error-tracker');

// Start tracking (captures global errors automatically)
errorTracker.start();
```

### Manual Error Tracking

```javascript
try {
    riskyOperation();
} catch (error) {
    errorTracker.trackError(error, {
        module: 'terminal',
        context: 'input-processing',
        userId: currentUser
    });
}
```

### Retrieving Errors

```javascript
// Get all errors
const allErrors = errorTracker.getErrors();

// Filter errors
const recentErrors = errorTracker.getErrors({
    since: Date.now() - 3600000, // Last hour
    type: 'uncaught-error',
    limit: 10
});

// Get error summary
const summary = errorTracker.getErrorSummary();
console.log('Total errors:', summary.totalErrors);
console.log('Top errors:', summary.topErrors);
```

### Clearing Errors

```javascript
// Clear error history
errorTracker.clearErrors();
```

## Health Checks

### Registering Modules

```javascript
const healthCheck = require('./shared/monitoring/health-check');

// Register terminal module
healthCheck.registerModule('terminal', {
    check: async () => {
        const activeTerminals = getActiveTerminals();
        const healthy = activeTerminals.length > 0;
        
        return {
            healthy,
            metrics: {
                activeTerminals: activeTerminals.length,
                memoryUsage: getTerminalMemoryUsage()
            },
            message: healthy ? 'OK' : 'No active terminals'
        };
    }
});

// Register filesystem module
healthCheck.registerModule('filesystem', {
    check: async () => {
        try {
            const isTracking = filesystemIsTracking();
            
            return {
                healthy: isTracking,
                metrics: {
                    currentPath: getCurrentPath(),
                    filesDisplayed: getFileCount()
                },
                message: isTracking ? 'Tracking active' : 'Tracking failed'
            };
        } catch (error) {
            return {
                healthy: false,
                message: error.message
            };
        }
    }
});
```

### Checking Health Status

```javascript
// Check specific module
const terminalStatus = await healthCheck.checkModule('terminal');
console.log('Terminal health:', terminalStatus.healthy);

// Check all modules
const overall = await healthCheck.getStatus();
console.log('Overall status:', overall.overall);
console.log('Healthy modules:', overall.healthyModules);
console.log('Unhealthy modules:', overall.unhealthyModules);

// Get last known status (without running checks)
const lastStatus = healthCheck.getLastStatus();
```

### Periodic Health Checks

```javascript
// Start automatic periodic checks (default: every 60 seconds)
healthCheck.startPeriodicChecks();

// Stop periodic checks
healthCheck.stopPeriodicChecks();
```

## Integration Examples

### Terminal Module Integration

```javascript
// src/classes/terminal.class.js
const { createLogger } = require('../shared/logger');
const monitor = require('../shared/monitoring/performance-monitor');
const healthCheck = require('../shared/monitoring/health-check');

class Terminal {
    constructor(opts) {
        this.logger = createLogger('terminal');
        this.logger.info('Initializing terminal', opts);
        
        // Register health check
        healthCheck.registerModule(`terminal-${opts.id}`, {
            check: async () => ({
                healthy: this.isAlive(),
                metrics: {
                    bufferedLines: this.buffer.length,
                    activeProcesses: this.processes.length
                }
            })
        });
    }
    
    write(data) {
        // Measure render performance
        monitor.measure('terminal-write', () => {
            this.xterm.write(data);
        });
    }
    
    resize(cols, rows) {
        this.logger.debug('Resizing terminal', { cols, rows });
        
        try {
            this.xterm.resize(cols, rows);
            monitor.recordMetric('terminal-resize', 1);
        } catch (error) {
            this.logger.error('Resize failed', { error: error.message });
            throw error;
        }
    }
    
    dispose() {
        this.logger.info('Disposing terminal');
        healthCheck.unregisterModule(`terminal-${this.id}`);
    }
}
```

### Filesystem Module Integration

```javascript
// src/classes/filesystem.class.js
const { createLogger } = require('../shared/logger');
const errorTracker = require('../shared/monitoring/error-tracker');

class Filesystem {
    constructor() {
        this.logger = createLogger('filesystem');
    }
    
    updateDirectory(path) {
        this.logger.info('Updating directory', { path });
        
        try {
            const files = this.readDirectory(path);
            this.displayFiles(files);
        } catch (error) {
            this.logger.error('Directory update failed', { path, error: error.message });
            errorTracker.trackError(error, {
                module: 'filesystem',
                operation: 'updateDirectory',
                path
            });
        }
    }
}
```

## Best Practices

### Logging
1. **Use appropriate log levels** - Don't log everything at INFO
2. **Include context** - Add relevant metadata to log messages
3. **Avoid sensitive data** - Don't log passwords, tokens, etc.
4. **Use structured data** - Pass objects, not concatenated strings

```javascript
// ❌ Bad
logger.info('User ' + username + ' logged in from ' + ip);

// ✅ Good
logger.info('User logged in', { username, ip });
```

### Performance Monitoring
1. **Measure critical paths** - Focus on user-facing operations
2. **Set thresholds** - Define what "slow" means for each operation
3. **Monitor trends** - Look for performance degradation over time
4. **Use marks** - For complex multi-step operations

### Error Tracking
1. **Add context** - Include relevant data with errors
2. **Don't duplicate** - Global handlers catch most errors
3. **Review regularly** - Check error summaries periodically
4. **Fix root causes** - Don't just log and ignore

### Health Checks
1. **Keep checks fast** - Should complete in <100ms
2. **Check core functionality** - Not just "is it running?"
3. **Include metrics** - Provide useful diagnostic data
4. **Handle failures gracefully** - Don't crash on health check errors

## Configuration

### Environment-Based Configuration

```javascript
// config.js
const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
    logging: {
        level: isDevelopment ? 'DEBUG' : 'INFO',
        outputs: isDevelopment ? ['console', 'file'] : ['file']
    },
    monitoring: {
        enabled: true,
        sampleInterval: isDevelopment ? 1000 : 5000
    },
    healthChecks: {
        checkInterval: isDevelopment ? 30000 : 60000
    }
};
```

## Troubleshooting

### Logs Not Appearing
- Check log level configuration
- Verify output destinations
- Ensure log directory is writable
- Check for errors in console

### High Memory Usage from Monitoring
- Reduce `maxSamples` in performance monitor
- Reduce `maxErrors` in error tracker
- Increase sampling intervals

### Health Checks Failing
- Check module registration
- Verify check function returns proper format
- Look for errors in check implementation
- Check console for health check errors

## API Reference

### Logger
- `initialize(config)` - Initialize global logger
- `getLogger()` - Get global logger instance
- `createLogger(module)` - Create module-specific logger
- `error(message, meta)` - Log error
- `warn(message, meta)` - Log warning
- `info(message, meta)` - Log info
- `debug(message, meta)` - Log debug
- `trace(message, meta)` - Log trace

### Performance Monitor
- `start()` - Start monitoring
- `stop()` - Stop monitoring
- `recordMetric(name, value, metadata)` - Record custom metric
- `measure(name, fn)` - Measure sync function
- `measureAsync(name, fn)` - Measure async function
- `mark(name)` - Create performance mark
- `measureBetween(name, start, end)` - Measure between marks
- `getMetrics()` - Get all metrics
- `getHealthStatus()` - Get health status

### Error Tracker
- `start()` - Start tracking
- `trackError(error, context)` - Track error manually
- `getErrors(filter)` - Get errors with optional filter
- `getErrorSummary()` - Get error summary
- `clearErrors()` - Clear error history

### Health Check
- `registerModule(name, module)` - Register module
- `unregisterModule(name)` - Unregister module
- `checkModule(name)` - Check specific module
- `getStatus()` - Get overall status
- `getLastStatus()` - Get last known status
- `startPeriodicChecks()` - Start automatic checks
- `stopPeriodicChecks()` - Stop automatic checks

---

**Status:** Ready for integration  
**Version:** 1.0  
**Last Updated:** October 31, 2025
