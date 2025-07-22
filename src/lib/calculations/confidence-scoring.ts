import { RiskScoringResult } from '@/lib/risk-assessment';

/**
 * Confidence level enum for estimate reliability
 */
export type ConfidenceLevel =
  | 'VERY_LOW'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'VERY_HIGH';

/**
 * Factors that influence confidence scoring
 */
export interface ConfidenceFactors {
  // Data quality factors
  dataCompleteness: number; // 0-100: How complete is the project data
  dataAccuracy: number; // 0-100: How accurate is the provided data
  dataRecency: number; // 0-100: How recent is the data (0 = very old, 100 = very recent)

  // Historical accuracy factors
  historicalAccuracy: number; // 0-100: Historical accuracy of similar estimates
  estimateFrequency: number; // 0-100: How often similar estimates are made
  varianceFromHistorical: number; // 0-100: How much current estimate varies from historical (0 = no variance, 100 = high variance)

  // Scope complexity factors
  scopeComplexity: number; // 0-100: Complexity of the project scope
  technicalUncertainty: number; // 0-100: Technical uncertainty in the project
  requirementClarity: number; // 0-100: Clarity of project requirements

  // Market factors
  marketDataAge: number; // 0-100: Age of market data (0 = very old, 100 = very recent)
  marketVolatility: number; // 0-100: Current market volatility
  supplierReliability: number; // 0-100: Reliability of suppliers and subcontractors

  // Risk assessment factors
  riskAssessmentConfidence: number; // 0-100: Confidence in the risk assessment
  riskFactorCoverage: number; // 0-100: Coverage of risk factors in assessment
}

/**
 * Configuration for confidence scoring algorithm
 */
export interface ConfidenceScoringConfig {
  // Factor weights (must sum to 1.0)
  weights: {
    dataCompleteness: number;
    dataAccuracy: number;
    dataRecency: number;
    historicalAccuracy: number;
    estimateFrequency: number;
    varianceFromHistorical: number;
    scopeComplexity: number;
    technicalUncertainty: number;
    requirementClarity: number;
    marketDataAge: number;
    marketVolatility: number;
    supplierReliability: number;
    riskAssessmentConfidence: number;
    riskFactorCoverage: number;
  };

  // Confidence level thresholds
  confidenceThresholds: {
    VERY_LOW: number; // 0-20
    LOW: number; // 21-40
    MEDIUM: number; // 41-60
    HIGH: number; // 61-80
    VERY_HIGH: number; // 81-100
  };

  // Uncertainty range multipliers based on confidence
  uncertaintyMultipliers: {
    [key in ConfidenceLevel]: number;
  };
}

/**
 * Default configuration for confidence scoring
 */
export const DEFAULT_CONFIDENCE_SCORING_CONFIG: ConfidenceScoringConfig = {
  weights: {
    dataCompleteness: 0.11,
    dataAccuracy: 0.09,
    dataRecency: 0.07, // Reduced from 0.08
    historicalAccuracy: 0.14,
    estimateFrequency: 0.08,
    varianceFromHistorical: 0.09,
    scopeComplexity: 0.08,
    technicalUncertainty: 0.08,
    requirementClarity: 0.08,
    marketDataAge: 0.05,
    marketVolatility: 0.05,
    supplierReliability: 0.03,
    riskAssessmentConfidence: 0.05,
    riskFactorCoverage: 0.03,
  },
  confidenceThresholds: {
    VERY_LOW: 20,
    LOW: 40,
    MEDIUM: 60,
    HIGH: 80,
    VERY_HIGH: 100,
  },
  uncertaintyMultipliers: {
    VERY_LOW: 0.25, // ±25% uncertainty range
    LOW: 0.15, // ±15% uncertainty range
    MEDIUM: 0.1, // ±10% uncertainty range
    HIGH: 0.05, // ±5% uncertainty range
    VERY_HIGH: 0.02, // ±2% uncertainty range
  },
};

/**
 * Input for confidence scoring calculation
 */
export interface ConfidenceScoringInput {
  factors: Partial<ConfidenceFactors>;
  riskAssessment?: RiskScoringResult;
  config?: Partial<ConfidenceScoringConfig>;
}

/**
 * Result of confidence scoring calculation
 */
export interface ConfidenceScoringResult {
  // Overall confidence score
  confidenceScore: number; // 0-100
  confidenceLevel: ConfidenceLevel;

  // Factor breakdown
  factorScores: {
    [K in keyof ConfidenceFactors]: {
      value: number;
      weight: number;
      weightedScore: number;
      description: string;
    };
  };

  // Uncertainty analysis
  uncertaintyRange: {
    lowerBound: number; // Percentage below estimate
    upperBound: number; // Percentage above estimate
    multiplier: number; // Uncertainty multiplier
  };

  // Recommendations
  recommendations: string[];

  // Metadata
  calculationTimestamp: Date;
  factorsProcessed: number;
  warnings: string[];
}

