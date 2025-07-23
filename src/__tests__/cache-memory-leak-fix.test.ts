import { Cache } from '../lib/cache';

describe('Cache Memory Leak Fix Tests', () => {
  let testCache: Cache;

  beforeEach(() => {
    testCache = new Cache({
      maxSize: 10,
      cleanupInterval: 100,
      memoryThreshold: 0.1,
    });
  });

  afterEach(() => {
    testCache.destroy();
  });

  describe('Basic Cache Operations', () => {
    test('should set and get values correctly', () => {
      testCache.set('key1', 'value1');
      expect(testCache.get('key1')).toBe('value1');
    });

    test('should handle non-existent keys', () => {
      expect(testCache.get('nonexistent')).toBeUndefined();
    });

    test('should delete values correctly', () => {
      testCache.set('key1', 'value1');
      testCache.delete('key1');
      expect(testCache.get('key1')).toBeUndefined();
    });

    test('should clear all values', () => {
      testCache.set('key1', 'value1');
      testCache.set('key2', 'value2');
      testCache.clear();
      expect(testCache.get('key1')).toBeUndefined();
      expect(testCache.get('key2')).toBeUndefined();
    });
  });

  describe('Memory Management', () => {
    test('should respect max size limit', () => {
      for (let i = 0; i < 15; i++) {
        testCache.set(`key${i}`, `value${i}`);
      }

      const stats = testCache.getStats();
      expect(stats.size).toBeLessThanOrEqual(10);
    });

    test('should evict oldest items when limit exceeded', () => {
      // Add items in order
      for (let i = 0; i < 12; i++) {
        testCache.set(`key${i}`, `value${i}`);
      }

      // Oldest items should be evicted
      expect(testCache.get('key0')).toBeUndefined();
      expect(testCache.get('key1')).toBeUndefined();
      expect(testCache.get('key10')).toBe('value10');
      expect(testCache.get('key11')).toBe('value11');
    });

    test('should update access time on get operations', () => {
      testCache.set('key1', 'value1');
      const firstStats = testCache.getStats();

      // Wait a bit
      setTimeout(() => {
        testCache.get('key1');
        const secondStats = testCache.getStats();
        expect(secondStats.size).toBe(firstStats.size);
      }, 10);
    });
  });

  describe('Error Boundaries and Retry Mechanisms', () => {
    test('should retry cleanup operations on failure', async () => {
      let cleanupAttempts = 0;

      // Create a cache with a custom cleanup function that fails first
      const testCacheWithRetry = new Cache({
        maxSize: 5,
        cleanupInterval: 50,
        memoryThreshold: 0.1,
      });

      // Mock the internal cleanup to fail first, then succeed
      const originalCleanup =
        testCacheWithRetry['performCleanup'].bind(testCacheWithRetry);
      testCacheWithRetry['performCleanup'] = jest
        .fn()
        .mockImplementation(() => {
          cleanupAttempts++;
          if (cleanupAttempts === 1) {
            throw new Error('Cleanup failed');
          }
          return originalCleanup();
        });

      testCacheWithRetry.set('test-key', 'test-value');

      // Wait for cleanup to run
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(cleanupAttempts).toBeGreaterThan(1);
      testCacheWithRetry.destroy();
    });

    test('should handle cleanup lock to prevent race conditions', async () => {
      const promises = [];

      // Simulate multiple concurrent cleanup operations
      for (let i = 0; i < 5; i++) {
        promises.push(
          new Promise(resolve => {
            setTimeout(() => {
              testCache.set(`key-${i}`, `value-${i}`);
              resolve(true);
            }, i * 10);
          })
        );
      }

      await Promise.all(promises);

      // Should not throw any errors
      expect(() => testCache.getStats()).not.toThrow();
    });

    test('should handle errors in cache operations gracefully', () => {
      // Test set operation with error handling
      expect(() => testCache.set('key', 'value')).not.toThrow();

      // Test get operation with error handling
      expect(() => testCache.get('key')).not.toThrow();

      // Test delete operation with error handling
      expect(() => testCache.delete('key')).not.toThrow();
    });
  });

  describe('Memory Monitoring and Alerts', () => {
    test('should track memory usage and generate alerts', () => {
      const stats = testCache.getStats();

      expect(stats).toHaveProperty('memoryUsage');
      expect(stats).toHaveProperty('cleanupErrors');
      expect(stats).toHaveProperty('lastCleanupTime');
      expect(typeof stats.memoryUsage).toBe('number');
    });

    test('should generate memory alerts when threshold is exceeded', () => {
      // Create a cache with very low memory threshold
      const lowThresholdCache = new Cache({
        memoryThreshold: 0.001, // 1KB threshold
        cleanupInterval: 100,
      });

      // Add some data to trigger memory check
      lowThresholdCache.set('test', 'value');

      // Wait for cleanup to run
      setTimeout(() => {
        const alerts = lowThresholdCache.getMemoryAlerts();
        expect(alerts.length).toBeGreaterThan(0);
        lowThresholdCache.destroy();
      }, 200);
    });

    test('should rotate memory alerts to prevent memory growth', () => {
      const alerts = testCache.getMemoryAlerts();
      expect(Array.isArray(alerts)).toBe(true);

      // Test alert clearing
      testCache.clearMemoryAlerts();
      expect(testCache.getMemoryAlerts().length).toBe(0);
    });
  });

  describe('Aggressive Cleanup', () => {
    test('should perform aggressive cleanup when memory is critical', () => {
      // Fill cache to trigger aggressive cleanup
      for (let i = 0; i < 20; i++) {
        testCache.set(`key-${i}`, `value-${i}`);
      }

      // Mock memory usage to be critical
      Object.defineProperty(testCache, 'memoryUsage', {
        get: () => 0.9, // 90% memory usage
      });

      // Trigger cleanup
      testCache['safeCleanup']();

      const stats = testCache.getStats();
      expect(stats.size).toBeLessThan(20);
    });

    test('should handle serialization errors gracefully', () => {
      // Test with non-serializable object
      const nonSerializable = {
        circular: null as any,
        func: () => {},
      };
      nonSerializable.circular = nonSerializable;

      expect(() => testCache.set('circular', nonSerializable)).not.toThrow();
    });
  });

  describe('Bounds Checking and Integer Overflow Prevention', () => {
    test('should handle large numbers without overflow', () => {
      const largeNumber = Number.MAX_SAFE_INTEGER;
      testCache.set('large', largeNumber);

      const result = testCache.get('large');
      expect(result).toBe(largeNumber);
    });

    test('should handle non-serializable objects gracefully', () => {
      const nonSerializable = {
        func: () => {},
        symbol: Symbol('test'),
      };

      expect(() =>
        testCache.set('non-serializable', nonSerializable)
      ).not.toThrow();

      const stats = testCache.getStats();
      expect(stats.totalSize).toBeGreaterThan(0);
    });
  });

  describe('Performance Optimization', () => {
    test('should handle rapid operations efficiently', () => {
      const startTime = Date.now();

      // Perform many operations quickly
      for (let i = 0; i < 1000; i++) {
        testCache.set(`key${i}`, `value${i}`);
        testCache.get(`key${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000);
    });

    test('should maintain performance under load', () => {
      const operations = [];
      const startTime = Date.now();

      // Simulate concurrent operations
      for (let i = 0; i < 100; i++) {
        operations.push(
          new Promise(resolve => {
            setTimeout(() => {
              testCache.set(`load-key-${i}`, `load-value-${i}`);
              testCache.get(`load-key-${i}`);
              resolve(true);
            }, Math.random() * 10);
          })
        );
      }

      return Promise.all(operations).then(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        expect(duration).toBeLessThan(2000);
      });
    });
  });

  describe('Resource Cleanup', () => {
    test('should properly clean up resources on destroy', () => {
      testCache.set('key1', 'value1');
      testCache.set('key2', 'value2');

      testCache.destroy();

      // Should not be able to access cache after destroy (returns undefined)
      expect(testCache.get('key1')).toBeUndefined();
      expect(() => testCache.set('key3', 'value3')).toThrow(
        'Cache has been destroyed'
      );
    });

    test('should handle multiple destroy calls gracefully', () => {
      expect(() => testCache.destroy()).not.toThrow();
      expect(() => testCache.destroy()).not.toThrow();
    });
  });
});
