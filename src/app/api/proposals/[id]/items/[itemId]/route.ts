import { ProposalItemSchema } from '@/lib/api-schemas';
import { auth } from '@/lib/auth';
import {
  deleteProposalItem,
  getProposalById,
  handleDatabaseError,
  updateProposalItem,
} from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id, itemId } = await params;

    // Check if proposal exists and user owns it
    const proposal = await getProposalById(id, session.user.id);
    if (!proposal) {
      return NextResponse.json(
        { message: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Check if item exists and belongs to this proposal
    const { prisma } = await import('@/lib/db');
    const existingItem = await prisma.proposalItem.findFirst({
      where: {
        id: itemId,
        proposalId: id,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { message: 'Proposal item not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validationResult = ProposalItemSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: 'Invalid request data',
          errors: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    // Update proposal item
    const updatedItem = await updateProposalItem(itemId, validationResult.data);

    return NextResponse.json({
      message: 'Proposal item updated successfully',
      data: updatedItem,
    });
  } catch (error) {
    console.error('PUT /api/proposals/[id]/items/[itemId] error:', error);

    const dbError = handleDatabaseError(error);
    return NextResponse.json(
      { message: dbError.message },
      { status: dbError.statusCode }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id, itemId } = await params;

    // Check if proposal exists and user owns it
    const proposal = await getProposalById(id, session.user.id);
    if (!proposal) {
      return NextResponse.json(
        { message: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Check if item exists and belongs to this proposal
    const { prisma } = await import('@/lib/db');
    const existingItem = await prisma.proposalItem.findFirst({
      where: {
        id: itemId,
        proposalId: id,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { message: 'Proposal item not found' },
        { status: 404 }
      );
    }

    // Delete proposal item
    await deleteProposalItem(itemId);

    return NextResponse.json({ message: 'Proposal item deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/proposals/[id]/items/[itemId] error:', error);

    const dbError = handleDatabaseError(error);
    return NextResponse.json(
      { message: dbError.message },
      { status: dbError.statusCode }
    );
  }
}
