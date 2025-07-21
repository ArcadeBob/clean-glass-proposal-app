import { UpdateGeneralContractorSchema } from '@/lib/api-schemas';
import { auth } from '@/lib/auth';
import {
  DatabaseError,
  deleteGeneralContractor,
  getGeneralContractorById,
  handleDatabaseError,
  updateGeneralContractor,
} from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get general contractor by ID
    const contractor = await getGeneralContractorById(id);

    if (!contractor) {
      return NextResponse.json(
        { message: 'General contractor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: contractor });
  } catch (error) {
    console.error('GET /api/contractors/[id] error:', error);

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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if contractor exists
    const existingContractor = await getGeneralContractorById(id);
    if (!existingContractor) {
      return NextResponse.json(
        { message: 'General contractor not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validationResult = UpdateGeneralContractorSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: 'Invalid request data',
          errors: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    // Update general contractor
    const updatedContractor = await updateGeneralContractor(
      id,
      validationResult.data
    );

    return NextResponse.json({
      message: 'General contractor updated successfully',
      data: updatedContractor,
    });
  } catch (error) {
    console.error('PUT /api/contractors/[id] error:', error);

    const dbError = handleDatabaseError(error);
    return NextResponse.json(
      { message: dbError.message },
      { status: dbError.statusCode }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if contractor exists
    const existingContractor = await getGeneralContractorById(id);
    if (!existingContractor) {
      return NextResponse.json(
        { message: 'General contractor not found' },
        { status: 404 }
      );
    }

    // Check if contractor is being used by any proposals
    const { prisma } = await import('@/lib/db');
    const proposalsUsingContractor = await prisma.proposal.findMany({
      where: { generalContractorId: id },
      select: { id: true, title: true },
    });

    if (proposalsUsingContractor.length > 0) {
      return NextResponse.json(
        {
          message:
            'Cannot delete general contractor that is associated with proposals',
          proposals: proposalsUsingContractor,
        },
        { status: 400 }
      );
    }

    // Delete general contractor
    await deleteGeneralContractor(id);

    return NextResponse.json({
      message: 'General contractor deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/contractors/[id] error:', error);

    const dbError = handleDatabaseError(error);
    return NextResponse.json(
      { message: dbError.message },
      { status: dbError.statusCode }
    );
  }
}
