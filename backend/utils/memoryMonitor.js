/**
 * Memory Monitoring Utility
 * Monitors memory usage and provides alerts for memory issues
 */

const logger = require('./logger');

class MemoryMonitor {
  constructor() {
    this.isMonitoring = false;
    this.intervalId = null;
    this.memoryThresholds = {
      warning: 100 * 1024 * 1024, // 100MB
      critical: 200 * 1024 * 1024, // 200MB
      max: 300 * 1024 * 1024 // 300MB
    };
    this.alertCooldown = 5 * 60 * 1000; // 5 minutes
    this.lastAlert = {
      warning: 0,
      critical: 0,
      max: 0
    };
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: usage.rss, // Resident Set Size
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers,
      // Convert to MB for readability
      rssMB: Math.round(usage.rss / 1024 / 1024),
      heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
      externalMB: Math.round(usage.external / 1024 / 1024)
    };
  }

  /**
   * Check memory usage against thresholds
   */
  checkMemoryThresholds() {
    const usage = this.getMemoryUsage();
    const now = Date.now();

    // Check heap used memory
    if (usage.heapUsed > this.memoryThresholds.max) {
      if (now - this.lastAlert.max > this.alertCooldown) {
        this.alertMaxMemory(usage);
        this.lastAlert.max = now;
      }
    } else if (usage.heapUsed > this.memoryThresholds.critical) {
      if (now - this.lastAlert.critical > this.alertCooldown) {
        this.alertCriticalMemory(usage);
        this.lastAlert.critical = now;
      }
    } else if (usage.heapUsed > this.memoryThresholds.warning) {
      if (now - this.lastAlert.warning > this.alertCooldown) {
        this.alertWarningMemory(usage);
        this.lastAlert.warning = now;
      }
    }
  }

  /**
   * Alert for warning memory usage
   */
  alertWarningMemory(usage) {
    logger.warn('Memory Usage Warning', {
      heapUsed: `${usage.heapUsedMB}MB`,
      heapTotal: `${usage.heapTotalMB}MB`,
      rss: `${usage.rssMB}MB`,
      threshold: `${Math.round(this.memoryThresholds.warning / 1024 / 1024)}MB`
    });
  }

  /**
   * Alert for critical memory usage
   */
  alertCriticalMemory(usage) {
    logger.error('Memory Usage Critical', {
      heapUsed: `${usage.heapUsedMB}MB`,
      heapTotal: `${usage.heapTotalMB}MB`,
      rss: `${usage.rssMB}MB`,
      threshold: `${Math.round(this.memoryThresholds.critical / 1024 / 1024)}MB`
    });
  }

  /**
   * Alert for maximum memory usage
   */
  alertMaxMemory(usage) {
    logger.error('Memory Usage Maximum Reached', {
      heapUsed: `${usage.heapUsedMB}MB`,
      heapTotal: `${usage.heapTotalMB}MB`,
      rss: `${usage.rssMB}MB`,
      threshold: `${Math.round(this.memoryThresholds.max / 1024 / 1024)}MB`
    });

    // Force garbage collection if available
    if (global.gc) {
      logger.info('Forcing garbage collection due to high memory usage');
      global.gc();
    }
  }

  /**
   * Start memory monitoring
   */
  start(intervalMs = 30000) { // Default 30 seconds
    if (this.isMonitoring) {
      logger.warn('Memory monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    this.intervalId = setInterval(() => {
      this.checkMemoryThresholds();
    }, intervalMs);

    logger.info('Memory monitoring started', {
      interval: `${intervalMs}ms`,
      thresholds: {
        warning: `${Math.round(this.memoryThresholds.warning / 1024 / 1024)}MB`,
        critical: `${Math.round(this.memoryThresholds.critical / 1024 / 1024)}MB`,
        max: `${Math.round(this.memoryThresholds.max / 1024 / 1024)}MB`
      }
    });
  }

  /**
   * Stop memory monitoring
   */
  stop() {
    if (!this.isMonitoring) {
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isMonitoring = false;
    logger.info('Memory monitoring stopped');
  }

  /**
   * Get memory statistics
   */
  getStats() {
    const usage = this.getMemoryUsage();
    return {
      current: usage,
      thresholds: this.memoryThresholds,
      isMonitoring: this.isMonitoring,
      lastAlerts: this.lastAlert
    };
  }
}

// Create singleton instance
const memoryMonitor = new MemoryMonitor();

/**
 * Start memory monitoring
 * @param {string} environment - Environment name
 */
const startMemoryMonitoring = (environment = 'development') => {
  // Adjust thresholds based on environment
  if (environment === 'production') {
    memoryMonitor.memoryThresholds = {
      warning: 200 * 1024 * 1024, // 200MB
      critical: 400 * 1024 * 1024, // 400MB
      max: 600 * 1024 * 1024 // 600MB
    };
  } else if (environment === 'staging') {
    memoryMonitor.memoryThresholds = {
      warning: 150 * 1024 * 1024, // 150MB
      critical: 300 * 1024 * 1024, // 300MB
      max: 450 * 1024 * 1024 // 450MB
    };
  }

  // Start monitoring with appropriate interval
  const interval = environment === 'production' ? 60000 : 30000; // 1 min prod, 30 sec dev
  memoryMonitor.start(interval);
};

/**
 * Stop memory monitoring
 */
const stopMemoryMonitoring = () => {
  memoryMonitor.stop();
};

/**
 * Get memory statistics
 */
const getMemoryStats = () => {
  return memoryMonitor.getStats();
};

module.exports = {
  startMemoryMonitoring,
  stopMemoryMonitoring,
  getMemoryStats,
  MemoryMonitor
};