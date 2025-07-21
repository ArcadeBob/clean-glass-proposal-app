import {
  OverheadTier,
  SizeBasedOverheadCalculator,
  calculateSizeBasedOverhead,
  getSizeBasedOverheadRate,
} from '../lib/calculations/size-based-overhead';

describe('Size-Based Overhead Calculator', () => {
  let calculator: SizeBasedOverheadCalculator;

  beforeEach(() => {
    calculator = new SizeBasedOverheadCalculator();
  });

  describe('Default Tiers', () => {
    it('should have correct default tiers', () => {
      const tiers = calculator.getTiers();
      expect(tiers).toHaveLength(5);
      expect(tiers[0]).toEqual({
        maxSize: 50000,
        rate: 0.18,
        description: 'Small projects (<$50k)',
      });
      expect(tiers[4]).toEqual({
        maxSize: Infinity,
        rate: 0.1,
        description: 'Mega projects (>$1M)',
      });
    });
  });

  describe('Tiered Calculation (no smooth scaling)', () => {
    it('should return correct rate for small projects', () => {
      const result = calculator.calculateOverheadRate(25000, false);
      expect(result.rate).toBe(0.18);
      expect(result.method).toBe('tiered');
      expect(result.tier.description).toBe('Small projects (<$50k)');
    });

    it('should return correct rate for medium projects', () => {
      const result = calculator.calculateOverheadRate(100000, false);
      expect(result.rate).toBe(0.16);
      expect(result.method).toBe('tiered');
      expect(result.tier.description).toBe('Medium projects ($50k-$200k)');
    });

    it('should return correct rate for large projects', () => {
      const result = calculator.calculateOverheadRate(300000, false);
      expect(result.rate).toBe(0.14);
      expect(result.method).toBe('tiered');
      expect(result.tier.description).toBe('Large projects ($200k-$500k)');
    });

    it('should return correct rate for very large projects', () => {
      const result = calculator.calculateOverheadRate(750000, false);
      expect(result.rate).toBe(0.12);
      expect(result.method).toBe('tiered');
      expect(result.tier.description).toBe('Very large projects ($500k-$1M)');
    });

    it('should return correct rate for mega projects', () => {
      const result = calculator.calculateOverheadRate(2000000, false);
      expect(result.rate).toBe(0.1);
      expect(result.method).toBe('tiered');
      expect(result.tier.description).toBe('Mega projects (>$1M)');
    });

    it('should handle boundary conditions correctly', () => {
      const result1 = calculator.calculateOverheadRate(50000, false);
      expect(result1.rate).toBe(0.16); // Should use medium tier

      const result2 = calculator.calculateOverheadRate(200000, false);
      expect(result2.rate).toBe(0.14); // Should use large tier
    });
  });

  describe('Smooth Scaling Calculation', () => {
    it('should interpolate between tiers smoothly', () => {
      const result = calculator.calculateOverheadRate(75000, true);
      expect(result.rate).toBeGreaterThan(0.16); // Should be higher than medium tier
      expect(result.rate).toBeLessThan(0.18); // Should be lower than small tier
      expect(result.method).toBe('smooth');
    });

    it('should handle edge cases at tier boundaries', () => {
      const result1 = calculator.calculateOverheadRate(50000, true);
      expect(result1.rate).toBeCloseTo(0.16, 2);

      const result2 = calculator.calculateOverheadRate(200000, true);
      expect(result2.rate).toBeCloseTo(0.14, 2);
    });

    it('should apply smooth curve to interpolation', () => {
      // Test that the curve is not linear
      const midPoint = 125000; // Halfway between 50k and 200k
      const result = calculator.calculateOverheadRate(midPoint, true);
      const linearRate = 0.16 + (0.14 - 0.16) * 0.5; // Linear interpolation
      expect(result.rate).not.toBeCloseTo(linearRate, 2); // Should not be linear
    });

    it('should use exact tier rates for boundary conditions', () => {
      const result1 = calculator.calculateOverheadRate(50000, true);
      expect(result1.rate).toBe(0.16); // Exact boundary should use next tier

      const result2 = calculator.calculateOverheadRate(200000, true);
      expect(result2.rate).toBe(0.14); // Exact boundary should use next tier
    });
  });

  describe('Utility Functions', () => {
    it('should calculate overhead amount correctly with tiered calculation', () => {
      const result = calculateSizeBasedOverhead(100000, 100000, false);
      expect(result.overheadAmount).toBe(16000); // 16% of 100k
      expect(result.overheadRate).toBe(0.16);
      expect(result.method).toBe('tiered');
    });

    it('should calculate overhead amount correctly with smooth scaling', () => {
      const result = calculateSizeBasedOverhead(100000, 100000, true);
      expect(result.overheadAmount).toBeGreaterThan(14000); // Should be interpolated
      expect(result.overheadRate).toBeGreaterThan(0.14);
      expect(result.method).toBe('smooth');
    });

    it('should return correct rate for given project size with tiered calculation', () => {
      const rate = getSizeBasedOverheadRate(100000, false);
      expect(rate).toBe(0.16);
    });

    it('should return interpolated rate for given project size with smooth scaling', () => {
      const rate = getSizeBasedOverheadRate(100000, true);
      expect(rate).toBeGreaterThan(0.14);
      expect(rate).toBeLessThan(0.18);
    });

    it('should handle zero or negative project sizes', () => {
      const result = calculator.calculateOverheadRate(0, true);
      expect(result.rate).toBe(0.18); // Should use first tier
      expect(result.method).toBe('fixed');

      const result2 = calculator.calculateOverheadRate(-1000, true);
      expect(result2.rate).toBe(0.18);
      expect(result2.method).toBe('fixed');
    });
  });

  describe('Custom Tiers', () => {
    it('should work with custom tier configuration', () => {
      const customTiers: OverheadTier[] = [
        { maxSize: 100000, rate: 0.2, description: 'Custom small' },
        { maxSize: 500000, rate: 0.15, description: 'Custom large' },
        { maxSize: Infinity, rate: 0.1, description: 'Custom mega' },
      ];

      const customCalculator = new SizeBasedOverheadCalculator(customTiers);
      const result = customCalculator.calculateOverheadRate(75000, false);
      expect(result.rate).toBe(0.2);
      expect(result.tier.description).toBe('Custom small');
    });

    it('should sort tiers automatically', () => {
      const unsortedTiers: OverheadTier[] = [
        { maxSize: 500000, rate: 0.15, description: 'Large' },
        { maxSize: 100000, rate: 0.2, description: 'Small' },
        { maxSize: Infinity, rate: 0.1, description: 'Mega' },
      ];

      const customCalculator = new SizeBasedOverheadCalculator(unsortedTiers);
      const tiers = customCalculator.getTiers();
      expect(tiers[0].maxSize).toBe(100000);
      expect(tiers[1].maxSize).toBe(500000);
      expect(tiers[2].maxSize).toBe(Infinity);
    });
  });

  describe('Calculation with Breakdown', () => {
    it('should calculate overhead breakdown correctly', () => {
      const overheadAmount = 10000;
      const breakdown = calculator.calculateOverheadBreakdown(overheadAmount);

      expect(breakdown.administrative).toBe(4500); // 45% of 10000
      expect(breakdown.equipment).toBe(3000); // 30% of 10000
      expect(breakdown.insurance).toBe(1500); // 15% of 10000
      expect(breakdown.other).toBe(1000); // 10% of 10000

      // Total should equal original amount
      const total =
        breakdown.administrative +
        breakdown.equipment +
        breakdown.insurance +
        breakdown.other;
      expect(total).toBe(overheadAmount);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle very large project sizes with tiered calculation', () => {
      const result = calculator.calculateOverheadRate(10000000, false);
      expect(result.rate).toBe(0.1); // Should use the highest tier
      expect(result.method).toBe('tiered');
    });

    it('should handle very large project sizes with smooth scaling', () => {
      const result = calculator.calculateOverheadRate(10000000, true);
      expect(result.rate).toBe(0.12); // Should interpolate between very large and mega tiers
      expect(result.method).toBe('smooth');
      expect(result.tier.description).toBe('Mega projects (>$1M)');
    });

    it('should handle single tier configuration', () => {
      const singleTier: OverheadTier[] = [
        { maxSize: Infinity, rate: 0.15, description: 'Single tier' },
      ];

      const customCalculator = new SizeBasedOverheadCalculator(singleTier);
      const result = customCalculator.calculateOverheadRate(100000, true);
      expect(result.rate).toBe(0.15);
      expect(result.method).toBe('smooth');
    });

    it('should handle empty tier configuration', () => {
      const emptyCalculator = new SizeBasedOverheadCalculator([]);
      const result = emptyCalculator.calculateOverheadRate(100000, true);
      expect(result.rate).toBe(0.15); // Should use default rate
      expect(result.method).toBe('fixed');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle typical commercial project with tiered calculation', () => {
      const baseCost = 150000; // $150k project
      const result = calculateSizeBasedOverhead(baseCost, baseCost, false);

      expect(result.overheadRate).toBe(0.16); // Should be in medium project tier
      expect(result.overheadAmount).toBe(24000); // 16% of 150k
      expect(result.tier.description).toBe('Medium projects ($50k-$200k)');
    });

    it('should handle typical commercial project with smooth scaling', () => {
      const baseCost = 150000; // $150k project
      const result = calculateSizeBasedOverhead(baseCost, baseCost, true);

      expect(result.overheadRate).toBeGreaterThan(0.14); // Should be interpolated
      expect(result.overheadRate).toBeLessThan(0.18);
      expect(result.overheadAmount).toBeGreaterThan(21000);
      expect(result.tier.description).toBe('Medium projects ($50k-$200k)');
    });

    it('should handle small residential project with tiered calculation', () => {
      const baseCost = 25000; // $25k project
      const result = calculateSizeBasedOverhead(baseCost, baseCost, false);

      expect(result.overheadRate).toBe(0.18); // Should be in small project tier
      expect(result.overheadAmount).toBe(4500); // 18% of 25k
      expect(result.tier.description).toBe('Small projects (<$50k)');
    });

    it('should handle mega project with tiered calculation', () => {
      const baseCost = 5000000; // $5M project
      const result = calculateSizeBasedOverhead(baseCost, baseCost, false);

      expect(result.overheadRate).toBe(0.1); // Should be in mega project tier
      expect(result.overheadAmount).toBe(500000); // 10% of 5M
      expect(result.tier.description).toBe('Mega projects (>$1M)');
    });
  });
});
