import { useCallback } from 'react'

interface ErrorHandlerOptions {
  onError?: (error: Error) => void
  logToConsole?: boolean
}

/**
 * Custom hook for handling errors in functional components
 * Provides a way to catch and handle errors gracefully
 */
export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const { onError, logToConsole = true } = options

  const handleError = useCallback((error: Error) => {
    // Log to console in development
    if (logToConsole && process.env.NODE_ENV === 'development') {
      console.error('🚨 Component Error:', error)
    }

    // Call custom error handler
    onError?.(error)

    // In production, you might want to send this to an error reporting service
    // Example with Sentry:
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, {
    //     tags: {
    //       component: 'useErrorHandler',
    //     },
    //   })
    // }
  }, [onError, logToConsole])

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>
  ): Promise<T | null> => {
    try {
      return await asyncFn()
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)))
      return null
    }
  }, [handleError])

  return {
    handleError,
    handleAsyncError,
  }
}

/**
 * Hook for wrapping async operations with error handling
 */
export function useAsyncErrorHandler() {
  const { handleError } = useErrorHandler()

  const withErrorHandling = useCallback(<T extends any[], R>(
    asyncFn: (...args: T) => Promise<R>
  ) => {
    return async (...args: T): Promise<R | null> => {
      try {
        return await asyncFn(...args)
      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)))
        return null
      }
    }
  }, [handleError])

  return { withErrorHandling }
} 