/**
 * Calculate confidence score for cost estimate reliability
 */
export function calculateConfidenceScore(
  input: ConfidenceScoringInput
): ConfidenceScoringResult {
  const { factors, riskAssessment, config = {} } = input;

  // Merge with default config
  const finalConfig: ConfidenceScoringConfig = {
    ...DEFAULT_CONFIDENCE_SCORING_CONFIG,
    ...config,
    weights: {
      ...DEFAULT_CONFIDENCE_SCORING_CONFIG.weights,
      ...config.weights,
    },
  };

  // Normalize weights to sum to 1.0
  const weightSum = Object.values(finalConfig.weights).reduce(
    (sum, weight) => sum + weight,
    0
  );
  const normalizedWeights = Object.fromEntries(
    Object.entries(finalConfig.weights).map(([key, weight]) => [
      key,
      weight / weightSum,
    ])
  );

  const warnings: string[] = [];
  const recommendations: string[] = [];
  const factorScores: any = {};

  // Calculate individual factor scores
  const factorCalculations = [
    {
      key: 'dataCompleteness' as keyof ConfidenceFactors,
      value: factors.dataCompleteness ?? 50,
      description: 'Data completeness score',
    },
    {
      key: 'dataAccuracy' as keyof ConfidenceFactors,
      value: factors.dataAccuracy ?? 50,
      description: 'Data accuracy score',
    },
    {
      key: 'dataRecency' as keyof ConfidenceFactors,
      value: factors.dataRecency ?? 50,
      description: 'Data recency score',
    },
    {
      key: 'historicalAccuracy' as keyof ConfidenceFactors,
      value: factors.historicalAccuracy ?? 50,
      description: 'Historical accuracy score',
    },
    {
      key: 'estimateFrequency' as keyof ConfidenceFactors,
      value: factors.estimateFrequency ?? 50,
      description: 'Estimate frequency score',
    },
    {
      key: 'varianceFromHistorical' as keyof ConfidenceFactors,
      value: factors.varianceFromHistorical ?? 50,
      description: 'Variance from historical estimates',
    },
    {
      key: 'scopeComplexity' as keyof ConfidenceFactors,
      value: factors.scopeComplexity ?? 50,
      description: 'Scope complexity score',
    },
    {
      key: 'technicalUncertainty' as keyof ConfidenceFactors,
      value: factors.technicalUncertainty ?? 50,
      description: 'Technical uncertainty score',
    },
    {
      key: 'requirementClarity' as keyof ConfidenceFactors,
      value: factors.requirementClarity ?? 50,
      description: 'Requirement clarity score',
    },
    {
      key: 'marketDataAge' as keyof ConfidenceFactors,
      value: factors.marketDataAge ?? 50,
      description: 'Market data age score',
    },
    {
      key: 'marketVolatility' as keyof ConfidenceFactors,
      value: factors.marketVolatility ?? 50,
      description: 'Market volatility score',
    },
    {
      key: 'supplierReliability' as keyof ConfidenceFactors,
      value: factors.supplierReliability ?? 50,
      description: 'Supplier reliability score',
    },
  ];

  // Add risk assessment factors if available
  if (riskAssessment) {
    factorCalculations.push(
      {
        key: 'riskAssessmentConfidence' as keyof ConfidenceFactors,
        value: riskAssessment.confidence * 100,
        description: 'Risk assessment confidence score',
      },
      {
        key: 'riskFactorCoverage' as keyof ConfidenceFactors,
        value: Math.min(100, (riskAssessment.factorsProcessed / 20) * 100), // Normalize to 0-100
        description: 'Risk factor coverage score',
      }
    );
  } else {
    // Use default values for risk factors
    factorCalculations.push(
      {
        key: 'riskAssessmentConfidence' as keyof ConfidenceFactors,
        value: 50,
        description: 'Risk assessment confidence score (default)',
      },
      {
        key: 'riskFactorCoverage' as keyof ConfidenceFactors,
        value: 50,
        description: 'Risk factor coverage score (default)',
      }
    );
    warnings.push(
      'Risk assessment not provided, using default confidence values'
    );
  }

  // Calculate weighted scores for each factor using normalized weights
  let totalWeightedScore = 0;
  let totalWeight = 0;

  factorCalculations.forEach(({ key, value, description }) => {
    const weight = normalizedWeights[key] || 0;
    const normalizedValue = Math.max(0, Math.min(100, value));
    const weightedScore = normalizedValue * weight;

    factorScores[key] = {
      value: normalizedValue,
      weight,
      weightedScore,
      description,
    };

    totalWeightedScore += weightedScore;
    totalWeight += weight;
  });

  // Calculate overall confidence score
  const confidenceScore =
    totalWeight > 0 ? totalWeightedScore / totalWeight : 50;
  const normalizedConfidenceScore = Math.max(0, Math.min(100, confidenceScore));

  // Determine confidence level
  const confidenceLevel = determineConfidenceLevel(
    normalizedConfidenceScore,
    finalConfig.confidenceThresholds
  );

  // Calculate uncertainty range
  const uncertaintyMultiplier =
    finalConfig.uncertaintyMultipliers[confidenceLevel];
  const uncertaintyRange = {
    lowerBound: uncertaintyMultiplier * 100,
    upperBound: uncertaintyMultiplier * 100,
    multiplier: uncertaintyMultiplier,
  };

  // Generate recommendations based on low-scoring factors
  generateRecommendations(factorScores, recommendations, warnings);

  return {
    confidenceScore: normalizedConfidenceScore,
    confidenceLevel,
    factorScores,
    uncertaintyRange,
    recommendations,
    calculationTimestamp: new Date(),
    factorsProcessed: factorCalculations.length,
    warnings,
  };
}

