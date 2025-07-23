import { DatabaseError, DatabaseErrorType, checkDatabaseHealth } from './db';

export interface DatabaseMetrics {
  connectionCount: number;
  activeConnections: number;
  idleConnections: number;
  averageQueryTime: number;
  errorRate: number;
  lastHealthCheck: Date;
  isHealthy: boolean;
}

export interface DatabaseAlert {
  type: 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  metric?: string;
  value?: number;
  threshold?: number;
}

class DatabaseMonitor {
  private metrics: DatabaseMetrics = {
    connectionCount: 0,
    activeConnections: 0,
    idleConnections: 0,
    averageQueryTime: 0,
    errorRate: 0,
    lastHealthCheck: new Date(),
    isHealthy: true,
  };

  private alerts: DatabaseAlert[] = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private queryTimes: number[] = [];
  private errorCount = 0;
  private totalQueries = 0;

  constructor() {
    this.startHealthCheck();
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheck(intervalMs: number = 30000) {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, intervalMs);
  }

  /**
   * Perform a health check and update metrics
   */
  private async performHealthCheck() {
    try {
      const health = await checkDatabaseHealth();
      this.metrics.isHealthy = health.healthy;
      this.metrics.lastHealthCheck = new Date();

      if (health.latency) {
        this.recordQueryTime(health.latency);
      }

      if (!health.healthy) {
        this.recordAlert({
          type: 'error',
          message: `Database health check failed: ${health.error}`,
          timestamp: new Date(),
          metric: 'health',
        });
      }
    } catch (error) {
      this.metrics.isHealthy = false;
      this.recordAlert({
        type: 'critical',
        message: `Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        metric: 'health',
      });
    }
  }

  /**
   * Record query execution time for performance monitoring
   */
  recordQueryTime(duration: number) {
    this.queryTimes.push(duration);
    this.totalQueries++;

    // Keep only last 100 query times for average calculation
    if (this.queryTimes.length > 100) {
      this.queryTimes.shift();
    }

    this.metrics.averageQueryTime =
      this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;

    // Alert on slow queries
    if (duration > 1000) {
      // 1 second threshold
      this.recordAlert({
        type: 'warning',
        message: `Slow query detected: ${duration}ms`,
        timestamp: new Date(),
        metric: 'queryTime',
        value: duration,
        threshold: 1000,
      });
    }
  }

  /**
   * Record database error for error rate calculation
   */
  recordError(error: DatabaseError) {
    this.errorCount++;
    this.metrics.errorRate = (this.errorCount / this.totalQueries) * 100;

    // Alert on high error rates
    if (this.metrics.errorRate > 5) {
      // 5% threshold
      this.recordAlert({
        type: 'error',
        message: `High error rate detected: ${this.metrics.errorRate.toFixed(2)}%`,
        timestamp: new Date(),
        metric: 'errorRate',
        value: this.metrics.errorRate,
        threshold: 5,
      });
    }

    // Alert on specific error types
    if (error.errorType === DatabaseErrorType.CONNECTION_TIMEOUT) {
      this.recordAlert({
        type: 'critical',
        message: 'Database connection timeout detected',
        timestamp: new Date(),
        metric: 'connection',
      });
    }

    if (error.errorType === DatabaseErrorType.DEADLOCK) {
      this.recordAlert({
        type: 'warning',
        message: 'Database deadlock detected',
        timestamp: new Date(),
        metric: 'deadlock',
      });
    }
  }

  /**
   * Record an alert
   */
  private recordAlert(alert: DatabaseAlert) {
    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    // Log critical alerts immediately
    if (alert.type === 'critical') {
      console.error('Database Critical Alert:', alert);
    } else if (alert.type === 'error') {
      console.warn('Database Error Alert:', alert);
    } else {
      console.log('Database Warning Alert:', alert);
    }
  }

  /**
   * Get current database metrics
   */
  getMetrics(): DatabaseMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit: number = 50): DatabaseAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Get alerts by type
   */
  getAlertsByType(type: DatabaseAlert['type']): DatabaseAlert[] {
    return this.alerts.filter(alert => alert.type === type);
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(olderThanHours: number = 24) {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      connectionCount: 0,
      activeConnections: 0,
      idleConnections: 0,
      averageQueryTime: 0,
      errorRate: 0,
      lastHealthCheck: new Date(),
      isHealthy: true,
    };
    this.queryTimes = [];
    this.errorCount = 0;
    this.totalQueries = 0;
  }
}

// Global database monitor instance
export const databaseMonitor = new DatabaseMonitor();

// Utility function to monitor database operations
export function withMonitoring<T>(
  operation: () => Promise<T>,
  context: string = 'database operation'
): Promise<T> {
  const start = Date.now();

  return operation()
    .then(result => {
      const duration = Date.now() - start;
      databaseMonitor.recordQueryTime(duration);
      return result;
    })
    .catch(error => {
      const duration = Date.now() - start;
      databaseMonitor.recordQueryTime(duration);

      if (error instanceof DatabaseError) {
        databaseMonitor.recordError(error);
      }

      throw error;
    });
}

// Graceful shutdown
process.on('SIGINT', () => {
  databaseMonitor.stop();
});

process.on('SIGTERM', () => {
  databaseMonitor.stop();
});
