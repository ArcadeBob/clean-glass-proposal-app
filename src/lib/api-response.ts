import { NextResponse } from 'next/server';
import { z } from 'zod';

// Standard API response schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional(),
  errors: z
    .array(
      z.object({
        field: z.string().optional(),
        message: z.string(),
      })
    )
    .optional(),
  timestamp: z.string().optional(),
  requestId: z.string().optional(),
});

export const PaginatedResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.any()),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean(),
  }),
  message: z.string().optional(),
});

// Response types
export type ApiResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{ field?: string; message: string }>;
  timestamp?: string;
  requestId?: string;
};

export type PaginatedApiResponse<T = any> = {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  message?: string;
  timestamp?: string;
};

// Standard HTTP status codes
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Standard error messages
export const ErrorMessages = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  RATE_LIMITED: 'Too many requests',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  CONFLICT: 'Resource conflict',
} as const;

// Success response helpers
export function createSuccessResponse<T>(
  data?: T,
  message?: string,
  status: number = HttpStatus.OK
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    timestamp: new Date().toISOString(),
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (message) {
    response.message = message;
  }

  return NextResponse.json(response, { status });
}

export function createCreatedResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiResponse<T>> {
  return createSuccessResponse(data, message, HttpStatus.CREATED);
}

export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  },
  message?: string
): NextResponse<PaginatedApiResponse<T>> {
  const response: PaginatedApiResponse<T> = {
    success: true,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  };

  if (message) {
    response.message = message;
  }

  return NextResponse.json(response);
}

// Error response helpers
export function createErrorResponse(
  message: string,
  status: number = HttpStatus.INTERNAL_SERVER_ERROR,
  errors?: Array<{ field?: string; message: string }>,
  requestId?: string
): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  if (requestId) {
    response.requestId = requestId;
  }

  return NextResponse.json(response, { status });
}

// Standard error responses
export function createUnauthorizedResponse(
  message: string = ErrorMessages.UNAUTHORIZED,
  requestId?: string
): NextResponse<ApiResponse> {
  return createErrorResponse(
    message,
    HttpStatus.UNAUTHORIZED,
    undefined,
    requestId
  );
}

export function createForbiddenResponse(
  message: string = ErrorMessages.FORBIDDEN,
  requestId?: string
): NextResponse<ApiResponse> {
  return createErrorResponse(
    message,
    HttpStatus.FORBIDDEN,
    undefined,
    requestId
  );
}

export function createNotFoundResponse(
  message: string = ErrorMessages.NOT_FOUND,
  requestId?: string
): NextResponse<ApiResponse> {
  return createErrorResponse(
    message,
    HttpStatus.NOT_FOUND,
    undefined,
    requestId
  );
}

export function createValidationErrorResponse(
  errors: Array<{ field?: string; message: string }>,
  message: string = ErrorMessages.VALIDATION_ERROR,
  requestId?: string
): NextResponse<ApiResponse> {
  return createErrorResponse(
    message,
    HttpStatus.BAD_REQUEST,
    errors,
    requestId
  );
}

export function createConflictResponse(
  message: string = ErrorMessages.CONFLICT,
  requestId?: string
): NextResponse<ApiResponse> {
  return createErrorResponse(
    message,
    HttpStatus.CONFLICT,
    undefined,
    requestId
  );
}

export function createRateLimitResponse(
  message: string = ErrorMessages.RATE_LIMITED,
  retryAfter?: number,
  requestId?: string
): NextResponse<ApiResponse> {
  const headers: Record<string, string> = {};
  if (retryAfter) {
    headers['Retry-After'] = retryAfter.toString();
  }

  const response = createErrorResponse(
    message,
    HttpStatus.TOO_MANY_REQUESTS,
    undefined,
    requestId
  );

  // Add rate limit headers
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export function createInternalErrorResponse(
  message: string = ErrorMessages.INTERNAL_ERROR,
  requestId?: string
): NextResponse<ApiResponse> {
  return createErrorResponse(
    message,
    HttpStatus.INTERNAL_SERVER_ERROR,
    undefined,
    requestId
  );
}

// Zod validation error helper
export function createZodValidationErrorResponse(
  zodError: z.ZodError,
  message: string = ErrorMessages.VALIDATION_ERROR,
  requestId?: string
): NextResponse<ApiResponse> {
  const errors = zodError.errors.map(error => ({
    field: error.path.join('.'),
    message: error.message,
  }));

  return createValidationErrorResponse(errors, message, requestId);
}

// Database error helper
export function createDatabaseErrorResponse(
  error: any,
  requestId?: string
): NextResponse<ApiResponse> {
  // Handle known database error types
  if (error.code) {
    switch (error.code) {
      case 'P2002':
        return createConflictResponse(
          'A record with this unique field already exists',
          requestId
        );
      case 'P2003':
        return createValidationErrorResponse(
          [{ message: 'Foreign key constraint failed' }],
          'Invalid reference',
          requestId
        );
      case 'P2025':
        return createNotFoundResponse('Record not found', requestId);
      case 'P2007':
        return createValidationErrorResponse(
          [{ message: 'Data validation failed' }],
          'Invalid data format',
          requestId
        );
    }
  }

  // Fallback to internal error
  return createInternalErrorResponse('Database operation failed', requestId);
}

// Request ID generator (simple implementation)
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Response validation helper
export function validateApiResponse(response: any): boolean {
  try {
    ApiResponseSchema.parse(response);
    return true;
  } catch {
    return false;
  }
}

// Middleware helper for consistent error handling
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  requestId?: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        requestId,
        timestamp: new Date().toISOString(),
      });

      // Re-throw to let the calling function handle it
      throw error;
    }
  };
}
