# Logging and Monitoring System Guide

## Overview

This document describes the comprehensive logging and monitoring system implemented for the Storefront Glazing Proposal App. The system provides structured logging, performance monitoring, health checks, and alerting capabilities for production debugging and analysis.

## Architecture

### Components

1. **Structured Logging** (`src/lib/logger.ts`)
   - Pino-based logging with structured data
   - Request ID tracking
   - Performance measurement
   - Context-aware logging

2. **Monitoring System** (`src/lib/monitoring.ts`)
   - Metrics collection and aggregation
   - Health checks
   - Alerting system
   - Performance monitoring

3. **Error Tracking** (`src/lib/sentry.ts`)
   - Sentry integration for production error tracking
   - Performance monitoring
   - Session replay

4. **API Endpoints**
   - `/api/monitoring/health` - Health check endpoint
   - `/api/monitoring/metrics` - Metrics retrieval endpoint

5. **Dashboard** (`src/components/dashboard/MonitoringDashboard.tsx`)
   - Real-time monitoring interface
   - Health status visualization
   - Metrics and alerts display

## Installation and Setup

### 1. Dependencies

The following dependencies have been added to `package.json`:

```json
{
  "dependencies": {
    "@sentry/nextjs": "^8.0.0",
    "pino": "^9.0.0",
    "pino-pretty": "^11.0.0"
  }
}
```

### 2. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Sentry Configuration
SENTRY_DSN=your_sentry_dsn_here

# Logging Configuration
LOG_LEVEL=info
NODE_ENV=production
```

### 3. Sentry Configuration

Create the following Sentry configuration files:

- `sentry.client.config.ts` - Browser-side configuration
- `sentry.server.config.ts` - Server-side configuration

## Usage

### Basic Logging

```typescript
import { logger } from '@/lib/logger';

// Basic logging
logger.info('User logged in', { userId: '123' });
logger.warn('High memory usage detected', { memoryUsage: '85%' });
logger.error('Database connection failed', error);

// With context
logger.setContext({ requestId: 'req-123', userId: 'user-456' });
logger.info('Processing request');

// Performance measurement
const duration = logger.measure('database_query', async () => {
  return await db.query('SELECT * FROM users');
});
```

### Metrics Collection

```typescript
import { appMonitor } from '@/lib/monitoring';

// Record metrics
appMonitor.metrics.record('request_count', 1, 'count', {
  endpoint: '/api/proposals',
  method: 'POST',
});

appMonitor.metrics.record('response_time', 150, 'milliseconds', {
  endpoint: '/api/proposals',
});

// Get aggregated metrics
const avgResponseTime = appMonitor.metrics.aggregate(
  'response_time',
  'avg',
  300000 // 5 minutes
);
```

### Health Checks

```typescript
import { appMonitor } from '@/lib/monitoring';

// Add custom health checks
appMonitor.health.addCheck('database', async () => {
  try {
    await db.$queryRaw`SELECT 1`;
    return { status: 'healthy', message: 'Database connection OK' };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Database connection failed',
      error: error.message,
    };
  }
});

appMonitor.health.addCheck('external_api', async () => {
  try {
    const response = await fetch('https://api.example.com/health');
    if (response.ok) {
      return { status: 'healthy', message: 'External API OK' };
    } else {
      return { status: 'degraded', message: 'External API responding slowly' };
    }
  } catch (error) {
    return { status: 'unhealthy', message: 'External API unavailable' };
  }
});
```

### Alerting

```typescript
import { appMonitor } from '@/lib/monitoring';

// Create alerts
appMonitor.alerts.create(
  'high_error_rate',
  'warning',
  'Error rate exceeded 5% threshold',
  { currentRate: '7%', threshold: '5%' }
);

