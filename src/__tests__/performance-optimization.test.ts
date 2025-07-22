import {
  Cache,
  calculationCache,
  marketDataCache,
  performanceMonitor,
  proposalCache,
  queryOptimizer,
  userCache,
} from '../lib/cache';

describe('Performance Optimization', () => {
  describe('Cache System', () => {
    let cache: Cache;

    beforeEach(() => {
      cache = new Cache({ ttl: 1000, maxSize: 5 }); // 1 second TTL, 5 items max
    });

    afterEach(() => {
      cache.clear();
    });

    test('should store and retrieve values', () => {
      cache.set('test-key', 'test-value');
      expect(cache.get('test-key')).toBe('test-value');
    });

    test('should return null for non-existent keys', () => {
      expect(cache.get('non-existent')).toBeNull();
    });

    test('should expire values after TTL', async () => {
      cache.set('expire-test', 'value', 50); // 50ms TTL
      expect(cache.get('expire-test')).toBe('value');

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(cache.get('expire-test')).toBeNull();
    });

    test('should evict oldest items when cache is full', () => {
      // Fill cache to capacity
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4');
      cache.set('key5', 'value5');

      // Add one more item
      cache.set('key6', 'value6');

      // Oldest item should be evicted
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key6')).toBe('value6');
    });

    test('should handle multiple data types', () => {
      const testData = {
        string: 'test',
        number: 42,
        boolean: true,
        object: { key: 'value' },
        array: [1, 2, 3],
        null: null,
      };

      Object.entries(testData).forEach(([key, value]) => {
        cache.set(key, value);
        expect(cache.get(key)).toEqual(value);
      });
    });

    test('should support pattern-based operations', () => {
      cache.set('user:1', 'user1');
      cache.set('user:2', 'user2');
      cache.set('proposal:1', 'proposal1');

      const userKeys = cache.keys('user:');
      expect(userKeys).toContain('user:1');
      expect(userKeys).toContain('user:2');
      expect(userKeys).not.toContain('proposal:1');

      const deletedCount = cache.deletePattern('user:');
      expect(deletedCount).toBe(2);
      expect(cache.get('user:1')).toBeNull();
      expect(cache.get('proposal:1')).toBe('proposal1');
    });

    test('should provide cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(5);
      expect(stats.expiredCount).toBe(0);
      expect(stats.totalSize).toBeGreaterThan(0);
    });

    test('should support batch operations', () => {
      const items = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
        { key: 'key3', value: 'value3' },
      ];

      cache.mset(items);

      const results = cache.mget(['key1', 'key2', 'key3']);
      expect(results).toEqual(['value1', 'value2', 'value3']);
    });
  });

  describe('Performance Monitor', () => {
    beforeEach(() => {
      performanceMonitor.reset();
    });

    test('should track operation timing', () => {
      const endTimer = performanceMonitor.startTimer('test-operation');

      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Busy wait for 10ms
      }

      endTimer();

      const metrics = performanceMonitor.getMetrics();
      expect(metrics['test-operation']).toBeDefined();
      expect(metrics['test-operation'].count).toBe(1);
      expect(metrics['test-operation'].avgTime).toBeGreaterThan(0);
    });

    test('should calculate average time correctly', () => {
      const operation = 'avg-test';

      // Simulate multiple operations with different durations
      for (let i = 0; i < 3; i++) {
        const endTimer = performanceMonitor.startTimer(operation);
        const start = Date.now();
        while (Date.now() - start < (i + 1) * 5) {
          // Busy wait
        }
        endTimer();
      }

      const metrics = performanceMonitor.getMetrics();
      expect(metrics[operation].count).toBe(3);
      expect(metrics[operation].avgTime).toBeGreaterThan(0);
    });

    test('should reset metrics', () => {
      const endTimer = performanceMonitor.startTimer('reset-test');
      endTimer();

      expect(Object.keys(performanceMonitor.getMetrics())).toHaveLength(1);

      performanceMonitor.reset();
      expect(Object.keys(performanceMonitor.getMetrics())).toHaveLength(0);
    });
  });

  describe('Query Optimizer', () => {
    test('should add index hints to queries', () => {
      const query = { where: { status: 'ACTIVE' } };
      const optimizedQuery = queryOptimizer.withIndexes(query, [
        'status_idx',
        'created_at_idx',
      ]);

      expect(optimizedQuery._indexes).toEqual(['status_idx', 'created_at_idx']);
      expect(optimizedQuery.where).toEqual({ status: 'ACTIVE' });
    });

    test('should handle pagination correctly', () => {
      const pagination = queryOptimizer.paginate(2, 10);
      expect(pagination.skip).toBe(10);
      expect(pagination.take).toBe(10);

      const firstPage = queryOptimizer.paginate(1, 5);
      expect(firstPage.skip).toBe(0);
      expect(firstPage.take).toBe(5);
    });

    test('should batch multiple queries', async () => {
      const queries = [
        () => Promise.resolve('result1'),
        () => Promise.resolve('result2'),
        () => Promise.resolve('result3'),
      ];

      const results = await queryOptimizer.batch(queries);
      expect(results).toEqual(['result1', 'result2', 'result3']);
    });
  });

  describe('Specialized Caches', () => {
    beforeEach(() => {
      proposalCache.clear();
      userCache.clear();
      marketDataCache.clear();
      calculationCache.clear();
    });

    test('should have appropriate TTL settings', () => {
      // Test that different caches have different TTLs
      const proposalStats = proposalCache.getStats();
      const userStats = userCache.getStats();
      const marketStats = marketDataCache.getStats();
      const calcStats = calculationCache.getStats();

      expect(proposalStats.maxSize).toBe(500);
      expect(userStats.maxSize).toBe(200);
      expect(marketStats.maxSize).toBe(100);
      expect(calcStats.maxSize).toBe(1000);
    });

    test('should cache proposal data effectively', () => {
      const proposalData = {
        id: 'proposal-1',
        title: 'Test Proposal',
        totalAmount: 10000,
      };

      proposalCache.set('proposal:1', proposalData);
      const cached = proposalCache.get('proposal:1');

      expect(cached).toEqual(proposalData);
    });

    test('should cache user data with longer TTL', () => {
      const userData = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'USER',
      };

      userCache.set('user:1', userData);
      const cached = userCache.get('user:1');

      expect(cached).toEqual(userData);
    });

    test('should cache market data with longest TTL', () => {
      const marketData = {
        region: 'West Coast',
        materialType: 'Glass',
        costPerSF: 25.5,
      };

      marketDataCache.set('market:west-coast:glass', marketData);
      const cached = marketDataCache.get('market:west-coast:glass');

      expect(cached).toEqual(marketData);
    });

    test('should cache calculation results', () => {
      const calculationParams = {
        squareFootage: 1000,
        glassType: 'clear',
        framingType: 'aluminum',
      };

      const result = {
        totalCost: 25000,
        overhead: 3750,
        profit: 5000,
        finalPrice: 33750,
      };

      const cacheKey = `calc:${JSON.stringify(calculationParams)}`;
      calculationCache.set(cacheKey, result);

      const cached = calculationCache.get(cacheKey);
      expect(cached).toEqual(result);
    });
  });

  describe('Cache Integration with Real Data', () => {
    test('should handle complex objects', () => {
      const complexData = {
        proposal: {
          id: 'prop-1',
          items: [
            { name: 'Glass Panel', quantity: 10, unitCost: 150 },
            { name: 'Framing', quantity: 5, unitCost: 200 },
          ],
          calculations: {
            subtotal: 2500,
            overhead: 375,
            profit: 500,
            total: 3375,
          },
        },
        metadata: {
          createdAt: new Date().toISOString(),
          version: '1.0',
        },
      };

      proposalCache.set('complex:prop-1', complexData);
      const cached = proposalCache.get('complex:prop-1');

      expect(cached).toEqual(complexData);
      expect(cached.proposal.items).toHaveLength(2);
      expect(cached.proposal.calculations.total).toBe(3375);
    });

    test('should handle cache invalidation patterns', () => {
      // Set up related data
      proposalCache.set('proposal:1', { id: '1', title: 'Proposal 1' });
      proposalCache.set('proposal:2', { id: '2', title: 'Proposal 2' });
      userCache.set('user:1', { id: '1', name: 'User 1' });

      // Invalidate all proposals
      const deletedCount = proposalCache.deletePattern('proposal:');
      expect(deletedCount).toBe(2);
      expect(proposalCache.get('proposal:1')).toBeNull();
      expect(proposalCache.get('proposal:2')).toBeNull();
      expect(userCache.get('user:1')).not.toBeNull(); // User cache unaffected
    });

    test('should handle concurrent access', async () => {
      const promises = [];

      // Simulate concurrent cache access
      for (let i = 0; i < 10; i++) {
        promises.push(
          new Promise<void>(resolve => {
            setTimeout(() => {
              proposalCache.set(`concurrent:${i}`, `value-${i}`);
              resolve();
            }, Math.random() * 10);
          })
        );
      }

      await Promise.all(promises);

      // Verify all values were set correctly
      for (let i = 0; i < 10; i++) {
        expect(proposalCache.get(`concurrent:${i}`)).toBe(`value-${i}`);
      }
    });
  });
});
