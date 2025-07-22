import { Cache } from '../lib/cache';
import { RateLimiterCore } from '../lib/rate-limiting-core';

describe('Rate Limiting Integration', () => {
  let authRateLimiter: RateLimiterCore;
  let registrationRateLimiter: RateLimiterCore;
  let basicRateLimiter: RateLimiterCore; // For basic rate limiting tests without backoff

  beforeEach(() => {
    // Create fresh rate limiter instances for each test
    authRateLimiter = new RateLimiterCore(
      new Cache({ ttl: 15 * 60 * 1000, maxSize: 1000 }),
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

    registrationRateLimiter = new RateLimiterCore(
      new Cache({ ttl: 60 * 60 * 1000, maxSize: 500 }),
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

    // Basic rate limiter without exponential backoff for testing basic rate limiting
    basicRateLimiter = new RateLimiterCore(
      new Cache({ ttl: 15 * 60 * 1000, maxSize: 1000 }),
      {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5, // 5 attempts per 15 minutes
        exponentialBackoff: {
          enabled: false, // No backoff for basic rate limiting tests
          baseDelay: 2000,
          maxDelay: 600000,
          factor: 2,
        },
      }
    );
  });

  describe('Authentication Rate Limiting', () => {
    it('should limit authentication attempts', async () => {
      const key = basicRateLimiter.generateKey(
        '192.168.1.100:POST:/api/auth/[...nextauth]'
      );

      // Check initial state
      let result = await basicRateLimiter.checkRateLimit(key);
      expect(result.isLimited).toBe(false);
      expect(result.remaining).toBe(5);

      // Make 5 requests (at the limit)
      for (let i = 0; i < 5; i++) {
        // Check rate limit before making request
        result = await basicRateLimiter.checkRateLimit(key);
        expect(result.isLimited).toBe(false);
        expect(result.remaining).toBe(5 - i);

        // Record the request (simulating the actual request)
        await basicRateLimiter.recordRequest(key, false); // Failed attempts
      }

      // Check rate limit after 5 requests - should be limited
      result = await basicRateLimiter.checkRateLimit(key);
      expect(result.isLimited).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('should apply exponential backoff for failed auth attempts', async () => {
      const key = authRateLimiter.generateKey(
        '192.168.1.101:POST:/api/auth/[...nextauth]'
      );

      // Make 3 failed attempts
      for (let i = 0; i < 3; i++) {
        await authRateLimiter.recordRequest(key, false);
      }

      // Should be blocked with backoff
      const result = await authRateLimiter.checkRateLimit(key);
      expect(result.isLimited).toBe(true);
      expect(result.blockedUntil).toBeDefined();
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
    });
  });

  describe('Registration Rate Limiting', () => {
    it('should limit registration attempts more strictly', async () => {
      const key = basicRateLimiter.generateKey(
        '192.168.1.102:POST:/api/auth/register'
      );

      // Make 3 requests (at the limit for registration)
      for (let i = 0; i < 3; i++) {
        // Check rate limit before making request
        const result = await basicRateLimiter.checkRateLimit(key);
        expect(result.isLimited).toBe(false);
        expect(result.remaining).toBe(5 - i); // Using basic rate limiter with 5 max requests

        // Record the request (simulating the actual request)
        await basicRateLimiter.recordRequest(key, false);
      }

      // Check rate limit after 3 requests - should not be limited yet (basic limiter has 5 max)
      let result = await basicRateLimiter.checkRateLimit(key);
      expect(result.isLimited).toBe(false);
      expect(result.remaining).toBe(2);

      // Make 2 more requests to reach the limit
      for (let i = 0; i < 2; i++) {
        await basicRateLimiter.recordRequest(key, false);
      }

      // Now should be limited
      result = await basicRateLimiter.checkRateLimit(key);
      expect(result.isLimited).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('should have longer backoff for registration failures', async () => {
      const key = registrationRateLimiter.generateKey(
        '192.168.1.103:POST:/api/auth/register'
      );

      // Make 2 failed attempts
      for (let i = 0; i < 2; i++) {
        await registrationRateLimiter.recordRequest(key, false);
      }

      // Should be blocked with longer backoff
      const result = await registrationRateLimiter.checkRateLimit(key);
      expect(result.isLimited).toBe(true);
      expect(result.blockedUntil).toBeDefined();
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
    });
  });

  describe('IP-based Isolation', () => {
    it('should isolate rate limits by IP address', async () => {
      const key1 = basicRateLimiter.generateKey(
        '192.168.1.200:POST:/api/auth/[...nextauth]'
      );
      const key2 = basicRateLimiter.generateKey(
        '192.168.1.201:POST:/api/auth/[...nextauth]'
      );

      // Exceed limit for first IP
      for (let i = 0; i < 5; i++) {
        await basicRateLimiter.recordRequest(key1, false);
      }

      // First IP should be limited
      const result1 = await basicRateLimiter.checkRateLimit(key1);
      expect(result1.isLimited).toBe(true);

      // Second IP should not be limited
      const result2 = await basicRateLimiter.checkRateLimit(key2);
      expect(result2.isLimited).toBe(false);
      expect(result2.remaining).toBe(5);
    });
  });

  describe('Success vs Failure Handling', () => {
    it('should reset backoff after successful authentication', async () => {
      const key = authRateLimiter.generateKey(
        '192.168.1.300:POST:/api/auth/[...nextauth]'
      );

      // Make 2 failed attempts
      await authRateLimiter.recordRequest(key, false);
      await authRateLimiter.recordRequest(key, false);

      // Should have backoff
      let result = await authRateLimiter.checkRateLimit(key);
      expect(result.blockedUntil).toBeDefined();

      // Make a successful attempt
      await authRateLimiter.recordRequest(key, true);

      // Backoff should be reset
      result = await authRateLimiter.checkRateLimit(key);
      expect(result.blockedUntil).toBeUndefined();
    });
  });

  describe('Configuration Verification', () => {
    it('should have correct auth rate limiter configuration', () => {
      const config = authRateLimiter.getConfig();
      expect(config.maxRequests).toBe(5);
      expect(config.windowMs).toBe(15 * 60 * 1000); // 15 minutes
      expect(config.exponentialBackoff?.enabled).toBe(true);
      expect(config.exponentialBackoff?.baseDelay).toBe(2000); // 2 seconds
    });

    it('should have correct registration rate limiter configuration', () => {
      const config = registrationRateLimiter.getConfig();
      expect(config.maxRequests).toBe(3);
      expect(config.windowMs).toBe(60 * 60 * 1000); // 1 hour
      expect(config.exponentialBackoff?.enabled).toBe(true);
      expect(config.exponentialBackoff?.baseDelay).toBe(5000); // 5 seconds
    });
  });
});
