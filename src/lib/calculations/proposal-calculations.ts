import { z } from 'zod';

// Validation schemas
export const ProposalCalculationSchema = z.object({
  baseCost: z.number().min(0),
  overheadPercentage: z.number().min(0).max(100).default(15),
  profitMargin: z.number().min(0).max(100).default(20),
  riskScore: z.number().min(0).max(10).default(0),
});

export type ProposalCalculationInput = z.infer<
  typeof ProposalCalculationSchema
>;

export interface ProposalCalculationResult {
  baseCost: number;
  overheadAmount: number;
  overheadPercentage: number;
  profitAmount: number;
  profitMargin: number;
  riskAdjustment: number;
  totalCost: number;
  winProbability: number;
}

/**
 * Calculate proposal pricing with overhead, profit margin, and risk adjustments
 */
export function calculateProposalPricing(
  input: ProposalCalculationInput
): ProposalCalculationResult {
  const { baseCost, overheadPercentage, profitMargin, riskScore } = input;

  // Calculate overhead
  const overheadAmount = (baseCost * overheadPercentage) / 100;
  const costWithOverhead = baseCost + overheadAmount;

  // Calculate profit margin
  const profitAmount = (costWithOverhead * profitMargin) / 100;
  const costWithProfit = costWithOverhead + profitAmount;

  // Calculate risk adjustment (higher risk = higher cost)
  const riskAdjustment = costWithProfit * riskScore * 0.02; // 2% per risk point
  const totalCost = costWithProfit + riskAdjustment;

  // Calculate win probability based on risk score (inverse relationship)
  const winProbability = Math.max(10, 100 - riskScore * 8); // 10% minimum, 8% reduction per risk point

  return {
    baseCost,
    overheadAmount,
    overheadPercentage,
    profitAmount,
    profitMargin,
    riskAdjustment,
    totalCost,
    winProbability,
  };
}

/**
 * Calculate item-level pricing
 */
export function calculateItemPricing(
  quantity: number,
  unitCost: number,
  overheadPercentage: number = 15,
  profitMargin: number = 20
): {
  baseCost: number;
  overheadAmount: number;
  profitAmount: number;
  totalCost: number;
} {
  const baseCost = quantity * unitCost;
  const overheadAmount = (baseCost * overheadPercentage) / 100;
  const costWithOverhead = baseCost + overheadAmount;
  const profitAmount = (costWithOverhead * profitMargin) / 100;
  const totalCost = costWithOverhead + profitAmount;

  return {
    baseCost,
    overheadAmount,
    profitAmount,
    totalCost,
  };
}

/**
 * Calculate total proposal from individual items
 */
export function calculateTotalProposal(
  items: Array<{ quantity: number; unitCost: number }>,
  overheadPercentage: number = 15,
  profitMargin: number = 20,
  riskScore: number = 0
): ProposalCalculationResult {
  const baseCost = items.reduce(
    (total, item) => total + item.quantity * item.unitCost,
    0
  );

  return calculateProposalPricing({
    baseCost,
    overheadPercentage,
    profitMargin,
    riskScore,
  });
}

/**
 * Calculate proposal price for wizard step
 */
export function calculateProposalPrice(input: {
  squareFootage: number;
  glassType: string;
  framingType: string;
  hardwareType: string;
  quantity: number;
  overheadPercentage: number;
  profitMargin: number;
  riskFactor: number;
}): {
  baseCost: number;
  withOverhead: number;
  finalPrice: number;
} {
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

  // Calculate base cost
  const baseCost = input.squareFootage * baseCostPerSqFt * input.quantity;

  // Calculate with overhead
  const overheadAmount = (baseCost * input.overheadPercentage) / 100;
  const withOverhead = baseCost + overheadAmount;

  // Calculate final price with profit margin and risk factor
  const profitAmount = (withOverhead * input.profitMargin) / 100;
  const riskAmount = (withOverhead * input.riskFactor) / 100;
  const finalPrice = withOverhead + profitAmount + riskAmount;

  return {
    baseCost,
    withOverhead,
    finalPrice,
  };
}
