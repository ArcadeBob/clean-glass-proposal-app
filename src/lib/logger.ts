import pino from 'pino';

// Log levels
export enum LogLevel {
  TRACE = 10,
  DEBUG = 20,
  INFO = 30,
  WARN = 40,
  ERROR = 50,
  FATAL = 60,
}

// Log context interface
export interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  component?: string;
  operation?: string;
  duration?: number;
  [key: string]: any;
}

// Log entry interface
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: Error;
  metadata?: Record<string, any>;
}

// Performance metrics interface
export interface PerformanceMetrics {
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

// Alert interface
export interface Alert {
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  context?: LogContext;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Logger configuration
const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  base: {
    env: process.env.NODE_ENV,
    version: process.env.npm_package_version,
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  formatters: {
    level: (label: string) => ({ level: label }),
    log: (object: any) => {
      if (object.err) {
        object.error = {
          message: object.err.message,
          stack: object.err.stack,
          code: object.err.code,
        };
        delete object.err;
      }
      return object;
    },
  },
  serializers: {
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
};

// Create logger instance
const pinoLogger = pino(loggerConfig);

// Enhanced logger class with structured logging
export class Logger {
  private logger: pino.Logger;
  private context: LogContext = {};

  constructor(name?: string) {
    this.logger = name ? pinoLogger.child({ name }) : pinoLogger;
  }

  // Set context for all subsequent logs
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  // Clear context
  clearContext(): void {
    this.context = {};
  }

  // Add context to a specific log entry
  private enrichLogEntry(entry: Partial<LogEntry>): LogEntry {
    return {
      level: LogLevel.INFO,
      message: '',
      timestamp: new Date().toISOString(),
      ...entry,
      context: { ...this.context, ...entry.context },
    };
  }

  // Basic logging methods
  trace(
    message: string,
    context?: LogContext,
    metadata?: Record<string, any>
  ): void {
    this.logger.trace(
      this.enrichLogEntry({
        level: LogLevel.TRACE,
        message,
        context,
        metadata,
      })
    );
  }

  debug(
    message: string,
    context?: LogContext,
    metadata?: Record<string, any>
  ): void {
    this.logger.debug(
      this.enrichLogEntry({
        level: LogLevel.DEBUG,
        message,
        context,
        metadata,
      })
    );
  }

  info(
    message: string,
    context?: LogContext,
    metadata?: Record<string, any>
  ): void {
    this.logger.info(
      this.enrichLogEntry({
        level: LogLevel.INFO,
        message,
        context,
        metadata,
      })
    );
  }

  warn(
    message: string,
    context?: LogContext,
    metadata?: Record<string, any>
  ): void {
    this.logger.warn(
      this.enrichLogEntry({
        level: LogLevel.WARN,
        message,
        context,
        metadata,
      })
    );
  }

  error(
    message: string,
    error?: Error,
    context?: LogContext,
    metadata?: Record<string, any>
  ): void {
    this.logger.error(
      this.enrichLogEntry({
        level: LogLevel.ERROR,
        message,
        error,
        context,
        metadata,
      })
    );
  }

  fatal(
    message: string,
    error?: Error,
    context?: LogContext,
    metadata?: Record<string, any>
  ): void {
    this.logger.fatal(
      this.enrichLogEntry({
        level: LogLevel.FATAL,
        message,
        error,
        context,
        metadata,
      })
    );
  }

  // Performance logging
  performance(metrics: PerformanceMetrics, context?: LogContext): void {
    this.logger.info(
      this.enrichLogEntry({
        level: LogLevel.INFO,
        message: `Performance: ${metrics.operation}`,
        context: { ...context, ...metrics },
        metadata: { type: 'performance', ...metrics.metadata },
      })
    );
  }

  // Alert logging
  alert(alert: Alert): void {
    const level =
      alert.level === 'critical'
        ? LogLevel.FATAL
        : alert.level === 'error'
          ? LogLevel.ERROR
          : alert.level === 'warning'
            ? LogLevel.WARN
            : LogLevel.INFO;

    this.logger[
      level === LogLevel.FATAL
        ? 'fatal'
        : level === LogLevel.ERROR
          ? 'error'
          : level === LogLevel.WARN
            ? 'warn'
            : 'info'
    ](
      this.enrichLogEntry({
        level,
        message: `Alert [${alert.level.toUpperCase()}]: ${alert.message}`,
        context: alert.context,
        metadata: { type: 'alert', ...alert.metadata },
      })
    );
  }

  // Request logging
  request(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    this.logger.info(
      this.enrichLogEntry({
        level: LogLevel.INFO,
        message: `${method} ${url} - ${statusCode} (${duration}ms)`,
        context: { ...context, method, url, statusCode, duration },
        metadata: { type: 'request' },
      })
    );
  }

  // Database operation logging
  database(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    error?: Error,
    context?: LogContext
  ): void {
    const level = success ? LogLevel.DEBUG : LogLevel.ERROR;
    const message = `Database ${operation} on ${table}${success ? '' : ' failed'}`;

    this.logger[level === LogLevel.ERROR ? 'error' : 'debug'](
      this.enrichLogEntry({
        level,
        message,
        error,
        context: { ...context, operation, table, duration, success },
        metadata: { type: 'database' },
      })
    );
  }

  // Security event logging
  security(
    event: string,
    details: Record<string, any>,
    context?: LogContext
  ): void {
    this.logger.warn(
      this.enrichLogEntry({
        level: LogLevel.WARN,
        message: `Security Event: ${event}`,
        context: { ...context, ...details },
        metadata: { type: 'security' },
      })
    );
  }

  // Business logic logging
  business(
    operation: string,
    details: Record<string, any>,
    context?: LogContext
  ): void {
    this.logger.info(
      this.enrichLogEntry({
        level: LogLevel.INFO,
        message: `Business Operation: ${operation}`,
        context: { ...context, ...details },
        metadata: { type: 'business' },
      })
    );
  }

  // Create child logger with additional context
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.setContext({ ...this.context, ...context });
    return childLogger;
  }
}

// Default logger instance
export const logger = new Logger('app');

// Performance monitoring decorator
export function logPerformance(operation: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      const logger = new Logger(target.constructor.name);

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - start;

        logger.performance({
          operation: `${target.constructor.name}.${operation}`,
          duration,
          success: true,
        });

        return result;
      } catch (error) {
        const duration = Date.now() - start;

        logger.performance({
          operation: `${target.constructor.name}.${operation}`,
          duration,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    };

    return descriptor;
  };
}

// Error boundary logging
export function logError(error: Error, context?: LogContext): void {
  logger.error('Unhandled error occurred', error, context);
}

// Request ID generator
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Export default logger for backward compatibility
export default logger;