/**
 * Determine confidence level based on score and thresholds
 */
function determineConfidenceLevel(
  score: number,
  thresholds: ConfidenceScoringConfig['confidenceThresholds']
): ConfidenceLevel {
  if (score <= thresholds.VERY_LOW) return 'VERY_LOW';
  if (score <= thresholds.LOW) return 'LOW';
  if (score <= thresholds.MEDIUM) return 'MEDIUM';
  if (score <= thresholds.HIGH) return 'HIGH';
  return 'VERY_HIGH';
}

/**
 * Generate recommendations based on factor scores
 */
function generateRecommendations(
  factorScores: any,
  recommendations: string[],
  warnings: string[]
): void {
  const lowScoreThreshold = 40;
  const veryLowScoreThreshold = 20;

  Object.entries(factorScores).forEach(([key, factor]: [string, any]) => {
    if (factor.value <= veryLowScoreThreshold) {
      recommendations.push(
        `Critical: Improve ${key.replace(/([A-Z])/g, ' $1').toLowerCase()} (${factor.value.toFixed(1)}%)`
      );
      warnings.push(
        `${key} score is critically low: ${factor.value.toFixed(1)}%`
      );
    } else if (factor.value <= lowScoreThreshold) {
      recommendations.push(
        `Improve ${key.replace(/([A-Z])/g, ' $1').toLowerCase()} (${factor.value.toFixed(1)}%)`
      );
    }
  });

  // Add general recommendations based on confidence level
  const avgScore =
    Object.values(factorScores).reduce(
      (sum: number, factor: any) => sum + factor.value,
      0
    ) / Object.keys(factorScores).length;

  if (avgScore < 30) {
    recommendations.push(
      'Consider delaying estimate until more data is available'
    );
  } else if (avgScore < 50) {
    recommendations.push('Add contingency buffer to account for uncertainty');
  } else if (avgScore > 80) {
    recommendations.push(
      'High confidence estimate - consider reducing contingency'
    );
  }
}

/**
 * Validate confidence scoring configuration
 */
export function validateConfidenceScoringConfig(
  config: ConfidenceScoringConfig
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate individual weights are positive (sum will be normalized automatically)
  Object.entries(config.weights).forEach(([key, weight]) => {
    if (weight < 0) {
      errors.push(`${key} weight must be positive, got: ${weight}`);
    }
  });

  // Validate confidence thresholds are in ascending order
  const thresholds = config.confidenceThresholds;
  if (thresholds.VERY_LOW >= thresholds.LOW) {
    errors.push('VERY_LOW threshold must be less than LOW threshold');
  }
  if (thresholds.LOW >= thresholds.MEDIUM) {
    errors.push('LOW threshold must be less than MEDIUM threshold');
  }
  if (thresholds.MEDIUM >= thresholds.HIGH) {
    errors.push('MEDIUM threshold must be less than HIGH threshold');
  }
  if (thresholds.HIGH >= thresholds.VERY_HIGH) {
    errors.push('HIGH threshold must be less than VERY_HIGH threshold');
  }

  // Validate uncertainty multipliers are positive
  Object.entries(config.uncertaintyMultipliers).forEach(
    ([level, multiplier]) => {
      if (multiplier < 0) {
        errors.push(
          `${level} uncertainty multiplier must be positive, got: ${multiplier}`
        );
      }
    }
  );

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get confidence level description
 */
export function getConfidenceLevelDescription(level: ConfidenceLevel): string {
  const descriptions = {
    VERY_LOW:
      'Very Low Confidence - High uncertainty, significant risk of cost overruns',
    LOW: 'Low Confidence - Moderate uncertainty, consider adding contingency',
    MEDIUM:
      'Medium Confidence - Standard uncertainty, typical for most estimates',
    HIGH: 'High Confidence - Low uncertainty, reliable estimate',
    VERY_HIGH:
      'Very High Confidence - Very low uncertainty, highly reliable estimate',
  };
  return descriptions[level];
}
