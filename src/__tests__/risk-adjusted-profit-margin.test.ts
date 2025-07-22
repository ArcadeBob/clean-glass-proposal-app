import {
  calculateRiskAdjustedProfitMargin,
  DEFAULT_RISK_ADJUSTED_PROFIT_MARGIN_CONFIG,
  RiskAdjustedProfitMarginInput,
  validateRiskAdjustedProfitMarginConfig,
} from '@/lib/calculations/risk-adjusted-profit-margin';
import { RiskLevel, RiskScoringResult } from '@/lib/risk-assessment';

// Mock risk assessment data for testing
const createMockRiskAssessment = (
  riskLevel: RiskLevel,
  totalRiskScore: number,
  factorScores: any[] = []
): RiskScoringResult => ({
  totalRiskScore,
  riskLevel,
  confidence: 0.85,
  categoryScores: [],
  factorScores,
  recommendations: [],
  contingencyRate: 0.1,
  calculationTimestamp: new Date(),
  factorsProcessed: factorScores.length,
  warnings: [],
});

describe('Risk-Adjusted Profit Margin System', () => {
  describe('calculateRiskAdjustedProfitMargin', () => {
    it('should return base margin for MEDIUM risk with no adjustments', () => {
      const input: RiskAdjustedProfitMarginInput = {
        baseProfitMargin: 20,
        riskAssessment: createMockRiskAssessment('MEDIUM', 50),
      };

      const result = calculateRiskAdjustedProfitMargin(input);

      expect(result.baseProfitMargin).toBe(20);
      expect(result.adjustedProfitMargin).toBe(20);
      expect(result.marginAdjustment).toBe(0);
      expect(result.adjustmentPercentage).toBe(0);
      expect(result.riskLevel).toBe('MEDIUM');
      expect(result.explanation).toContain('Base profit margin: 20.0%');
      expect(result.explanation).toContain('Final adjusted margin: 20.0%');
    });

    it('should reduce margin for LOW risk projects', () => {
      const input: RiskAdjustedProfitMarginInput = {
        baseProfitMargin: 20,
        riskAssessment: createMockRiskAssessment('LOW', 25),
      };

      const result = calculateRiskAdjustedProfitMargin(input);

      expect(result.baseProfitMargin).toBe(20);
      expect(result.adjustedProfitMargin).toBe(16); // 20 * 0.8 = 16
      expect(result.marginAdjustment).toBe(-4);
      expect(result.adjustmentPercentage).toBe(-20);
      expect(result.riskLevel).toBe('LOW');
      expect(result.explanation).toContain('LOW risk level');
    });

    it('should increase margin for HIGH risk projects', () => {
      const input: RiskAdjustedProfitMarginInput = {
        baseProfitMargin: 20,
        riskAssessment: createMockRiskAssessment('HIGH', 75),
      };

      const result = calculateRiskAdjustedProfitMargin(input);

      expect(result.baseProfitMargin).toBe(20);
      expect(result.adjustedProfitMargin).toBe(26); // 20 * 1.3 = 26
      expect(result.marginAdjustment).toBe(6);
      expect(result.adjustmentPercentage).toBe(30);
      expect(result.riskLevel).toBe('HIGH');
      expect(result.explanation).toContain('HIGH risk level');
    });

    it('should significantly increase margin for CRITICAL risk projects', () => {
      const input: RiskAdjustedProfitMarginInput = {
        baseProfitMargin: 20,
        riskAssessment: createMockRiskAssessment('CRITICAL', 90),
      };

      const result = calculateRiskAdjustedProfitMargin(input);

      expect(result.baseProfitMargin).toBe(20);
      expect(result.adjustedProfitMargin).toBe(32); // 20 * 1.6 = 32
      expect(result.marginAdjustment).toBe(12);
      expect(result.adjustmentPercentage).toBe(60);
      expect(result.riskLevel).toBe('CRITICAL');
      expect(result.explanation).toContain('CRITICAL risk level');
    });

    it('should apply technical complexity adjustment when score > 70', () => {
      const technicalFactors = [
        {
          factorId: 'tech1',
          factorName: 'Technical Complexity',
          categoryId: 'cat1',
          categoryName: 'Technical',
          weight: 1,
          inputValue: 80,
          calculatedScore: 85,
          weightedScore: 85,
          scoringMethod: 'LINEAR' as any,
          dataType: 'NUMERIC' as any,
        },
      ];

      const input: RiskAdjustedProfitMarginInput = {
        baseProfitMargin: 20,
        riskAssessment: createMockRiskAssessment(
          'MEDIUM',
          50,
          technicalFactors
        ),
      };

      const result = calculateRiskAdjustedProfitMargin(input);

      expect(result.adjustedProfitMargin).toBe(23); // 20 + (20 * 0.15) = 23
      expect(
        result.adjustmentFactors.technicalComplexityAdjustment
      ).toBeCloseTo(3, 1);
      expect(result.explanation).toContain('Technical complexity');
    });

    it('should apply timeline pressure adjustment when score > 60', () => {
      const timelineFactors = [
        {
          factorId: 'timeline1',
          factorName: 'Project Timeline',
          categoryId: 'cat2',
          categoryName: 'Schedule',
          weight: 1,
          inputValue: 70,
          calculatedScore: 75,
          weightedScore: 75,
          scoringMethod: 'LINEAR' as any,
          dataType: 'NUMERIC' as any,
        },
      ];

      const input: RiskAdjustedProfitMarginInput = {
        baseProfitMargin: 20,
        riskAssessment: createMockRiskAssessment('MEDIUM', 50, timelineFactors),
      };

      const result = calculateRiskAdjustedProfitMargin(input);

      expect(result.adjustedProfitMargin).toBe(24); // 20 + (20 * 0.2) = 24
      expect(result.adjustmentFactors.timelinePressureAdjustment).toBeCloseTo(
        4,
        1
      );
      expect(result.explanation).toContain('Timeline pressure');
    });

    it('should apply client history adjustment when score > 50', () => {
      const clientFactors = [
        {
          factorId: 'client1',
          factorName: 'Client Relationship',
          categoryId: 'cat3',
          categoryName: 'Client',
          weight: 1,
          inputValue: 60,
          calculatedScore: 65,
          weightedScore: 65,
          scoringMethod: 'LINEAR' as any,
          dataType: 'NUMERIC' as any,
        },
      ];

      const input: RiskAdjustedProfitMarginInput = {
        baseProfitMargin: 20,
        riskAssessment: createMockRiskAssessment('MEDIUM', 50, clientFactors),
      };

      const result = calculateRiskAdjustedProfitMargin(input);

      expect(result.adjustedProfitMargin).toBe(22); // 20 + (20 * 0.1) = 22
      expect(result.adjustmentFactors.clientHistoryAdjustment).toBeCloseTo(
        2,
        1
      );
      expect(result.explanation).toContain('Client history');
    });

    it('should apply market condition adjustment when score > 65', () => {
      const marketFactors = [
        {
          factorId: 'market1',
          factorName: 'Market Conditions',
          categoryId: 'cat4',
          categoryName: 'Market',
          weight: 1,
          inputValue: 70,
          calculatedScore: 75,
          weightedScore: 75,
          scoringMethod: 'LINEAR' as any,
          dataType: 'NUMERIC' as any,
        },
      ];

      const input: RiskAdjustedProfitMarginInput = {
        baseProfitMargin: 20,
        riskAssessment: createMockRiskAssessment('MEDIUM', 50, marketFactors),
      };

      const result = calculateRiskAdjustedProfitMargin(input);

      expect(result.adjustedProfitMargin).toBe(21); // 20 + (20 * 0.05) = 21
      expect(result.adjustmentFactors.marketConditionAdjustment).toBeCloseTo(
        1,
        1
      );
      expect(result.explanation).toContain('Market conditions');
    });

    it('should respect minimum margin bounds', () => {
      const input: RiskAdjustedProfitMarginInput = {
        baseProfitMargin: 10,
        riskAssessment: createMockRiskAssessment('LOW', 25),
        config: { minMargin: 9 }, // Set minimum higher than the adjusted margin
      };

      const result = calculateRiskAdjustedProfitMargin(input);

      expect(result.adjustedProfitMargin).toBe(9); // Should be clamped to minimum
      expect(result.warnings.some(w => w.includes('below minimum'))).toBe(true);
    });

    it('should respect maximum margin bounds', () => {
      const input: RiskAdjustedProfitMarginInput = {
        baseProfitMargin: 30,
        riskAssessment: createMockRiskAssessment('CRITICAL', 90),
        config: { maxMargin: 40 },
      };

      const result = calculateRiskAdjustedProfitMargin(input);

      expect(result.adjustedProfitMargin).toBe(40); // Should be clamped to maximum
      expect(result.warnings.some(w => w.includes('above maximum'))).toBe(true);
    });

    it('should combine multiple adjustments correctly', () => {
      const combinedFactors = [
        {
          factorId: 'tech1',
          factorName: 'Technical Complexity',
          categoryId: 'cat1',
          categoryName: 'Technical',
          weight: 1,
          inputValue: 80,
          calculatedScore: 85,
          weightedScore: 85,
          scoringMethod: 'LINEAR' as any,
          dataType: 'NUMERIC' as any,
        },
        {
          factorId: 'timeline1',
          factorName: 'Project Timeline',
          categoryId: 'cat2',
          categoryName: 'Schedule',
          weight: 1,
          inputValue: 70,
          calculatedScore: 75,
          weightedScore: 75,
          scoringMethod: 'LINEAR' as any,
          dataType: 'NUMERIC' as any,
        },
      ];

      const input: RiskAdjustedProfitMarginInput = {
        baseProfitMargin: 20,
        riskAssessment: createMockRiskAssessment('HIGH', 75, combinedFactors),
      };

      const result = calculateRiskAdjustedProfitMargin(input);

      // Base: 20, HIGH risk: +6, Technical: +3, Timeline: +4 = 33
      expect(result.adjustedProfitMargin).toBe(33);
      expect(result.adjustmentFactors.riskLevelAdjustment).toBeCloseTo(6, 1);
      expect(
        result.adjustmentFactors.technicalComplexityAdjustment
      ).toBeCloseTo(3, 1);
      expect(result.adjustmentFactors.timelinePressureAdjustment).toBeCloseTo(
        4,
        1
      );
    });
  });

  describe('validateRiskAdjustedProfitMarginConfig', () => {
    it('should validate correct configuration', () => {
      const config = { ...DEFAULT_RISK_ADJUSTED_PROFIT_MARGIN_CONFIG };
      const result = validateRiskAdjustedProfitMarginConfig(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid base margin', () => {
      const config = {
        ...DEFAULT_RISK_ADJUSTED_PROFIT_MARGIN_CONFIG,
        baseMargin: -5,
      };
      const result = validateRiskAdjustedProfitMarginConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Base margin must be between 0 and 100');
    });

    it('should detect invalid min/max margin relationship', () => {
      const config = {
        ...DEFAULT_RISK_ADJUSTED_PROFIT_MARGIN_CONFIG,
        minMargin: 30,
        maxMargin: 20,
      };
      const result = validateRiskAdjustedProfitMarginConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Minimum margin must be less than maximum margin'
      );
    });

    it('should detect base margin outside min/max range', () => {
      const config = {
        ...DEFAULT_RISK_ADJUSTED_PROFIT_MARGIN_CONFIG,
        baseMargin: 40,
        maxMargin: 35,
      };
      const result = validateRiskAdjustedProfitMarginConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Base margin must be within the min/max range'
      );
    });
  });

  describe('DEFAULT_RISK_ADJUSTED_PROFIT_MARGIN_CONFIG', () => {
    it('should have valid default configuration', () => {
      const result = validateRiskAdjustedProfitMarginConfig(
        DEFAULT_RISK_ADJUSTED_PROFIT_MARGIN_CONFIG
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should have reasonable default values', () => {
      const config = DEFAULT_RISK_ADJUSTED_PROFIT_MARGIN_CONFIG;

      expect(config.baseMargin).toBe(20);
      expect(config.minMargin).toBe(5);
      expect(config.maxMargin).toBe(35);
      expect(config.riskAdjustmentFactors.LOW.multiplier).toBe(0.8);
      expect(config.riskAdjustmentFactors.MEDIUM.multiplier).toBe(1.0);
      expect(config.riskAdjustmentFactors.HIGH.multiplier).toBe(1.3);
      expect(config.riskAdjustmentFactors.CRITICAL.multiplier).toBe(1.6);
    });
  });
});
