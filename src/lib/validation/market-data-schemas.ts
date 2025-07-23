import { z } from 'zod';

// Business logic constants for validation
export const MARKET_DATA_CONSTRAINTS = {
  // Cost per square foot ranges (in USD)
  COST_PER_SF: {
    MIN: 5, // $5/SF minimum (very basic work)
    MAX: 500, // $500/SF maximum (premium/luxury work)
    REASONABLE_MIN: 15, // $15/SF reasonable minimum
    REASONABLE_MAX: 200, // $200/SF reasonable maximum
  },
  // Regional multipliers
  REGIONAL_MULTIPLIERS: {
    Northeast: { min: 0.8, max: 1.5 },
    Midwest: { min: 0.7, max: 1.3 },
    South: { min: 0.6, max: 1.2 },
    West: { min: 0.8, max: 1.4 },
    Southeast: { min: 0.6, max: 1.2 },
    Southwest: { min: 0.7, max: 1.3 },
    Northwest: { min: 0.8, max: 1.4 },
    Central: { min: 0.7, max: 1.3 },
  },
  // Date constraints
  DATE: {
    MAX_FUTURE_DAYS: 365, // Can't be more than 1 year in future
    MIN_PAST_DAYS: 3650, // Can't be more than 10 years in past
  },
  // Input constraints
  INPUT: {
    MAX_RECORDS_PER_REQUEST: 100,
    MAX_STRING_LENGTH: 1000,
    ALLOWED_UNITS: ['SF', 'sqft', 'sq_ft', 'square_feet', 'USD/SF', '$/SF'],
  },
} as const;

// Valid region names
export const VALID_REGIONS = [
  'Northeast',
  'Midwest',
  'South',
  'West',
  'Southeast',
  'Southwest',
  'Northwest',
  'Central',
  'National',
  'International',
] as const;

// Valid project types
export const VALID_PROJECT_TYPES = [
  'COMMERCIAL',
  'RESIDENTIAL',
  'INDUSTRIAL',
  'INSTITUTIONAL',
  'RETAIL',
  'HOSPITALITY',
  'HEALTHCARE',
  'EDUCATIONAL',
  'GOVERNMENT',
  'MIXED_USE',
  'OTHER',
] as const;

