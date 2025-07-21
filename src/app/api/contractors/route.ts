import {
  CreateGeneralContractorSchema,
  GeneralContractorQuerySchema,
} from '@/lib/api-schemas';
import { auth } from '@/lib/auth';
import {
  createGeneralContractor,
  DatabaseError,
  getGeneralContractors,
  handleDatabaseError,
} from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const queryResult = GeneralContractorQuerySchema.safeParse(queryParams);
    if (!queryResult.success) {
      return NextResponse.json(
        {
          message: 'Invalid query parameters',
          errors: queryResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { search, limit = 50, offset = 0 } = queryResult.data;

    // Get all general contractors
    let contractors = await getGeneralContractors();

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      contractors = contractors.filter(
        contractor =>
          contractor.name.toLowerCase().includes(searchLower) ||
          contractor.company?.toLowerCase().includes(searchLower) ||
          contractor.email?.toLowerCase().includes(searchLower) ||
          contractor.address?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const total = contractors.length;
    const paginatedContractors = contractors.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginatedContractors,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('GET /api/contractors error:', error);

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const validationResult = CreateGeneralContractorSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: 'Invalid request data',
          errors: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    // Create general contractor
    const contractor = await createGeneralContractor(validationResult.data);

    return NextResponse.json(
      {
        message: 'General contractor created successfully',
        data: contractor,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/contractors error:', error);

    const dbError = handleDatabaseError(error);
    return NextResponse.json(
      { message: dbError.message },
      { status: dbError.statusCode }
    );
  }
}
