import {
  RiskScoringEngine,
  RiskScoringInput,
  RiskScoringResult,
} from '@/lib/risk-assessment';
import { z } from 'zod';
import {
  ConfidenceScoringResult,
  calculateConfidenceScore,
} from './confidence-scoring';
import { getContingencyRecommendation } from './contingency-recommendation';
import {
  MarketAnalysisResult,
  analyzeMarketConditions,
} from './market-analysis';
import { calculateRiskAdjustedProfitMargin } from './risk-adjusted-profit-margin';
import { calculateSizeBasedOverhead } from './size-based-overhead';

// Enhanced validation schemas
export const EnhancedProposalCalculationSchema = z.object({
  baseCost: z.number().min(0),
  overheadPercentage: z.number().min(0).max(100).default(15),
  profitMargin: z.number().min(0).max(100).default(20),
  // Size-based overhead options
  useSizeBasedOverhead: z.boolean().default(true),
  useSmoothScaling: z.boolean().default(true),
  // Risk assessment inputs
  projectType: z.string().optional(),
  squareFootage: z.number().optional(),
  buildingHeight: z.number().optional(),
  region: z.string().optional(),
  materialType: z.string().optional(),
  riskFactorInputs: z
    .record(
      z.object({
        value: z.union([z.number(), z.string(), z.boolean()]),
        notes: z.string().optional(),
      })
    )
    .optional(),
  // Confidence scoring inputs
  confidenceFactors: z
    .object({
      dataCompleteness: z.number().min(0).max(100).optional(),
      dataAccuracy: z.number().min(0).max(100).optional(),
      dataRecency: z.number().min(0).max(100).optional(),
      historicalAccuracy: z.number().min(0).max(100).optional(),
      estimateFrequency: z.number().min(0).max(100).optional(),
      varianceFromHistorical: z.number().min(0).max(100).optional(),
      scopeComplexity: z.number().min(0).max(100).optional(),
      technicalUncertainty: z.number().min(0).max(100).optional(),
      requirementClarity: z.number().min(0).max(100).optional(),
      marketDataAge: z.number().min(0).max(100).optional(),
      marketVolatility: z.number().min(0).max(100).optional(),
      supplierReliability: z.number().min(0).max(100).optional(),
    })
    .optional(),
  // Legacy support
  riskScore: z.number().min(0).max(10).optional(),
});

export type EnhancedProposalCalculationInput = z.infer<
  typeof EnhancedProposalCalculationSchema
>;

// Audit log interface for calculation tracking
export interface CalculationAuditLog {
  timestamp: Date;
  calculationId: string;
  input: EnhancedProposalCalculationInput;
  result: EnhancedProposalCalculationResult;
  executionTime: number;
  warnings: string[];
  errors: string[];
  riskAssessmentUsed: boolean;
  fallbackUsed: boolean;
}

// Enhanced error handling interface
export interface CalculationError {
  code:
    | 'RISK_ASSESSMENT_FAILED'
    | 'MARKET_ANALYSIS_FAILED'
    | 'CONFIDENCE_SCORING_FAILED'
    | 'VALIDATION_ERROR'
    | 'DATABASE_ERROR';
  message: string;
  details?: any;
  fallbackUsed: boolean;
}

export interface EnhancedProposalCalculationResult {
  // Basic calculation results
  baseCost: number;
  overheadAmount: number;
  overheadPercentage: number;
  profitAmount: number;
  profitMargin: number;
  totalCost: number;

  // Size-based overhead results
  isSizeBasedOverhead: boolean;
  overheadTier?: {
    maxSize: number;
    rate: number;
    description: string;
  };
  overheadCalculationMethod?: 'tiered' | 'smooth' | 'fixed';

  // Risk assessment results
  riskAssessment: RiskScoringResult | null;
  riskAdjustment: number;
  contingencyAmount: number;
  contingencyRate: number;

  // Risk-adjusted profit margin results
  isRiskAdjustedProfitMargin: boolean;
  baseProfitMargin: number;
  profitMarginAdjustment: number;
  profitMarginExplanation: string;

  // Confidence scoring results
  confidenceAssessment: ConfidenceScoringResult | null;
  isConfidenceScored: boolean;
  uncertaintyRange: {
    lowerBound: number;
    upperBound: number;
    multiplier: number;
  };

  // Market analysis
  winProbability: number;
  costPerSquareFoot: number;

