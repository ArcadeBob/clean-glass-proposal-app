import {
  RiskFactorScore,
  RiskLevel,
  RiskScoringResult,
} from '@/lib/risk-assessment';

/**
 * Configuration for risk-adjusted profit margin calculations
 */
export interface RiskAdjustedProfitMarginConfig {
  // Base profit margin range
  baseMargin: number; // Default base margin (e.g., 20%)
  minMargin: number; // Minimum allowed margin (e.g., 5%)
  maxMargin: number; // Maximum allowed margin (e.g., 35%)

  // Risk adjustment factors
  riskAdjustmentFactors: {
    [key in RiskLevel]: {
      multiplier: number; // How much to adjust margin (e.g., 0.8 for LOW = 20% reduction)
      description: string;
    };
  };

  // Additional adjustment factors
  technicalComplexityMultiplier: number; // Additional adjustment for technical complexity
  timelinePressureMultiplier: number; // Additional adjustment for timeline pressure
  clientHistoryMultiplier: number; // Additional adjustment for client history
  marketConditionMultiplier: number; // Additional adjustment for market conditions
}

/**
 * Default configuration for risk-adjusted profit margins
 */
export const DEFAULT_RISK_ADJUSTED_PROFIT_MARGIN_CONFIG: RiskAdjustedProfitMarginConfig =
  {
    baseMargin: 20,
    minMargin: 5,
    maxMargin: 35,
    riskAdjustmentFactors: {
      LOW: {
        multiplier: 0.8, // 20% reduction for low risk
        description:
          'Low risk projects can use reduced margins due to predictable outcomes',
      },
      MEDIUM: {
        multiplier: 1.0, // No adjustment for medium risk
        description: 'Standard margins for medium risk projects',
      },
      HIGH: {
        multiplier: 1.3, // 30% increase for high risk
        description:
          'Increased margins for high risk projects to account for uncertainty',
      },
      CRITICAL: {
        multiplier: 1.6, // 60% increase for critical risk
        description: 'Significant margin increase for critical risk projects',
      },
    },
    technicalComplexityMultiplier: 1.15, // 15% increase for technical complexity
    timelinePressureMultiplier: 1.2, // 20% increase for timeline pressure
    clientHistoryMultiplier: 1.1, // 10% increase for new clients
    marketConditionMultiplier: 1.05, // 5% increase for challenging market conditions
  };

/**
 * Input for risk-adjusted profit margin calculation
 */
export interface RiskAdjustedProfitMarginInput {
  baseProfitMargin: number;
  riskAssessment: RiskScoringResult;
  config?: Partial<RiskAdjustedProfitMarginConfig>;
}

/**
 * Result of risk-adjusted profit margin calculation
 */
export interface RiskAdjustedProfitMarginResult {
  baseProfitMargin: number;
  adjustedProfitMargin: number;
  marginAdjustment: number;
  adjustmentPercentage: number;
  riskLevel: RiskLevel;
  adjustmentFactors: {
    riskLevelAdjustment: number;
    technicalComplexityAdjustment: number;
    timelinePressureAdjustment: number;
    clientHistoryAdjustment: number;
    marketConditionAdjustment: number;
  };
  explanation: string;
  warnings: string[];
}

/**
 * Calculate risk-adjusted profit margin based on risk assessment
 */
