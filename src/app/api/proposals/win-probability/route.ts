import { calculateWinProbability } from '@/lib/calculations/market-analysis';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { costPerSF, riskScore, marketPercentile, projectType, region } =
      body;
    if (
      typeof costPerSF !== 'number' ||
      typeof riskScore !== 'number' ||
      typeof marketPercentile !== 'number'
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'costPerSF, riskScore, and marketPercentile are required and must be numbers.',
        },
        { status: 400 }
      );
    }
    const winProbability = calculateWinProbability({
      costPerSF,
      riskScore,
      marketPercentile,
      projectType,
      region,
    });
    return NextResponse.json({ success: true, winProbability });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