// Enhanced market data record schema with business logic validation
export const MarketDataRecordSchema = z.object({
  region: z
    .string()
    .min(1, 'Region is required')
    .max(50, 'Region name too long')
    .refine(
      val => VALID_REGIONS.includes(val as any) || val.match(/^[A-Za-z\s\-]+$/),
      {
        message:
          'Region must be a valid region name or contain only letters, spaces, and hyphens',
      }
    ),
  value: z
    .number()
    .finite('Value must be a finite number')
    .min(
      MARKET_DATA_CONSTRAINTS.COST_PER_SF.MIN,
      `Value must be at least $${MARKET_DATA_CONSTRAINTS.COST_PER_SF.MIN}/SF`
    )
    .max(
      MARKET_DATA_CONSTRAINTS.COST_PER_SF.MAX,
      `Value must be at most $${MARKET_DATA_CONSTRAINTS.COST_PER_SF.MAX}/SF`
    )
    .refine(
      val =>
        val >= MARKET_DATA_CONSTRAINTS.COST_PER_SF.REASONABLE_MIN &&
        val <= MARKET_DATA_CONSTRAINTS.COST_PER_SF.REASONABLE_MAX,
      `Value is outside reasonable range ($${MARKET_DATA_CONSTRAINTS.COST_PER_SF.REASONABLE_MIN}-$${MARKET_DATA_CONSTRAINTS.COST_PER_SF.REASONABLE_MAX}/SF). Please verify this is correct.`
    ),
  effectiveDate: z.string().refine(
    val => {
      const date = new Date(val);
      const now = new Date();
      const maxFuture = new Date(
        now.getTime() +
          MARKET_DATA_CONSTRAINTS.DATE.MAX_FUTURE_DAYS * 24 * 60 * 60 * 1000
      );
      const minPast = new Date(
        now.getTime() -
          MARKET_DATA_CONSTRAINTS.DATE.MIN_PAST_DAYS * 24 * 60 * 60 * 1000
      );
      return !isNaN(date.getTime()) && date <= maxFuture && date >= minPast;
    },
    {
      message: `Effective date must be a valid date between ${new Date(Date.now() - MARKET_DATA_CONSTRAINTS.DATE.MIN_PAST_DAYS * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} and ${new Date(Date.now() + MARKET_DATA_CONSTRAINTS.DATE.MAX_FUTURE_DAYS * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`,
    }
  ),
  unit: z
    .string()
    .optional()
    .refine(
      val =>
        !val ||
        MARKET_DATA_CONSTRAINTS.INPUT.ALLOWED_UNITS.includes(val as any),
      {
        message: `Unit must be one of: ${MARKET_DATA_CONSTRAINTS.INPUT.ALLOWED_UNITS.join(', ')}`,
      }
    ),
  source: z
    .string()
    .optional()
    .nullable()
    .refine(
      val =>
        !val || val.length <= MARKET_DATA_CONSTRAINTS.INPUT.MAX_STRING_LENGTH,
      {
        message: `Source must be ${MARKET_DATA_CONSTRAINTS.INPUT.MAX_STRING_LENGTH} characters or less`,
      }
    ),
  notes: z
    .string()
    .optional()
    .nullable()
    .refine(
      val =>
        !val || val.length <= MARKET_DATA_CONSTRAINTS.INPUT.MAX_STRING_LENGTH,
      {
        message: `Notes must be ${MARKET_DATA_CONSTRAINTS.INPUT.MAX_STRING_LENGTH} characters or less`,
      }
    )
    .refine(
      val =>
        !val || (!val.includes('<script>') && !val.includes('javascript:')),
      {
        message: 'Notes cannot contain potentially malicious content',
      }
    ),
});

// Schema for bulk market data operations
export const BulkMarketDataSchema = z.object({
  records: z
    .array(MarketDataRecordSchema)
    .min(1, 'At least one record is required')
    .max(
      MARKET_DATA_CONSTRAINTS.INPUT.MAX_RECORDS_PER_REQUEST,
      `Maximum ${MARKET_DATA_CONSTRAINTS.INPUT.MAX_RECORDS_PER_REQUEST} records per request`
    ),
});

// Schema for market data queries
export const MarketDataQuerySchema = z.object({
  region: z.string().optional(),
  projectType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  limit: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().min(1).max(1000))
    .optional(),
  offset: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().min(0))
    .optional(),
});

// Schema for data consistency validation
export const DataConsistencySchema = z
  .object({
    region: z.string(),
    value: z.number(),
    effectiveDate: z.string(),
    historicalData: z.array(
      z.object({
        value: z.number(),
        effectiveDate: z.string(),
      })
    ),
  })
  .refine(
    data => {
      // Check for significant deviations from historical data
      if (data.historicalData.length === 0) return true;

      const historicalValues = data.historicalData.map(d => d.value);
      const mean =
        historicalValues.reduce((sum, val) => sum + val, 0) /
        historicalValues.length;
      const stdDev = Math.sqrt(
        historicalValues.reduce(
          (sum, val) => sum + Math.pow(val - mean, 2),
          0
        ) / historicalValues.length
      );

      // Allow up to 3 standard deviations from mean
      const zScore = Math.abs(data.value - mean) / stdDev;
      return zScore <= 3;
    },
    {
      message:
        'Value deviates significantly from historical data for this region. Please verify this is correct.',
      path: ['value'],
    }
  );

// Type exports
export type MarketDataRecord = z.infer<typeof MarketDataRecordSchema>;
export type BulkMarketData = z.infer<typeof BulkMarketDataSchema>;
export type MarketDataQuery = z.infer<typeof MarketDataQuerySchema>;
export type DataConsistencyCheck = z.infer<typeof DataConsistencySchema>;
