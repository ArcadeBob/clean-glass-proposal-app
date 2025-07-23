import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Integrations
  integrations: [Sentry.nodeTracingIntegration()],

  // Before send hook to filter sensitive data
  beforeSend(event: any, hint: any) {
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
    // Database connection errors
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',

    // Prisma errors that are not actionable
    'P2024', // Connection timeout
    'P2025', // Record not found
    'P2034', // Transaction failed

    // Rate limiting errors
    'Too Many Requests',
    'Rate limit exceeded',
  ],

  // Configure breadcrumbs
  beforeBreadcrumb(breadcrumb: any) {
    // Filter out sensitive data from breadcrumbs
    if (breadcrumb.category === 'http' && breadcrumb.data) {
      delete breadcrumb.data.request_body;
      delete breadcrumb.data.response_body;
    }

    return breadcrumb;
  },
});
