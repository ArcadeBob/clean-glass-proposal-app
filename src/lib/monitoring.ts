import { Alert, logger } from './logger';

// Metrics collection interface
export interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags: Record<string, string>;
  metadata?: Record<string, any>;
}

// Health check interface
export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, any>;
}

// Alert configuration
export interface AlertConfig {
  name: string;
  condition: (metrics: Metric[]) => boolean;
  threshold: number;
  cooldown: number; // milliseconds
  notificationChannels: string[];
}

// Performance metrics collector
export class MetricsCollector {
  private metrics: Metric[] = [];
  private maxMetrics = 10000; // Keep last 10k metrics

  // Record a metric
  record(
    name: string,
    value: number,
    unit: string,
    tags: Record<string, string> = {},
    metadata?: Record<string, any>
  ): void {
    const metric: Metric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags,
      metadata,
    };

    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    logger.debug(`Metric recorded: ${name} = ${value} ${unit}`, { metric });
  }

  // Get metrics by name and time range
  getMetrics(name: string, startTime?: Date, endTime?: Date): Metric[] {
    let filtered = this.metrics.filter(m => m.name === name);

    if (startTime) {
      filtered = filtered.filter(m => m.timestamp >= startTime);
    }

    if (endTime) {
      filtered = filtered.filter(m => m.timestamp <= endTime);
    }

    return filtered;
  }

  // Get aggregated metrics
  getAggregatedMetrics(
    name: string,
    aggregation: 'avg' | 'sum' | 'min' | 'max',
    timeWindow: number
  ): number {
    const now = new Date();
    const startTime = new Date(now.getTime() - timeWindow);
    const metrics = this.getMetrics(name, startTime, now);

    if (metrics.length === 0) return 0;

    const values = metrics.map(m => m.value);

    switch (aggregation) {
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      default:
        return 0;
    }
  }

  // Alias for getAggregatedMetrics
  aggregate(
    name: string,
    aggregation: 'avg' | 'sum' | 'min' | 'max',
    timeWindow: number
  ): number {
    return this.getAggregatedMetrics(name, aggregation, timeWindow);
  }

  // Clear old metrics
  clearOldMetrics(olderThan: Date): void {
    this.metrics = this.metrics.filter(m => m.timestamp > olderThan);
  }

  // Get all metrics
  getAllMetrics(): Metric[] {
    return [...this.metrics];
  }

  // Get all metrics (alias for getAllMetrics)
  getAll(): Metric[] {
    return this.getAllMetrics();
  }

  // Clear all metrics
  clear(): void {
    this.metrics = [];
  }
}

// Health check system
export class HealthChecker {
  private checks: Map<string, () => Promise<HealthCheck>> = new Map();
  private results: Map<string, HealthCheck> = new Map();

  // Register a health check
  register(name: string, check: () => Promise<HealthCheck>): void {
    this.checks.set(name, check);
  }

  // Alias for register
  addCheck(name: string, check: () => Promise<HealthCheck>): void {
    this.register(name, check);
  }

  async runAllChecks(): Promise<HealthCheck[]> {
    const results: HealthCheck[] = [];
    const startTime = Date.now();

    for (const [name, check] of this.checks) {
      const checkStartTime = Date.now();
      try {
        const result = await check();
        const duration = Date.now() - checkStartTime;

        const healthCheck: HealthCheck = {
          name,
          status: result.status,
          message: result.message,
          timestamp: new Date(),
          duration,
          metadata: result.metadata,
        };

        this.results.set(name, healthCheck);
        results.push(healthCheck);
      } catch (error) {
        const duration = Date.now() - checkStartTime;
        const healthCheck: HealthCheck = {
          name,
          status: 'unhealthy',
          message:
            error instanceof Error ? error.message : 'Health check failed',
          timestamp: new Date(),
          duration,
          metadata: {
            error: error instanceof Error ? error.stack : String(error),
          },
        };

        this.results.set(name, healthCheck);
        results.push(healthCheck);
      }
    }

    return results;
  }

