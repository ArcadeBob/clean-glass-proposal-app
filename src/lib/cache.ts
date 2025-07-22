interface CacheItem<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items in cache
}

export class Cache {
  private store = new Map<string, CacheItem<any>>();
  private readonly defaultTTL: number;
  private readonly maxSize: number;
  private creationCounter = 0;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 1000; // 1000 items default

    // Clean up expired items every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Set a value in the cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);

    // Remove oldest items if cache is full (before adding new item)
    if (this.store.size >= this.maxSize) {
      this.evictOldest();
    }

    this.store.set(key, {
      value,
      expiresAt,
      createdAt: Date.now() + this.creationCounter++,
    });
  }

  /**
   * Get a value from the cache
   */
  get<T>(key: string): T | null {
    const item = this.store.get(key);

    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Check if a key exists in the cache
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a key from the cache
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let totalSize = 0;

    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        expiredCount++;
      }
      totalSize += JSON.stringify(item.value).length;
    }

    return {
      size: this.store.size,
      maxSize: this.maxSize,
      expiredCount,
      totalSize,
      hitRate: this.calculateHitRate(),
    };
  }

  /**
   * Get multiple values at once
   */
  mget<T>(keys: string[]): (T | null)[] {
    return keys.map(key => this.get<T>(key));
  }

  /**
   * Set multiple values at once
   */
  mset<T>(items: Array<{ key: string; value: T; ttl?: number }>): void {
    items.forEach(({ key, value, ttl }) => {
      this.set(key, value, ttl);
    });
  }

  /**
   * Get keys matching a pattern (simple prefix matching)
   */
  keys(pattern: string): string[] {
    const keys: string[] = [];
    for (const key of this.store.keys()) {
      if (key.startsWith(pattern)) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Delete keys matching a pattern
   */
  deletePattern(pattern: string): number {
    const keysToDelete = this.keys(pattern);
    keysToDelete.forEach(key => this.delete(key));
    return keysToDelete.length;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, item] of this.store.entries()) {
      if (item.createdAt < oldestTime) {
        oldestTime = item.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
    }
  }

  private hitRate = { hits: 0, misses: 0 };

  private calculateHitRate(): number {
    const total = this.hitRate.hits + this.hitRate.misses;
    return total === 0 ? 0 : (this.hitRate.hits / total) * 100;
  }
}

// Create cache instances for different purposes
export const proposalCache = new Cache({ ttl: 10 * 60 * 1000, maxSize: 500 }); // 10 minutes
export const userCache = new Cache({ ttl: 30 * 60 * 1000, maxSize: 200 }); // 30 minutes
export const marketDataCache = new Cache({ ttl: 60 * 60 * 1000, maxSize: 100 }); // 1 hour
export const calculationCache = new Cache({
  ttl: 5 * 60 * 1000,
  maxSize: 1000,
}); // 5 minutes

// Cache decorator for functions
export function cached<T extends (...args: any[]) => any>(
  cache: Cache,
  keyGenerator?: (...args: Parameters<T>) => string
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = function (...args: Parameters<T>) {
      const key = keyGenerator
        ? keyGenerator(...args)
        : `${propertyName}:${JSON.stringify(args)}`;

      const cached = cache.get<ReturnType<T>>(key);
      if (cached !== null) {
        return cached;
      }

      const result = method.apply(this, args);
      cache.set(key, result);
      return result;
    };
  };
}

// Cache middleware for API routes
export function withCache<T>(
  cache: Cache,
  keyGenerator: (request: Request) => string,
  ttl?: number
) {
  return function (handler: (request: Request) => Promise<T>) {
    return async function (request: Request): Promise<T> {
      const key = keyGenerator(request);
      const cached = cache.get<T>(key);

      if (cached !== null) {
        return cached;
      }

      const result = await handler(request);
      cache.set(key, result, ttl);
      return result;
    };
  };
}

// Performance monitoring
export class PerformanceMonitor {
  private metrics = new Map<
    string,
    { count: number; totalTime: number; avgTime: number }
  >();

  startTimer(operation: string): () => void {
    const start = performance.now();
    return () => this.endTimer(operation, start);
  }

  private endTimer(operation: string, start: number): void {
    const duration = performance.now() - start;
    const existing = this.metrics.get(operation) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
    };

    existing.count++;
    existing.totalTime += duration;
    existing.avgTime = existing.totalTime / existing.count;

    this.metrics.set(operation, existing);
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  reset() {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Database query optimization utilities
export const queryOptimizer = {
  // Add indexes hint for complex queries
  withIndexes: (query: any, indexes: string[]) => {
    return { ...query, _indexes: indexes };
  },

  // Batch multiple queries
  batch: async <T>(queries: (() => Promise<T>)[]): Promise<T[]> => {
    return Promise.all(queries.map(query => query()));
  },

  // Pagination helper
  paginate: (page: number = 1, limit: number = 10) => {
    const offset = (page - 1) * limit;
    return { skip: offset, take: limit };
  },
};
