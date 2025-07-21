import { auth } from '@/lib/auth';
import { DatabaseError, handleDatabaseError, prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for risk factor updates
const RiskFactorUpdateSchema = z.object({
  id: z.string(),
  weight: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
  options: z.any().optional(),
  formula: z.string().optional(),
});

const RiskCategoryUpdateSchema = z.object({
  id: z.string(),
  weight: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Build query
    const whereClause: any = {};
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }
    if (!includeInactive) {
      whereClause.isActive = true;
    }

    // Fetch risk categories with their factors
    const categories = await prisma.riskCategory.findMany({
      where: { isActive: true },
      include: {
        riskFactors: {
          where: whereClause,
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching risk factors:', error);

    if (error instanceof DatabaseError) {
      return handleDatabaseError(error);
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { riskFactors, riskCategories } = body;

    const results = {
      riskFactors: [],
      riskCategories: [],
      errors: [],
    };

    // Update risk factors
    if (riskFactors && Array.isArray(riskFactors)) {
      for (const factor of riskFactors) {
        try {
          const validatedData = RiskFactorUpdateSchema.parse(factor);
          const updated = await prisma.riskFactor.update({
            where: { id: validatedData.id },
            data: validatedData,
          });
          results.riskFactors.push(updated);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          results.errors.push(`Risk factor ${factor.id}: ${errorMessage}`);
        }
      }
    }

    // Update risk categories
    if (riskCategories && Array.isArray(riskCategories)) {
      for (const category of riskCategories) {
        try {
          const validatedData = RiskCategoryUpdateSchema.parse(category);
          const updated = await prisma.riskCategory.update({
            where: { id: validatedData.id },
            data: validatedData,
          });
          results.riskCategories.push(updated);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          results.errors.push(`Risk category ${category.id}: ${errorMessage}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error updating risk factors:', error);

    if (error instanceof DatabaseError) {
      return handleDatabaseError(error);
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
