import { auth } from '@/lib/auth';
import {
  calculateEnhancedProposalPricing,
  clearOldAuditLogs,
  getAvailableRiskFactors,
  getCalculationAuditLogs,
  getCalculationStatistics,
} from '@/lib/calculations/enhanced-proposal-calculations';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for enhanced calculation request
const EnhancedCalculationRequestSchema = z.object({
  baseCost: z.number().min(0),
  overheadPercentage: z.number().min(0).max(100).default(15),
  profitMargin: z.number().min(0).max(100).default(20),
  // Size-based overhead options
  useSizeBasedOverhead: z.boolean().default(true),
  useSmoothScaling: z.boolean().default(true),
  // Risk assessment inputs
  projectType: z.string().optional(),
  squareFootage: z.number().optional(),
  buildingHeight: z.number().optional(),
  region: z.string().optional(),
  materialType: z.string().optional(),
  riskFactorInputs: z
    .record(
      z.object({
        value: z.union([z.number(), z.string(), z.boolean()]),
        notes: z.string().optional(),
      })
    )
    .optional(),
  // Confidence scoring inputs
  confidenceFactors: z
    .object({
      dataCompleteness: z.number().min(0).max(100).optional(),
      dataAccuracy: z.number().min(0).max(100).optional(),
      dataRecency: z.number().min(0).max(100).optional(),
      historicalAccuracy: z.number().min(0).max(100).optional(),
      estimateFrequency: z.number().min(0).max(100).optional(),
      varianceFromHistorical: z.number().min(0).max(100).optional(),
      scopeComplexity: z.number().min(0).max(100).optional(),
      technicalUncertainty: z.number().min(0).max(100).optional(),
      requirementClarity: z.number().min(0).max(100).optional(),
      marketDataAge: z.number().min(0).max(100).optional(),
      marketVolatility: z.number().min(0).max(100).optional(),
      supplierReliability: z.number().min(0).max(100).optional(),
    })
    .optional(),
  // Legacy support
  riskScore: z.number().min(0).max(10).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = EnhancedCalculationRequestSchema.parse(body);

    // Perform enhanced calculation
    const result = await calculateEnhancedProposalPricing(validatedData);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in enhanced calculation:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Invalid request data',
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve available risk factors, audit logs, or statistics
export async function GET(request: NextRequest) {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'risk-factors':
        // Get available risk factors
        const riskFactors = await getAvailableRiskFactors();
        return NextResponse.json({
          success: true,
          data: riskFactors,
        });

      case 'audit-logs':
        // Get calculation audit logs
        const limit = searchParams.get('limit')
          ? parseInt(searchParams.get('limit')!)
          : 100;
        const since = searchParams.get('since')
          ? new Date(searchParams.get('since')!)
          : undefined;
        const calculationId = searchParams.get('calculationId') || undefined;
        const includeErrors = searchParams.get('includeErrors') !== 'false';

        const auditLogs = getCalculationAuditLogs({
          limit,
          since,
          calculationId,
          includeErrors,
        });

        return NextResponse.json({
          success: true,
          data: auditLogs,
        });

      case 'statistics':
        // Get calculation statistics
        const statistics = getCalculationStatistics();
        return NextResponse.json({
          success: true,
          data: statistics,
        });

      case 'clear-logs':
        // Clear old audit logs
        const olderThanDays = searchParams.get('olderThanDays')
          ? parseInt(searchParams.get('olderThanDays')!)
          : 30;
        const clearedCount = clearOldAuditLogs(olderThanDays);

        return NextResponse.json({
          success: true,
          data: {
            clearedCount,
            message: `Cleared ${clearedCount} old audit logs`,
          },
        });

      default:
        // Default: get available risk factors
        const defaultRiskFactors = await getAvailableRiskFactors();
        return NextResponse.json({
          success: true,
          data: defaultRiskFactors,
        });
    }
  } catch (error) {
    console.error('Error in enhanced calculation GET:', error);

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
