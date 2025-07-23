import * as Sentry from '@sentry/nextjs';
import { logger } from './logger';

// Sentry configuration
export function initializeSentry(): void {
  if (!process.env.SENTRY_DSN) {
    logger.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      replaysSessionSampleRate:
        process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      replaysOnErrorSampleRate: 1.0,

      // Performance monitoring
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],

      // Before sending events to Sentry
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request?.data) {
          const sensitiveFields = [
            'password',
            'token',
            'secret',
            'apiKey',
            'authorization',
            'projectAddress',
            'gcContact',
            'phone',
            'ssn',
            'creditCard',
          ];

          sensitiveFields.forEach(field => {
            if (event.request.data[field]) {
              event.request.data[field] = '[REDACTED]';
            }
          });
        }

        // Add custom context
        event.tags = {
          ...event.tags,
          environment: process.env.NODE_ENV,
          version: process.env.npm_package_version,
        };

        return event;
      },

      // Ignore certain errors
      ignoreErrors: [
        // Network errors that are not critical
        'Network Error',
        'Failed to fetch',
        'Request timeout',
        // Browser-specific errors
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
      ],

      // Configure sampling
      tracesSampler: samplingContext => {
        // Sample 100% of transactions in development
        if (process.env.NODE_ENV === 'development') {
          return 1.0;
        }

        // Sample based on operation
        const { transactionContext } = samplingContext;

        // Sample all API routes
        if (transactionContext.op === 'http.server') {
          return 0.1;
        }

        // Sample database operations
        if (transactionContext.op === 'db') {
          return 0.2;
        }

        // Default sampling rate
        return 0.05;
      },
    });

    logger.info('Sentry initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Sentry', error as Error);
  }
}

// Error tracking utilities
export const errorTracking = {
  // Capture and report an error
  captureException(error: Error, context?: Record<string, any>): void {
    try {
      Sentry.captureException(error, {
        extra: context,
        tags: {
          source: 'manual',
          ...context?.tags,
        },
      });

      logger.error('Error captured by Sentry', error, context);
    } catch (sentryError) {
      logger.error('Failed to capture error in Sentry', sentryError as Error);
    }
  },

  // Capture a message
  captureMessage(
    message: string,
    level: Sentry.SeverityLevel = 'error',
    context?: Record<string, any>
  ): void {
    try {
      Sentry.captureMessage(message, {
        level,
        extra: context,
        tags: {
          source: 'manual',
          ...context?.tags,
        },
      });

      logger.info(`Message captured by Sentry: ${message}`, context);
    } catch (sentryError) {
      logger.error('Failed to capture message in Sentry', sentryError as Error);
    }
  },

  // Set user context
  setUser(user: { id: string; email?: string; username?: string }): void {
    try {
      Sentry.setUser(user);
      logger.debug('Sentry user context set', { user });
    } catch (error) {
      logger.error('Failed to set Sentry user context', error as Error);
    }
  },

  // Set additional context
  setContext(name: string, context: Record<string, any>): void {
    try {
      Sentry.setContext(name, context);
      logger.debug(`Sentry context set: ${name}`, context);
    } catch (error) {
      logger.error('Failed to set Sentry context', error as Error);
    }
  },

  // Set tags
  setTag(key: string, value: string): void {
    try {
      Sentry.setTag(key, value);
      logger.debug(`Sentry tag set: ${key} = ${value}`);
    } catch (error) {
      logger.error('Failed to set Sentry tag', error as Error);
    }
  },

  // Start a performance transaction
  startTransaction(name: string, operation: string): Sentry.Transaction | null {
    try {
      const transaction = Sentry.startTransaction({
        name,
        op: operation,
      });

      Sentry.getCurrentHub().configureScope(scope =>
        scope.setSpan(transaction)
      );

      logger.debug(`Sentry transaction started: ${name}`, { operation });
      return transaction;
    } catch (error) {
      logger.error('Failed to start Sentry transaction', error as Error);
      return null;
    }
  },

  // Add breadcrumb
  addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
    try {
      Sentry.addBreadcrumb(breadcrumb);
      logger.debug('Sentry breadcrumb added', breadcrumb);
    } catch (error) {
      logger.error('Failed to add Sentry breadcrumb', error as Error);
    }
  },

  // Flush events (useful for serverless environments)
  async flush(timeout?: number): Promise<boolean> {
    try {
      const result = await Sentry.flush(timeout);
      logger.debug('Sentry events flushed', { success: result });
      return result;
    } catch (error) {
      logger.error('Failed to flush Sentry events', error as Error);
      return false;
    }
  },
};

// Performance monitoring utilities
export const performanceMonitoring = {
  // Wrap a function with performance monitoring
  async measure<T>(
    name: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const transaction = errorTracking.startTransaction(name, operation);

    try {
      const result = await fn();

      if (transaction) {
        transaction.setStatus('ok');
        transaction.finish();
      }

      return result;
    } catch (error) {
      if (transaction) {
        transaction.setStatus('internal_error');
        transaction.finish();
      }

      errorTracking.captureException(error as Error, {
        operation,
        transaction: name,
      });

      throw error;
    }
  },

  // Measure synchronous function
  measureSync<T>(name: string, operation: string, fn: () => T): T {
    const transaction = errorTracking.startTransaction(name, operation);

    try {
      const result = fn();

      if (transaction) {
        transaction.setStatus('ok');
        transaction.finish();
      }

      return result;
    } catch (error) {
      if (transaction) {
        transaction.setStatus('internal_error');
        transaction.finish();
      }

      errorTracking.captureException(error as Error, {
        operation,
        transaction: name,
      });

      throw error;
    }
  },

  // Create a span for a specific operation
  createSpan(name: string, operation: string): Sentry.Span | null {
    try {
      const currentSpan = Sentry.getCurrentHub().getScope().getTransaction();
      if (currentSpan) {
        const span = currentSpan.startChild({
          op: operation,
          description: name,
        });

        logger.debug(`Sentry span created: ${name}`, { operation });
        return span;
      }
      return null;
    } catch (error) {
      logger.error('Failed to create Sentry span', error as Error);
      return null;
    }
  },
};

// Request monitoring middleware
export function withSentryMonitoring<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  operationName: string
) {
  return async (...args: T): Promise<R> => {
    return performanceMonitoring.measure(operationName, 'function', () =>
      handler(...args)
    );
  };
}

// Error boundary integration
export function withSentryErrorBoundary<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  context?: Record<string, any>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      errorTracking.captureException(error as Error, {
        handler: handler.name,
        args: args.map(arg =>
          typeof arg === 'object' ? '[Object]' : String(arg)
        ),
        ...context,
      });
      throw error;
    }
  };
}

// Initialize Sentry on module load
if (typeof window !== 'undefined') {
  // Client-side initialization
  initializeSentry();
} else {
  // Server-side initialization
  initializeSentry();
}

export default Sentry;
