import { auth } from '@/lib/auth';
import { handleDatabaseError } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for bulk operations
const BulkOperationSchema = z.object({
  action: z.enum(['delete', 'status']),
  proposalIds: z
    .array(z.string())
    .min(1, 'At least one proposal ID is required'),
  status: z
    .enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'])
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const validationResult = BulkOperationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: 'Invalid request data',
          errors: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { action, proposalIds, status } = validationResult.data;

    // Import Prisma
    const { prisma } = await import('@/lib/db');

    // Verify all proposals belong to the current user
    const userProposals = await prisma.proposal.findMany({
      where: {
        id: { in: proposalIds },
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (userProposals.length !== proposalIds.length) {
      return NextResponse.json(
        { message: 'Some proposals not found or access denied' },
        { status: 403 }
      );
    }

    let result;

    if (action === 'delete') {
      // Bulk delete proposals
      result = await prisma.proposal.deleteMany({
        where: {
          id: { in: proposalIds },
          userId: session.user.id,
        },
      });

      return NextResponse.json({
        message: `Successfully deleted ${result.count} proposal(s)`,
        deletedCount: result.count,
      });
    } else if (action === 'status' && status) {
      // Bulk update status
      result = await prisma.proposal.updateMany({
        where: {
          id: { in: proposalIds },
          userId: session.user.id,
        },
        data: {
          status: status,
        },
      });

      return NextResponse.json({
        message: `Successfully updated status for ${result.count} proposal(s)`,
        updatedCount: result.count,
        newStatus: status,
      });
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/proposals/bulk error:', error);

    const dbError = handleDatabaseError(error);
    return NextResponse.json(
      { message: dbError.message },
      { status: dbError.statusCode }
    );
  }
}
