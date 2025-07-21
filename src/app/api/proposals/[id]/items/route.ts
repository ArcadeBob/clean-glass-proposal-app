import { ProposalItemSchema } from '@/lib/api-schemas';
import { auth } from '@/lib/auth';
import {
  createProposalItem,
  DatabaseError,
  getProposalById,
  getProposalItems,
  handleDatabaseError,
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

    // Check if proposal exists and user owns it
    const proposal = await getProposalById(id, session.user.id);
    if (!proposal) {
      return NextResponse.json(
        { message: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Get proposal items
    const items = await getProposalItems(id);

    return NextResponse.json({ data: items });
  } catch (error) {
    console.error('GET /api/proposals/[id]/items error:', error);

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

export async function POST(
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
    const proposal = await getProposalById(id, session.user.id);
    if (!proposal) {
      return NextResponse.json(
        { message: 'Proposal not found' },
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

    // Create proposal item
    const item = await createProposalItem({
      ...validationResult.data,
      proposalId: id,
    });

    return NextResponse.json(
      {
        message: 'Proposal item created successfully',
        data: item,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/proposals/[id]/items error:', error);

    const dbError = handleDatabaseError(error);
    return NextResponse.json(
      { message: dbError.message },
      { status: dbError.statusCode }
    );
  }
}
