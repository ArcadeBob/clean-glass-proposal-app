import { createAuditLog } from '@/lib/audit-trail';
import {
  BulkMarketDataSchema,
  DataConsistencySchema,
  MarketDataQuerySchema,
  MarketDataRecordSchema,
} from '@/lib/validation/market-data-schemas';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const queryValidation = MarketDataQuerySchema.safeParse({
      region: searchParams.get('region') || undefined,
      projectType: searchParams.get('projectType') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      minValue: searchParams.get('minValue')
        ? Number(searchParams.get('minValue'))
        : undefined,
      maxValue: searchParams.get('maxValue')
        ? Number(searchParams.get('maxValue'))
        : undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    });

    if (!queryValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: queryValidation.error.errors,
        },
        { status: 400 }
      );
    }

    const query = queryValidation.data;
    const where: any = {
      dataType: 'COST_PER_SF',
    };

    if (query.region) where.region = query.region;
    if (query.projectType)
      where.notes = { contains: query.projectType, mode: 'insensitive' };
    if (query.startDate || query.endDate) {
      where.effectiveDate = {};
      if (query.startDate) where.effectiveDate.gte = new Date(query.startDate);
      if (query.endDate) where.effectiveDate.lte = new Date(query.endDate);
    }
    if (query.minValue !== undefined)
      where.value = { ...where.value, gte: query.minValue };
    if (query.maxValue !== undefined)
      where.value = { ...where.value, lte: query.maxValue };

    const data = await prisma.marketData.findMany({
      where,
      orderBy: { effectiveDate: 'desc' },
      take: query.limit || 100,
      skip: query.offset || 0,
    });

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        limit: query.limit || 100,
        offset: query.offset || 0,
        total: data.length,
      },
    });
  } catch (error: any) {
    console.error('GET /api/market-data/cost-per-sf error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve market data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate bulk data structure
    const bulkValidation = BulkMarketDataSchema.safeParse({ records: body });
    if (!bulkValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request format',
          details: bulkValidation.error.errors,
        },
        { status: 400 }
      );
    }

    const results = {
      inserted: 0,
      skipped: 0,
      errors: [] as Array<{ index: number; error: string }>,
      consistencyWarnings: [] as Array<{ index: number; warning: string }>,
    };

    for (const [i, record] of bulkValidation.data.records.entries()) {
      try {
        // Enhanced validation with business logic
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

        // Data consistency check - get historical data for the region
        const historicalData = await prisma.marketData.findMany({
          where: {
            dataType: 'COST_PER_SF',
            region: validRecord.region,
            effectiveDate: {
              lt: new Date(validRecord.effectiveDate),
            },
          },
          orderBy: { effectiveDate: 'desc' },
          take: 50, // Last 50 records for statistical analysis
        });

        if (historicalData.length > 0) {
          const consistencyCheck = DataConsistencySchema.safeParse({
            region: validRecord.region,
            value: validRecord.value,
            effectiveDate: validRecord.effectiveDate,
            historicalData: historicalData.map(d => ({
              value: d.value,
              effectiveDate: d.effectiveDate.toISOString(),
            })),
          });

          if (!consistencyCheck.success) {
            results.consistencyWarnings.push({
              index: i,
              warning:
                consistencyCheck.error.errors[0]?.message ||
                'Data consistency check failed',
            });
          }
        }

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
        const newRecord = await prisma.marketData.create({
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

        // Audit logging for data modification
        await createAuditLog('CREATE', 'MarketData', newRecord.id, {
          newValues: {
            region: validRecord.region,
            value: validRecord.value,
            unit: validRecord.unit || 'SF',
            effectiveDate: validRecord.effectiveDate,
            source: validRecord.source,
            notes: validRecord.notes,
          },
          metadata: {
            dataType: 'COST_PER_SF',
            recordIndex: i,
            consistencyWarning: results.consistencyWarnings.some(
              w => w.index === i
            ),
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

    return NextResponse.json({
      success: true,
      ...results,
      summary: {
        total: bulkValidation.data.records.length,
        inserted: results.inserted,
        skipped: results.skipped,
        consistencyWarnings: results.consistencyWarnings.length,
      },
    });
  } catch (e: any) {
    console.error('POST /api/market-data/cost-per-sf error:', e);
    return NextResponse.json(
      { success: false, error: 'Failed to process market data' },
      { status: 500 }
    );
  }
}