  // Metadata
  calculationMethod: 'enhanced' | 'legacy';
  confidence: number;
  warnings: string[];

  // Enhanced integration metadata
  calculationId: string;
  executionTime: number;
  errors: CalculationError[];
  auditTrail: {
    riskAssessmentTimestamp?: Date;
    marketAnalysisTimestamp?: Date;
    confidenceScoringTimestamp?: Date;
    calculationSequence: string[];
  };
}

// Global audit log storage (in production, this would be a database)
const calculationAuditLogs: CalculationAuditLog[] = [];

// Generate unique calculation ID
function generateCalculationId(): string {
  return `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Enhanced error handling and validation
function validateRiskFactorInputs(
  riskFactorInputs: Record<string, { value: any; notes?: string }> | undefined
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!riskFactorInputs || Object.keys(riskFactorInputs).length === 0) {
    warnings.push('No risk factor inputs provided, using legacy risk scoring');
    return { isValid: false, errors, warnings };
  }

  // Validate each risk factor input
  for (const [factorName, input] of Object.entries(riskFactorInputs)) {
    if (input.value === undefined || input.value === null) {
      warnings.push(
        `Risk factor '${factorName}' has no value, will use default`
      );
    }
  }

  return { isValid: true, errors, warnings };
}

// Enhanced calculation pipeline with proper sequencing
export async function calculateEnhancedProposalPricing(
  input: EnhancedProposalCalculationInput
): Promise<
  EnhancedProposalCalculationResult & { contingencyRecommendation?: any }
> {
  const startTime = Date.now();
  const calculationId = generateCalculationId();
  const errors: CalculationError[] = [];
  const calculationSequence: string[] = [];

  const {
    baseCost,
    overheadPercentage,
    profitMargin,
    useSizeBasedOverhead,
    useSmoothScaling,
    projectType,
    squareFootage,
    buildingHeight,
    region,
    materialType,
    riskFactorInputs,
    riskScore: legacyRiskScore,
  } = input;

  let riskAssessment: RiskScoringResult | null = null;
  let riskAdjustment = 0;
  let contingencyAmount = 0;
  let contingencyRate = 0;
  let winProbability = 50; // Default
  let confidence = 1.0;
  let warnings: string[] = [];
  let calculationMethod: 'enhanced' | 'legacy' = 'legacy';

  // Step 1: Validate risk factor inputs
  calculationSequence.push('risk_validation');
  const riskValidation = validateRiskFactorInputs(riskFactorInputs);
  warnings.push(...riskValidation.warnings);

  // Step 2: Enhanced risk assessment (if inputs are valid)
  if (
    riskValidation.isValid &&
    riskFactorInputs &&
    Object.keys(riskFactorInputs).length > 0
  ) {
    try {
      calculationSequence.push('risk_assessment');
      const riskEngine = new RiskScoringEngine();
      await riskEngine.initialize();

      const riskInput: RiskScoringInput = {
        projectType,
        squareFootage,
        buildingHeight,
        region,
        factorInputs: riskFactorInputs,
      };

      riskAssessment = await riskEngine.calculateRiskScore(riskInput);

      // Use risk assessment results
      contingencyRate = riskAssessment.contingencyRate;
      contingencyAmount = baseCost * contingencyRate;
      winProbability = Math.max(10, 100 - riskAssessment.totalRiskScore * 0.8);
      confidence = riskAssessment.confidence;
      warnings.push(...riskAssessment.warnings);
      calculationMethod = 'enhanced';
    } catch (error) {
      console.error('Error in enhanced risk assessment:', error);
      errors.push({
        code: 'RISK_ASSESSMENT_FAILED',
        message:
          'Enhanced risk assessment failed, falling back to legacy method',
        details: error,
        fallbackUsed: true,
      });
      warnings.push(
        'Enhanced risk assessment failed, falling back to legacy method'
      );
    }
  }

  // Step 3: Fall back to legacy risk scoring if enhanced method failed
  if (calculationMethod === 'legacy' && legacyRiskScore !== undefined) {
    calculationSequence.push('legacy_risk_scoring');
    riskAdjustment = baseCost * (legacyRiskScore / 10) * 0.02;
    winProbability = Math.max(10, 100 - legacyRiskScore * 8);
    confidence = 0.8; // Lower confidence for legacy method
  }

  // Step 4: Calculate overhead with size-based adjustment
  calculationSequence.push('overhead_calculation');
  let overheadAmount: number;
  let actualOverheadPercentage: number;
  let isSizeBasedOverhead = false;
  let overheadTier:
    | { maxSize: number; rate: number; description: string }
    | undefined;
  let overheadCalculationMethod: 'tiered' | 'smooth' | 'fixed' | undefined;

  if (useSizeBasedOverhead && baseCost > 0) {
    const sizeBasedResult = calculateSizeBasedOverhead(
      baseCost,
      baseCost,
      useSmoothScaling
    );

    overheadAmount = sizeBasedResult.overheadAmount;
    actualOverheadPercentage = sizeBasedResult.overheadRate * 100;
    isSizeBasedOverhead = true;
    overheadTier = sizeBasedResult.tier;
    overheadCalculationMethod = sizeBasedResult.method;
  } else {
    overheadAmount = (baseCost * overheadPercentage) / 100;
    actualOverheadPercentage = overheadPercentage;
    isSizeBasedOverhead = false;
  }

  const costWithOverhead = baseCost + overheadAmount;

  // Step 5: Calculate risk-adjusted profit margin
  calculationSequence.push('profit_margin_calculation');
  let actualProfitMargin = profitMargin;
  let profitMarginAdjustment = 0;
  let profitMarginExplanation = '';

  if (riskAssessment) {
    try {
      const riskAdjustedMargin = calculateRiskAdjustedProfitMargin({
        baseProfitMargin: profitMargin,
        riskAssessment,
      });

      actualProfitMargin = riskAdjustedMargin.adjustedProfitMargin;
      profitMarginAdjustment = riskAdjustedMargin.marginAdjustment;
      profitMarginExplanation = riskAdjustedMargin.explanation;
      warnings.push(...riskAdjustedMargin.warnings);
    } catch (error) {
      console.error('Error in risk-adjusted profit margin calculation:', error);
      errors.push({
        code: 'VALIDATION_ERROR',
        message:
          'Risk-adjusted profit margin calculation failed, using base margin',
        details: error,
        fallbackUsed: true,
      });
      // Use base profit margin as fallback
      actualProfitMargin = profitMargin;
    }
  }

  // Step 6: Calculate profit amount using adjusted margin
  const profitAmount = (costWithOverhead * actualProfitMargin) / 100;
  const costWithProfit = costWithOverhead + profitAmount;

  // Step 7: Apply risk adjustments
  const totalCost = costWithProfit + riskAdjustment + contingencyAmount;

  // Step 8: Calculate cost per square foot
  let costPerSquareFoot = squareFootage ? totalCost / squareFootage : 0;

  // Step 9: Market analysis integration
  calculationSequence.push('market_analysis');
  let marketAnalysis: MarketAnalysisResult | null = null;
  if (region && materialType) {
    try {
      marketAnalysis = analyzeMarketConditions({
        region,
        materialType,
        projectType,
        squareFootage,
      });

      // Adjust winProbability and costPerSquareFoot based on market conditions
      winProbability = Math.max(
        10,
        Math.min(
          100,
          winProbability - (10 - marketAnalysis.marketConditionScore) * 0.3
        )
      );

      costPerSquareFoot =
        baseCost && squareFootage
          ? (baseCost *
              marketAnalysis.regionalAdjustment *
              (1 + marketAnalysis.materialCostTrend)) /
            squareFootage
          : 0;

      if (marketAnalysis.notes.length > 0) {
        warnings.push(...marketAnalysis.notes);
      }
    } catch (error) {
      console.error('Error in market analysis:', error);
      errors.push({
        code: 'MARKET_ANALYSIS_FAILED',
        message: 'Market analysis failed, using default values',
        details: error,
        fallbackUsed: true,
      });
      warnings.push('Market analysis failed, using default values');
    }
  } else {
    warnings.push(
      'Market analysis skipped: region or materialType not provided.'
    );
  }

  // Step 10: Contingency recommendation integration
  calculationSequence.push('contingency_recommendation');
  let contingencyRecommendation = null;
  if (riskAssessment) {
    try {
      contingencyRecommendation = getContingencyRecommendation({
        riskAssessment,
        marketAnalysis: marketAnalysis || undefined,
      });
    } catch (error) {
      console.error('Error in contingency recommendation:', error);
      errors.push({
        code: 'VALIDATION_ERROR',
        message: 'Contingency recommendation failed',
        details: error,
        fallbackUsed: true,
      });
    }
  }

  // Step 11: Confidence scoring integration
  calculationSequence.push('confidence_scoring');
  let confidenceAssessment: ConfidenceScoringResult | null = null;
  let isConfidenceScored = false;
  let uncertaintyRange = {
    lowerBound: 10,
    upperBound: 10,
    multiplier: 0.1,
  };

  if (input.confidenceFactors) {
    try {
      confidenceAssessment = calculateConfidenceScore({
        factors: input.confidenceFactors,
        riskAssessment: riskAssessment || undefined,
      });

      isConfidenceScored = true;
      if (confidenceAssessment) {
        uncertaintyRange = confidenceAssessment.uncertaintyRange;
        warnings.push(...confidenceAssessment.warnings);
        confidence = confidenceAssessment.confidenceScore / 100;
      }
    } catch (error) {
      console.error('Error in confidence scoring:', error);
      errors.push({
        code: 'CONFIDENCE_SCORING_FAILED',
        message: 'Confidence scoring failed, using default uncertainty range',
        details: error,
        fallbackUsed: true,
      });
      warnings.push(
        'Confidence scoring failed, using default uncertainty range'
      );
    }
  }

  const executionTime = Date.now() - startTime;

  const result: EnhancedProposalCalculationResult = {
    baseCost,
    overheadAmount,
    overheadPercentage: actualOverheadPercentage,
    profitAmount,
    profitMargin: actualProfitMargin,
    totalCost,
    isSizeBasedOverhead,
    overheadTier,
    overheadCalculationMethod,
    riskAssessment,
    riskAdjustment,
    contingencyAmount,
    contingencyRate,
    isRiskAdjustedProfitMargin: riskAssessment !== null,
    baseProfitMargin: profitMargin,
    profitMarginAdjustment,
    profitMarginExplanation,
    confidenceAssessment,
    isConfidenceScored,
    uncertaintyRange,
    winProbability,
    costPerSquareFoot,
    calculationMethod,
    confidence,
    warnings,
    calculationId,
    executionTime,
    errors,
    auditTrail: {
      riskAssessmentTimestamp: riskAssessment ? new Date() : undefined,
      marketAnalysisTimestamp: marketAnalysis ? new Date() : undefined,
      confidenceScoringTimestamp: confidenceAssessment ? new Date() : undefined,
      calculationSequence,
    },
  };

  // Log calculation for audit trail
  const auditLog: CalculationAuditLog = {
    timestamp: new Date(),
    calculationId,
    input,
    result,
    executionTime,
    warnings,
    errors: errors.map(e => e.message),
    riskAssessmentUsed: riskAssessment !== null,
    fallbackUsed: errors.some(e => e.fallbackUsed),
  };

  calculationAuditLogs.push(auditLog);

  return {
    ...result,
    contingencyRecommendation,
  };
}

/**
 * Retrieve calculation audit logs for monitoring and debugging
 */
export function getCalculationAuditLogs(
  options: {
    limit?: number;
    since?: Date;
    calculationId?: string;
    includeErrors?: boolean;
  } = {}
): CalculationAuditLog[] {
  const { limit = 100, since, calculationId, includeErrors = true } = options;

  let filteredLogs = [...calculationAuditLogs];

  // Filter by calculation ID if provided
  if (calculationId) {
    filteredLogs = filteredLogs.filter(
      log => log.calculationId === calculationId
    );
  }

  // Filter by date if provided
  if (since) {
    filteredLogs = filteredLogs.filter(log => log.timestamp >= since);
  }

  // Filter by errors if requested
  if (!includeErrors) {
    filteredLogs = filteredLogs.filter(log => log.errors.length === 0);
  }

  // Sort by timestamp (newest first) and limit results
  return filteredLogs
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

/**
 * Get calculation statistics for monitoring system performance
 */
export function getCalculationStatistics(): {
  totalCalculations: number;
  averageExecutionTime: number;
  errorRate: number;
  riskAssessmentUsageRate: number;
  fallbackUsageRate: number;
  recentErrors: string[];
} {
  if (calculationAuditLogs.length === 0) {
    return {
      totalCalculations: 0,
      averageExecutionTime: 0,
      errorRate: 0,
      riskAssessmentUsageRate: 0,
      fallbackUsageRate: 0,
      recentErrors: [],
    };
  }

  const totalCalculations = calculationAuditLogs.length;
  const totalExecutionTime = calculationAuditLogs.reduce(
    (sum, log) => sum + log.executionTime,
    0
  );
  const averageExecutionTime = totalExecutionTime / totalCalculations;

  const calculationsWithErrors = calculationAuditLogs.filter(
    log => log.errors.length > 0
  ).length;
  const errorRate = (calculationsWithErrors / totalCalculations) * 100;

  const calculationsWithRiskAssessment = calculationAuditLogs.filter(
    log => log.riskAssessmentUsed
  ).length;
  const riskAssessmentUsageRate =
    (calculationsWithRiskAssessment / totalCalculations) * 100;

  const calculationsWithFallback = calculationAuditLogs.filter(
    log => log.fallbackUsed
  ).length;
  const fallbackUsageRate =
    (calculationsWithFallback / totalCalculations) * 100;

  // Get recent errors (last 10 calculations with errors)
  const recentErrors = calculationAuditLogs
    .filter(log => log.errors.length > 0)
    .slice(0, 10)
    .flatMap(log => log.errors);

  return {
    totalCalculations,
    averageExecutionTime,
    errorRate,
    riskAssessmentUsageRate,
    fallbackUsageRate,
    recentErrors,
  };
}

/**
 * Clear old audit logs to prevent memory issues
 */
export function clearOldAuditLogs(olderThanDays: number = 30): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const initialLength = calculationAuditLogs.length;
  const filteredLogs = calculationAuditLogs.filter(
    log => log.timestamp >= cutoffDate
  );

  // Clear the array and repopulate with filtered logs
  calculationAuditLogs.length = 0;
  calculationAuditLogs.push(...filteredLogs);

  return initialLength - calculationAuditLogs.length;
}

/**
 * Clear all audit logs (useful for testing)
 */
export function clearAllAuditLogs(): number {
  const initialLength = calculationAuditLogs.length;
  calculationAuditLogs.length = 0;
  return initialLength;
}

/**
 * Calculate enhanced item-level pricing with risk assessment
 */
export async function calculateEnhancedItemPricing(
  quantity: number,
  unitCost: number,
  overheadPercentage: number = 15,
  profitMargin: number = 20,
  riskFactorInputs?: Record<
    string,
    { value: number | string | boolean; notes?: string }
  >
): Promise<{
  baseCost: number;
  overheadAmount: number;
  profitAmount: number;
  totalCost: number;
  riskAdjustment: number;
  contingencyAmount: number;
}> {
  const baseCost = quantity * unitCost;

  let riskAdjustment = 0;
  let contingencyAmount = 0;

  // Apply risk assessment if inputs provided
  if (riskFactorInputs && Object.keys(riskFactorInputs).length > 0) {
    try {
      const riskEngine = new RiskScoringEngine();
      await riskEngine.initialize();

      const riskAssessment = await riskEngine.calculateRiskScore({
        factorInputs: riskFactorInputs,
      });

      contingencyAmount = baseCost * riskAssessment.contingencyRate;
    } catch (error) {
      console.error('Error in item risk assessment:', error);
    }
  }

  const overheadAmount = (baseCost * overheadPercentage) / 100;
  const costWithOverhead = baseCost + overheadAmount;
  const profitAmount = (costWithOverhead * profitMargin) / 100;
  const totalCost =
    costWithOverhead + profitAmount + riskAdjustment + contingencyAmount;

  return {
    baseCost,
    overheadAmount,
    profitAmount,
    totalCost,
    riskAdjustment,
    contingencyAmount,
  };
}

/**
 * Enhanced proposal price calculation for wizard step
 */
export async function calculateEnhancedProposalPrice(input: {
  squareFootage: number;
  glassType: string;
  framingType: string;
  hardwareType: string;
  quantity: number;
  overheadPercentage: number;
  profitMargin: number;
  useSizeBasedOverhead?: boolean;
  useSmoothScaling?: boolean;
  riskFactorInputs?: Record<
    string,
    { value: number | string | boolean; notes?: string }
  >;
  region?: string;
  materialType?: string;
  // Legacy support
  riskFactor?: number;
}): Promise<{
  baseCost: number;
  withOverhead: number;
  finalPrice: number;
  riskAssessment?: RiskScoringResult;
  contingencyAmount: number;
  costPerSquareFoot: number;
  marketAnalysis?: any;
  isSizeBasedOverhead?: boolean;
  overheadTier?: {
    maxSize: number;
    rate: number;
    description: string;
  };
}> {
  // Base cost calculation based on specifications
  let baseCostPerSqFt = 25; // Base rate per square foot

  // Adjust for glass type
  const glassTypeMultipliers = {
    clear: 1.0,
    tinted: 1.2,
    reflective: 1.5,
    low_e: 1.3,
    tempered: 1.4,
  };
  baseCostPerSqFt *=
    glassTypeMultipliers[
      input.glassType as keyof typeof glassTypeMultipliers
    ] || 1.0;

  // Adjust for framing type
  const framingTypeMultipliers = {
    aluminum: 1.0,
    steel: 1.3,
    wood: 1.1,
    vinyl: 0.9,
  };
  baseCostPerSqFt *=
    framingTypeMultipliers[
      input.framingType as keyof typeof framingTypeMultipliers
    ] || 1.0;

  // Adjust for hardware type
  const hardwareTypeMultipliers = {
    standard: 1.0,
    premium: 1.2,
    custom: 1.5,
  };
  baseCostPerSqFt *=
    hardwareTypeMultipliers[
      input.hardwareType as keyof typeof hardwareTypeMultipliers
    ] || 1.0;

  const baseCost = baseCostPerSqFt * input.squareFootage * input.quantity;

  // Calculate overhead with size-based adjustment
  let overheadAmount: number;
  let isSizeBasedOverhead = false;
  let overheadTier:
    | { maxSize: number; rate: number; description: string }
    | undefined;

  if (input.useSizeBasedOverhead && baseCost > 0) {
    // Use size-based overhead calculation
    const sizeBasedResult = calculateSizeBasedOverhead(
      baseCost,
      baseCost, // Use baseCost as project size
      input.useSmoothScaling ?? true
    );

    overheadAmount = sizeBasedResult.overheadAmount;
    isSizeBasedOverhead = true;
    overheadTier = sizeBasedResult.tier;
  } else {
    // Use fixed overhead percentage
    overheadAmount = (baseCost * input.overheadPercentage) / 100;
    isSizeBasedOverhead = false;
  }

  const costWithOverhead = baseCost + overheadAmount;

  // Risk assessment
  let riskAssessment: RiskScoringResult | undefined;
  let contingencyAmount = 0;

  if (
    input.riskFactorInputs &&
    Object.keys(input.riskFactorInputs).length > 0
  ) {
    try {
      const riskEngine = new RiskScoringEngine();
      await riskEngine.initialize();

      riskAssessment = await riskEngine.calculateRiskScore({
        factorInputs: input.riskFactorInputs,
      });

      contingencyAmount = costWithOverhead * riskAssessment.contingencyRate;
    } catch (error) {
      console.error('Error in risk assessment:', error);
    }
  } else if (input.riskFactor) {
    // Legacy risk calculation
    contingencyAmount = costWithOverhead * (input.riskFactor / 100);
  }

  const profitAmount = (costWithOverhead * input.profitMargin) / 100;
  const finalPrice = costWithOverhead + profitAmount + contingencyAmount;

  // Market analysis integration
  let marketAnalysis = null;
  let costPerSquareFoot = finalPrice / input.squareFootage;

  if (input.region && input.materialType) {
    marketAnalysis = analyzeMarketConditions({
      region: input.region,
      materialType: input.materialType,
      squareFootage: input.squareFootage,
    });

    // Adjust cost per square foot based on market conditions
    costPerSquareFoot =
      (baseCost *
        marketAnalysis.regionalAdjustment *
        (1 + marketAnalysis.materialCostTrend)) /
      input.squareFootage;
  }

  return {
    baseCost,
    withOverhead: costWithOverhead,
    finalPrice,
    riskAssessment,
    contingencyAmount,
    costPerSquareFoot,
    marketAnalysis,
    isSizeBasedOverhead,
    overheadTier,
  };
}

/**
 * Get available risk factors for UI integration
 */
export async function getAvailableRiskFactors() {
  try {
    const riskEngine = new RiskScoringEngine();
    await riskEngine.initialize();

    return {
      factors: riskEngine.getRiskFactors(),
      categories: riskEngine.getRiskCategories(),
    };
  } catch (error) {
    console.error('Error getting risk factors:', error);
    return { factors: [], categories: [] };
  }
}
