import {
  ApiResponseSchema,
  ErrorMessages,
  HttpStatus,
  PaginatedResponseSchema,
  createCreatedResponse,
  createDatabaseErrorResponse,
  createInternalErrorResponse,
  createPaginatedResponse,
  createSuccessResponse,
  createUnauthorizedResponse,
  createValidationErrorResponse,
  createZodValidationErrorResponse,
} from '@/lib/api-response';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { z } from 'zod';

// Mock NextResponse
const mockNextResponse = {
  json: jest.fn((data, options) => {
    const response = {
      body: JSON.parse(JSON.stringify(data)), // Ensure it's a parsed object
      status: options?.status || 200,
      headers: new Map(Object.entries(options?.headers || {})),
    };
    return response;
  }),
};

jest.mock('next/server', () => ({
  NextResponse: mockNextResponse,
}));

describe('Standardized API Response Format', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Responses', () => {
    it('should create a basic success response', async () => {
      const response = createSuccessResponse({ id: '123', name: 'Test' });
      const bodyText = await response.text();
      const body = JSON.parse(bodyText);

      expect(body).toEqual({
        success: true,
        data: { id: '123', name: 'Test' },
        timestamp: expect.any(String),
      });
      expect(response.status).toBe(HttpStatus.OK);
    });

    it('should create a success response with message', async () => {
      const response = createSuccessResponse(
        { id: '123' },
        'Operation completed successfully'
      );
      const body = await response.json();

      expect(body).toEqual({
        success: true,
        data: { id: '123' },
        message: 'Operation completed successfully',
        timestamp: expect.any(String),
      });
    });

    it('should create a created response with 201 status', async () => {
      const response = createCreatedResponse(
        { id: '123', name: 'New Item' },
        'Item created successfully'
      );
      const body = await response.json();

      expect(body).toEqual({
        success: true,
        data: { id: '123', name: 'New Item' },
        message: 'Item created successfully',
        timestamp: expect.any(String),
      });
      expect(response.status).toBe(HttpStatus.CREATED);
    });

    it('should create a paginated response', async () => {
      const data = [{ id: '1' }, { id: '2' }];
      const pagination = {
        total: 100,
        limit: 10,
        offset: 0,
        hasMore: true,
      };

      const response = createPaginatedResponse(
        data,
        pagination,
        'Items retrieved'
      );
      const body = await response.json();

      expect(body).toEqual({
        success: true,
        data,
        pagination,
        message: 'Items retrieved',
        timestamp: expect.any(String),
      });
      expect(response.status).toBe(HttpStatus.OK);
    });
  });

  describe('Error Responses', () => {
    it('should create an unauthorized response', async () => {
      const response = createUnauthorizedResponse();
      const body = await response.json();

      expect(body).toEqual({
        success: false,
        error: ErrorMessages.UNAUTHORIZED,
        timestamp: expect.any(String),
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should create a validation error response', async () => {
      const errors = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'password', message: 'Password is required' },
      ];

      const response = createValidationErrorResponse(
        errors,
        'Validation failed'
      );
      const body = await response.json();

      expect(body).toEqual({
        success: false,
        error: 'Validation failed',
        errors,
        timestamp: expect.any(String),
      });
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create a database error response for constraint violation', async () => {
      const dbError = {
        code: 'P2002',
        message: 'Unique constraint failed',
      };

      const response = createDatabaseErrorResponse(dbError);
      const body = await response.json();

      expect(body).toEqual({
        success: false,
        error: 'A record with this unique field already exists',
        timestamp: expect.any(String),
      });
      expect(response.status).toBe(HttpStatus.CONFLICT);
    });

    it('should create a database error response for not found', async () => {
      const dbError = {
        code: 'P2025',
        message: 'Record not found',
      };

      const response = createDatabaseErrorResponse(dbError);
      const body = await response.json();

      expect(body).toEqual({
        success: false,
        error: 'Record not found',
        timestamp: expect.any(String),
      });
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('should create an internal error response', async () => {
      const response = createInternalErrorResponse('Something went wrong');
      const body = await response.json();

      expect(body).toEqual({
        success: false,
        error: 'Something went wrong',
        timestamp: expect.any(String),
      });
      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should create a Zod validation error response', async () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      const result = schema.safeParse({ email: 'invalid', age: 15 });
      if (!result.success) {
        const response = createZodValidationErrorResponse(result.error);
        const body = await response.json();

        expect(body).toEqual({
          success: false,
          error: ErrorMessages.VALIDATION_ERROR,
          errors: [
            { field: 'email', message: 'Invalid email' },
            {
              field: 'age',
              message: 'Number must be greater than or equal to 18',
            },
          ],
          timestamp: expect.any(String),
        });
        expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      }
    });
  });

  describe('Response Schema Validation', () => {
    it('should validate success response schema', async () => {
      const response = createSuccessResponse({ test: 'data' });
      const body = await response.json();
      const isValid = ApiResponseSchema.safeParse(body);

      expect(isValid.success).toBe(true);
    });

    it('should validate error response schema', async () => {
      const response = createUnauthorizedResponse();
      const body = await response.json();
      const isValid = ApiResponseSchema.safeParse(body);

      expect(isValid.success).toBe(true);
    });

    it('should validate paginated response schema', async () => {
      const response = createPaginatedResponse([{ id: '1' }, { id: '2' }], {
        total: 2,
        limit: 10,
        offset: 0,
        hasMore: false,
      });
      const body = await response.json();
      const isValid = PaginatedResponseSchema.safeParse(body);

      expect(isValid.success).toBe(true);
    });

    it('should reject invalid response format', () => {
      const invalidResponse = {
        data: { test: 'data' },
        // Missing success field
      };

      const isValid = ApiResponseSchema.safeParse(invalidResponse);
      expect(isValid.success).toBe(false);
    });
  });

  describe('Request ID Support', () => {
    it('should include request ID in error responses', async () => {
      const requestId = 'req_1234567890_abc123';
      const response = createUnauthorizedResponse('Custom message', requestId);
      const body = await response.json();

      expect(body).toEqual({
        success: false,
        error: 'Custom message',
        timestamp: expect.any(String),
        requestId,
      });
    });
  });

  describe('HTTP Status Codes', () => {
    it('should use correct status codes for different scenarios', () => {
      expect(createSuccessResponse({}).status).toBe(HttpStatus.OK);
      expect(createCreatedResponse({}).status).toBe(HttpStatus.CREATED);
      expect(createUnauthorizedResponse().status).toBe(HttpStatus.UNAUTHORIZED);
      expect(createValidationErrorResponse([]).status).toBe(
        HttpStatus.BAD_REQUEST
      );
      expect(createInternalErrorResponse().status).toBe(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    });
  });

  describe('Error Messages', () => {
    it('should use standardized error messages', () => {
      expect(ErrorMessages.UNAUTHORIZED).toBe('Unauthorized access');
      expect(ErrorMessages.FORBIDDEN).toBe('Access forbidden');
      expect(ErrorMessages.NOT_FOUND).toBe('Resource not found');
      expect(ErrorMessages.VALIDATION_ERROR).toBe('Validation failed');
      expect(ErrorMessages.INTERNAL_ERROR).toBe('Internal server error');
    });
  });
});
