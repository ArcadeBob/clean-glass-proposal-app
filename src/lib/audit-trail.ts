import { prisma } from './db';

export interface AuditLogData {
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AuditTrailService {
  /**
   * Create an audit log entry
   */
  static async createLog(data: AuditLogData) {
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
          newValues: data.newValues ? JSON.stringify(data.newValues) : null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return auditLog;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      throw new Error('Failed to create audit log entry');
    }
  }

  /**
   * Get audit logs with filtering
   */
  static async getLogs(filters: AuditLogFilters = {}) {
    try {
      const where: any = {};

      if (filters.userId) where.userId = filters.userId;
      if (filters.action) where.action = filters.action;
      if (filters.entityType) where.entityType = filters.entityType;
      if (filters.entityId) where.entityId = filters.entityId;
      if (filters.startDate || filters.endDate) {
        where.timestamp = {};
        if (filters.startDate) where.timestamp.gte = filters.startDate;
        if (filters.endDate) where.timestamp.lte = filters.endDate;
      }

      const logs = await prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: filters.limit || 100,
        skip: filters.offset || 0,
      });

      return logs;
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      throw new Error('Failed to retrieve audit logs');
    }
  }

  /**
   * Get audit logs for a specific entity
   */
  static async getEntityLogs(entityType: string, entityId: string, limit = 50) {
    return this.getLogs({
      entityType,
      entityId,
      limit,
    });
  }

  /**
   * Get user activity logs
   */
  static async getUserActivity(userId: string, limit = 100) {
    return this.getLogs({
      userId,
      limit,
    });
  }

  /**
   * Export audit logs to CSV
   */
  static async exportLogs(filters: AuditLogFilters = {}) {
    try {
      const logs = await this.getLogs({ ...filters, limit: 10000 });

      const csvHeaders = [
        'Timestamp',
        'User',
        'Action',
        'Entity Type',
        'Entity ID',
        'IP Address',
        'User Agent',
      ];

      const csvRows = logs.map(log => [
        log.timestamp.toISOString(),
        log.user?.email || 'Unknown',
        log.action,
        log.entityType,
        log.entityId,
        log.ipAddress || '',
        log.userAgent || '',
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Failed to export audit logs:', error);
      throw new Error('Failed to export audit logs');
    }
  }

  /**
   * Clean up old audit logs (retention policy)
   */
  static async cleanupOldLogs(retentionDays = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await prisma.auditLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error('Failed to cleanup old audit logs:', error);
      throw new Error('Failed to cleanup old audit logs');
    }
  }
}

// Convenience functions for common audit actions
export const AuditActions = {
  // Proposal actions
  PROPOSAL_CREATED: 'PROPOSAL_CREATED',
  PROPOSAL_UPDATED: 'PROPOSAL_UPDATED',
  PROPOSAL_DELETED: 'PROPOSAL_DELETED',
  PROPOSAL_STATUS_CHANGED: 'PROPOSAL_STATUS_CHANGED',
  PROPOSAL_EXPORTED: 'PROPOSAL_EXPORTED',

  // User actions
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',

  // Data management actions
  DATA_EXPORTED: 'DATA_EXPORTED',
  DATA_IMPORTED: 'DATA_IMPORTED',
  BACKUP_CREATED: 'BACKUP_CREATED',
  BACKUP_RESTORED: 'BACKUP_RESTORED',

  // System actions
  CONFIG_CHANGED: 'CONFIG_CHANGED',
  SYSTEM_MAINTENANCE: 'SYSTEM_MAINTENANCE',
} as const;

// Helper function to create audit logs with common patterns
export const createAuditLog = async (
  action: string,
  entityType: string,
  entityId: string,
  options: {
    userId?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  } = {}
) => {
  return AuditTrailService.createLog({
    action,
    entityType,
    entityId,
    ...options,
  });
};
