import { Cache } from '../lib/cache';
import { RateLimiterCore } from '../lib/rate-limiting-core';

describe('Rate Limiting System', () => {
  let testCache: Cache;
  let testRateLimiter: RateLimiterCore;

  beforeEach(() => {
    testCache = new Cache({ ttl: 1000, maxSize: 100 });
    testRateLimiter = new RateLimiterCore(testCache, {
      windowMs: 1000, // 1 second for testing
      maxRequests: 3,
      exponentialBackoff: {
        enabled: true,
        baseDelay: 100,
        maxDelay: 1000,
        factor: 2,
      },
    });
  });

  afterEach(() => {
    testCache.clear();
  });

  describe('RateLimiterCore Class', () => {
    it('should allow requests within limit', async () => {
      const key = testRateLimiter.generateKey('test-ip');

      // First request should be allowed
      const result1 = await testRateLimiter.checkRateLimit(key);
      expect(result1.isLimited).toBe(false);
      expect(result1.remaining).toBe(3);

      // Record the request
      await testRateLimiter.recordRequest(key, true);

      // Second request should still be allowed
      const result2 = await testRateLimiter.checkRateLimit(key);
      expect(result2.isLimited).toBe(false);
      expect(result2.remaining).toBe(2);
    });

    it('should block requests exceeding limit', async () => {
      const key = testRateLimiter.generateKey('test-ip');

      // Make 3 requests (at the limit)
      for (let i = 0; i < 3; i++) {
        await testRateLimiter.recordRequest(key, true);
      }

      // Fourth request should be blocked
      const result = await testRateLimiter.checkRateLimit(key);
      expect(result.isLimited).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('should reset after window expires', async () => {
      const key = testRateLimiter.generateKey('test-ip');

      // Make 3 requests
      for (let i = 0; i < 3; i++) {
        await testRateLimiter.recordRequest(key, true);
      }

      // Should be blocked
      let result = await testRateLimiter.checkRateLimit(key);
      expect(result.isLimited).toBe(true);

      // Wait for window to expire (1 second)
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be allowed again
      result = await testRateLimiter.checkRateLimit(key);
      expect(result.isLimited).toBe(false);
      expect(result.remaining).toBe(3);
    });

    it('should apply exponential backoff for failed requests', async () => {
      const key = testRateLimiter.generateKey('test-ip');

      // Make 3 failed requests
      for (let i = 0; i < 3; i++) {
        await testRateLimiter.recordRequest(key, false);
      }

      // Should be blocked with exponential backoff
      const result = await testRateLimiter.checkRateLimit(key);
      expect(result.isLimited).toBe(true);
      expect(result.blockedUntil).toBeDefined();
      expect(result.retryAfter).toBeDefined();
    });

    it('should reset backoff after successful request', async () => {
      const key = testRateLimiter.generateKey('test-ip');

      // Make 2 failed requests
      await testRateLimiter.recordRequest(key, false);
      await testRateLimiter.recordRequest(key, false);

      // Should have backoff
      let result = await testRateLimiter.checkRateLimit(key);
      expect(result.blockedUntil).toBeDefined();

      // Make a successful request
      await testRateLimiter.recordRequest(key, true);

      // Backoff should be reset
      result = await testRateLimiter.checkRateLimit(key);
      expect(result.blockedUntil).toBeUndefined();
    });

    it('should generate different keys for different IPs', async () => {
      const key1 = testRateLimiter.generateKey('192.168.1.1');
      const key2 = testRateLimiter.generateKey('192.168.1.2');

      // Make requests from different IPs
      await testRateLimiter.recordRequest(key1, true);
      await testRateLimiter.recordRequest(key2, true);

      // Both should be allowed (different limits)
      const result1 = await testRateLimiter.checkRateLimit(key1);
      const result2 = await testRateLimiter.checkRateLimit(key2);

      expect(result1.isLimited).toBe(false);
      expect(result2.isLimited).toBe(false);
      expect(result1.remaining).toBe(2);
      expect(result2.remaining).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests', async () => {
      const key = testRateLimiter.generateKey('test-ip');

      // Simulate concurrent requests
      const promises = Array(5)
        .fill(null)
        .map(() => testRateLimiter.recordRequest(key, true));

      await Promise.all(promises);

      const result = await testRateLimiter.checkRateLimit(key);
      expect(result.isLimited).toBe(true);
    });

    it('should handle cache expiration gracefully', async () => {
      const shortCache = new Cache({ ttl: 50, maxSize: 10 });
      const shortRateLimiter = new RateLimiterCore(shortCache, {
        windowMs: 100,
        maxRequests: 2,
        exponentialBackoff: {
          enabled: false,
          baseDelay: 1000,
          maxDelay: 300000,
          factor: 2,
        },
      });

      const key = shortRateLimiter.generateKey('test-ip');

      // Make a request
      await shortRateLimiter.recordRequest(key, true);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should reset
      const result = await shortRateLimiter.checkRateLimit(key);
      expect(result.isLimited).toBe(false);
    });

    it('should generate proper keys', () => {
      const key = testRateLimiter.generateKey('test-identifier');
      expect(key).toBe('rate-limit:test-identifier');
    });

    it('should return configuration', () => {
      const config = testRateLimiter.getConfig();
      expect(config.maxRequests).toBe(3);
      expect(config.windowMs).toBe(1000);
      expect(config.exponentialBackoff?.enabled).toBe(true);
    });
  });
});
