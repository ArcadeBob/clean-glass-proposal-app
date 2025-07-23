interface CacheItem<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items in cache
  cleanupInterval?: number; // Cleanup interval in milliseconds
  maxRetries?: number; // Maximum retry attempts for cleanup operations
  memoryThreshold?: number; // Memory usage threshold in MB
}

interface CacheStats {
  size: number;
  maxSize: number;
  expiredCount: number;
  totalSize: number;
  hitRate: number;
  memoryUsage: number;
  cleanupErrors: number;
  lastCleanupTime: number;
}

interface MemoryAlert {
  type: 'warning' | 'critical';
  message: string;
  timestamp: number;
  memoryUsage: number;
}

export class Cache {
  private store = new Map<string, CacheItem<any>>();
  private readonly defaultTTL: number;
  private readonly maxSize: number;
  private readonly cleanupIntervalMs: number;
  private readonly maxRetries: number;
  private readonly memoryThreshold: number;
  private creationCounter = 0;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isDestroyed = false;
  private cleanupErrors = 0;
  private lastCleanupTime = 0;
  private memoryAlerts: MemoryAlert[] = [];
  private readonly maxAlerts = 10;
  private cleanupLock = false;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 1000; // 1000 items default
    this.cleanupIntervalMs = options.cleanupInterval || 60 * 1000; // 1 minute default
    this.maxRetries = options.maxRetries || 3; // 3 retries default
    this.memoryThreshold = options.memoryThreshold || 100; // 100MB default

