import { AuditActions, createAuditLog } from './audit-trail';
import { prisma } from './db';

export interface ExportOptions {
  userId: string;
  exportType:
    | 'PROPOSALS'
    | 'USERS'
    | 'RISK_ASSESSMENTS'
    | 'MARKET_DATA'
    | 'AUDIT_LOGS'
    | 'ALL_DATA';
  filters?: Record<string, any>;
  format?: 'CSV' | 'JSON' | 'EXCEL';
}

export interface ImportOptions {
  userId: string;
  importType:
    | 'PROPOSALS'
    | 'USERS'
    | 'RISK_FACTORS'
    | 'MARKET_DATA'
    | 'CONTRACTORS';
  fileName: string;
  filePath: string;
  fileSize: number;
  mapping?: Record<string, string>;
}

export class DataManagementService {
  /**
   * Export data based on type and filters
   */
  static async exportData(options: ExportOptions) {
    try {
      // Create export record
      const exportRecord = await prisma.dataExport.create({
        data: {
          userId: options.userId,
          exportType: options.exportType,
          filters: options.filters,
          recordCount: 0, // Will be updated after export
          status: 'PENDING',
        },
      });

      let data: any[] = [];
      let recordCount = 0;

      switch (options.exportType) {
        case 'PROPOSALS':
          data = await this.exportProposals(options.filters);
          break;
        case 'USERS':
          data = await this.exportUsers(options.filters);
          break;
        case 'RISK_ASSESSMENTS':
          data = await this.exportRiskAssessments(options.filters);
          break;
        case 'MARKET_DATA':
          data = await this.exportMarketData(options.filters);
          break;
        case 'AUDIT_LOGS':
          data = await this.exportAuditLogs(options.filters);
          break;
        case 'ALL_DATA':
          data = await this.exportAllData(options.filters);
          break;
      }

      recordCount = data.length;

      // Convert to requested format
      let exportContent: string;
      let fileExtension: string;

      switch (options.format || 'CSV') {
        case 'CSV':
          exportContent = this.convertToCSV(data);
          fileExtension = 'csv';
          break;
        case 'JSON':
          exportContent = JSON.stringify(data, null, 2);
          fileExtension = 'json';
          break;
        default:
          exportContent = this.convertToCSV(data);
          fileExtension = 'csv';
      }

      // Update export record
      await prisma.dataExport.update({
        where: { id: exportRecord.id },
        data: {
          status: 'COMPLETED',
          recordCount,
          filePath: `exports/${exportRecord.id}.${fileExtension}`,
          fileSize: Buffer.byteLength(exportContent, 'utf8'),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Create audit log
      await createAuditLog(
        AuditActions.DATA_EXPORTED,
        'DataExport',
        exportRecord.id,
        {
          userId: options.userId,
          metadata: {
            exportType: options.exportType,
            recordCount,
            format: options.format,
          },
        }
      );

      return {
        exportId: exportRecord.id,
        content: exportContent,
        recordCount,
        format: options.format || 'CSV',
      };
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export data');
    }
  }

  /**
   * Import data from file
   */
  static async importData(options: ImportOptions) {
    try {
      // Create import record
      const importRecord = await prisma.dataImport.create({
        data: {
          userId: options.userId,
          importType: options.importType,
          fileName: options.fileName,
          filePath: options.filePath,
          fileSize: options.fileSize,
          recordCount: 0,
          mapping: options.mapping,
          status: 'PENDING',
        },
      });

      // Process import based on type
      let processedCount = 0;
      let errorCount = 0;
      let errors: any[] = [];

      try {
        switch (options.importType) {
          case 'PROPOSALS':
            const result = await this.importProposals(
              options.filePath,
              options.mapping
            );
            processedCount = result.processedCount;
            errorCount = result.errorCount;
            errors = result.errors;
            break;
          case 'USERS':
            const userResult = await this.importUsers(
              options.filePath,
              options.mapping
            );
            processedCount = userResult.processedCount;
            errorCount = userResult.errorCount;
            errors = userResult.errors;
            break;
          // Add other import types as needed
        }

        // Update import record
        await prisma.dataImport.update({
          where: { id: importRecord.id },
          data: {
            status: errorCount > 0 ? 'PARTIAL' : 'COMPLETED',
            processedCount,
            errorCount,
            errors: errors.length > 0 ? errors : null,
          },
        });

        // Create audit log
        await createAuditLog(
          AuditActions.DATA_IMPORTED,
          'DataImport',
          importRecord.id,
          {
            userId: options.userId,
            metadata: {
              importType: options.importType,
              processedCount,
              errorCount,
            },
          }
        );

        return {
          importId: importRecord.id,
          processedCount,
          errorCount,
          errors,
        };
      } catch (error) {
        // Update import record with error
        await prisma.dataImport.update({
          where: { id: importRecord.id },
          data: {
            status: 'FAILED',
            errorMessage:
              error instanceof Error ? error.message : 'Unknown error',
          },
        });

        throw error;
      }
    } catch (error) {
      console.error('Import failed:', error);
      throw new Error('Failed to import data');
    }
  }

  /**
   * Get export history for user
   */
  static async getExportHistory(userId: string, limit = 50) {
    return prisma.dataExport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get import history for user
   */
  static async getImportHistory(userId: string, limit = 50) {
    return prisma.dataImport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Private helper methods
  private static async exportProposals(filters?: Record<string, any>) {
    const proposals = await prisma.proposal.findMany({
      where: filters,
      include: {
        user: { select: { name: true, email: true } },
        generalContractor: { select: { name: true, company: true } },
        items: true,
        riskAssessment: true,
      },
    });

    return proposals.map(proposal => ({
      id: proposal.id,
      title: proposal.title,
      status: proposal.status,
      totalAmount: proposal.totalAmount,
      projectName: proposal.projectName,
      projectAddress: proposal.projectAddress,
      projectType: proposal.projectType,
      squareFootage: proposal.squareFootage,
      proposalDate: proposal.proposalDate,
      createdBy: proposal.user.email,
      contractor: proposal.generalContractor?.name,
      itemCount: proposal.items.length,
      hasRiskAssessment: !!proposal.riskAssessment,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
    }));
  }

  private static async exportUsers(filters?: Record<string, any>) {
    const users = await prisma.user.findMany({
      where: filters,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return users;
  }

  private static async exportRiskAssessments(filters?: Record<string, any>) {
    const assessments = await prisma.riskAssessment.findMany({
      where: filters,
      include: {
        proposal: { select: { title: true, projectName: true } },
        factorAssessments: {
          include: {
            riskFactor: {
              select: { name: true, category: { select: { name: true } } },
            },
          },
        },
      },
    });

    return assessments.map(assessment => ({
      id: assessment.id,
      proposalTitle: assessment.proposal.title,
      projectName: assessment.proposal.projectName,
      totalRiskScore: assessment.totalRiskScore,
      riskLevel: assessment.riskLevel,
      contingencyRate: assessment.contingencyRate,
      factorCount: assessment.factorAssessments.length,
      createdAt: assessment.createdAt,
    }));
  }

  private static async exportMarketData(filters?: Record<string, any>) {
    const marketData = await prisma.marketData.findMany({
      where: filters,
      orderBy: { effectiveDate: 'desc' },
    });

    return marketData;
  }

  private static async exportAuditLogs(filters?: Record<string, any>) {
    const logs = await prisma.auditLog.findMany({
      where: filters,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { timestamp: 'desc' },
    });

    return logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      user: log.user?.email,
      ipAddress: log.ipAddress,
    }));
  }

  private static async exportAllData(filters?: Record<string, any>) {
    const [proposals, users, assessments, marketData] = await Promise.all([
      this.exportProposals(filters),
      this.exportUsers(filters),
      this.exportRiskAssessments(filters),
      this.exportMarketData(filters),
    ]);

    return {
      proposals,
      users,
      riskAssessments: assessments,
      marketData,
      exportDate: new Date().toISOString(),
    };
  }

  private static convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers,
      ...data.map(row => headers.map(header => row[header])),
    ];

    return csvRows
      .map(row =>
        row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');
  }

  private static async importProposals(
    filePath: string,
    mapping?: Record<string, string>
  ) {
    // Implementation for importing proposals
    // This would read the file and process the data
    return { processedCount: 0, errorCount: 0, errors: [] };
  }

  private static async importUsers(
    filePath: string,
    mapping?: Record<string, string>
  ) {
    // Implementation for importing users
    // This would read the file and process the data
    return { processedCount: 0, errorCount: 0, errors: [] };
  }
}
