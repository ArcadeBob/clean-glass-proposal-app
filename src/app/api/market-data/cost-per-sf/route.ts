import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

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

    const requiredFields = ['region', 'value', 'effectiveDate'];
    const results = {
      inserted: 0,
      skipped: 0,
      errors: [] as Array<{ index: number; error: string }>,
    };
    for (const [i, record] of body.entries()) {
      // Validate required fields
      if (
        !requiredFields.every(
          f => record[f] !== undefined && record[f] !== null
        )
      ) {
        results.skipped++;
        results.errors.push({ index: i, error: 'Missing required fields.' });
        continue;
      }
      // Prevent duplicates (region, value, effectiveDate)
      const exists = await prisma.marketData.findFirst({
        where: {
          dataType: 'COST_PER_SF',
          region: record.region,
          value: record.value,
          effectiveDate: new Date(record.effectiveDate),
        },
      });
      if (exists) {
        results.skipped++;
        results.errors.push({ index: i, error: 'Duplicate entry.' });
        continue;
      }
      // Insert record
      await prisma.marketData.create({
        data: {
          dataType: 'COST_PER_SF',
          region: record.region,
          value: record.value,
          unit: record.unit || 'SF',
          source: record.source || null,
          effectiveDate: new Date(record.effectiveDate),
          notes: record.notes || null,
        },
      });
      results.inserted++;
    }
    return NextResponse.json({ success: true, ...results });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
