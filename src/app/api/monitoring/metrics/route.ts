import { generateRequestId, logger } from '@/lib/logger';
import { appMonitor } from '@/lib/monitoring';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  logger.setContext({ requestId, operation: 'metrics_retrieval' });

  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const metricName = searchParams.get('name');
    const aggregation = searchParams.get('aggregation') as
      | 'avg'
      | 'sum'
      | 'min'
      | 'max'
      | undefined;
    const timeWindow = parseInt(searchParams.get('timeWindow') || '300000'); // 5 minutes default
    const limit = parseInt(searchParams.get('limit') || '100');
    const startTimeParam = searchParams.get('startTime');
    const endTimeParam = searchParams.get('endTime');

    logger.info('Metrics retrieval requested', {
      metricName,
      aggregation,
      timeWindow,
      limit,
      startTime: startTimeParam,
      endTime: endTimeParam,
    });

    let metrics;
    let aggregatedValue;

    if (metricName) {
      // Get specific metric
      const startTimeDate = startTimeParam
        ? new Date(startTimeParam)
        : undefined;
      const endTimeDate = endTimeParam ? new Date(endTimeParam) : undefined;

      metrics = appMonitor.metrics.getMetrics(
        metricName,
        startTimeDate,
        endTimeDate
      );

      // Apply aggregation if requested
      if (aggregation) {
        aggregatedValue = appMonitor.metrics.getAggregatedMetrics(
          metricName,
          aggregation,
          timeWindow
        );
      }
    } else {
      // Get all metrics
      metrics = appMonitor.metrics.getAllMetrics();
    }

    // Apply limit
    if (limit > 0) {
      metrics = metrics.slice(-limit);
    }

    // Build response
    const response: any = {
      timestamp: new Date().toISOString(),
      requestId,
      metrics: metrics.map(metric => ({
        name: metric.name,
        value: metric.value,
        unit: metric.unit,
        timestamp: metric.timestamp.toISOString(),
        tags: metric.tags,
        metadata: metric.metadata,
      })),
      summary: {
        total: metrics.length,
        uniqueNames: [...new Set(metrics.map(m => m.name))].length,
        timeRange: {
          start: metrics.length > 0 ? metrics[0].timestamp.toISOString() : null,
          end:
            metrics.length > 0
              ? metrics[metrics.length - 1].timestamp.toISOString()
              : null,
        },
      },
    };

    // Include aggregated value if requested
    if (aggregatedValue !== undefined) {
      response.aggregated = {
        name: metricName,
        aggregation,
        value: aggregatedValue,
        timeWindow,
      };
    }

    const duration = Date.now() - startTime;

    // Log the metrics retrieval
    logger.info('Metrics retrieval completed', {
      metricsCount: metrics.length,
      duration,
      hasAggregation: aggregation !== null,
    });

    // Record metrics
    appMonitor.metrics.record('metrics_retrieval_duration', duration, 'ms', {
      metricsCount: metrics.length.toString(),
      hasAggregation: (aggregation !== null).toString(),
    });

    appMonitor.metrics.record('metrics_retrieval_count', 1, 'count', {
      success: 'true',
    });

    return NextResponse.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Metrics retrieval failed', error as Error, {
      duration,
    });

    // Record error metric
    appMonitor.metrics.record('metrics_retrieval_error', 1, 'count', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        requestId,
        error: 'Metrics retrieval failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  logger.setContext({ requestId, operation: 'metrics_recording' });

  try {
    const body = await request.json();
    const { name, value, unit, tags, metadata } = body;

    // Validate required fields
    if (!name || typeof value !== 'number' || !unit) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          requestId,
          error: 'Invalid metric data',
          message: 'name, value (number), and unit are required',
        },
        { status: 400 }
      );
    }

    logger.info('Custom metric recording requested', {
      name,
      value,
      unit,
      tags: tags || {},
    });

    // Record the metric
    appMonitor.metrics.record(name, value, unit, tags || {}, metadata);

    const duration = Date.now() - startTime;

    // Log the metric recording
    logger.info('Custom metric recorded successfully', {
      name,
      value,
      unit,
      duration,
    });

    // Record metrics
    appMonitor.metrics.record(
      'custom_metric_recording_duration',
      duration,
      'ms',
      {
        metricName: name,
      }
    );

    appMonitor.metrics.record('custom_metric_recording_count', 1, 'count', {
      success: 'true',
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      requestId,
      message: 'Metric recorded successfully',
      metric: {
        name,
        value,
        unit,
        tags: tags || {},
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Custom metric recording failed', error as Error, {
      duration,
    });

    // Record error metric
    appMonitor.metrics.record('custom_metric_recording_error', 1, 'count', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        requestId,
        error: 'Metric recording failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
