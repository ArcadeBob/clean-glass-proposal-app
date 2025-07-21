import {
  CreateProposalWithItemsSchema,
  ProposalQuerySchema,
} from '@/lib/api-schemas';
import { auth } from '@/lib/auth';
import {
  createProposal,
  DatabaseError,
  getProposalsByUserId,
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

    const queryResult = ProposalQuerySchema.safeParse(queryParams);
    if (!queryResult.success) {
      return NextResponse.json(
        {
          message: 'Invalid query parameters',
          errors: queryResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      status,
      projectType,
      limit = 50,
      offset = 0,
      search,
    } = queryResult.data;

    // Get proposals for the current user
    let proposals = await getProposalsByUserId(session.user.id);

    // Apply filters
    if (status) {
      proposals = proposals.filter(proposal => proposal.status === status);
    }

    if (projectType) {
      proposals = proposals.filter(
        proposal => proposal.projectType === projectType
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      proposals = proposals.filter(
        proposal =>
          proposal.title.toLowerCase().includes(searchLower) ||
          proposal.projectName?.toLowerCase().includes(searchLower) ||
          proposal.projectAddress?.toLowerCase().includes(searchLower) ||
          proposal.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const total = proposals.length;
    const paginatedProposals = proposals.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginatedProposals,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('GET /api/proposals error:', error);

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
    const validationResult = CreateProposalWithItemsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: 'Invalid request data',
          errors: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { items, ...proposalData } = validationResult.data;

    // Create proposal with items
    const proposal = await createProposal(proposalData, session.user.id);

    // If items are provided, create them
    if (items && items.length > 0) {
      const { prisma } = await import('@/lib/db');

      await prisma.proposalItem.createMany({
        data: items.map(item => ({
          ...item,
          proposalId: proposal.id,
        })),
      });

      // Fetch the proposal again with items
      const proposalWithItems = await prisma.proposal.findUnique({
        where: { id: proposal.id },
        include: {
          generalContractor: true,
          items: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          message: 'Proposal created successfully',
          data: proposalWithItems,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        message: 'Proposal created successfully',
        data: proposal,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/proposals error:', error);

    const dbError = handleDatabaseError(error);
    return NextResponse.json(
      { message: dbError.message },
      { status: dbError.statusCode }
    );
  }
}
