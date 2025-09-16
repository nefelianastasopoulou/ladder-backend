import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { logger } from '../lib/logger';

interface GlobalErrorHandlerProps {
  children: React.ReactNode;
}

export function GlobalErrorHandler({ children }: GlobalErrorHandlerProps) {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: any) => {
      logger.error('Unhandled promise rejection:', {
        reason: event.reason,
        promise: event.promise,
      });
      
      // Show user-friendly error message
      Alert.alert(
        'Something went wrong',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    };

    // Handle global errors
    const handleGlobalError = (error: ErrorEvent) => {
      logger.error('Global error:', {
        message: error.message,
        filename: error.filename,
        lineno: error.lineno,
        colno: error.colno,
      });
    };

    // Add event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      window.addEventListener('error', handleGlobalError);
    }

    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        window.removeEventListener('error', handleGlobalError);
      }
    };
  }, []);

  return <>{children}</>;
}