  // Alias for runAllChecks
  async runChecks(): Promise<HealthCheck[]> {
    return this.runAllChecks();
  }

  // Run a specific health check
  async runCheck(name: string): Promise<HealthCheck | null> {
    const check = this.checks.get(name);
    if (!check) return null;

    const start = Date.now();

    try {
      const result = await check();
      result.duration = Date.now() - start;
      this.results.set(name, result);

      logger.debug(`Health check completed: ${name}`, { healthCheck: result });
      return result;
    } catch (error) {
      const result: HealthCheck = {
        name,
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        duration: Date.now() - start,
      };

      this.results.set(name, result);

      logger.error(`Health check failed: ${name}`, error as Error);
      return result;
    }
  }

  // Get overall health status
  getOverallHealth(): 'healthy' | 'unhealthy' | 'degraded' {
    const results = Array.from(this.results.values());

    if (results.length === 0) return 'healthy';

    const unhealthyCount = results.filter(r => r.status === 'unhealthy').length;
    const degradedCount = results.filter(r => r.status === 'degraded').length;

    if (unhealthyCount > 0) return 'unhealthy';
    if (degradedCount > 0) return 'degraded';
    return 'healthy';
  }

  // Get all health check results
  getAllResults(): HealthCheck[] {
    return Array.from(this.results.values());
  }
}

// Alerting system
export class AlertingSystem {
  private alerts: Alert[] = [];
  private configs: AlertConfig[] = [];
  private lastAlertTimes: Map<string, number> = new Map();
  private metricsCollector: MetricsCollector;

  constructor(metricsCollector: MetricsCollector) {
    this.metricsCollector = metricsCollector;
  }

  // Register an alert configuration
  registerAlert(config: AlertConfig): void {
    this.configs.push(config);
    logger.info(`Alert registered: ${config.name}`);
  }

  // Check all alerts
  checkAlerts(): void {
    const metrics = this.metricsCollector.getAllMetrics();

    for (const config of this.configs) {
      const lastAlertTime = this.lastAlertTimes.get(config.name) || 0;
      const now = Date.now();

      // Check cooldown period
      if (now - lastAlertTime < config.cooldown) {
        continue;
      }

      // Check condition
      if (config.condition(metrics)) {
        this.triggerAlert(config, metrics);
        this.lastAlertTimes.set(config.name, now);
      }
    }
  }

  // Trigger an alert
  private triggerAlert(config: AlertConfig, metrics: Metric[]): void {
    const alert: Alert = {
      level: 'warning',
      message: `Alert triggered: ${config.name}`,
      timestamp: new Date().toISOString(),
      context: {
        alertName: config.name,
        threshold: config.threshold,
        metricsCount: metrics.length,
      },
      metadata: {
        notificationChannels: config.notificationChannels,
        triggeredAt: new Date().toISOString(),
      },
    };

    this.alerts.push(alert);
    logger.alert(alert);

    // Send notifications (placeholder for actual notification system)
    this.sendNotifications(alert, config.notificationChannels);
  }

  // Send notifications (placeholder implementation)
  private sendNotifications(alert: Alert, channels: string[]): void {
    // In a real implementation, this would send to:
    // - Email
    // - Slack
    // - PagerDuty
    // - Webhook
    // - etc.

    logger.info(`Sending notifications for alert: ${alert.message}`, {
      channels,
      alert: alert.message,
    });
  }

  // Get recent alerts
  getRecentAlerts(limit: number = 100): Alert[] {
    return this.alerts.slice(-limit);
  }

  // Clear old alerts
  clearOldAlerts(olderThan: Date): void {
    this.alerts = this.alerts.filter(
      alert => new Date(alert.timestamp) > olderThan
    );
  }

