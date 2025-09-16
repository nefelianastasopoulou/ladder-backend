/**
 * Production-ready logging utility
 * Replaces console.log/error statements in production builds
 */

interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

class ProductionLogger {
  private currentLevel: number;

  constructor() {
    // In production, only log errors and warnings
    // In development, log everything
    this.currentLevel = __DEV__ ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;
  }

  private shouldLog(level: keyof LogLevel): boolean {
    return LOG_LEVELS[level] <= this.currentLevel;
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('ERROR')) {
      if (__DEV__) {
        console.error(this.formatMessage('ERROR', message), ...args);
      } else {
        // In production, you might want to send errors to a logging service
        // For now, we'll just log to console but with proper formatting
        console.error(this.formatMessage('ERROR', message));
      }
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('WARN')) {
      if (__DEV__) {
        console.warn(this.formatMessage('WARN', message), ...args);
      } else {
        console.warn(this.formatMessage('WARN', message));
      }
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('INFO')) {
      if (__DEV__) {
        console.log(this.formatMessage('INFO', message), ...args);
      }
      // In production, info logs are not shown
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('DEBUG')) {
      if (__DEV__) {
        console.log(this.formatMessage('DEBUG', message), ...args);
      }
      // In production, debug logs are not shown
    }
  }

  // Specialized logging methods
  apiError(endpoint: string, error: any): void {
    this.error(`API Error on ${endpoint}:`, error?.message || 'Unknown error');
  }

  apiSuccess(endpoint: string, responseTime?: number): void {
    this.debug(`API Success on ${endpoint}${responseTime ? ` (${responseTime}ms)` : ''}`);
  }

  userAction(action: string, details?: any): void {
    this.info(`User Action: ${action}`, details);
  }

  performance(operation: string, duration: number): void {
    if (duration > 1000) { // Log slow operations
      this.warn(`Slow operation: ${operation} took ${duration}ms`);
    } else {
      this.debug(`Operation: ${operation} took ${duration}ms`);
    }
  }
}

// Create singleton instance
export const logger = new ProductionLogger();

// Export for backward compatibility
export default logger;
