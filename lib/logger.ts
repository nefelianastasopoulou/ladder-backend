/**
 * Production-safe logging utility
 * Only logs in development mode, silent in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDevelopment = __DEV__;

  private formatMessage(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.isDevelopment) {
      // In production, only log errors
      return level === 'error';
    }
    return true;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      const entry = this.formatMessage('debug', message, data);
      console.log(`[DEBUG] ${entry.timestamp} - ${entry.message}`, entry.data || '');
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      const entry = this.formatMessage('info', message, data);
      console.log(`[INFO] ${entry.timestamp} - ${entry.message}`, entry.data || '');
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      const entry = this.formatMessage('warn', message, data);
      console.warn(`[WARN] ${entry.timestamp} - ${entry.message}`, entry.data || '');
    }
  }

  error(message: string, error?: any): void {
    if (this.shouldLog('error')) {
      const entry = this.formatMessage('error', message, error);
      console.error(`[ERROR] ${entry.timestamp} - ${entry.message}`, entry.data || '');
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export individual methods for convenience
export const { debug, info, warn, error } = logger;
