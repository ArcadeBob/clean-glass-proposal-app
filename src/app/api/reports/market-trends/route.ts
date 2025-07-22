import { getMarketTrends } from '@/lib/calculations/market-analysis';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const marketData = await prisma.marketData.findMany({
      where: { dataType: 'COST_PER_SF' },
      select: {
        value: true,
        region: true,
        notes: true, // projectType may be in notes
        effectiveDate: true,
      },
    });
    const formatted = marketData.map((d: any) => ({
      value: Number(d.value),
      region: d.region,
      projectType: d.notes || undefined,
      effectiveDate: d.effectiveDate
        ? d.effectiveDate.toISOString().slice(0, 10)
        : undefined,
    }));
    const trends = getMarketTrends(formatted);
    return NextResponse.json({ success: true, trends });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
