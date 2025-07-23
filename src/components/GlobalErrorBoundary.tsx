'use client';

import { ErrorInfo } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

import { logger } from '@/lib/logger';
import { errorTracking } from '@/lib/sentry';

// Global error handler for the entire application
const globalErrorHandler = (error: Error, errorInfo: ErrorInfo) => {
  // Log error with structured logging
  logger.error('Global Error Boundary caught an error', error, {
    component: 'GlobalErrorBoundary',
    componentStack: errorInfo.componentStack,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
  });

  // Send to Sentry in production
  if (process.env.NODE_ENV === 'production') {
    errorTracking.captureException(error, {
      component: 'GlobalErrorBoundary',
      componentStack: errorInfo.componentStack,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent:
        typeof window !== 'undefined' ? navigator.userAgent : undefined,
    });
  }
};

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
}

export function GlobalErrorBoundary({ children }: GlobalErrorBoundaryProps) {
  return <ErrorBoundary onError={globalErrorHandler}>{children}</ErrorBoundary>;
}
