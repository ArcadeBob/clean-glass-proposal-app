import { databaseMonitor } from '@/lib/database-monitor';
import { checkDatabaseHealth } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeMetrics = searchParams.get('metrics') === 'true';
    const includeAlerts = searchParams.get('alerts') === 'true';
    const alertType = searchParams.get('alertType') as
      | 'warning'
      | 'error'
      | 'critical'
      | undefined;

    // Perform health check
    const health = await checkDatabaseHealth();

    // Build response
    const response: any = {
      timestamp: new Date().toISOString(),
      healthy: health.healthy,
      latency: health.latency,
    };

    if (health.error) {
      response.error = health.error;
    }

    // Include metrics if requested
    if (includeMetrics) {
      response.metrics = databaseMonitor.getMetrics();
    }

    // Include alerts if requested
    if (includeAlerts) {
      if (alertType) {
        response.alerts = databaseMonitor.getAlertsByType(alertType);
      } else {
        response.alerts = databaseMonitor.getAlerts();
      }
    }

    const status = health.healthy ? 200 : 503;

    return NextResponse.json(response, { status });
  } catch (error) {
    console.error('Database health check API error:', error);

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        healthy: false,
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'reset-metrics':
        databaseMonitor.resetMetrics();
        return NextResponse.json({
          message: 'Database metrics reset successfully',
          timestamp: new Date().toISOString(),
        });

      case 'clear-alerts':
        const { olderThanHours = 24 } = body;
        databaseMonitor.clearOldAlerts(olderThanHours);
        return NextResponse.json({
          message: `Alerts older than ${olderThanHours} hours cleared successfully`,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Database health management API error:', error);

    return NextResponse.json(
      {
        error: 'Request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
