import { logger } from '@/lib/logger';
import { errorTracking } from '@/lib/sentry';
import { useCallback } from 'react';

interface ErrorHandlerOptions {
  onError?: (error: Error) => void;
  logToConsole?: boolean;
  component?: string;
}

/**
 * Custom hook for handling errors in functional components
 * Provides a way to catch and handle errors gracefully
 */
export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const { onError, logToConsole = true, component } = options;

  const handleError = useCallback(
    (error: Error) => {
      // Log error with structured logging
      logger.error('Component Error', error, {
        component: component || 'useErrorHandler',
        logToConsole,
      });

      // Call custom error handler
      onError?.(error);

      // Send to Sentry in production
      if (process.env.NODE_ENV === 'production') {
        errorTracking.captureException(error, {
          component: component || 'useErrorHandler',
          source: 'hook',
        });
      }
    },
    [onError, logToConsole, component]
  );

  const handleAsyncError = useCallback(
    async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
      try {
        return await asyncFn();
      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)));
        return null;
      }
    },
    [handleError]
  );

  return {
    handleError,
    handleAsyncError,
  };
}

/**
 * Hook for wrapping async operations with error handling
 */
export function useAsyncErrorHandler() {
  const { handleError } = useErrorHandler();

  const withErrorHandling = useCallback(
    <T extends any[], R>(asyncFn: (...args: T) => Promise<R>) => {
      return async (...args: T): Promise<R | null> => {
        try {
          return await asyncFn(...args);
        } catch (error) {
          handleError(
            error instanceof Error ? error : new Error(String(error))
          );
          return null;
        }
      };
    },
    [handleError]
  );

  return { withErrorHandling };
}
