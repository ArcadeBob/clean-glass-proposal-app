import { benchmarkProjectCost } from '@/lib/calculations/market-analysis';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { region, projectType, costPerSF, effectiveDate } = body;
    if (!region || typeof costPerSF !== 'number') {
      return NextResponse.json(
        { success: false, error: 'region and costPerSF are required.' },
        { status: 400 }
      );
    }
    // Fetch all market data for COST_PER_SF
    const marketData = await prisma.marketData.findMany({
      where: { dataType: 'COST_PER_SF' },
      select: { value: true, region: true, notes: true, effectiveDate: true },
    });
    // Optionally parse projectType from notes if needed
    const formatted = marketData
      .filter(d => typeof d.region === 'string' && d.region)
      .map(d => ({
        value: Number(d.value),
        region: d.region as string,
        projectType: d.notes || undefined,
        effectiveDate: d.effectiveDate
          ? d.effectiveDate.toISOString().slice(0, 10)
          : undefined,
      }));
    const result = benchmarkProjectCost(
      { region, projectType, costPerSF, effectiveDate },
      formatted
    );
    return NextResponse.json({ success: true, result });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
