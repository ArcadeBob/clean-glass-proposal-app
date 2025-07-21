import {
  RiskScoringEngine,
  RiskScoringInput,
  RiskScoringResult,
} from '@/lib/risk-assessment';
import { z } from 'zod';
import { getContingencyRecommendation } from './contingency-recommendation';
import {
  analyzeMarketConditions,
  MarketAnalysisResult,
} from './market-analysis';

// Enhanced validation schemas
export const EnhancedProposalCalculationSchema = z.object({
  baseCost: z.number().min(0),
  overheadPercentage: z.number().min(0).max(100).default(15),
  profitMargin: z.number().min(0).max(100).default(20),
  // Risk assessment inputs
  projectType: z.string().optional(),
  squareFootage: z.number().optional(),
  buildingHeight: z.number().optional(),
  region: z.string().optional(),
  materialType: z.string().optional(), // <-- Add materialType
  riskFactorInputs: z
    .record(
      z.object({
        value: z.union([z.number(), z.string(), z.boolean()]),
        notes: z.string().optional(),
      })
    )
    .optional(),
  // Legacy support
  riskScore: z.number().min(0).max(10).optional(),
});

export type EnhancedProposalCalculationInput = z.infer<
  typeof EnhancedProposalCalculationSchema
>;

export interface EnhancedProposalCalculationResult {
  // Basic calculation results
  baseCost: number;
  overheadAmount: number;
  overheadPercentage: number;
  profitAmount: number;
  profitMargin: number;
  totalCost: number;

  // Risk assessment results
  riskAssessment: RiskScoringResult | null;
  riskAdjustment: number;
  contingencyAmount: number;
  contingencyRate: number;

  // Market analysis
  winProbability: number;
  costPerSquareFoot: number;

  // Metadata
  calculationMethod: 'enhanced' | 'legacy';
  confidence: number;
  warnings: string[];
}

/**
 * Enhanced proposal calculation with integrated risk assessment
 */
export async function calculateEnhancedProposalPricing(
  input: EnhancedProposalCalculationInput
): Promise<
  EnhancedProposalCalculationResult & { contingencyRecommendation?: any }
> {
  const {
    baseCost,
    overheadPercentage,
    profitMargin,
    projectType,
    squareFootage,
    buildingHeight,
    region,
    materialType, // <-- Add materialType
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

  // Try to use enhanced risk assessment if inputs are provided
  if (riskFactorInputs && Object.keys(riskFactorInputs).length > 0) {
    try {
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
      winProbability = Math.max(10, 100 - riskAssessment.totalRiskScore * 0.8); // 0.8% reduction per risk point
      confidence = riskAssessment.confidence;
      warnings = riskAssessment.warnings;
      calculationMethod = 'enhanced';
    } catch (error) {
      console.error('Error in enhanced risk assessment:', error);
      warnings.push(
        'Enhanced risk assessment failed, falling back to legacy method'
      );
      // Fall back to legacy method
    }
  }

  // Fall back to legacy risk scoring if enhanced method failed or not available
  if (calculationMethod === 'legacy' && legacyRiskScore !== undefined) {
    // Legacy risk adjustment (2% per risk point)
    riskAdjustment = baseCost * (legacyRiskScore / 10) * 0.02;
    winProbability = Math.max(10, 100 - legacyRiskScore * 8); // 8% reduction per risk point
    confidence = 0.8; // Lower confidence for legacy method
  }

  // Calculate overhead
  const overheadAmount = (baseCost * overheadPercentage) / 100;
  const costWithOverhead = baseCost + overheadAmount;

  // Calculate profit margin
  const profitAmount = (costWithOverhead * profitMargin) / 100;
  const costWithProfit = costWithOverhead + profitAmount;

  // Apply risk adjustments
  const totalCost = costWithProfit + riskAdjustment + contingencyAmount;

  // Calculate cost per square foot if square footage is provided
  let costPerSquareFoot = squareFootage ? totalCost / squareFootage : 0;

  // Market analysis integration
  let marketAnalysis: MarketAnalysisResult | null = null;
  if (region && materialType) {
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
    // Example: costPerSquareFoot increases with regional adjustment and material trend
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
  } else {
    warnings.push(
      'Market analysis skipped: region or materialType not provided.'
    );
  }

  // Contingency recommendation integration
  let contingencyRecommendation = null;
  if (riskAssessment) {
    contingencyRecommendation = getContingencyRecommendation({
      riskAssessment,
      marketAnalysis: marketAnalysis || undefined,
    });
  }

  return {
    baseCost,
    overheadAmount,
    overheadPercentage,
    profitAmount,
    profitMargin,
    totalCost,
    riskAssessment,
    riskAdjustment,
    contingencyAmount,
    contingencyRate,
    winProbability,
    costPerSquareFoot,
    calculationMethod,
    confidence,
    warnings,
    contingencyRecommendation,
  };
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
  const overheadAmount = (baseCost * input.overheadPercentage) / 100;
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
