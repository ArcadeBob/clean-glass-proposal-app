'use client'

import { ErrorInfo } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

// Global error handler for the entire application
const globalErrorHandler = (error: Error, errorInfo: ErrorInfo) => {
  // Log error to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Global Error Boundary')
    console.error('Error:', error)
    console.error('Component Stack:', errorInfo.componentStack)
    console.groupEnd()
  }

  // In production, you would send this to an error reporting service
  // Example with Sentry:
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error, {
  //     extra: {
  //       componentStack: errorInfo.componentStack,
  //       url: window.location.href,
  //       userAgent: navigator.userAgent,
  //     },
  //   })
  // }

  // You could also send to your own error tracking service
  // Example:
  // fetch('/api/error-log', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     error: error.message,
  //     stack: error.stack,
  //     componentStack: errorInfo.componentStack,
  //     url: window.location.href,
  //     timestamp: new Date().toISOString(),
  //   }),
  // }).catch(console.error)
}

interface GlobalErrorBoundaryProps {
  children: React.ReactNode
}

export function GlobalErrorBoundary({ children }: GlobalErrorBoundaryProps) {
  return (
    <ErrorBoundary onError={globalErrorHandler}>
      {children}
    </ErrorBoundary>
  )
} 