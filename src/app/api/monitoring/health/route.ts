import { generateRequestId, logger } from '@/lib/logger';
import { appMonitor } from '@/lib/monitoring';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  logger.setContext({ requestId, operation: 'health_check' });

  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeMetrics = searchParams.get('metrics') === 'true';
    const includeAlerts = searchParams.get('alerts') === 'true';
    const includeDetails = searchParams.get('details') === 'true';

    logger.info('Health check requested', {
      includeMetrics,
      includeAlerts,
      includeDetails,
    });

    // Run health checks
    const healthChecks = await appMonitor.health.runAllChecks();
    const overallHealth = appMonitor.health.getOverallHealth();

    // Build response
    const response: any = {
      status: overallHealth,
      timestamp: new Date().toISOString(),
      requestId,
      checks: healthChecks.map(check => ({
        name: check.name,
        status: check.status,
        message: check.message,
        duration: check.duration,
        timestamp: check.timestamp.toISOString(),
      })),
    };

    // Include metrics if requested
    if (includeMetrics) {
      const metrics = appMonitor.metrics.getAllMetrics();
      response.metrics = {
        total: metrics.length,
        recent: metrics.slice(-50).map(metric => ({
          name: metric.name,
          value: metric.value,
          unit: metric.unit,
          timestamp: metric.timestamp.toISOString(),
          tags: metric.tags,
        })),
      };
    }

    // Include alerts if requested
    if (includeAlerts) {
      const alerts = appMonitor.alerts.getRecentAlerts(20);
      response.alerts = alerts.map(alert => ({
        level: alert.level,
        message: alert.message,
        timestamp: alert.timestamp,
        context: alert.context,
      }));
    }

    // Include detailed status if requested
    if (includeDetails) {
      const status = appMonitor.getStatus();
      response.details = {
        uptime: status.uptime,
        totalMetrics: status.metrics,
        totalAlerts: status.alerts,
        memory:
          typeof process !== 'undefined'
            ? {
                heapUsed: process.memoryUsage().heapUsed / 1024 / 1024,
                heapTotal: process.memoryUsage().heapTotal / 1024 / 1024,
                rss: process.memoryUsage().rss / 1024 / 1024,
              }
            : null,
      };
    }

    const duration = Date.now() - startTime;

    // Log the health check result
    logger.info('Health check completed', {
      status: overallHealth,
      duration,
      checksCount: healthChecks.length,
    });

    // Record metrics
    appMonitor.metrics.record('health_check_duration', duration, 'ms', {
      status: overallHealth,
      includeMetrics: includeMetrics.toString(),
      includeAlerts: includeAlerts.toString(),
    });

    appMonitor.metrics.record('health_check_count', 1, 'count', {
      status: overallHealth,
    });

    // Set appropriate status code
    const statusCode =
      overallHealth === 'healthy'
        ? 200
        : overallHealth === 'degraded'
          ? 200
          : 503;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Health check failed', error as Error, {
      duration,
    });

    // Record error metric
    appMonitor.metrics.record('health_check_error', 1, 'count', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        requestId,
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
