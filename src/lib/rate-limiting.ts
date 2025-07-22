import { NextRequest, NextResponse } from 'next/server';
import { RateLimitResult, RateLimiterCore } from './rate-limiting-core';

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Skip rate limiting for successful requests
  skipFailedRequests?: boolean; // Skip rate limiting for failed requests
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
  handler?: (request: NextRequest) => NextResponse; // Custom handler for rate limit exceeded
  exponentialBackoff?: {
    enabled: boolean;
    baseDelay: number; // Base delay in milliseconds
    maxDelay: number; // Maximum delay in milliseconds
    factor: number; // Exponential factor
  };
}

/**
 * Rate limiting middleware class
 */
export class RateLimiter {
  private core: RateLimiterCore;
  private config: RateLimitConfig;

  constructor(cache: any, config: RateLimitConfig) {
    this.core = new RateLimiterCore(cache, config);
    this.config = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      exponentialBackoff: {
        enabled: true,
        baseDelay: 1000, // 1 second
        maxDelay: 300000, // 5 minutes
        factor: 2,
      },
      ...config,
    };
  }

  /**
   * Generate rate limit key from request
   */
  private generateKey(request: NextRequest): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(request);
    }

    const ip = this.getClientIP(request);
    const path = request.nextUrl.pathname;
    const method = request.method;

    return this.core.generateKey(`${ip}:${method}:${path}`);
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string {
    // Check for forwarded headers (common in proxy setups)
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    // Check for real IP header
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }

    // Fallback to connection remote address
    return 'unknown';
  }

  /**
   * Check if request is rate limited
   */
  async checkRateLimit(request: NextRequest): Promise<RateLimitResult> {
    const key = this.generateKey(request);
    return await this.core.checkRateLimit(key);
  }

  /**
   * Record a request attempt
   */
  async recordRequest(request: NextRequest, success: boolean): Promise<void> {
    const key = this.generateKey(request);
    await this.core.recordRequest(key, success);
  }

  /**
   * Create rate limiting middleware
   */
  middleware() {
    return async (
      request: NextRequest,
      handler: () => Promise<NextResponse>
    ) => {
      // Check rate limit before processing
      const rateLimit = await this.checkRateLimit(request);

      if (rateLimit.isLimited) {
        if (this.config.handler) {
          return this.config.handler(request);
        }

        return NextResponse.json(
          {
            message: 'Too many requests',
            retryAfter: rateLimit.retryAfter,
            blockedUntil: rateLimit.blockedUntil,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': this.config.maxRequests.toString(),
              'X-RateLimit-Remaining': rateLimit.remaining.toString(),
              'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
              ...(rateLimit.retryAfter && {
                'Retry-After': rateLimit.retryAfter.toString(),
              }),
            },
          }
        );
      }

      // Process request
      const response = await handler();

      // Record the request (success based on status code)
      const success = response.status < 400;
      await this.recordRequest(request, success);

      // Add rate limit headers to response
      response.headers.set(
        'X-RateLimit-Limit',
        this.config.maxRequests.toString()
      );
      response.headers.set(
        'X-RateLimit-Remaining',
        rateLimit.remaining.toString()
      );
      response.headers.set(
        'X-RateLimit-Reset',
        new Date(rateLimit.resetTime).toISOString()
      );

      return response;
    };
  }
}

/**
 * Pre-configured rate limiters for different use cases
 */

// Authentication rate limiter (stricter limits)
export const authRateLimiter = new RateLimiter(
  new (require('./cache').Cache)({ ttl: 15 * 60 * 1000, maxSize: 1000 }), // 15 minutes TTL
  {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    exponentialBackoff: {
      enabled: true,
      baseDelay: 2000, // 2 seconds
      maxDelay: 600000, // 10 minutes
      factor: 2,
    },
  }
);

// Registration rate limiter (very strict)
export const registrationRateLimiter = new RateLimiter(
  new (require('./cache').Cache)({ ttl: 60 * 60 * 1000, maxSize: 500 }), // 1 hour TTL
  {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 attempts per hour
    exponentialBackoff: {
      enabled: true,
      baseDelay: 5000, // 5 seconds
      maxDelay: 1800000, // 30 minutes
      factor: 3,
    },
  }
);

// General API rate limiter (more lenient)
export const apiRateLimiter = new RateLimiter(
  new (require('./cache').Cache)({ ttl: 5 * 60 * 1000, maxSize: 2000 }), // 5 minutes TTL
  {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 100, // 100 requests per 5 minutes
    exponentialBackoff: {
      enabled: false,
      baseDelay: 1000,
      maxDelay: 300000,
      factor: 2,
    },
  }
);

/**
 * Utility function to create rate-limited API route
 */
export function withRateLimit(
  rateLimiter: RateLimiter,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  const middleware = rateLimiter.middleware();
  return async (request: NextRequest) => {
    return middleware(request, () => handler(request));
  };
}

/**
 * Utility function to get rate limit info for a request
 */
export async function getRateLimitInfo(
  rateLimiter: RateLimiter,
  request: NextRequest
) {
  return await rateLimiter.checkRateLimit(request);
}