export function calculateRiskAdjustedProfitMargin(
  input: RiskAdjustedProfitMarginInput
): RiskAdjustedProfitMarginResult {
  const { baseProfitMargin, riskAssessment, config = {} } = input;

  // Merge with default config
  const finalConfig: RiskAdjustedProfitMarginConfig = {
    ...DEFAULT_RISK_ADJUSTED_PROFIT_MARGIN_CONFIG,
    ...config,
  };

  const warnings: string[] = [];
  const adjustmentFactors = {
    riskLevelAdjustment: 0,
    technicalComplexityAdjustment: 0,
    timelinePressureAdjustment: 0,
    clientHistoryAdjustment: 0,
    marketConditionAdjustment: 0,
  };

  // Start with base margin
  let adjustedMargin = baseProfitMargin;

  // 1. Apply risk level adjustment
  const riskLevelConfig =
    finalConfig.riskAdjustmentFactors[riskAssessment.riskLevel];

  if (!riskLevelConfig) {
    warnings.push(
      `Unknown risk level '${riskAssessment.riskLevel}', using MEDIUM risk level`
    );
    const mediumConfig = finalConfig.riskAdjustmentFactors.MEDIUM;
    const riskLevelMultiplier = mediumConfig.multiplier;
    const riskLevelAdjustment = baseProfitMargin * (riskLevelMultiplier - 1);
    adjustedMargin += riskLevelAdjustment;
    adjustmentFactors.riskLevelAdjustment = riskLevelAdjustment;
  } else {
    const riskLevelMultiplier = riskLevelConfig.multiplier;
    const riskLevelAdjustment = baseProfitMargin * (riskLevelMultiplier - 1);
    adjustedMargin += riskLevelAdjustment;
    adjustmentFactors.riskLevelAdjustment = riskLevelAdjustment;
  }

  // 2. Apply technical complexity adjustment
  const technicalComplexityScore = getTechnicalComplexityScore(riskAssessment);
  if (technicalComplexityScore > 70) {
    const technicalAdjustment =
      baseProfitMargin * (finalConfig.technicalComplexityMultiplier - 1);
    adjustedMargin += technicalAdjustment;
    adjustmentFactors.technicalComplexityAdjustment = technicalAdjustment;
  }

  // 3. Apply timeline pressure adjustment
  const timelinePressureScore = getTimelinePressureScore(riskAssessment);
  if (timelinePressureScore > 60) {
    const timelineAdjustment =
      baseProfitMargin * (finalConfig.timelinePressureMultiplier - 1);
    adjustedMargin += timelineAdjustment;
    adjustmentFactors.timelinePressureAdjustment = timelineAdjustment;
  }

  // 4. Apply client history adjustment
  const clientHistoryScore = getClientHistoryScore(riskAssessment);
  if (clientHistoryScore > 50) {
    const clientAdjustment =
      baseProfitMargin * (finalConfig.clientHistoryMultiplier - 1);
    adjustedMargin += clientAdjustment;
    adjustmentFactors.clientHistoryAdjustment = clientAdjustment;
  }

  // 5. Apply market condition adjustment
  const marketConditionScore = getMarketConditionScore(riskAssessment);
  if (marketConditionScore > 65) {
    const marketAdjustment =
      baseProfitMargin * (finalConfig.marketConditionMultiplier - 1);
    adjustedMargin += marketAdjustment;
    adjustmentFactors.marketConditionAdjustment = marketAdjustment;
  }

  // Apply bounds checking
  if (adjustedMargin < finalConfig.minMargin) {
    warnings.push(
      `Adjusted margin (${adjustedMargin.toFixed(1)}%) is below minimum (${finalConfig.minMargin}%). Using minimum margin.`
    );
    adjustedMargin = finalConfig.minMargin;
  } else if (adjustedMargin > finalConfig.maxMargin) {
    warnings.push(
      `Adjusted margin (${adjustedMargin.toFixed(1)}%) is above maximum (${finalConfig.maxMargin}%). Using maximum margin.`
    );
    adjustedMargin = finalConfig.maxMargin;
  }

  const marginAdjustment = adjustedMargin - baseProfitMargin;
  const adjustmentPercentage =
    baseProfitMargin > 0 ? (marginAdjustment / baseProfitMargin) * 100 : 0;

  // Generate explanation
  const explanation = generateAdjustmentExplanation(
    baseProfitMargin,
    adjustedMargin,
    riskAssessment,
    adjustmentFactors,
    finalConfig
  );

  return {
    baseProfitMargin,
    adjustedProfitMargin: adjustedMargin,
    marginAdjustment,
    adjustmentPercentage,
    riskLevel: riskAssessment.riskLevel,
    adjustmentFactors,
    explanation,
    warnings,
  };
}

/**
 * Get technical complexity score from risk assessment
 */
function getTechnicalComplexityScore(
  riskAssessment: RiskScoringResult
): number {
  const technicalFactors = riskAssessment.factorScores.filter(
    (factor: RiskFactorScore) =>
      factor.categoryName.toLowerCase().includes('technical') ||
      factor.factorName.toLowerCase().includes('complexity') ||
      factor.factorName.toLowerCase().includes('technical')
  );

  if (technicalFactors.length === 0) return 0;

  return (
    technicalFactors.reduce(
      (sum: number, factor: RiskFactorScore) => sum + factor.calculatedScore,
      0
    ) / technicalFactors.length
  );
}

/**
 * Get timeline pressure score from risk assessment
 */
function getTimelinePressureScore(riskAssessment: RiskScoringResult): number {
  const timelineFactors = riskAssessment.factorScores.filter(
    (factor: RiskFactorScore) =>
      factor.categoryName.toLowerCase().includes('schedule') ||
      factor.factorName.toLowerCase().includes('timeline') ||
      factor.factorName.toLowerCase().includes('deadline') ||
      factor.factorName.toLowerCase().includes('pressure')
  );

  if (timelineFactors.length === 0) return 0;

  return (
    timelineFactors.reduce(
      (sum: number, factor: RiskFactorScore) => sum + factor.calculatedScore,
      0
    ) / timelineFactors.length
  );
}

