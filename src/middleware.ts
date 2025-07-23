import { generateRequestId, logger } from '@/lib/logger';
import { appMonitor } from '@/lib/monitoring';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  // Set up logging context
  logger.setContext({
    requestId,
    operation: 'middleware',
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    ip:
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown',
  });

  logger.info('Request started', {
    method: request.method,
    url: request.url,
    pathname: request.nextUrl.pathname,
  });

  // Record request metric
  appMonitor.metrics.record('request_count', 1, 'count', {
    method: request.method,
    path: request.nextUrl.pathname,
    status: 'started',
  });

  // Add request ID to headers for tracking
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  // Create response
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add response headers
  response.headers.set('x-request-id', requestId);
  response.headers.set('x-response-time', '0'); // Will be updated after response

  // Log request completion
  const duration = Date.now() - startTime;

  logger.info('Request completed', {
    method: request.method,
    url: request.url,
    duration,
    statusCode: response.status,
  });

  // Record completion metrics
  appMonitor.metrics.record('request_duration', duration, 'ms', {
    method: request.method,
    path: request.nextUrl.pathname,
    statusCode: response.status.toString(),
  });

  appMonitor.metrics.record('request_count', 1, 'count', {
    method: request.method,
    path: request.nextUrl.pathname,
    status: 'completed',
  });

  // Update response time header
  response.headers.set('x-response-time', duration.toString());

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
