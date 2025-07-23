import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,

  // Integrations
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Before send hook to filter sensitive data
  beforeSend(event, hint) {
    // Filter out health check errors
    if (event.request?.url?.includes('/api/monitoring/health')) {
      return null;
    }

    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
      delete event.request.headers['x-api-key'];
    }

    return event;
  },

  // Ignore specific errors
  ignoreErrors: [
    // Network errors that are not actionable
    'Network Error',
    'Failed to fetch',
    'Request timeout',
    'Request aborted',

    // Browser-specific errors
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',

    // Third-party script errors
    /Script error\.?$/,
    /Javascript error: .* on line \d+/,
  ],

  // Configure breadcrumbs
  beforeBreadcrumb(breadcrumb) {
    // Filter out sensitive data from breadcrumbs
    if (breadcrumb.category === 'http' && breadcrumb.data) {
      delete breadcrumb.data.request_body;
      delete breadcrumb.data.response_body;
    }

    return breadcrumb;
  },
});
