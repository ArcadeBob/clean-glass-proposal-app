import { UpdateProposalSchema } from '@/lib/api-schemas';
import { auth } from '@/lib/auth';
import {
  DatabaseError,
  deleteProposal,
  getProposalById,
  handleDatabaseError,
  updateProposal,
} from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get proposal by ID (ensure user owns it)
    const proposal = await getProposalById(id, session.user.id);

    if (!proposal) {
      return NextResponse.json(
        { message: 'Proposal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: proposal });
  } catch (error) {
    console.error('GET /api/proposals/[id] error:', error);

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Parse request body
    const body = await request.json();
    const validationResult = UpdateProposalSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: 'Invalid request data',
          errors: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    // Check if proposal exists and user owns it
    const existingProposal = await getProposalById(id, session.user.id);
    if (!existingProposal) {
      return NextResponse.json(
        { message: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Update proposal
    const updatedProposal = await updateProposal(
      id,
      validationResult.data,
      session.user.id
    );

    return NextResponse.json({
      message: 'Proposal updated successfully',
      data: updatedProposal,
    });
  } catch (error) {
    console.error('PUT /api/proposals/[id] error:', error);

    const dbError = handleDatabaseError(error);
    return NextResponse.json(
      { message: dbError.message },
      { status: dbError.statusCode }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if proposal exists and user owns it
    const existingProposal = await getProposalById(id, session.user.id);
    if (!existingProposal) {
      return NextResponse.json(
        { message: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Delete proposal (this will cascade delete items)
    await deleteProposal(id, session.user.id);

    return NextResponse.json({ message: 'Proposal deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/proposals/[id] error:', error);

    const dbError = handleDatabaseError(error);
    return NextResponse.json(
      { message: dbError.message },
      { status: dbError.statusCode }
    );
  }
}
