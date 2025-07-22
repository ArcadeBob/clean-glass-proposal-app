import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const prisma = new PrismaClient();

// Zod schema for a single market data record
const MarketDataRecordSchema = z.object({
  region: z.string().min(1, 'Region is required'),
  value: z.number().finite().min(0, 'Value must be a non-negative number'),
  effectiveDate: z
    .string()
    .refine(val => !isNaN(Date.parse(val)), {
      message: 'effectiveDate must be a valid date string',
    }),
  unit: z.string().optional(),
  source: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region');
  const projectType = searchParams.get('projectType'); // If you want to filter by project type in notes

  const where: any = {
    dataType: 'COST_PER_SF',
  };
  if (region) where.region = region;
  if (projectType) where.notes = { contains: projectType, mode: 'insensitive' };

  const data = await prisma.marketData.findMany({
    where,
    orderBy: { effectiveDate: 'desc' },
  });

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: 'Payload must be an array of records.' },
        { status: 400 }
      );
    }

    const results = {
      inserted: 0,
      skipped: 0,
      errors: [] as Array<{ index: number; error: string }>,
    };
    for (const [i, record] of body.entries()) {
      // Zod validation
      const validation = MarketDataRecordSchema.safeParse(record);
      if (!validation.success) {
        results.skipped++;
        results.errors.push({
          index: i,
          error: validation.error.errors.map(e => e.message).join('; '),
        });
        continue;
      }
      const validRecord = validation.data;
      // Prevent duplicates (region, value, effectiveDate)
      const exists = await prisma.marketData.findFirst({
        where: {
          dataType: 'COST_PER_SF',
          region: validRecord.region,
          value: validRecord.value,
          effectiveDate: new Date(validRecord.effectiveDate),
        },
      });
      if (exists) {
        results.skipped++;
        results.errors.push({ index: i, error: 'Duplicate entry.' });
        continue;
      }
      // Insert record
      try {
        await prisma.marketData.create({
          data: {
            dataType: 'COST_PER_SF',
            region: validRecord.region,
            value: validRecord.value,
            unit: validRecord.unit || 'SF',
            source: validRecord.source || null,
            effectiveDate: new Date(validRecord.effectiveDate),
            notes: validRecord.notes || null,
          },
        });
        results.inserted++;
      } catch (err: any) {
        results.skipped++;
        results.errors.push({
          index: i,
          error: err.message || 'Database error',
        });
      }
    }
    return NextResponse.json({ success: true, ...results });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
