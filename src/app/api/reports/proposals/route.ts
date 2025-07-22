import { getProposalStats } from '@/lib/calculations/market-analysis';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const proposals = await prisma.proposal.findMany({
      select: {
        id: true,
        status: true,
        totalAmount: true,
        projectType: true,
        // region: true, // Not in schema; add via join or parsing if needed
        proposalDate: true,
        squareFootage: true,
        profitMargin: true,
        // Add outcome if available in schema
      },
    });
    const formatted = proposals.map((p: any) => ({
      status: p.status,
      costPerSF: p.squareFootage
        ? Number(p.totalAmount) / Number(p.squareFootage)
        : 0,
      margin: Number(p.profitMargin) || 0,
      // region: p.region, // Not in schema
      projectType: p.projectType,
      date: p.proposalDate,
      // outcome: p.outcome, // Uncomment if available
    }));
    const stats = getProposalStats(formatted);
    return NextResponse.json({ success: true, stats });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