/**
 * Get client history score from risk assessment
 */
function getClientHistoryScore(riskAssessment: RiskScoringResult): number {
  const clientFactors = riskAssessment.factorScores.filter(
    (factor: RiskFactorScore) =>
      factor.categoryName.toLowerCase().includes('client') ||
      factor.factorName.toLowerCase().includes('client') ||
      factor.factorName.toLowerCase().includes('relationship')
  );

  if (clientFactors.length === 0) return 0;

  return (
    clientFactors.reduce(
      (sum: number, factor: RiskFactorScore) => sum + factor.calculatedScore,
      0
    ) / clientFactors.length
  );
}

/**
 * Get market condition score from risk assessment
 */
function getMarketConditionScore(riskAssessment: RiskScoringResult): number {
  const marketFactors = riskAssessment.factorScores.filter(
    (factor: RiskFactorScore) =>
      factor.categoryName.toLowerCase().includes('market') ||
      factor.factorName.toLowerCase().includes('market') ||
      factor.factorName.toLowerCase().includes('economic') ||
      factor.factorName.toLowerCase().includes('competition')
  );

  if (marketFactors.length === 0) return 0;

  return (
    marketFactors.reduce(
      (sum: number, factor: RiskFactorScore) => sum + factor.calculatedScore,
      0
    ) / marketFactors.length
  );
}

/**
 * Generate explanation for margin adjustments
 */
function generateAdjustmentExplanation(
  baseMargin: number,
  adjustedMargin: number,
  riskAssessment: RiskScoringResult,
  adjustmentFactors: any,
  config: RiskAdjustedProfitMarginConfig
): string {
  const parts: string[] = [];

  // Base explanation
  parts.push(`Base profit margin: ${baseMargin.toFixed(1)}%`);

  // Risk level adjustment
  if (adjustmentFactors.riskLevelAdjustment !== 0) {
    const riskConfig = config.riskAdjustmentFactors[riskAssessment.riskLevel];
    parts.push(
      `${riskAssessment.riskLevel} risk level: ${riskConfig.description} (${adjustmentFactors.riskLevelAdjustment > 0 ? '+' : ''}${adjustmentFactors.riskLevelAdjustment.toFixed(1)}%)`
    );
  }

  // Technical complexity
  if (adjustmentFactors.technicalComplexityAdjustment > 0) {
    parts.push(
      `Technical complexity: Increased margin for complex technical requirements (+${adjustmentFactors.technicalComplexityAdjustment.toFixed(1)}%)`
    );
  }

  // Timeline pressure
  if (adjustmentFactors.timelinePressureAdjustment > 0) {
    parts.push(
      `Timeline pressure: Increased margin for tight deadlines (+${adjustmentFactors.timelinePressureAdjustment.toFixed(1)}%)`
    );
  }

  // Client history
  if (adjustmentFactors.clientHistoryAdjustment > 0) {
    parts.push(
      `Client history: Increased margin for new client relationship (+${adjustmentFactors.clientHistoryAdjustment.toFixed(1)}%)`
    );
  }

  // Market conditions
  if (adjustmentFactors.marketConditionAdjustment > 0) {
    parts.push(
      `Market conditions: Increased margin for challenging market environment (+${adjustmentFactors.marketConditionAdjustment.toFixed(1)}%)`
    );
  }

  // Final result
  parts.push(`Final adjusted margin: ${adjustedMargin.toFixed(1)}%`);

  return parts.join('. ');
}

/**
 * Validate risk-adjusted profit margin configuration
 */
export function validateRiskAdjustedProfitMarginConfig(
  config: RiskAdjustedProfitMarginConfig
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.baseMargin < 0 || config.baseMargin > 100) {
    errors.push('Base margin must be between 0 and 100');
  }

  if (config.minMargin < 0 || config.minMargin > 100) {
    errors.push('Minimum margin must be between 0 and 100');
  }

  if (config.maxMargin < 0 || config.maxMargin > 100) {
    errors.push('Maximum margin must be between 0 and 100');
  }

  if (config.minMargin >= config.maxMargin) {
    errors.push('Minimum margin must be less than maximum margin');
  }

  if (
    config.baseMargin < config.minMargin ||
    config.baseMargin > config.maxMargin
  ) {
    errors.push('Base margin must be within the min/max range');
  }

  // Validate risk adjustment factors
  Object.entries(config.riskAdjustmentFactors).forEach(([level, factor]) => {
    if (factor.multiplier < 0) {
      errors.push(`${level} risk multiplier must be positive`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
