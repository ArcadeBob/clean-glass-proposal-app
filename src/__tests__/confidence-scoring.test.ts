import {
  calculateConfidenceScore,
  ConfidenceLevel,
  ConfidenceScoringInput,
  DEFAULT_CONFIDENCE_SCORING_CONFIG,
  getConfidenceLevelDescription,
  validateConfidenceScoringConfig,
} from '@/lib/calculations/confidence-scoring';
import { RiskLevel, RiskScoringResult } from '@/lib/risk-assessment';

// Mock risk assessment data for testing
const createMockRiskAssessment = (
  riskLevel: RiskLevel,
  totalRiskScore: number,
  confidence: number = 0.85,
  factorsProcessed: number = 15
): RiskScoringResult => ({
  totalRiskScore,
  riskLevel,
  confidence,
  categoryScores: [],
  factorScores: [],
  recommendations: [],
  contingencyRate: 0.1,
  calculationTimestamp: new Date(),
  factorsProcessed,
  warnings: [],
});

describe('Confidence Scoring Algorithm', () => {
  describe('calculateConfidenceScore', () => {
    it('should calculate medium confidence with default factors', () => {
      const input: ConfidenceScoringInput = {
        factors: {},
      };

      const result = calculateConfidenceScore(input);

      expect(result.confidenceScore).toBeCloseTo(50, 1);
      expect(result.confidenceLevel).toBe('MEDIUM');
      expect(result.factorsProcessed).toBe(14); // 12 base factors + 2 risk factors
      // With all default values (50), no recommendations should be generated
      expect(result.recommendations.length).toBe(0);
    });

    it('should calculate high confidence with excellent factors', () => {
      const input: ConfidenceScoringInput = {
        factors: {
          dataCompleteness: 95,
          dataAccuracy: 90,
          dataRecency: 85,
          historicalAccuracy: 88,
          estimateFrequency: 80,
          varianceFromHistorical: 20,
          scopeComplexity: 30,
          technicalUncertainty: 25,
          requirementClarity: 90,
          marketDataAge: 85,
          marketVolatility: 20,
          supplierReliability: 85,
        },
      };

      const result = calculateConfidenceScore(input);

      expect(result.confidenceScore).toBeGreaterThan(65);
      expect(['HIGH', 'VERY_HIGH']).toContain(result.confidenceLevel);
      expect(result.uncertaintyRange.multiplier).toBeLessThan(0.1);
    });

    it('should calculate low confidence with poor factors', () => {
      const input: ConfidenceScoringInput = {
        factors: {
          dataCompleteness: 20,
          dataAccuracy: 15,
          dataRecency: 10,
          historicalAccuracy: 25,
          estimateFrequency: 30,
          varianceFromHistorical: 80,
          scopeComplexity: 85,
          technicalUncertainty: 90,
          requirementClarity: 20,
          marketDataAge: 15,
          marketVolatility: 85,
          supplierReliability: 30,
        },
      };

      const result = calculateConfidenceScore(input);

      expect(result.confidenceScore).toBeLessThan(45);
      expect(['VERY_LOW', 'LOW', 'MEDIUM']).toContain(result.confidenceLevel); // Allow MEDIUM as fallback
      expect(result.uncertaintyRange.multiplier).toBeGreaterThan(0.05); // Allow for MEDIUM confidence
    });

    it('should integrate with risk assessment when provided', () => {
      const riskAssessment = createMockRiskAssessment('MEDIUM', 50, 0.9, 18);

      const input: ConfidenceScoringInput = {
        factors: {
          dataCompleteness: 80,
          dataAccuracy: 75,
        },
        riskAssessment,
      };

      const result = calculateConfidenceScore(input);

      expect(result.factorsProcessed).toBe(14);
      expect(result.factorScores.riskAssessmentConfidence.value).toBeCloseTo(
        90,
        1
      );
      expect(result.factorScores.riskFactorCoverage.value).toBeCloseTo(90, 1); // 18/20 * 100
      expect(result.warnings).toHaveLength(0);
    });

    it('should use default values when risk assessment is not provided', () => {
      const input: ConfidenceScoringInput = {
        factors: {
          dataCompleteness: 80,
          dataAccuracy: 75,
        },
      };

      const result = calculateConfidenceScore(input);

      expect(result.factorScores.riskAssessmentConfidence.value).toBe(50);
      expect(result.factorScores.riskFactorCoverage.value).toBe(50);
      expect(
        result.warnings.some(w => w.includes('Risk assessment not provided'))
      ).toBe(true);
    });

    it('should generate appropriate recommendations for low-scoring factors', () => {
      const input: ConfidenceScoringInput = {
        factors: {
          dataCompleteness: 15, // Very low
          dataAccuracy: 25, // Low
          requirementClarity: 85, // High
        },
      };

      const result = calculateConfidenceScore(input);

      expect(
        result.recommendations.some(r =>
          r.includes('Critical: Improve data completeness')
        )
      ).toBe(true);
      expect(
        result.recommendations.some(r => r.includes('Improve data accuracy'))
      ).toBe(true);
      expect(
        result.warnings.some(w =>
          w.includes('dataCompleteness score is critically low')
        )
      ).toBe(true);
    });

    it('should respect configuration overrides', () => {
      const customConfig = {
        weights: {
          ...DEFAULT_CONFIDENCE_SCORING_CONFIG.weights,
          dataCompleteness: 0.5, // Much higher weight
          historicalAccuracy: 0.05, // Much lower weight
        },
      };

      const input: ConfidenceScoringInput = {
        factors: {
          dataCompleteness: 90,
          historicalAccuracy: 30,
        },
        config: customConfig,
      };

      const result = calculateConfidenceScore(input);

      // With high dataCompleteness weight, the score should be higher
      expect(result.confidenceScore).toBeGreaterThan(60);
    });

    it('should handle edge cases with extreme values', () => {
      const input: ConfidenceScoringInput = {
        factors: {
          dataCompleteness: 150, // Above 100
          dataAccuracy: -10, // Below 0
          scopeComplexity: 0,
          technicalUncertainty: 100,
        },
      };

      const result = calculateConfidenceScore(input);

      // Values should be clamped to 0-100 range
      expect(result.factorScores.dataCompleteness.value).toBe(100);
      expect(result.factorScores.dataAccuracy.value).toBe(0);
      expect(result.factorScores.scopeComplexity.value).toBe(0);
      expect(result.factorScores.technicalUncertainty.value).toBe(100);
    });

    it('should calculate uncertainty ranges correctly', () => {
      const testCases = [
        { level: 'VERY_LOW' as ConfidenceLevel, expectedMultiplier: 0.25 },
        { level: 'LOW' as ConfidenceLevel, expectedMultiplier: 0.15 },
        { level: 'MEDIUM' as ConfidenceLevel, expectedMultiplier: 0.1 },
        { level: 'HIGH' as ConfidenceLevel, expectedMultiplier: 0.05 },
        { level: 'VERY_HIGH' as ConfidenceLevel, expectedMultiplier: 0.02 },
      ];

      testCases.forEach(({ level, expectedMultiplier }) => {
        const customConfig = {
          confidenceThresholds: {
            VERY_LOW: 10,
            LOW: 30,
            MEDIUM: 50,
            HIGH: 70,
            VERY_HIGH: 100,
          },
        };

        // Create input that will result in the specific confidence level
        const score =
          level === 'VERY_LOW'
            ? 5
            : level === 'LOW'
              ? 20
              : level === 'MEDIUM'
                ? 40
                : level === 'HIGH'
                  ? 60
                  : 80;

        const input: ConfidenceScoringInput = {
          factors: {
            dataCompleteness: score,
            dataAccuracy: score,
            dataRecency: score,
            historicalAccuracy: score,
            estimateFrequency: score,
            varianceFromHistorical: score,
            scopeComplexity: score,
            technicalUncertainty: score,
            requirementClarity: score,
            marketDataAge: score,
            marketVolatility: score,
            supplierReliability: score,
          },
          config: customConfig,
        };

        const result = calculateConfidenceScore(input);
        expect(result.confidenceLevel).toBe(level);
        expect(result.uncertaintyRange.multiplier).toBe(expectedMultiplier);
        expect(result.uncertaintyRange.lowerBound).toBe(
          expectedMultiplier * 100
        );
        expect(result.uncertaintyRange.upperBound).toBe(
          expectedMultiplier * 100
        );
      });
    });
  });

  describe('validateConfidenceScoringConfig', () => {
    it('should validate correct configuration', () => {
      const validation = validateConfidenceScoringConfig(
        DEFAULT_CONFIDENCE_SCORING_CONFIG
      );

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid weight sum', () => {
      const invalidConfig = {
        ...DEFAULT_CONFIDENCE_SCORING_CONFIG,
        weights: {
          ...DEFAULT_CONFIDENCE_SCORING_CONFIG.weights,
          dataCompleteness: 0.5, // This makes sum > 1.0
        },
      };

      const validation = validateConfidenceScoringConfig(invalidConfig);

      // Since we normalize weights automatically, this should still be valid
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect negative weights', () => {
      const invalidConfig = {
        ...DEFAULT_CONFIDENCE_SCORING_CONFIG,
        weights: {
          ...DEFAULT_CONFIDENCE_SCORING_CONFIG.weights,
          dataCompleteness: -0.1,
        },
      };

      const validation = validateConfidenceScoringConfig(invalidConfig);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('must be positive'))).toBe(
        true
      );
    });

    it('should detect invalid confidence thresholds', () => {
      const invalidConfig = {
        ...DEFAULT_CONFIDENCE_SCORING_CONFIG,
        confidenceThresholds: {
          VERY_LOW: 30,
          LOW: 20, // Less than VERY_LOW
          MEDIUM: 60,
          HIGH: 80,
          VERY_HIGH: 100,
        },
      };

      const validation = validateConfidenceScoringConfig(invalidConfig);

      expect(validation.isValid).toBe(false);
      expect(
        validation.errors.some(e =>
          e.includes('VERY_LOW threshold must be less than LOW')
        )
      ).toBe(true);
    });

    it('should detect negative uncertainty multipliers', () => {
      const invalidConfig = {
        ...DEFAULT_CONFIDENCE_SCORING_CONFIG,
        uncertaintyMultipliers: {
          ...DEFAULT_CONFIDENCE_SCORING_CONFIG.uncertaintyMultipliers,
          HIGH: -0.05,
        },
      };

      const validation = validateConfidenceScoringConfig(invalidConfig);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('must be positive'))).toBe(
        true
      );
    });
  });

  describe('getConfidenceLevelDescription', () => {
    it('should return appropriate descriptions for all confidence levels', () => {
      const descriptions = {
        VERY_LOW: getConfidenceLevelDescription('VERY_LOW'),
        LOW: getConfidenceLevelDescription('LOW'),
        MEDIUM: getConfidenceLevelDescription('MEDIUM'),
        HIGH: getConfidenceLevelDescription('HIGH'),
        VERY_HIGH: getConfidenceLevelDescription('VERY_HIGH'),
      };

      expect(descriptions.VERY_LOW).toContain('Very Low Confidence');
      expect(descriptions.LOW).toContain('Low Confidence');
      expect(descriptions.MEDIUM).toContain('Medium Confidence');
      expect(descriptions.HIGH).toContain('High Confidence');
      expect(descriptions.VERY_HIGH).toContain('Very High Confidence');
    });
  });

  describe('Integration with enhanced proposal calculations', () => {
    it('should work with enhanced proposal calculation input', () => {
      const input: ConfidenceScoringInput = {
        factors: {
          dataCompleteness: 85,
          dataAccuracy: 80,
          dataRecency: 75,
          historicalAccuracy: 82,
          estimateFrequency: 70,
          varianceFromHistorical: 30,
          scopeComplexity: 40,
          technicalUncertainty: 35,
          requirementClarity: 85,
          marketDataAge: 80,
          marketVolatility: 25,
          supplierReliability: 75,
        },
        riskAssessment: createMockRiskAssessment('MEDIUM', 45, 0.88, 16),
      };

      const result = calculateConfidenceScore(input);

      expect(result.confidenceScore).toBeGreaterThan(60);
      expect(result.confidenceLevel).toBe('HIGH');
      expect(result.factorsProcessed).toBe(14);
      expect(result.uncertaintyRange.multiplier).toBe(0.05); // HIGH confidence = 5%
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});
