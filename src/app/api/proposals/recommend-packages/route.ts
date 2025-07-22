import { recommendPackages } from '@/lib/calculations/market-analysis';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const RecommendPackagesSchema = z
  .object({
    baseCost: z.number().min(0, 'baseCost must be non-negative'),
    marketAverage: z.number().min(0, 'marketAverage must be non-negative'),
    marketPercentile: z
      .number()
      .min(0, 'marketPercentile must be non-negative'),
    winProbability: z.number().min(0, 'winProbability must be non-negative'),
    minMargin: z.number().min(0).max(100).optional(),
    maxMargin: z.number().min(0).max(100).optional(),
  })
  .refine(
    data =>
      data.minMargin === undefined ||
      data.maxMargin === undefined ||
      data.minMargin <= data.maxMargin,
    {
      message: 'minMargin must be less than or equal to maxMargin',
      path: ['minMargin', 'maxMargin'],
    }
  );

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = RecommendPackagesSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors.map(e => e.message).join('; '),
        },
        { status: 400 }
      );
    }
    const {
      baseCost,
      marketAverage,
      marketPercentile,
      winProbability,
      minMargin,
      maxMargin,
    } = validation.data;
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
