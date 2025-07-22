import { recommendPackages } from '@/lib/calculations/market-analysis';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      baseCost,
      marketAverage,
      marketPercentile,
      winProbability,
      minMargin,
      maxMargin,
    } = body;
    if (
      typeof baseCost !== 'number' ||
      typeof marketAverage !== 'number' ||
      typeof marketPercentile !== 'number' ||
      typeof winProbability !== 'number'
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'baseCost, marketAverage, marketPercentile, and winProbability are required and must be numbers.',
        },
        { status: 400 }
      );
    }
    const packages = recommendPackages({
      baseCost,
      marketAverage,
      marketPercentile,
      winProbability,
      minMargin,
      maxMargin,
    });
    return NextResponse.json({ success: true, packages });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