    // Start cleanup interval with error boundary
    this.startCleanupInterval();
  }

  /**
   * Start the cleanup interval with error handling
   */
  private startCleanupInterval(): void {
    try {
      this.cleanupInterval = setInterval(() => {
        this.safeCleanup();
      }, this.cleanupIntervalMs);
    } catch (error) {
      console.error('Failed to start cleanup interval:', error);
      this.addMemoryAlert(
        'critical',
        `Failed to start cleanup interval: ${error}`
      );
    }
  }

  /**
   * Safe cleanup with error boundaries and retry mechanism
   */
  private async safeCleanup(): Promise<void> {
    if (this.cleanupLock || this.isDestroyed) {
      return;
    }

    this.cleanupLock = true;
    let retryCount = 0;

    while (retryCount < this.maxRetries) {
      try {
        await this.performCleanup();
        this.lastCleanupTime = Date.now();
        this.cleanupErrors = 0; // Reset error count on success
        break;
      } catch (error) {
        retryCount++;
        this.cleanupErrors++;
        console.error(`Cleanup attempt ${retryCount} failed:`, error);

        if (retryCount >= this.maxRetries) {
          this.addMemoryAlert(
            'critical',
            `Cleanup failed after ${this.maxRetries} attempts: ${error}`
          );
        } else {
          // Wait before retry with exponential backoff
          await new Promise(resolve =>
            setTimeout(resolve, Math.pow(2, retryCount) * 1000)
          );
        }
      }
    }

    this.cleanupLock = false;
  }

  /**
   * Perform the actual cleanup operation
   */
  private async performCleanup(): Promise<void> {
    const now = Date.now();
    const keysToDelete: string[] = [];

    // Collect expired keys first to avoid modification during iteration
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        keysToDelete.push(key);
      }
    }

    // Delete expired items
    for (const key of keysToDelete) {
      this.store.delete(key);
    }

    // Check memory usage and trigger alerts if needed
    this.checkMemoryUsage();

    // Force garbage collection if available (Node.js only)
    if (typeof global.gc === 'function') {
      try {
        global.gc();
      } catch (error) {
        // GC might not be available or enabled
      }
    }
  }

  /**
   * Check memory usage and trigger alerts
   */
  private checkMemoryUsage(): void {
    if (typeof process === 'undefined') return;

    try {
      const memUsage = process.memoryUsage();
      const memoryUsageMB = memUsage.heapUsed / 1024 / 1024;

      if (memoryUsageMB > this.memoryThreshold) {
        this.addMemoryAlert(
          'warning',
          `Memory usage high: ${memoryUsageMB.toFixed(2)}MB`
        );
      }

      if (memoryUsageMB > this.memoryThreshold * 2) {
        this.addMemoryAlert(
          'critical',
          `Memory usage critical: ${memoryUsageMB.toFixed(2)}MB`
        );
        // Force aggressive cleanup
        this.aggressiveCleanup();
      }
    } catch (error) {
      console.error('Failed to check memory usage:', error);
    }
  }

  /**
   * Add memory alert with rotation
   */
  private addMemoryAlert(type: 'warning' | 'critical', message: string): void {
    const alert: MemoryAlert = {
      type,
      message,
      timestamp: Date.now(),
      memoryUsage:
        typeof process !== 'undefined'
          ? process.memoryUsage().heapUsed / 1024 / 1024
          : 0,
    };

    this.memoryAlerts.push(alert);

    // Keep only the most recent alerts
    if (this.memoryAlerts.length > this.maxAlerts) {
      this.memoryAlerts = this.memoryAlerts.slice(-this.maxAlerts);
    }

    // Log critical alerts immediately
    if (type === 'critical') {
      console.error(`Cache Memory Alert: ${message}`);
    }
  }

  /**
   * Aggressive cleanup when memory usage is critical
   */
  private aggressiveCleanup(): void {
    try {
      // Remove 50% of oldest items
      const items = Array.from(this.store.entries()).sort(
        ([, a], [, b]) => a.createdAt - b.createdAt
      );

      const itemsToRemove = Math.floor(items.length * 0.5);

      for (let i = 0; i < itemsToRemove; i++) {
        this.store.delete(items[i][0]);
      }
    } catch (error) {
      console.error('Aggressive cleanup failed:', error);
    }
  }

  /**
   * Destroy the cache instance and clean up resources
   */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;

    try {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }
    } catch (error) {
      console.error('Error clearing cleanup interval:', error);
    }

    try {
      this.store.clear();
    } catch (error) {
      console.error('Error clearing cache store:', error);
    }
  }

  /**
   * Set a value in the cache with thread-safe operations
   */
  set<T>(key: string, value: T, ttl?: number): void {
    if (this.isDestroyed) {
      throw new Error('Cache has been destroyed');
    }

    try {
      const expiresAt = Date.now() + (ttl || this.defaultTTL);

      // Remove oldest items if cache is full (before adding new item)
      if (this.store.size >= this.maxSize) {
        this.evictOldest();
      }

      this.store.set(key, {
        value,
        expiresAt,
        createdAt: Date.now() + this.creationCounter++,
        accessCount: 0,
        lastAccessed: Date.now(),
      });
    } catch (error) {
      console.error('Error setting cache value:', error);
      throw error;
    }
  }

  /**
   * Get a value from the cache with access tracking
   */
  get<T>(key: string): T | undefined {
    if (this.isDestroyed) {
      return undefined;
    }

    try {
      const item = this.store.get(key);

      if (!item) {
        return undefined;
      }

      // Check if item has expired
      if (Date.now() > item.expiresAt) {
        this.store.delete(key);
        return undefined;
      }

      // Update access statistics
      item.accessCount++;
      item.lastAccessed = Date.now();

      return item.value;
    } catch (error) {
      console.error('Error getting cache value:', error);
      return undefined;
    }
  }

  /**
   * Check if a key exists in the cache
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete a key from the cache
   */
  delete(key: string): boolean {
    if (this.isDestroyed) {
      return false;
    }

    try {
      return this.store.delete(key);
    } catch (error) {
      console.error('Error deleting cache key:', error);
      return false;
    }
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    if (this.isDestroyed) {
      return;
    }

    try {
      this.store.clear();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics with memory monitoring
   */
  getStats(): CacheStats {
    if (this.isDestroyed) {
      return {
        size: 0,
        maxSize: this.maxSize,
        expiredCount: 0,
        totalSize: 0,
        hitRate: 0,
        memoryUsage: 0,
        cleanupErrors: this.cleanupErrors,
        lastCleanupTime: this.lastCleanupTime,
      };
    }

    try {
      const now = Date.now();
      let expiredCount = 0;
      let totalSize = 0;
      let memoryUsage = 0;

      // Calculate memory usage safely
      if (typeof process !== 'undefined') {
        memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
      }

      // Calculate total size with bounds checking
      for (const [key, item] of this.store.entries()) {
        if (now > item.expiresAt) {
          expiredCount++;
        }

        try {
          const itemSize = JSON.stringify(item.value).length;
          // Prevent integer overflow
          if (totalSize + itemSize < Number.MAX_SAFE_INTEGER) {
            totalSize += itemSize;
          } else {
            totalSize = Number.MAX_SAFE_INTEGER;
            break;
          }
        } catch (error) {
          // Skip items that can't be serialized
          console.warn('Failed to calculate size for cache item:', error);
        }
      }

      return {
        size: this.store.size,
        maxSize: this.maxSize,
        expiredCount,
        totalSize,
        hitRate: this.calculateHitRate(),
        memoryUsage,
        cleanupErrors: this.cleanupErrors,
        lastCleanupTime: this.lastCleanupTime,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        size: 0,
        maxSize: this.maxSize,
        expiredCount: 0,
        totalSize: 0,
        hitRate: 0,
        memoryUsage: 0,
        cleanupErrors: this.cleanupErrors,
        lastCleanupTime: this.lastCleanupTime,
      };
    }
  }

  /**
   * Get memory alerts
   */
  getMemoryAlerts(): MemoryAlert[] {
    return [...this.memoryAlerts];
  }

  /**
   * Clear memory alerts
   */
  clearMemoryAlerts(): void {
    this.memoryAlerts = [];
  }

  /**
   * Get multiple values at once
   */
  mget<T>(keys: string[]): (T | undefined)[] {
    if (this.isDestroyed) {
      return keys.map(() => undefined);
    }

    try {
      return keys.map(key => this.get<T>(key));
    } catch (error) {
      console.error('Error in mget operation:', error);
      return keys.map(() => undefined);
    }
  }

  /**
   * Set multiple values at once
   */
  mset<T>(items: Array<{ key: string; value: T; ttl?: number }>): void {
    if (this.isDestroyed) {
      throw new Error('Cache has been destroyed');
    }

    try {
      items.forEach(({ key, value, ttl }) => {
        this.set(key, value, ttl);
      });
    } catch (error) {
      console.error('Error in mset operation:', error);
      throw error;
    }
  }

  /**
   * Get keys matching a pattern (simple prefix matching)
   */
  keys(pattern: string): string[] {
    if (this.isDestroyed) {
      return [];
    }

    try {
      const keys: string[] = [];
      for (const key of this.store.keys()) {
        if (key.startsWith(pattern)) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      console.error('Error getting cache keys:', error);
      return [];
    }
  }

  /**
   * Delete keys matching a pattern
   */
  deletePattern(pattern: string): number {
    if (this.isDestroyed) {
      return 0;
    }

    try {
      const keysToDelete = this.keys(pattern);
      keysToDelete.forEach(key => this.delete(key));
      return keysToDelete.length;
    } catch (error) {
      console.error('Error deleting cache pattern:', error);
      return 0;
    }
  }

  private evictOldest(): void {
    if (this.isDestroyed) {
      return;
    }

    try {
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
    } catch (error) {
      console.error('Error evicting oldest cache item:', error);
    }
  }

  private hitRate = { hits: 0, misses: 0 };

  private calculateHitRate(): number {
    try {
      const total = this.hitRate.hits + this.hitRate.misses;
      return total === 0 ? 0 : (this.hitRate.hits / total) * 100;
    } catch (error) {
      console.error('Error calculating hit rate:', error);
      return 0;
    }
  }
}

// Create cache instances for different purposes with enhanced options
export const proposalCache = new Cache({
  ttl: 10 * 60 * 1000,
  maxSize: 500,
  cleanupInterval: 60 * 1000,
  maxRetries: 3,
  memoryThreshold: 50,
});

export const userCache = new Cache({
  ttl: 30 * 60 * 1000,
  maxSize: 200,
  cleanupInterval: 60 * 1000,
  maxRetries: 3,
  memoryThreshold: 30,
});

export const marketDataCache = new Cache({
  ttl: 60 * 60 * 1000,
  maxSize: 100,
  cleanupInterval: 60 * 1000,
  maxRetries: 3,
  memoryThreshold: 20,
});

export const calculationCache = new Cache({
  ttl: 5 * 60 * 1000,
  maxSize: 1000,
  cleanupInterval: 60 * 1000,
  maxRetries: 3,
  memoryThreshold: 100,
});

/**
 * Global cleanup function to destroy all cache instances with error handling
 */
export function cleanupAllCaches(): void {
  const caches = [proposalCache, userCache, marketDataCache, calculationCache];

  caches.forEach((cache, index) => {
    try {
      cache.destroy();
    } catch (error) {
      console.error(`Failed to destroy cache ${index}:`, error);
    }
  });
}

/**
 * Get comprehensive cache health report
 */
export function getCacheHealthReport(): {
  caches: Array<{ name: string; stats: CacheStats; alerts: MemoryAlert[] }>;
  overallHealth: 'healthy' | 'warning' | 'critical';
  totalMemoryUsage: number;
} {
  const cacheInstances = [
    { name: 'proposalCache', cache: proposalCache },
    { name: 'userCache', cache: userCache },
    { name: 'marketDataCache', cache: marketDataCache },
    { name: 'calculationCache', cache: calculationCache },
  ];

  const report = cacheInstances.map(({ name, cache }) => ({
    name,
    stats: cache.getStats(),
    alerts: cache.getMemoryAlerts(),
  }));

  const totalMemoryUsage = report.reduce(
    (sum, { stats }) => sum + stats.memoryUsage,
    0
  );

  const hasCriticalAlerts = report.some(({ alerts }) =>
    alerts.some(alert => alert.type === 'critical')
  );

  const hasWarnings = report.some(({ alerts }) =>
    alerts.some(alert => alert.type === 'warning')
  );

  let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (hasCriticalAlerts) {
    overallHealth = 'critical';
  } else if (hasWarnings) {
    overallHealth = 'warning';
  }

  return {
    caches: report,
    overallHealth,
    totalMemoryUsage,
  };
}

/**
 * Register cleanup handlers for graceful shutdown with enhanced error handling
 */
if (typeof process !== 'undefined') {
  const cleanupHandlers = ['SIGTERM', 'SIGINT', 'SIGUSR1', 'SIGUSR2'];

  cleanupHandlers.forEach(signal => {
    process.on(signal as NodeJS.Signals, () => {
      console.log(`Received ${signal}, cleaning up cache instances...`);
      try {
        cleanupAllCaches();
        console.log('Cache cleanup completed successfully');
      } catch (error) {
        console.error('Error during cache cleanup:', error);
      }
    });
  });

  // Handle uncaught exceptions with enhanced logging
  process.on('uncaughtException', error => {
    console.error('Uncaught exception, cleaning up cache instances...', error);
    try {
      cleanupAllCaches();
    } catch (cleanupError) {
      console.error('Error during emergency cache cleanup:', cleanupError);
    }
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error(
      'Unhandled rejection, cleaning up cache instances...',
      reason
    );
    try {
      cleanupAllCaches();
    } catch (cleanupError) {
      console.error('Error during emergency cache cleanup:', cleanupError);
    }
    process.exit(1);
  });
}

// Cache decorator for functions with enhanced error handling
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
      try {
        const key = keyGenerator
          ? keyGenerator(...args)
          : `${propertyName}:${JSON.stringify(args)}`;

        const cached = cache.get<ReturnType<T>>(key);
        if (cached !== undefined) {
          return cached;
        }

        const result = method.apply(this, args);
        cache.set(key, result);
        return result;
      } catch (error) {
        console.error('Error in cached decorator:', error);
        // Fallback to original method if cache fails
        return method.apply(this, args);
      }
    };
  };
}

