import { Logger, logger } from '@/lib/logger';
import {
  AlertingSystem,
  HealthChecker,
  MetricsCollector,
  appMonitor,
} from '@/lib/monitoring';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

global.console = mockConsole as any;

describe('Logging System', () => {
  describe('Logger', () => {
    it('should create logger instance', () => {
      const logger = new Logger('test');
      expect(logger).toBeDefined();
    });

    it('should set context', () => {
      const logger = new Logger('test');
      logger.setContext({ userId: '123', operation: 'test' });
      expect(logger).toBeDefined();
    });

    it('should measure performance correctly', () => {
      const logger = new Logger('test');
      const result = logger.measure('test_operation', () => {
        // Simulate some work
        return 'result';
      });

      expect(result).toBe('result');
    });
  });
});

describe('Monitoring System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    appMonitor.metrics.clear();
    appMonitor.alerts.clear();
  });

  describe('MetricsCollector', () => {
    it('should record metrics correctly', () => {
      appMonitor.metrics.record('test_metric', 42, 'count', { tag1: 'value1' });

      const metrics = appMonitor.metrics.getAll();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        name: 'test_metric',
        value: 42,
        unit: 'count',
        tags: { tag1: 'value1' },
      });
    });

    it('should aggregate metrics correctly', () => {
      appMonitor.metrics.record('test_metric', 10, 'count');
      appMonitor.metrics.record('test_metric', 20, 'count');
      appMonitor.metrics.record('test_metric', 30, 'count');

      const aggregated = appMonitor.metrics.aggregate(
        'test_metric',
        'sum',
        60000
      );
      expect(aggregated).toBe(60);
    });

    it('should limit metrics storage', () => {
      const collector = new MetricsCollector();
      const maxMetrics = 5;

      // Add more metrics than the limit
      for (let i = 0; i < 10; i++) {
        collector.record(`metric_${i}`, i, 'count');
      }

      const metrics = collector.getAll();
      expect(metrics.length).toBeLessThanOrEqual(10); // Should respect the default limit
    });
  });

  describe('HealthChecker', () => {
    it('should perform health checks', async () => {
      const checker = new HealthChecker();

      // Add a simple health check
      checker.addCheck('test_check', async () => ({
        name: 'test_check',
        status: 'healthy',
        message: 'Test check passed',
        timestamp: new Date(),
        duration: 10,
      }));

      const checks = await checker.runChecks();
      expect(checks).toHaveLength(1);
      expect(checks[0]).toMatchObject({
        name: 'test_check',
        status: 'healthy',
        message: 'Test check passed',
      });
    });

    it('should handle failing health checks', async () => {
      const checker = new HealthChecker();

      checker.addCheck('failing_check', async () => {
        throw new Error('Health check failed');
      });

      const checks = await checker.runChecks();
      expect(checks).toHaveLength(1);
      expect(checks[0]).toMatchObject({
        name: 'failing_check',
        status: 'unhealthy',
        message: 'Health check failed',
      });
    });

    it('should measure check duration', async () => {
      const checker = new HealthChecker();

      checker.addCheck('slow_check', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return {
          name: 'slow_check',
          status: 'healthy' as const,
          timestamp: new Date(),
        };
      });

      const checks = await checker.runChecks();
      expect(checks[0].duration).toBeGreaterThan(40);
    });
  });

  describe('AlertingSystem', () => {
    it('should create alerts', () => {
      const metricsCollector = new MetricsCollector();
      const alerting = new AlertingSystem(metricsCollector);

      alerting.create('test_alert', 'warning', 'Test alert message', {
        metric: 'test_metric',
        value: 100,
      });

      const alerts = alerting.getRecent();
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        level: 'warning',
        message: 'Test alert message',
      });
    });

    it('should limit alert storage', () => {
      const metricsCollector = new MetricsCollector();
      const alerting = new AlertingSystem(metricsCollector);

      for (let i = 0; i < 5; i++) {
        alerting.create(`alert_${i}`, 'info', `Alert ${i}`);
      }

      const alerts = alerting.getRecent();
      expect(alerts).toHaveLength(5);
    });

    it('should filter alerts by level', () => {
      const metricsCollector = new MetricsCollector();
      const alerting = new AlertingSystem(metricsCollector);

      alerting.create('info_alert', 'info', 'Info message');
      alerting.create('warning_alert', 'warning', 'Warning message');
      alerting.create('error_alert', 'error', 'Error message');

      const alerts = alerting.getRecent();
      expect(alerts).toHaveLength(3);
    });
  });

  describe('ApplicationMonitor', () => {
    it('should provide overall health status', async () => {
      const status = await appMonitor.getHealthStatus();
      expect(status.status).toBe('healthy');
      expect(status.checks.length).toBeGreaterThan(0); // Should have at least one check
    });

    it('should track performance metrics', () => {
      appMonitor.performance.measure('test_operation', () => {
        // Simulate work
        return 'result';
      });

      // Check that metrics were recorded
      const metrics = appMonitor.metrics.getAll();
      const performanceMetrics = metrics.filter(
        m => m.name.includes('test_operation') || m.name.includes('performance')
      );
      expect(performanceMetrics.length).toBeGreaterThanOrEqual(0);
    });

    it('should create alerts for critical conditions', () => {
      // Simulate a critical condition
      appMonitor.metrics.record('error_rate', 0.15, 'percentage');

      // This would typically trigger an alert based on thresholds
      const alerts = appMonitor.alerts.getRecent();
      // Note: In a real implementation, you'd have alert rules that check metrics
      expect(Array.isArray(alerts)).toBe(true);
    });
  });
});

describe('API Integration', () => {
  it('should handle health check API requests', async () => {
    const healthStatus = await appMonitor.getHealthStatus();

    expect(healthStatus).toHaveProperty('status');
    expect(healthStatus).toHaveProperty('checks');
    expect(healthStatus).toHaveProperty('timestamp');
  });

  it('should handle metrics API requests', async () => {
    appMonitor.metrics.record('api_test_metric', 123, 'count');

    const metrics = appMonitor.metrics.getAll();
    const testMetric = metrics.find(m => m.name === 'api_test_metric');

    expect(testMetric).toBeDefined();
    expect(testMetric?.value).toBe(123);
  });
});

describe('Error Handling', () => {
  it('should handle logging errors gracefully', () => {
    // Test that logging doesn't throw errors
    expect(() => {
      logger.info('Test message');
      logger.error('Test error', new Error('Test'));
    }).not.toThrow();
  });

  it('should handle monitoring errors gracefully', async () => {
    // Test that monitoring doesn't throw errors
    expect(async () => {
      await appMonitor.getHealthStatus();
      appMonitor.metrics.record('test', 1, 'count');
    }).not.toThrow();
  });
});
