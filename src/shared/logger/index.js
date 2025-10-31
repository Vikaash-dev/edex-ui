/**
 * eDEX-UI Logger Module
 * Provides structured logging with multiple levels and output formats
 * 
 * Usage:
 *   const logger = require('./shared/logger');
 *   const terminalLogger = logger.createLogger('terminal');
 *   terminalLogger.info('Terminal initialized', { cols: 80, rows: 24 });
 */

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Log levels
const LogLevel = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    TRACE: 4
};

const LogLevelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];

class Logger {
    constructor(config = {}) {
        this.level = config.level || LogLevel.INFO;
        this.module = config.module || 'app';
        this.outputs = config.outputs || ['console'];
        this.logDir = config.logDir || this.getDefaultLogDir();
        this.maxLogSize = config.maxLogSize || 10 * 1024 * 1024; // 10MB
        this.maxLogFiles = config.maxLogFiles || 5;
        
        // Ensure log directory exists
        this.ensureLogDirectory();
        
        // Rotate logs if needed
        this.rotateLogs();
    }
    
    getDefaultLogDir() {
        try {
            const userDataPath = app.getPath('userData');
            return path.join(userDataPath, 'logs');
        } catch (e) {
            return path.join(process.cwd(), 'logs');
        }
    }
    
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }
    
    rotateLogs() {
        const logFile = path.join(this.logDir, 'edex-ui.log');
        
        if (fs.existsSync(logFile)) {
            const stats = fs.statSync(logFile);
            
            if (stats.size > this.maxLogSize) {
                // Rotate existing logs
                for (let i = this.maxLogFiles - 1; i > 0; i--) {
                    const oldFile = path.join(this.logDir, `edex-ui.log.${i}`);
                    const newFile = path.join(this.logDir, `edex-ui.log.${i + 1}`);
                    
                    if (fs.existsSync(oldFile)) {
                        if (i === this.maxLogFiles - 1) {
                            fs.unlinkSync(oldFile); // Delete oldest
                        } else {
                            fs.renameSync(oldFile, newFile);
                        }
                    }
                }
                
                // Move current log to .1
                fs.renameSync(logFile, path.join(this.logDir, 'edex-ui.log.1'));
            }
        }
    }
    
    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const levelName = LogLevelNames[level];
        
        const logEntry = {
            timestamp,
            level: levelName,
            module: this.module,
            message,
            ...meta
        };
        
        return logEntry;
    }
    
    formatForConsole(logEntry) {
        const colors = {
            ERROR: '\x1b[31m', // Red
            WARN: '\x1b[33m',  // Yellow
            INFO: '\x1b[36m',  // Cyan
            DEBUG: '\x1b[90m', // Gray
            TRACE: '\x1b[37m'  // White
        };
        
        const reset = '\x1b[0m';
        const color = colors[logEntry.level] || '';
        
        let output = `${color}[${logEntry.timestamp}] [${logEntry.level}] [${logEntry.module}]${reset} ${logEntry.message}`;
        
        if (Object.keys(logEntry).length > 4) { // More than standard fields
            const meta = { ...logEntry };
            delete meta.timestamp;
            delete meta.level;
            delete meta.module;
            delete meta.message;
            
            if (Object.keys(meta).length > 0) {
                output += ` ${JSON.stringify(meta)}`;
            }
        }
        
        return output;
    }
    
    formatForFile(logEntry) {
        return JSON.stringify(logEntry);
    }
    
    write(level, message, meta = {}) {
        if (level > this.level) {
            return; // Skip if below configured level
        }
        
        const logEntry = this.formatMessage(level, message, meta);
        
        // Console output
        if (this.outputs.includes('console')) {
            const formatted = this.formatForConsole(logEntry);
            
            if (level === LogLevel.ERROR) {
                console.error(formatted);
            } else if (level === LogLevel.WARN) {
                console.warn(formatted);
            } else {
                console.log(formatted);
            }
        }
        
        // File output
        if (this.outputs.includes('file')) {
            const logFile = path.join(this.logDir, 'edex-ui.log');
            const formatted = this.formatForFile(logEntry) + '\n';
            
            try {
                fs.appendFileSync(logFile, formatted, 'utf8');
            } catch (e) {
                console.error('Failed to write to log file:', e.message);
            }
        }
    }
    
    // Convenience methods
    error(message, meta) {
        this.write(LogLevel.ERROR, message, meta);
    }
    
    warn(message, meta) {
        this.write(LogLevel.WARN, message, meta);
    }
    
    info(message, meta) {
        this.write(LogLevel.INFO, message, meta);
    }
    
    debug(message, meta) {
        this.write(LogLevel.DEBUG, message, meta);
    }
    
    trace(message, meta) {
        this.write(LogLevel.TRACE, message, meta);
    }
    
    // Create child logger with module name
    child(moduleName) {
        return new Logger({
            level: this.level,
            module: moduleName,
            outputs: this.outputs,
            logDir: this.logDir,
            maxLogSize: this.maxLogSize,
            maxLogFiles: this.maxLogFiles
        });
    }
}

// Global logger instance
let globalLogger = null;

/**
 * Initialize the global logger
 * @param {Object} config Configuration options
 */
function initialize(config = {}) {
    globalLogger = new Logger(config);
    return globalLogger;
}

/**
 * Get the global logger or create a default one
 */
function getLogger() {
    if (!globalLogger) {
        globalLogger = new Logger({
            level: process.env.LOG_LEVEL ? LogLevel[process.env.LOG_LEVEL.toUpperCase()] : LogLevel.INFO,
            outputs: process.env.NODE_ENV === 'production' ? ['file'] : ['console', 'file']
        });
    }
    return globalLogger;
}

/**
 * Create a module-specific logger
 * @param {String} moduleName Name of the module
 */
function createLogger(moduleName) {
    return getLogger().child(moduleName);
}

module.exports = {
    LogLevel,
    Logger,
    initialize,
    getLogger,
    createLogger
};