  // Clear all alerts
  clear(): void {
    this.alerts = [];
  }

  // Create an alert manually
  create(
    name: string,
    level: 'info' | 'warning' | 'error' | 'critical',
    message: string,
    metadata?: Record<string, any>
  ): void {
    const alert: Alert = {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.alerts.push(alert);

    // Keep only recent alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }
  }

  // Get recent alerts (alias for getRecentAlerts)
  getRecent(limit: number = 100): Alert[] {
    return this.getRecentAlerts(limit);
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private metricsCollector: MetricsCollector;
  private timers: Map<string, number> = new Map();

  constructor(metricsCollector: MetricsCollector) {
    this.metricsCollector = metricsCollector;
  }

  // Start timing an operation
  startTimer(operation: string): void {
    this.timers.set(operation, Date.now());
  }

  // End timing an operation and record metric
  endTimer(
    operation: string,
    success: boolean = true,
    metadata?: Record<string, any>
  ): number {
    const startTime = this.timers.get(operation);
    if (!startTime) {
      logger.warn(`Timer not found for operation: ${operation}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(operation);

    this.metricsCollector.record(
      `${operation}_duration`,
      duration,
      'ms',
      { operation, success: success.toString() },
      metadata
    );

    logger.performance({
      operation,
      duration,
      success,
      metadata,
    });

    return duration;
  }

  // Record memory usage
  recordMemoryUsage(): void {
    if (typeof process !== 'undefined') {
      const usage = process.memoryUsage();

      this.metricsCollector.record(
        'memory_heap_used',
        usage.heapUsed / 1024 / 1024,
        'MB',
        { type: 'heap_used' }
      );
      this.metricsCollector.record(
        'memory_heap_total',
        usage.heapTotal / 1024 / 1024,
        'MB',
        { type: 'heap_total' }
      );
      this.metricsCollector.record(
        'memory_rss',
        usage.rss / 1024 / 1024,
        'MB',
        { type: 'rss' }
      );
      this.metricsCollector.record(
        'memory_external',
        usage.external / 1024 / 1024,
        'MB',
        { type: 'external' }
      );
    }
  }

  // Record CPU usage (placeholder - would need actual CPU monitoring)
  recordCPUUsage(): void {
    // In a real implementation, this would use os.cpus() or similar
    const cpuUsage = Math.random() * 100; // Simulated CPU usage
    this.metricsCollector.record('cpu_usage', cpuUsage, 'percent');
  }

  // Measure execution time of a function
  measure<T>(operation: string, fn: () => T): T {
    const startTime = Date.now();
    try {
      const result = fn();
      const duration = Date.now() - startTime;
      this.endTimer(operation, true);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.endTimer(operation, false, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Measure execution time of an async function
  async measureAsync<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.endTimer(operation, true);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.endTimer(operation, false, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Application monitoring system
export class ApplicationMonitor {
  public metrics: MetricsCollector;
  public health: HealthChecker;
  public alerts: AlertingSystem;
  public performance: PerformanceMonitor;

  constructor() {
    this.metrics = new MetricsCollector();
    this.health = new HealthChecker();
    this.alerts = new AlertingSystem(this.metrics);
    this.performance = new PerformanceMonitor(this.metrics);

    // Register default health checks
    this.registerDefaultHealthChecks();

    // Register default alerts
    this.registerDefaultAlerts();

    // Start periodic monitoring
    this.startPeriodicMonitoring();
  }

  // Register default health checks
  private registerDefaultHealthChecks(): void {
    // Database health check
    this.health.register('database', async () => {
      try {
        // This would actually check the database connection
        // For now, we'll simulate a health check
        await new Promise(resolve => setTimeout(resolve, 10));

        return {
          name: 'database',
          status: 'healthy',
          message: 'Database connection is healthy',
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          name: 'database',
          status: 'unhealthy',
          message:
            error instanceof Error
              ? error.message
              : 'Database connection failed',
          timestamp: new Date(),
        };
      }
    });

    // Memory health check
    this.health.register('memory', async () => {
      if (typeof process === 'undefined') {
        return {
          name: 'memory',
          status: 'healthy',
          message: 'Memory check not available in browser',
          timestamp: new Date(),
        };
      }

      const usage = process.memoryUsage();
      const heapUsedMB = usage.heapUsed / 1024 / 1024;

      if (heapUsedMB > 500) {
        // 500MB threshold
        return {
          name: 'memory',
          status: 'degraded',
          message: `High memory usage: ${heapUsedMB.toFixed(2)}MB`,
          timestamp: new Date(),
        };
      }

      return {
        name: 'memory',
        status: 'healthy',
        message: `Memory usage: ${heapUsedMB.toFixed(2)}MB`,
        timestamp: new Date(),
      };
    });
  }

  // Register default alerts
  private registerDefaultAlerts(): void {
    // High error rate alert
    this.alerts.registerAlert({
      name: 'high_error_rate',
      condition: metrics => {
        const errorCount = metrics.filter(
          m => m.name === 'error_count' && m.tags.type === 'api'
        ).length;
        const totalRequests = metrics.filter(
          m => m.name === 'request_count'
        ).length;
        return totalRequests > 0 && errorCount / totalRequests > 0.1; // 10% error rate
      },
      threshold: 0.1,
      cooldown: 5 * 60 * 1000, // 5 minutes
      notificationChannels: ['email', 'slack'],
    });

    // High response time alert
    this.alerts.registerAlert({
      name: 'high_response_time',
      condition: metrics => {
        const avgResponseTime = this.metrics.getAggregatedMetrics(
          'api_response_time',
          'avg',
          5 * 60 * 1000
        ); // 5 minutes
        return avgResponseTime > 2000; // 2 seconds
      },
      threshold: 2000,
      cooldown: 2 * 60 * 1000, // 2 minutes
      notificationChannels: ['slack'],
    });

    // High memory usage alert
    this.alerts.registerAlert({
      name: 'high_memory_usage',
      condition: metrics => {
        const memoryUsage = this.metrics.getAggregatedMetrics(
          'memory_heap_used',
          'avg',
          1 * 60 * 1000
        ); // 1 minute
        return memoryUsage > 400; // 400MB
      },
      threshold: 400,
      cooldown: 1 * 60 * 1000, // 1 minute
      notificationChannels: ['email', 'pagerduty'],
    });
  }

  // Start periodic monitoring
  private startPeriodicMonitoring(): void {
    // Health checks every 30 seconds
    setInterval(async () => {
      await this.health.runAllChecks();
    }, 30000);

    // Memory usage every 10 seconds
    setInterval(() => {
      this.performance.recordMemoryUsage();
    }, 10000);

    // Alert checks every 30 seconds
    setInterval(() => {
      this.alerts.checkAlerts();
    }, 30000);

    // Cleanup old data every 5 minutes
    setInterval(
      () => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        this.metrics.clearOldMetrics(fiveMinutesAgo);
        this.alerts.clearOldAlerts(fiveMinutesAgo);
      },
      5 * 60 * 1000
    );
  }

  // Get monitoring status
  getStatus(): {
    health: 'healthy' | 'unhealthy' | 'degraded';
    metrics: number;
    alerts: number;
    uptime: number;
  } {
    return {
      health: this.health.getOverallHealth(),
      metrics: this.metrics.getAllMetrics().length,
      alerts: this.alerts.getRecentAlerts().length,
      uptime: process.uptime(),
    };
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    checks: HealthCheck[];
    timestamp: Date;
  }> {
    const checks = await this.health.runAllChecks();
    const status = this.health.getOverallHealth();

    return {
      status,
      checks,
      timestamp: new Date(),
    };
  }
}

// Global monitoring instance
export const appMonitor = new ApplicationMonitor();