appMonitor.alerts.create(
  'database_down',
  'critical',
  'Database connection lost',
  { lastSeen: new Date().toISOString() }
);
```

## API Endpoints

### Health Check Endpoint

**GET** `/api/monitoring/health`

Query Parameters:

- `metrics=true` - Include recent metrics
- `alerts=true` - Include recent alerts
- `details=true` - Include detailed status information

Response:

```json
{
  "status": "healthy",
  "checks": [
    {
      "name": "database",
      "status": "healthy",
      "message": "Database connection OK",
      "duration": 12,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "metrics": {
    "recent": [...],
    "summary": {...}
  },
  "alerts": [...],
  "details": {
    "health": "healthy",
    "uptime": 86400,
    "metrics": 1250,
    "alerts": 0
  }
}
```

### Metrics Endpoint

**GET** `/api/monitoring/metrics`

Query Parameters:

- `name=metric_name` - Filter by metric name
- `aggregation=avg|sum|min|max` - Aggregation method
- `timeWindow=300000` - Time window in milliseconds
- `limit=100` - Maximum number of metrics to return

Response:

```json
{
  "metrics": [
    {
      "name": "request_count",
      "value": 42,
      "unit": "count",
      "timestamp": "2024-01-15T10:30:00Z",
      "tags": {
        "endpoint": "/api/proposals",
        "method": "POST"
      }
    }
  ],
  "aggregated": {
    "request_count": 1250
  }
}
```

## Dashboard

The monitoring dashboard provides a real-time view of application health, metrics, and alerts. Access it at `/monitoring` (you'll need to add this route to your application).

### Features

1. **Health Status Overview**
   - Overall application health
   - Uptime tracking
   - Total metrics count
   - Active alerts count

2. **Health Checks**
   - Individual health check status
   - Response times
   - Error messages

3. **Recent Alerts**
   - Alert levels (info, warning, error, critical)
   - Timestamps
   - Context information

4. **Metrics Table**
   - Recent metric values
   - Aggregated data
   - Tag filtering

## Configuration

### Log Levels

Configure log levels in your environment:

```env
LOG_LEVEL=trace|debug|info|warn|error|fatal
```

### Performance Monitoring

Configure Sentry performance monitoring:

```typescript
// In sentry.client.config.ts and sentry.server.config.ts
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
```

### Alert Thresholds

Configure alert thresholds in your monitoring system:

```typescript
// Example alert configuration
const alertConfig = {
  errorRate: { threshold: 0.05, cooldown: 300000 }, // 5% error rate, 5 min cooldown
  responseTime: { threshold: 2000, cooldown: 60000 }, // 2s response time, 1 min cooldown
  memoryUsage: { threshold: 0.9, cooldown: 120000 }, // 90% memory usage, 2 min cooldown
};
```

## Best Practices

### Logging

1. **Use Structured Logging**

   ```typescript
   // Good
   logger.info('User action completed', {
     userId: '123',
     action: 'proposal_created',
     proposalId: 'prop-456',
     duration: 150,
   });

   // Avoid
   console.log('User 123 created proposal prop-456 in 150ms');
   ```

2. **Include Context**

   ```typescript
   logger.setContext({
     requestId: 'req-123',
     userId: 'user-456',
     sessionId: 'sess-789',
   });
   ```

3. **Handle Errors Properly**
   ```typescript
   try {
     await riskyOperation();
   } catch (error) {
     logger.error('Operation failed', error, {
       operation: 'risky_operation',
       userId: '123',
     });
   }
   ```

### Monitoring

1. **Define Key Metrics**
   - Request count and response times
   - Error rates
   - Database connection status
   - Memory and CPU usage
   - External API health

2. **Set Appropriate Thresholds**
   - Error rate > 5%
   - Response time > 2 seconds
   - Memory usage > 90%
   - Database connection failures

3. **Use Tags for Filtering**
   ```typescript
   appMonitor.metrics.record('api_request', 1, 'count', {
     endpoint: '/api/proposals',
     method: 'POST',
     status: '200',
   });
   ```

### Alerting

1. **Use Appropriate Alert Levels**
   - `info` - Informational messages
   - `warning` - Potential issues
   - `error` - Actual problems
   - `critical` - System failures

2. **Include Context in Alerts**

   ```typescript
   appMonitor.alerts.create(
     'high_error_rate',
     'warning',
     'Error rate exceeded threshold',
     {
       currentRate: '7%',
       threshold: '5%',
       timeWindow: '5 minutes',
     }
   );
   ```

3. **Set Cooldown Periods**
   - Prevent alert spam
   - Allow time for issues to resolve
   - Configure based on alert severity

## Testing

Run the comprehensive test suite:

```bash
npm test -- logging-monitoring.test.ts
```

The tests cover:

- Logging functionality
- Metrics collection and aggregation
- Health check execution
- Alert creation and management
- Error handling
- API integration

## Troubleshooting

### Common Issues

1. **Sentry Not Initializing**
   - Check `SENTRY_DSN` environment variable
   - Verify Sentry configuration files exist
   - Check for TypeScript compilation errors

2. **Logs Not Appearing**
   - Verify `LOG_LEVEL` environment variable
   - Check console output in development
   - Ensure logger is properly imported

3. **Health Checks Failing**
   - Verify database connection
   - Check external API availability
   - Review health check implementation

4. **Metrics Not Recording**
   - Check metrics collector initialization
   - Verify metric names and units
   - Review aggregation logic

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

### Performance Impact

The logging and monitoring system is designed to have minimal performance impact:

- Logging is asynchronous
- Metrics are batched and aggregated
- Health checks run on demand
- Alerts are processed asynchronously

## Security Considerations

1. **Sensitive Data Filtering**
   - Headers are automatically filtered
   - Request bodies are not logged
   - User IDs are anonymized in production

2. **Access Control**
   - Monitoring endpoints should be protected
   - Dashboard access should be restricted
   - API keys should be secured

3. **Data Retention**
   - Logs are not persisted by default
   - Metrics are kept in memory only
   - Implement external storage for production

## Production Deployment

1. **Environment Setup**

   ```env
   NODE_ENV=production
   SENTRY_DSN=your_production_dsn
   LOG_LEVEL=info
   ```

2. **External Monitoring**
   - Configure external log aggregation (e.g., ELK stack)
   - Set up metrics storage (e.g., Prometheus, DataDog)
   - Configure alerting channels (e.g., Slack, email)

3. **Performance Tuning**
   - Adjust sample rates for high-traffic applications
   - Configure log rotation and retention
   - Set appropriate metric aggregation intervals

## Future Enhancements

1. **Advanced Analytics**
   - Trend analysis
   - Anomaly detection
   - Predictive alerting

2. **Integration**
   - Slack notifications
   - Email alerts
   - PagerDuty integration

3. **Custom Dashboards**
   - Grafana integration
   - Custom metric visualizations
   - Real-time charts

4. **Machine Learning**
   - Automated threshold adjustment
   - Pattern recognition
   - Predictive maintenance
