// Enhanced Error Handling System
// This module provides comprehensive error handling for the application

import { Alert } from 'react-native';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  stack?: string;
}

export class CustomError extends Error {
  public code: string;
  public details?: any;
  public timestamp: Date;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
  }
}

// Error codes for consistent error handling
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // API errors
  API_ERROR: 'API_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  QUERY_ERROR: 'QUERY_ERROR',
  
  // File errors
  FILE_ERROR: 'FILE_ERROR',
  UPLOAD_ERROR: 'UPLOAD_ERROR',
  
  // Unknown errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Error handler class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];
  private maxLogSize = 100;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Log error
  public logError(error: Error | AppError, context?: string): void {
    const appError: AppError = {
      code: 'code' in error ? error.code : ERROR_CODES.UNKNOWN_ERROR,
      message: error.message,
      details: 'details' in error ? error.details : { context, stack: error.stack },
      timestamp: 'timestamp' in error ? error.timestamp : new Date(),
      stack: error.stack,
    };

    this.errorLog.push(appError);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Log to console in development
    if (__DEV__) {
      console.error('Error logged:', appError);
    }
  }

  // Handle API errors
  public handleAPIError(error: any): AppError {
    let appError: AppError;

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          appError = new CustomError(ERROR_CODES.VALIDATION_ERROR, data?.message || 'Invalid request');
          break;
        case 401:
          appError = new CustomError(ERROR_CODES.AUTH_INVALID, data?.message || 'Authentication required');
          break;
        case 403:
          appError = new CustomError(ERROR_CODES.FORBIDDEN, data?.message || 'Access forbidden');
          break;
        case 404:
          appError = new CustomError(ERROR_CODES.NOT_FOUND, data?.message || 'Resource not found');
          break;
        case 500:
          appError = new CustomError(ERROR_CODES.SERVER_ERROR, data?.message || 'Server error');
          break;
        default:
          appError = new CustomError(ERROR_CODES.API_ERROR, data?.message || 'API error');
      }

      appError.details = { status, data };
    } else if (error.request) {
      // Network error
      appError = new CustomError(ERROR_CODES.NETWORK_ERROR, 'Network connection failed');
      appError.details = { request: error.request };
    } else {
      // Other error
      appError = new CustomError(ERROR_CODES.UNKNOWN_ERROR, error.message || 'Unknown error occurred');
    }

    this.logError(appError, 'API');
    return appError;
  }

  // Handle validation errors
  public handleValidationError(errors: string[]): AppError {
    const appError = new CustomError(
      ERROR_CODES.VALIDATION_ERROR,
      'Validation failed',
      { errors }
    );
    this.logError(appError, 'Validation');
    return appError;
  }

  // Show user-friendly error message
  public showError(error: AppError, customMessage?: string): void {
    const message = customMessage || this.getUserFriendlyMessage(error);
    
    Alert.alert(
      'Error',
      message,
      [{ text: 'OK' }]
    );
  }

  // Get user-friendly error message
  private getUserFriendlyMessage(error: AppError): string {
    switch (error.code) {
      case ERROR_CODES.NETWORK_ERROR:
        return 'Please check your internet connection and try again.';
      case ERROR_CODES.AUTH_INVALID:
        return 'Please log in again to continue.';
      case ERROR_CODES.AUTH_EXPIRED:
        return 'Your session has expired. Please log in again.';
      case ERROR_CODES.VALIDATION_ERROR:
        return 'Please check your input and try again.';
      case ERROR_CODES.NOT_FOUND:
        return 'The requested resource was not found.';
      case ERROR_CODES.FORBIDDEN:
        return 'You do not have permission to perform this action.';
      case ERROR_CODES.SERVER_ERROR:
        return 'Something went wrong on our end. Please try again later.';
      case ERROR_CODES.FILE_ERROR:
        return 'There was an error with the file. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  // Get error log
  public getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  // Clear error log
  public clearErrorLog(): void {
    this.errorLog = [];
  }

  // Get error statistics
  public getErrorStats(): {
    total: number;
    byCode: Record<string, number>;
    recent: AppError[];
  } {
    const byCode: Record<string, number> = {};
    this.errorLog.forEach(error => {
      byCode[error.code] = (byCode[error.code] || 0) + 1;
    });

    const recent = this.errorLog
      .filter(error => Date.now() - error.timestamp.getTime() < 24 * 60 * 60 * 1000) // Last 24 hours
      .slice(-10);

    return {
      total: this.errorLog.length,
      byCode,
      recent,
    };
  }
}

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// React error boundary hook
export const useErrorHandler = () => {
  const handleError = (error: Error, context?: string) => {
    errorHandler.logError(error, context);
    errorHandler.showError(errorHandler.handleAPIError(error));
  };

  const handleAPIError = (error: any) => {
    const appError = errorHandler.handleAPIError(error);
    errorHandler.showError(appError);
    return appError;
  };

  const handleValidationError = (errors: string[]) => {
    const appError = errorHandler.handleValidationError(errors);
    errorHandler.showError(appError);
    return appError;
  };

  return {
    handleError,
    handleAPIError,
    handleValidationError,
    getErrorLog: () => errorHandler.getErrorLog(),
    getErrorStats: () => errorHandler.getErrorStats(),
  };
};

// Async error wrapper
export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T => {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandler.logError(error as Error, context);
      throw errorHandler.handleAPIError(error);
    }
  }) as T;
};

// Retry mechanism for failed requests
export const withRetry = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  maxRetries: number = 3,
  delay: number = 1000
): T => {
  return (async (...args: Parameters<T>) => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    
    throw lastError!;
  }) as T;
};
