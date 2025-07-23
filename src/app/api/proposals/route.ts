import {
  createCreatedResponse,
  createDatabaseErrorResponse,
  createInternalErrorResponse,
  createPaginatedResponse,
  createUnauthorizedResponse,
  createValidationErrorResponse,
} from '@/lib/api-response';
import {
  CreateProposalWithItemsSchema,
  ProposalQuerySchema,
} from '@/lib/api-schemas';
import { auth } from '@/lib/auth';
import {
  DatabaseError,
  createProposal,
  createProposalWithItems,
  getProposalsByUserId,
} from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return createUnauthorizedResponse();
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const queryResult = ProposalQuerySchema.safeParse(queryParams);
    if (!queryResult.success) {
      const errors = queryResult.error.errors.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      return createValidationErrorResponse(errors, 'Invalid query parameters');
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

    return createPaginatedResponse(paginatedProposals, {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error('GET /api/proposals error:', error);

    if (error instanceof DatabaseError) {
      return createDatabaseErrorResponse(error);
    }

    return createInternalErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return createUnauthorizedResponse();
    }

    // Parse request body
    const body = await request.json();
    const validationResult = CreateProposalWithItemsSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      return createValidationErrorResponse(errors, 'Invalid request data');
    }

    const { items, ...proposalData } = validationResult.data;

    // Create proposal with items using transaction
    const proposal =
      items && items.length > 0
        ? await createProposalWithItems(proposalData, items, session.user.id)
        : await createProposal(proposalData, session.user.id);

    return createCreatedResponse(proposal, 'Proposal created successfully');
  } catch (error) {
    console.error('POST /api/proposals error:', error);

    return createDatabaseErrorResponse(error);
  }
}
