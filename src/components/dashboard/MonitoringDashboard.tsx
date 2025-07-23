'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState } from 'react';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  duration?: number;
  timestamp: string;
}

interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags: Record<string, string>;
}

interface Alert {
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

interface MonitoringStatus {
  health: 'healthy' | 'unhealthy' | 'degraded';
  metrics: number;
  alerts: number;
  uptime: number;
}

export default function MonitoringDashboard() {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [status, setStatus] = useState<MonitoringStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealthData = async () => {
    try {
      const response = await fetch(
        '/api/monitoring/health?metrics=true&alerts=true&details=true'
      );
      if (!response.ok) throw new Error('Failed to fetch health data');

      const data = await response.json();
      setHealthChecks(data.checks || []);
      setMetrics(data.metrics?.recent || []);
      setAlerts(data.alerts || []);
      setStatus(data.details || null);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Failed to fetch monitoring data', err as Error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/monitoring/metrics?limit=50');
      if (!response.ok) throw new Error('Failed to fetch metrics');

      const data = await response.json();
      setMetrics(data.metrics || []);
    } catch (err) {
      logger.error('Failed to fetch metrics', err as Error);
    }
  };

  useEffect(() => {
    fetchHealthData();
    fetchMetrics();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchHealthData();
        fetchMetrics();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-100';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-100';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatMemory = (mb: number) => {
    if (mb > 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Application Monitoring
            </h1>
            <p className="text-gray-600 mt-1">
              Real-time health, metrics, and alerts
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">Auto-refresh</span>
            </label>
            <button
              onClick={() => {
                fetchHealthData();
                fetchMetrics();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {/* Status Overview */}
        {status && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div
                  className={`p-2 rounded-full ${getStatusColor(status.health)}`}
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Overall Health
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 capitalize">
                    {status.health}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Uptime</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatUptime(status.uptime)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-green-100 text-green-600">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Metrics
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {status.metrics.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Active Alerts
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {status.alerts}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Health Checks */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Health Checks
              </h2>
            </div>
            <div className="p-6">
              {healthChecks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No health checks available
                </p>
              ) : (
                <div className="space-y-4">
                  {healthChecks.map((check, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            check.status === 'healthy'
                              ? 'bg-green-500'
                              : check.status === 'degraded'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                        ></div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {check.name}
                          </p>
                          {check.message && (
                            <p className="text-sm text-gray-600">
                              {check.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-medium capitalize ${getStatusColor(check.status)}`}
                        >
                          {check.status}
                        </p>
                        {check.duration && (
                          <p className="text-xs text-gray-500">
                            {check.duration}ms
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Recent Alerts
              </h2>
            </div>
            <div className="p-6">
              {alerts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No alerts</p>
              ) : (
                <div className="space-y-4">
                  {alerts.slice(0, 10).map((alert, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg ${getAlertColor(alert.level)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm mt-1">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded capitalize ${
                            alert.level === 'critical'
                              ? 'bg-red-200 text-red-800'
                              : alert.level === 'error'
                                ? 'bg-red-100 text-red-700'
                                : alert.level === 'warning'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {alert.level}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Recent Metrics
            </h2>
          </div>
          <div className="p-6">
            {metrics.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No metrics available
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tags
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {metrics.slice(0, 20).map((metric, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {metric.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {metric.name.includes('memory')
                            ? formatMemory(metric.value)
                            : metric.value.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {metric.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {Object.entries(metric.tags).map(([key, value]) => (
                            <span
                              key={key}
                              className="inline-block bg-gray-100 rounded px-2 py-1 text-xs mr-1 mb-1"
                            >
                              {key}: {value}
                            </span>
                          ))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(metric.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
