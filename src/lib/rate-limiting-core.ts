import { Cache } from './cache';

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Skip rate limiting for successful requests
  skipFailedRequests?: boolean; // Skip rate limiting for failed requests
  exponentialBackoff?: {
    enabled: boolean;
    baseDelay: number; // Base delay in milliseconds
    maxDelay: number; // Maximum delay in milliseconds
    factor: number; // Exponential factor
  };
}

/**
 * Rate limit entry in cache
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
  blockedUntil?: number;
  consecutiveFailures: number;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  isLimited: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  blockedUntil?: number;
}

/**
 * Core rate limiting class (no Next.js dependencies)
 */
export class RateLimiterCore {
  private cache: Cache;
  private config: RateLimitConfig;

  constructor(cache: Cache, config: RateLimitConfig) {
    this.cache = cache;
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
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(consecutiveFailures: number): number {
    if (!this.config.exponentialBackoff?.enabled) {
      return 0;
    }

    const { baseDelay, maxDelay, factor } = this.config.exponentialBackoff;
    const delay = Math.min(
      baseDelay * Math.pow(factor, consecutiveFailures),
      maxDelay
    );

    // Add some randomness to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return delay + jitter;
  }

  /**
   * Check if request is rate limited
   */
  async checkRateLimit(key: string): Promise<RateLimitResult> {
    const now = Date.now();

    // Get current rate limit entry
    const entry = this.cache.get<RateLimitEntry>(key) || {
      count: 0,
      resetTime: now + this.config.windowMs,
      consecutiveFailures: 0,
    };

    // Check if currently blocked due to exponential backoff
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return {
        isLimited: true,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
        blockedUntil: entry.blockedUntil,
      };
    }

    // Reset if window has expired
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + this.config.windowMs;
      entry.consecutiveFailures = 0;
      entry.blockedUntil = undefined;
    }

    // Check if rate limit exceeded
    const isLimited = entry.count >= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - entry.count);

    return {
      isLimited,
      remaining,
      resetTime: entry.resetTime,
      blockedUntil: entry.blockedUntil,
    };
  }

  /**
   * Record a request attempt
   */
  async recordRequest(key: string, success: boolean): Promise<void> {
    const now = Date.now();

    const entry = this.cache.get<RateLimitEntry>(key) || {
      count: 0,
      resetTime: now + this.config.windowMs,
      consecutiveFailures: 0,
    };

    // Reset if window has expired
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + this.config.windowMs;
      entry.consecutiveFailures = 0;
      entry.blockedUntil = undefined;
    }

    // Update counters
    if (success) {
      entry.consecutiveFailures = 0;
      entry.blockedUntil = undefined;

      if (!this.config.skipSuccessfulRequests) {
        entry.count++;
      }
    } else {
      entry.consecutiveFailures++;
      entry.count++;

      // Apply exponential backoff for failures (only after multiple consecutive failures)
      if (
        this.config.exponentialBackoff?.enabled &&
        entry.consecutiveFailures > 1
      ) {
        const backoffDelay = this.calculateBackoffDelay(
          entry.consecutiveFailures
        );
        if (backoffDelay > 0) {
          entry.blockedUntil = now + backoffDelay;
        }
      }
    }

    // Store updated entry
    this.cache.set(key, entry, this.config.windowMs);
  }

  /**
   * Generate a rate limit key
   */
  generateKey(identifier: string): string {
    return `rate-limit:${identifier}`;
  }

  /**
   * Get configuration
   */
  getConfig(): RateLimitConfig {
    return { ...this.config };
  }
}

/**
 * Pre-configured rate limiters for different use cases
 */

// Authentication rate limiter (stricter limits)
export const authRateLimiterCore = new RateLimiterCore(
  new Cache({ ttl: 15 * 60 * 1000, maxSize: 1000 }), // 15 minutes TTL
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
export const registrationRateLimiterCore = new RateLimiterCore(
  new Cache({ ttl: 60 * 60 * 1000, maxSize: 500 }), // 1 hour TTL
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
export const apiRateLimiterCore = new RateLimiterCore(
  new Cache({ ttl: 5 * 60 * 1000, maxSize: 2000 }), // 5 minutes TTL
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
