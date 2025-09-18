/**
 * Database Setup and Monitoring Utility
 * Provides database connection monitoring and health checks
 */

const logger = require('./logger');

class DatabaseMonitor {
  constructor() {
    this.db = null;
    this.isMonitoring = false;
    this.intervalId = null;
    this.connectionStats = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingConnections: 0,
      lastCheck: null,
      errors: 0
    };
  }

  /**
   * Set database instance
   */
  setDatabase(db) {
    this.db = db;
  }

  /**
   * Get database connection statistics
   */
  async getConnectionStats() {
    if (!this.db) {
      throw new Error('Database not set');
    }

    try {
      // Get pool statistics if available
      if (this.db.pool) {
        return {
          totalCount: this.db.pool.totalCount || 0,
          idleCount: this.db.pool.idleCount || 0,
          waitingCount: this.db.pool.waitingCount || 0
        };
      }

      // Fallback: try to get stats from database
      const result = await this.db.query(`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);

      return {
        totalConnections: parseInt(result.rows[0]?.total_connections || 0),
        activeConnections: parseInt(result.rows[0]?.active_connections || 0),
        idleConnections: parseInt(result.rows[0]?.idle_connections || 0)
      };
    } catch (error) {
      logger.error('Failed to get database connection stats:', error);
      return {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        error: error.message
      };
    }
  }

  /**
   * Test database connection
   */
  async testConnection() {
    if (!this.db) {
      throw new Error('Database not set');
    }

    try {
      const start = Date.now();
      await this.db.query('SELECT 1');
      const responseTime = Date.now() - start;

      return {
        connected: true,
        responseTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.connectionStats.errors++;
      return {
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get database performance statistics
   */
  async getPerformanceStats() {
    if (!this.db) {
      throw new Error('Database not set');
    }

    try {
      // Get query statistics if available
      if (this.db.getStats) {
        return this.db.getStats();
      }

      // Fallback: basic performance info
      return {
        message: 'Performance stats not available',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get database performance stats:', error);
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check database health
   */
  async checkHealth() {
    const connectionTest = await this.testConnection();
    const connectionStats = await this.getConnectionStats();
    const performanceStats = await this.getPerformanceStats();

    return {
      connection: connectionTest,
      stats: connectionStats,
      performance: performanceStats,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Start database monitoring
   */
  start(intervalMs = 60000) { // Default 1 minute
    if (this.isMonitoring) {
      logger.warn('Database monitoring is already running');
      return;
    }

    if (!this.db) {
      throw new Error('Database not set before starting monitoring');
    }

    this.isMonitoring = true;
    this.intervalId = setInterval(async () => {
      try {
        const health = await this.checkHealth();
        this.connectionStats.lastCheck = new Date().toISOString();

        // Log health status
        if (health.connection.connected) {
          logger.debug('Database health check passed', {
            responseTime: `${health.connection.responseTime}ms`,
            connections: health.stats
          });
        } else {
          logger.error('Database health check failed', {
            error: health.connection.error
          });
        }
      } catch (error) {
        logger.error('Database monitoring error:', error);
        this.connectionStats.errors++;
      }
    }, intervalMs);

    logger.info('Database monitoring started', {
      interval: `${intervalMs}ms`
    });
  }

  /**
   * Stop database monitoring
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
    logger.info('Database monitoring stopped');
  }

  /**
   * Get monitoring statistics
   */
  getStats() {
    return {
      isMonitoring: this.isMonitoring,
      connectionStats: this.connectionStats,
      lastCheck: this.connectionStats.lastCheck
    };
  }
}

// Create singleton instance
const databaseMonitor = new DatabaseMonitor();

/**
 * Setup database monitoring
 * @param {Object} db - Database instance
 */
const setupDatabaseMonitoring = (db) => {
  if (!db) {
    throw new Error('Database instance is required');
  }

  // Set database instance
  databaseMonitor.setDatabase(db);

  // Test initial connection
  databaseMonitor.testConnection()
    .then(result => {
      if (result.connected) {
        logger.info('Database connection test successful', {
          responseTime: `${result.responseTime}ms`
        });
      } else {
        logger.error('Database connection test failed', {
          error: result.error
        });
      }
    })
    .catch(error => {
      logger.error('Database connection test error:', error);
    });

  // Start monitoring in production
  if (process.env.NODE_ENV === 'production') {
    databaseMonitor.start(60000); // 1 minute interval for production
  } else {
    databaseMonitor.start(30000); // 30 second interval for development
  }
};

/**
 * Stop database monitoring
 */
const stopDatabaseMonitoring = () => {
  databaseMonitor.stop();
};

/**
 * Get database health
 */
const getDatabaseHealth = async () => {
  return await databaseMonitor.checkHealth();
};

/**
 * Get database monitoring statistics
 */
const getDatabaseMonitoringStats = () => {
  return databaseMonitor.getStats();
};

/**
 * Test database connection
 */
const testDatabaseConnection = async () => {
  return await databaseMonitor.testConnection();
};

module.exports = {
  setupDatabaseMonitoring,
  stopDatabaseMonitoring,
  getDatabaseHealth,
  getDatabaseMonitoringStats,
  testDatabaseConnection,
  DatabaseMonitor
};