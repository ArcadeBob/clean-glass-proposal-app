import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createDatabaseErrorResponse,
  createInternalErrorResponse,
  createUnauthorizedResponse,
  createZodValidationErrorResponse,
  generateRequestId,
  withErrorHandling,
  type ApiResponse,
} from './api-response';
import { DatabaseError } from './db';

// Middleware configuration
export interface ApiMiddlewareConfig {
  requireAuth?: boolean;
  validateBody?: z.ZodSchema;
  validateQuery?: z.ZodSchema;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

// Request context with metadata
export interface RequestContext {
  requestId: string;
  userId?: string;
  timestamp: string;
  method: string;
  url: string;
}

// Middleware function type
export type ApiHandler<T = any> = (
  request: NextRequest,
  context: RequestContext
) => Promise<NextResponse<ApiResponse<T>>>;

// Main middleware wrapper
export function withApiMiddleware<T = any>(
  handler: ApiHandler<T>,
  config: ApiMiddlewareConfig = {}
) {
  return async (
    request: NextRequest
  ): Promise<NextResponse<ApiResponse<T>>> => {
    const requestId = generateRequestId();
    const context: RequestContext = {
      requestId,
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
    };

    try {
      // Add request ID to headers for tracing
      const headers = new Headers(request.headers);
      headers.set('X-Request-ID', requestId);

      // Validate authentication if required
      if (config.requireAuth) {
        const authResult = await validateAuthentication(request, context);
        if (!authResult.success) {
          return authResult.response!;
        }
        context.userId = authResult.userId;
      }

      // Validate request body if schema provided
      if (config.validateBody && request.method !== 'GET') {
        const bodyResult = await validateRequestBody(
          request,
          config.validateBody,
          context
        );
        if (!bodyResult.success) {
          return bodyResult.response!;
        }
      }

      // Validate query parameters if schema provided
      if (config.validateQuery) {
        const queryResult = validateQueryParameters(
          request,
          config.validateQuery,
          context
        );
        if (!queryResult.success) {
          return queryResult.response!;
        }
      }

      // Apply rate limiting if configured
      if (config.rateLimit) {
        const rateLimitResult = await checkRateLimit(
          request,
          config.rateLimit,
          context
        );
        if (!rateLimitResult.success) {
          return rateLimitResult.response!;
        }
      }

      // Execute the handler with error handling
      const wrappedHandler = withErrorHandling(handler, requestId);
      return await wrappedHandler(request, context);
    } catch (error) {
      console.error('API Middleware Error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context,
      });

      // Handle specific error types
      if (error instanceof z.ZodError) {
        return createZodValidationErrorResponse(
          error,
          'Request validation failed',
          requestId
        );
      }

      if (error instanceof DatabaseError) {
        return createDatabaseErrorResponse(error, requestId);
      }

      // Generic error handling
      return createInternalErrorResponse(
        'An unexpected error occurred',
        requestId
      );
    }
  };
}

// Authentication validation
async function validateAuthentication(
  request: NextRequest,
  context: RequestContext
): Promise<{
  success: boolean;
  response?: NextResponse<ApiResponse>;
  userId?: string;
}> {
  try {
    // Import auth dynamically to avoid circular dependencies
    const { auth } = await import('./auth');
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        response: createUnauthorizedResponse(
          'Authentication required',
          context.requestId
        ),
      };
    }

    return {
      success: true,
      userId: session.user.id,
    };
  } catch (error) {
    console.error('Authentication validation error:', error);
    return {
      success: false,
      response: createUnauthorizedResponse(
        'Authentication failed',
        context.requestId
      ),
    };
  }
}

// Request body validation
async function validateRequestBody(
  request: NextRequest,
  schema: z.ZodSchema,
  context: RequestContext
): Promise<{ success: boolean; response?: NextResponse<ApiResponse> }> {
  try {
    const body = await request.json();
    schema.parse(body);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        response: createZodValidationErrorResponse(
          error,
          'Invalid request body',
          context.requestId
        ),
      };
    }
    return {
      success: false,
      response: createInternalErrorResponse(
        'Failed to parse request body',
        context.requestId
      ),
    };
  }
}

// Query parameters validation
function validateQueryParameters(
  request: NextRequest,
  schema: z.ZodSchema,
  context: RequestContext
): { success: boolean; response?: NextResponse<ApiResponse> } {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    schema.parse(queryParams);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        response: createZodValidationErrorResponse(
          error,
          'Invalid query parameters',
          context.requestId
        ),
      };
    }
    return {
      success: false,
      response: createInternalErrorResponse(
        'Failed to parse query parameters',
        context.requestId
      ),
    };
  }
}

// Rate limiting check (simple in-memory implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

async function checkRateLimit(
  request: NextRequest,
  config: { maxRequests: number; windowMs: number },
  context: RequestContext
): Promise<{ success: boolean; response?: NextResponse<ApiResponse> }> {
  const key = `rate_limit:${context.userId || 'anonymous'}`;
  const now = Date.now();

  const current = rateLimitStore.get(key);
  if (!current || now > current.resetTime) {
    // Reset or initialize rate limit
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return { success: true };
  }

  if (current.count >= config.maxRequests) {
    const retryAfter = Math.ceil((current.resetTime - now) / 1000);
    return {
      success: false,
      response: createInternalErrorResponse(
        'Rate limit exceeded',
        context.requestId
      ),
    };
  }

  // Increment count
  current.count++;
  return { success: true };
}

// Utility function to create middleware with common configurations
export function createAuthMiddleware<T = any>(handler: ApiHandler<T>) {
  return withApiMiddleware(handler, { requireAuth: true });
}

export function createValidationMiddleware<T = any>(
  handler: ApiHandler<T>,
  bodySchema?: z.ZodSchema,
  querySchema?: z.ZodSchema
) {
  return withApiMiddleware(handler, {
    requireAuth: true,
    validateBody: bodySchema,
    validateQuery: querySchema,
  });
}

export function createRateLimitedMiddleware<T = any>(
  handler: ApiHandler<T>,
  maxRequests: number = 100,
  windowMs: number = 60000
) {
  return withApiMiddleware(handler, {
    requireAuth: true,
    rateLimit: { maxRequests, windowMs },
  });
}

// Helper to extract user ID from context
export function getUserIdFromContext(context: RequestContext): string {
  if (!context.userId) {
    throw new Error('User ID not available in context');
  }
  return context.userId;
}

// Helper to get request ID from headers
export function getRequestIdFromHeaders(headers: Headers): string | undefined {
  return headers.get('X-Request-ID') || undefined;
}
