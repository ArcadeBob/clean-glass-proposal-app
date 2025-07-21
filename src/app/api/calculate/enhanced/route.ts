import { auth } from '@/lib/auth';
import {
  calculateEnhancedProposalPricing,
  getAvailableRiskFactors,
} from '@/lib/calculations/enhanced-proposal-calculations';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for enhanced calculation request
const EnhancedCalculationRequestSchema = z.object({
  baseCost: z.number().min(0),
  overheadPercentage: z.number().min(0).max(100).default(15),
  profitMargin: z.number().min(0).max(100).default(20),
  // Risk assessment inputs
  projectType: z.string().optional(),
  squareFootage: z.number().optional(),
  buildingHeight: z.number().optional(),
  region: z.string().optional(),
  riskFactorInputs: z
    .record(
      z.object({
        value: z.union([z.number(), z.string(), z.boolean()]),
        notes: z.string().optional(),
      })
    )
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

// GET endpoint to retrieve available risk factors
export async function GET(request: NextRequest) {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get available risk factors
    const riskFactors = await getAvailableRiskFactors();

    return NextResponse.json({
      success: true,
      data: riskFactors,
    });
  } catch (error) {
    console.error('Error getting risk factors:', error);

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