// Cache middleware for API routes with enhanced error handling
export function withCache<T>(
  cache: Cache,
  keyGenerator: (request: Request) => string,
  ttl?: number
) {
  return function (handler: (request: Request) => Promise<T>) {
    return async function (request: Request): Promise<T> {
      try {
        const key = keyGenerator(request);
        const cached = cache.get<T>(key);

        if (cached !== undefined) {
          return cached;
        }

        const result = await handler(request);
        cache.set(key, result, ttl);
        return result;
      } catch (error) {
        console.error('Error in cache middleware:', error);
        // Fallback to original handler if cache fails
        return handler(request);
      }
    };
  };
}

// Performance monitoring with enhanced error handling
export class PerformanceMonitor {
  private metrics = new Map<
    string,
    { count: number; totalTime: number; avgTime: number; errors: number }
  >();

  startTimer(operation: string): () => void {
    const start = performance.now();
    return () => this.endTimer(operation, start);
  }

  private endTimer(operation: string, start: number): void {
    try {
      const duration = performance.now() - start;
      const existing = this.metrics.get(operation) || {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        errors: 0,
      };

      existing.count++;
      existing.totalTime += duration;
      existing.avgTime = existing.totalTime / existing.count;

      this.metrics.set(operation, existing);
    } catch (error) {
      console.error('Error updating performance metrics:', error);
    }
  }

