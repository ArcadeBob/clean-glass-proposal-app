import { analyzeMarketConditions } from '@/lib/calculations/market-analysis';

describe('Market Analysis', () => {
  describe('analyzeMarketConditions', () => {
    it('should return market analysis for valid inputs', () => {
      const result = analyzeMarketConditions({
        region: 'Northeast',
        materialType: 'glass',
        projectType: 'commercial',
        squareFootage: 1000,
      });

      expect(result).toMatchObject({
        materialCostTrend: 0.08,
        laborAvailabilityIndex: 70,
        regionalAdjustment: 1.1,
        marketConditionScore: expect.any(Number),
        notes: expect.any(Array),
      });
    });

    it('should handle unknown regions with defaults', () => {
      const result = analyzeMarketConditions({
        region: 'Unknown',
        materialType: 'glass',
      });

      expect(result.regionalAdjustment).toBe(1.0);
      expect(result.laborAvailabilityIndex).toBe(70);
      expect(result.notes).toContain(
        "No regional adjustment for 'Unknown', using 1.0."
      );
    });

    it('should handle unknown materials with defaults', () => {
      const result = analyzeMarketConditions({
        region: 'Northeast',
        materialType: 'unknown',
      });

      expect(result.materialCostTrend).toBe(0.06);
      expect(result.notes).toContain(
        "No specific trend for material 'unknown', using default 6%."
      );
    });

    it('should calculate market condition score correctly', () => {
      const result = analyzeMarketConditions({
        region: 'South',
        materialType: 'steel',
      });

      // South has lower labor availability (60) and steel has high cost trend (0.12)
      // This should result in a lower market condition score
      expect(result.marketConditionScore).toBeLessThan(100);
      expect(result.marketConditionScore).toBeGreaterThan(0);
    });

    it('should handle edge cases gracefully', () => {
      const result = analyzeMarketConditions({
        region: '',
        materialType: '',
      });

      expect(result).toMatchObject({
        materialCostTrend: 0.06,
        laborAvailabilityIndex: 70,
        regionalAdjustment: 1.0,
        marketConditionScore: expect.any(Number),
        notes: expect.any(Array),
      });
    });
  });
});
