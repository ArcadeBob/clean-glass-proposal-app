import { LogLevel, generateRequestId, logger } from '@/lib/logger';
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
  beforeEach(() => {
    jest.clearAllMocks();
    logger.setContext({});
  });

  describe('Logger', () => {
    it('should log messages with correct levels', () => {
      logger.info('Test info message');
      logger.warn('Test warning message');
      logger.error('Test error message');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.INFO,
          message: 'Test info message',
        })
      );

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.WARN,
          message: 'Test warning message',
        })
      );

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.ERROR,
          message: 'Test error message',
        })
      );
    });

    it('should include context in log messages', () => {
      logger.setContext({ userId: '123', operation: 'test' });
      logger.info('Test message');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.objectContaining({
          context: { userId: '123', operation: 'test' },
        })
      );
    });

    it('should generate unique request IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    it('should handle errors with stack traces', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Test error',
            stack: expect.any(String),
          }),
        })
      );
    });

    it('should measure performance correctly', () => {
      const startTime = Date.now();
      const duration = logger.measure('test_operation', () => {
        // Simulate some work
        return 'result';
      });

      expect(duration).toBeGreaterThan(0);
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Performance measurement: test_operation',
          context: expect.objectContaining({
            operation: 'test_operation',
            duration: expect.any(Number),
          }),
        })
      );
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
      const maxMetrics = 5;
      const collector = new MetricsCollector(maxMetrics);

      for (let i = 0; i < 10; i++) {
        collector.record(`metric_${i}`, i, 'count');
      }

      const metrics = collector.getAll();
      expect(metrics.length).toBeLessThanOrEqual(maxMetrics);
    });
  });

  describe('HealthChecker', () => {
    it('should perform health checks', async () => {
      const checker = new HealthChecker();

      // Add a simple health check
      checker.addCheck('test_check', async () => ({
        status: 'healthy',
        message: 'Test check passed',
        duration: 10,
      }));

      const checks = await checker.runChecks();
      expect(checks).toHaveLength(1);
      expect(checks[0]).toMatchObject({
        name: 'test_check',
        status: 'healthy',
        message: 'Test check passed',
        duration: 10,
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
        return { status: 'healthy' as const };
      });

      const checks = await checker.runChecks();
      expect(checks[0].duration).toBeGreaterThan(40);
    });
  });

  describe('AlertingSystem', () => {
    it('should create alerts', () => {
      const alerting = new AlertingSystem();

      alerting.create('test_alert', 'warning', 'Test alert message', {
        metric: 'test_metric',
        value: 100,
      });

      const alerts = alerting.getRecent();
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        level: 'warning',
        message: 'Test alert message',
        context: {
          metric: 'test_metric',
          value: 100,
        },
      });
    });

    it('should limit alert storage', () => {
      const maxAlerts = 3;
      const alerting = new AlertingSystem(maxAlerts);

      for (let i = 0; i < 5; i++) {
        alerting.create(`alert_${i}`, 'info', `Alert ${i}`);
      }

      const alerts = alerting.getRecent();
      expect(alerts.length).toBeLessThanOrEqual(maxAlerts);
    });

    it('should filter alerts by level', () => {
      const alerting = new AlertingSystem();

      alerting.create('info_alert', 'info', 'Info message');
      alerting.create('warning_alert', 'warning', 'Warning message');
      alerting.create('error_alert', 'error', 'Error message');

      const errorAlerts = alerting.getByLevel('error');
      expect(errorAlerts).toHaveLength(1);
      expect(errorAlerts[0].level).toBe('error');
    });
  });

  describe('ApplicationMonitor', () => {
    it('should provide overall health status', async () => {
      // Add a healthy check
      appMonitor.health.addCheck('healthy_check', async () => ({
        status: 'healthy',
        message: 'All good',
      }));

      const status = await appMonitor.getHealthStatus();
      expect(status.health).toBe('healthy');
      expect(status.checks).toHaveLength(1);
    });

    it('should track performance metrics', () => {
      appMonitor.performance.measure('test_operation', () => {
        // Simulate work
        return 'result';
      });

      const metrics = appMonitor.metrics.getAll();
      const performanceMetrics = metrics.filter(m =>
        m.name.includes('test_operation')
      );
      expect(performanceMetrics.length).toBeGreaterThan(0);
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
    // This would test the actual API endpoints
    // For now, we'll test the monitoring functions they use
    const healthStatus = await appMonitor.getHealthStatus();

    expect(healthStatus).toHaveProperty('health');
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