  recordError(operation: string): void {
    try {
      const existing = this.metrics.get(operation) || {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        errors: 0,
      };

      existing.errors++;
      this.metrics.set(operation, existing);
    } catch (error) {
      console.error('Error recording performance error:', error);
    }
  }

  getMetrics() {
    try {
      return Object.fromEntries(this.metrics);
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return {};
    }
  }

  reset() {
    try {
      this.metrics.clear();
    } catch (error) {
      console.error('Error resetting performance metrics:', error);
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Database query optimization utilities with enhanced error handling
export const queryOptimizer = {
  // Add indexes hint for complex queries
  withIndexes: (query: any, indexes: string[]) => {
    try {
      return { ...query, _indexes: indexes };
    } catch (error) {
      console.error('Error adding indexes to query:', error);
      return query;
    }
  },

  // Batch multiple queries with error handling
  batch: async <T>(queries: (() => Promise<T>)[]): Promise<T[]> => {
    try {
      return Promise.all(queries.map(query => query()));
    } catch (error) {
      console.error('Error in batch query execution:', error);
      throw error;
    }
  },

  // Pagination helper with validation
  paginate: (page: number = 1, limit: number = 10) => {
    try {
      const validatedPage = Math.max(1, Math.floor(page));
      const validatedLimit = Math.max(1, Math.min(1000, Math.floor(limit)));
      const offset = (validatedPage - 1) * validatedLimit;
      return { skip: offset, take: validatedLimit };
    } catch (error) {
      console.error('Error in pagination calculation:', error);
      return { skip: 0, take: 10 };
    }
  },
};

// Memory monitoring utilities
export const memoryMonitor = {
  // Get current memory usage
  getMemoryUsage: () => {
    try {
      if (typeof process === 'undefined') return null;
      const usage = process.memoryUsage();
      return {
        heapUsed: usage.heapUsed / 1024 / 1024,
        heapTotal: usage.heapTotal / 1024 / 1024,
        external: usage.external / 1024 / 1024,
        rss: usage.rss / 1024 / 1024,
      };
    } catch (error) {
      console.error('Error getting memory usage:', error);
      return null;
    }
  },

  // Check if memory usage is high
  isMemoryUsageHigh: (threshold: number = 100): boolean => {
    try {
      const usage = memoryMonitor.getMemoryUsage();
      return usage ? usage.heapUsed > threshold : false;
    } catch (error) {
      console.error('Error checking memory usage:', error);
      return false;
    }
  },

  // Force garbage collection if available
  forceGC: (): void => {
    try {
      if (typeof global.gc === 'function') {
        global.gc();
      }
    } catch (error) {
      // GC might not be available or enabled
    }
  },
};

// Cache health monitoring utilities
export const cacheHealthMonitor = {
  // Monitor all caches and return health status
  checkAllCaches: () => {
    try {
      return getCacheHealthReport();
    } catch (error) {
      console.error('Error checking cache health:', error);
      return {
        caches: [],
        overallHealth: 'critical' as const,
        totalMemoryUsage: 0,
      };
    }
  },

  // Get cache performance metrics
  getPerformanceMetrics: () => {
    try {
      return performanceMonitor.getMetrics();
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return {};
    }
  },

  // Reset all monitoring data
  resetMonitoring: () => {
    try {
      performanceMonitor.reset();
      [proposalCache, userCache, marketDataCache, calculationCache].forEach(
        cache => {
          cache.clearMemoryAlerts();
        }
      );
    } catch (error) {
      console.error('Error resetting monitoring data:', error);
    }
  },
};
