import {
  BulkMarketDataSchema,
  DataConsistencySchema,
  MARKET_DATA_CONSTRAINTS,
  MarketDataQuerySchema,
  MarketDataRecordSchema,
  VALID_PROJECT_TYPES,
  VALID_REGIONS,
} from '@/lib/validation/market-data-schemas';

describe('Market Data Validation Schemas', () => {
  describe('MarketDataRecordSchema', () => {
    const validRecord = {
      region: 'Northeast',
      value: 50,
      effectiveDate: '2024-01-15',
      unit: 'SF',
      source: 'Market Research',
      notes: 'Commercial project data',
    };

    describe('Region Validation', () => {
      it('should accept valid region names', () => {
        const result = MarketDataRecordSchema.safeParse(validRecord);
        expect(result.success).toBe(true);
      });

      it('should accept custom region names with valid characters', () => {
        const customRegionRecord = { ...validRecord, region: 'New York Metro' };
        const result = MarketDataRecordSchema.safeParse(customRegionRecord);
        expect(result.success).toBe(true);
      });

      it('should reject empty region', () => {
        const invalidRecord = { ...validRecord, region: '' };
        const result = MarketDataRecordSchema.safeParse(invalidRecord);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0]?.message).toBe('Region is required');
      });

      it('should reject region with invalid characters', () => {
        const invalidRecord = { ...validRecord, region: 'Region123!' };
        const result = MarketDataRecordSchema.safeParse(invalidRecord);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0]?.message).toContain(
          'Region must be a valid region name'
        );
      });

      it('should reject region that is too long', () => {
        const invalidRecord = { ...validRecord, region: 'A'.repeat(51) };
        const result = MarketDataRecordSchema.safeParse(invalidRecord);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0]?.message).toBe('Region name too long');
      });
    });

    describe('Value Validation', () => {
      it('should accept values within reasonable range', () => {
        const result = MarketDataRecordSchema.safeParse(validRecord);
        expect(result.success).toBe(true);
      });

      it('should accept minimum allowed value', () => {
        const minRecord = {
          ...validRecord,
          value: MARKET_DATA_CONSTRAINTS.COST_PER_SF.REASONABLE_MIN,
        };
        const result = MarketDataRecordSchema.safeParse(minRecord);
        expect(result.success).toBe(true);
      });

      it('should accept maximum allowed value', () => {
        const maxRecord = {
          ...validRecord,
          value: MARKET_DATA_CONSTRAINTS.COST_PER_SF.REASONABLE_MAX,
        };
        const result = MarketDataRecordSchema.safeParse(maxRecord);
        expect(result.success).toBe(true);
      });

      it('should reject negative values', () => {
        const invalidRecord = { ...validRecord, value: -10 };
        const result = MarketDataRecordSchema.safeParse(invalidRecord);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0]?.message).toContain(
          'Value must be at least'
        );
      });

      it('should reject values below minimum', () => {
        const invalidRecord = {
          ...validRecord,
          value: MARKET_DATA_CONSTRAINTS.COST_PER_SF.MIN - 1,
        };
        const result = MarketDataRecordSchema.safeParse(invalidRecord);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0]?.message).toContain(
          'Value must be at least'
        );
      });

      it('should reject values above maximum', () => {
        const invalidRecord = {
          ...validRecord,
          value: MARKET_DATA_CONSTRAINTS.COST_PER_SF.MAX + 1,
        };
        const result = MarketDataRecordSchema.safeParse(invalidRecord);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0]?.message).toContain(
          'Value must be at most'
        );
      });

      it('should reject non-finite values', () => {
        const invalidRecord = { ...validRecord, value: Infinity };
        const result = MarketDataRecordSchema.safeParse(invalidRecord);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0]?.message).toBe(
          'Value must be a finite number'
        );
      });

      it('should warn about values outside reasonable range', () => {
        const warningRecord = { ...validRecord, value: 12 }; // Below reasonable minimum (15)
        const result = MarketDataRecordSchema.safeParse(warningRecord);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0]?.message).toContain(
          'outside reasonable range'
        );
      });
    });

    describe('Date Validation', () => {
      it('should accept valid dates within range', () => {
        const result = MarketDataRecordSchema.safeParse(validRecord);
        expect(result.success).toBe(true);
      });

      it('should reject invalid date strings', () => {
        const invalidRecord = { ...validRecord, effectiveDate: 'invalid-date' };
        const result = MarketDataRecordSchema.safeParse(invalidRecord);
        expect(result.success).toBe(false);
      });

      it('should reject dates too far in the future', () => {
        const futureDate = new Date();
        futureDate.setDate(
          futureDate.getDate() +
            MARKET_DATA_CONSTRAINTS.DATE.MAX_FUTURE_DAYS +
            1
        );
        const invalidRecord = {
          ...validRecord,
          effectiveDate: futureDate.toISOString().split('T')[0],
        };
        const result = MarketDataRecordSchema.safeParse(invalidRecord);
        expect(result.success).toBe(false);
      });

      it('should reject dates too far in the past', () => {
        const pastDate = new Date();
        pastDate.setDate(
          pastDate.getDate() - MARKET_DATA_CONSTRAINTS.DATE.MIN_PAST_DAYS - 1
        );
        const invalidRecord = {
          ...validRecord,
          effectiveDate: pastDate.toISOString().split('T')[0],
        };
        const result = MarketDataRecordSchema.safeParse(invalidRecord);
        expect(result.success).toBe(false);
      });
    });

    describe('Unit Validation', () => {
      it('should accept valid units', () => {
        const result = MarketDataRecordSchema.safeParse(validRecord);
        expect(result.success).toBe(true);
      });

      it('should accept undefined unit', () => {
        const { unit, ...noUnitRecord } = validRecord;
        const result = MarketDataRecordSchema.safeParse(noUnitRecord);
        expect(result.success).toBe(true);
      });

      it('should reject invalid units', () => {
        const invalidRecord = { ...validRecord, unit: 'invalid-unit' };
        const result = MarketDataRecordSchema.safeParse(invalidRecord);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0]?.message).toContain(
          'Unit must be one of'
        );
      });
    });

    describe('String Field Validation', () => {
      it('should accept valid source and notes', () => {
        const result = MarketDataRecordSchema.safeParse(validRecord);
        expect(result.success).toBe(true);
      });

      it('should reject source that is too long', () => {
        const invalidRecord = {
          ...validRecord,
          source: 'A'.repeat(
            MARKET_DATA_CONSTRAINTS.INPUT.MAX_STRING_LENGTH + 1
          ),
        };
        const result = MarketDataRecordSchema.safeParse(invalidRecord);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0]?.message).toContain('Source must be');
      });

      it('should reject notes that are too long', () => {
        const invalidRecord = {
          ...validRecord,
          notes: 'A'.repeat(
            MARKET_DATA_CONSTRAINTS.INPUT.MAX_STRING_LENGTH + 1
          ),
        };
        const result = MarketDataRecordSchema.safeParse(invalidRecord);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0]?.message).toContain('Notes must be');
      });

      it('should reject notes with malicious content', () => {
        const invalidRecord = {
          ...validRecord,
          notes: '<script>alert("xss")</script>',
        };
        const result = MarketDataRecordSchema.safeParse(invalidRecord);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0]?.message).toBe(
          'Notes cannot contain potentially malicious content'
        );
      });

      it('should reject notes with javascript protocol', () => {
        const invalidRecord = {
          ...validRecord,
          notes: 'javascript:alert("xss")',
        };
        const result = MarketDataRecordSchema.safeParse(invalidRecord);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0]?.message).toBe(
          'Notes cannot contain potentially malicious content'
        );
      });
    });
  });

  describe('BulkMarketDataSchema', () => {
    const validRecords = [
      {
        region: 'Northeast',
        value: 50,
        effectiveDate: '2024-01-15',
        unit: 'SF',
      },
      {
        region: 'Southwest',
        value: 75,
        effectiveDate: '2024-01-16',
        unit: 'SF',
      },
    ];

    it('should accept valid bulk data', () => {
      const result = BulkMarketDataSchema.safeParse({ records: validRecords });
      expect(result.success).toBe(true);
    });

    it('should reject empty records array', () => {
      const result = BulkMarketDataSchema.safeParse({ records: [] });
      expect(result.success).toBe(false);
      expect(result.error?.errors[0]?.message).toBe(
        'At least one record is required'
      );
    });

    it('should reject too many records', () => {
      const tooManyRecords = Array(
        MARKET_DATA_CONSTRAINTS.INPUT.MAX_RECORDS_PER_REQUEST + 1
      )
        .fill(null)
        .map((_, i) => ({
          region: 'Northeast',
          value: 50 + i,
          effectiveDate: '2024-01-15',
        }));

      const result = BulkMarketDataSchema.safeParse({
        records: tooManyRecords,
      });
      expect(result.success).toBe(false);
      expect(result.error?.errors[0]?.message).toContain('Maximum');
    });

    it('should reject invalid records in bulk', () => {
      const invalidRecords = [
        { ...validRecords[0] },
        { region: '', value: 50, effectiveDate: '2024-01-15' }, // Invalid record
      ];

      const result = BulkMarketDataSchema.safeParse({
        records: invalidRecords,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('MarketDataQuerySchema', () => {
    it('should accept valid query parameters', () => {
      const validQuery = {
        region: 'Northeast',
        projectType: 'COMMERCIAL',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        minValue: 25,
        maxValue: 100,
        limit: '50',
        offset: '0',
      };

      const result = MarketDataQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it('should accept partial query parameters', () => {
      const partialQuery = {
        region: 'Northeast',
        limit: '25',
      };

      const result = MarketDataQuerySchema.safeParse(partialQuery);
      expect(result.success).toBe(true);
    });

    it('should reject invalid limit values', () => {
      const invalidQuery = { limit: '0' };
      const result = MarketDataQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it('should reject limit values that are too high', () => {
      const invalidQuery = { limit: '1001' };
      const result = MarketDataQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it('should reject negative offset values', () => {
      const invalidQuery = { offset: '-1' };
      const result = MarketDataQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  describe('DataConsistencySchema', () => {
    const baseData = {
      region: 'Northeast',
      value: 50,
      effectiveDate: '2024-01-15',
      historicalData: [
        { value: 45, effectiveDate: '2024-01-01' },
        { value: 47, effectiveDate: '2024-01-08' },
        { value: 48, effectiveDate: '2024-01-10' },
      ],
    };

    it('should accept data within normal statistical range', () => {
      const result = DataConsistencySchema.safeParse(baseData);
      expect(result.success).toBe(true);
    });

    it('should accept data with no historical data', () => {
      const noHistoryData = { ...baseData, historicalData: [] };
      const result = DataConsistencySchema.safeParse(noHistoryData);
      expect(result.success).toBe(true);
    });

    it('should reject data that deviates significantly from historical data', () => {
      // Value of 200 is way outside the normal range of 45-48
      const outlierData = { ...baseData, value: 200 };
      const result = DataConsistencySchema.safeParse(outlierData);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0]?.message).toContain(
        'deviates significantly'
      );
    });

    it('should accept data that is within 3 standard deviations', () => {
      // Calculate a value that's just within 3 standard deviations
      const historicalValues = baseData.historicalData.map(d => d.value);
      const mean =
        historicalValues.reduce((sum, val) => sum + val, 0) /
        historicalValues.length;
      const stdDev = Math.sqrt(
        historicalValues.reduce(
          (sum, val) => sum + Math.pow(val - mean, 2),
          0
        ) / historicalValues.length
      );

      const acceptableValue = mean + 2.9 * stdDev; // Just under 3 standard deviations
      const acceptableData = { ...baseData, value: acceptableValue };

      const result = DataConsistencySchema.safeParse(acceptableData);
      expect(result.success).toBe(true);
    });
  });

  describe('Constants and Constraints', () => {
    it('should have valid region constants', () => {
      expect(VALID_REGIONS).toBeInstanceOf(Array);
      expect(VALID_REGIONS.length).toBeGreaterThan(0);
      expect(VALID_REGIONS).toContain('Northeast');
      expect(VALID_REGIONS).toContain('Southwest');
    });

    it('should have valid project type constants', () => {
      expect(VALID_PROJECT_TYPES).toBeInstanceOf(Array);
      expect(VALID_PROJECT_TYPES.length).toBeGreaterThan(0);
      expect(VALID_PROJECT_TYPES).toContain('COMMERCIAL');
      expect(VALID_PROJECT_TYPES).toContain('RESIDENTIAL');
    });

    it('should have reasonable cost constraints', () => {
      expect(MARKET_DATA_CONSTRAINTS.COST_PER_SF.MIN).toBeLessThan(
        MARKET_DATA_CONSTRAINTS.COST_PER_SF.MAX
      );
      expect(
        MARKET_DATA_CONSTRAINTS.COST_PER_SF.REASONABLE_MIN
      ).toBeGreaterThanOrEqual(MARKET_DATA_CONSTRAINTS.COST_PER_SF.MIN);
      expect(
        MARKET_DATA_CONSTRAINTS.COST_PER_SF.REASONABLE_MAX
      ).toBeLessThanOrEqual(MARKET_DATA_CONSTRAINTS.COST_PER_SF.MAX);
    });

    it('should have valid date constraints', () => {
      expect(MARKET_DATA_CONSTRAINTS.DATE.MAX_FUTURE_DAYS).toBeGreaterThan(0);
      expect(MARKET_DATA_CONSTRAINTS.DATE.MIN_PAST_DAYS).toBeGreaterThan(0);
    });

    it('should have valid input constraints', () => {
      expect(
        MARKET_DATA_CONSTRAINTS.INPUT.MAX_RECORDS_PER_REQUEST
      ).toBeGreaterThan(0);
      expect(MARKET_DATA_CONSTRAINTS.INPUT.MAX_STRING_LENGTH).toBeGreaterThan(
        0
      );
      expect(
        MARKET_DATA_CONSTRAINTS.INPUT.ALLOWED_UNITS.length
      ).toBeGreaterThan(0);
    });
  });
});
