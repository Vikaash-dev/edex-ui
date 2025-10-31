/**
 * eDEX-UI Module Health Check System
 * Monitors health status of all application modules
 * 
 * Usage:
 *   const healthCheck = require('./shared/monitoring/health-check');
 *   
 *   // Register a module
 *   healthCheck.registerModule('terminal', {
 *     check: async () => {
 *       return {
 *         healthy: terminalIsRunning(),
 *         metrics: { activeTerminals: terminals.length }
 *       };
 *     }
 *   });
 *   
 *   // Get health status
 *   const status = await healthCheck.getStatus();
 */

const { createLogger } = require('../logger');
const logger = createLogger('health-check');

class HealthCheckSystem {
    constructor(config = {}) {
        this.modules = new Map();
        this.checkInterval = config.checkInterval || 60000; // 1 minute
        this.intervalId = null;
    }
    
    registerModule(name, module) {
        if (this.modules.has(name)) {
            logger.warn('Module already registered, overwriting', { name });
        }
        
        this.modules.set(name, {
            name,
            check: module.check,
            lastCheck: null,
            lastStatus: null,
            consecutiveFailures: 0
        });
        
        logger.info('Module registered for health checks', { name });
    }
    
    unregisterModule(name) {
        if (this.modules.delete(name)) {
            logger.info('Module unregistered from health checks', { name });
        }
    }
    
    async checkModule(name) {
        const module = this.modules.get(name);
        
        if (!module) {
            logger.error('Module not found', { name });
            return null;
        }
        
        try {
            const startTime = Date.now();
            const result = await module.check();
            const duration = Date.now() - startTime;
            
            const status = {
                name,
                timestamp: Date.now(),
                healthy: result.healthy !== false,
                metrics: result.metrics || {},
                message: result.message,
                checkDuration: duration
            };
            
            module.lastCheck = Date.now();
            module.lastStatus = status;
            
            if (status.healthy) {
                module.consecutiveFailures = 0;
            } else {
                module.consecutiveFailures++;
                logger.warn('Module health check failed', {
                    name,
                    consecutiveFailures: module.consecutiveFailures,
                    message: status.message
                });
            }
            
            return status;
        } catch (error) {
            logger.error('Health check error', { name, error: error.message });
            
            module.consecutiveFailures++;
            
            return {
                name,
                timestamp: Date.now(),
                healthy: false,
                error: error.message,
                consecutiveFailures: module.consecutiveFailures
            };
        }
    }
    
    async checkAll() {
        const results = [];
        
        for (const [name] of this.modules) {
            const status = await this.checkModule(name);
            if (status) {
                results.push(status);
            }
        }
        
        return results;
    }
    
    async getStatus() {
        const checks = await this.checkAll();
        
        const summary = {
            timestamp: Date.now(),
            overall: checks.every(c => c.healthy) ? 'healthy' : 'degraded',
            modules: checks,
            totalModules: this.modules.size,
            healthyModules: checks.filter(c => c.healthy).length,
            unhealthyModules: checks.filter(c => !c.healthy).length
        };
        
        return summary;
    }
    
    startPeriodicChecks() {
        if (this.intervalId) {
            logger.warn('Periodic checks already running');
            return;
        }
        
        logger.info('Starting periodic health checks', { interval: this.checkInterval });
        
        this.intervalId = setInterval(async () => {
            const status = await this.getStatus();
            
            if (status.unhealthyModules > 0) {
                logger.warn('Unhealthy modules detected', {
                    unhealthy: status.unhealthyModules,
                    modules: status.modules.filter(m => !m.healthy).map(m => m.name)
                });
            }
        }, this.checkInterval);
    }
    
    stopPeriodicChecks() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            logger.info('Stopped periodic health checks');
        }
    }
    
    // Get last known status without running checks
    getLastStatus() {
        const modules = [];
        
        for (const [name, module] of this.modules) {
            if (module.lastStatus) {
                modules.push(module.lastStatus);
            } else {
                modules.push({
                    name,
                    healthy: null,
                    message: 'Not yet checked'
                });
            }
        }
        
        return {
            timestamp: Date.now(),
            overall: modules.every(m => m.healthy === true) ? 'healthy' : 
                     modules.some(m => m.healthy === false) ? 'degraded' : 'unknown',
            modules,
            totalModules: this.modules.size
        };
    }
}

// Global health check instance
let globalHealthCheck = null;

function initialize(config = {}) {
    globalHealthCheck = new HealthCheckSystem(config);
    return globalHealthCheck;
}

function getHealthCheck() {
    if (!globalHealthCheck) {
        globalHealthCheck = new HealthCheckSystem();
    }
    return globalHealthCheck;
}

module.exports = {
    HealthCheckSystem,
    initialize,
    getHealthCheck,
    // Convenience exports
    registerModule: (name, module) => getHealthCheck().registerModule(name, module),
    unregisterModule: (name) => getHealthCheck().unregisterModule(name),
    checkModule: (name) => getHealthCheck().checkModule(name),
    getStatus: () => getHealthCheck().getStatus(),
    getLastStatus: () => getHealthCheck().getLastStatus(),
    startPeriodicChecks: () => getHealthCheck().startPeriodicChecks(),
    stopPeriodicChecks: () => getHealthCheck().stopPeriodicChecks()
};
