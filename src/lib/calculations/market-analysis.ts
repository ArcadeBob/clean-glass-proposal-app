// Market analysis types and logic for proposal pricing

export interface MarketAnalysisInput {
  region: string;
  materialType: string;
  projectType?: string;
  squareFootage?: number;
}

export interface MarketAnalysisResult {
  materialCostTrend: number; // percent change over last year
  laborAvailabilityIndex: number; // 0-100
  regionalAdjustment: number; // multiplier, e.g., 1.10 for +10%
  marketConditionScore: number; // 0-100
  notes: string[];
}

// Mock data for demonstration
const MATERIAL_PRICE_TRENDS: Record<string, number> = {
  glass: 0.08, // 8% increase
  aluminum: 0.05,
  steel: 0.12,
};

const LABOR_AVAILABILITY_BY_REGION: Record<string, number> = {
  Northeast: 70,
  Midwest: 80,
  South: 60,
  West: 75,
};

const REGIONAL_ADJUSTMENTS: Record<string, number> = {
  Northeast: 1.1,
  Midwest: 1.0,
  South: 0.95,
  West: 1.08,
};

export function analyzeMarketConditions(
  input: MarketAnalysisInput
): MarketAnalysisResult {
  const { region, materialType } = input;
  const notes: string[] = [];

  // Material cost trend
  const materialCostTrend = MATERIAL_PRICE_TRENDS[materialType] ?? 0.06;
  if (!MATERIAL_PRICE_TRENDS[materialType]) {
    notes.push(
      `No specific trend for material '${materialType}', using default 6%.`
    );
  }

  // Labor availability
  const laborAvailabilityIndex = LABOR_AVAILABILITY_BY_REGION[region] ?? 70;
  if (!LABOR_AVAILABILITY_BY_REGION[region]) {
    notes.push(`No labor data for region '${region}', using default 70.`);
  }

  // Regional adjustment
  const regionalAdjustment = REGIONAL_ADJUSTMENTS[region] ?? 1.0;
  if (!REGIONAL_ADJUSTMENTS[region]) {
    notes.push(`No regional adjustment for '${region}', using 1.0.`);
  }

  // Market condition score (simple weighted average)
  // Higher material cost trend and lower labor availability = worse conditions
  const marketConditionScore = Math.max(
    0,
    Math.round(
      100 -
        materialCostTrend * 50 -
        (100 - laborAvailabilityIndex) * 0.5 -
        (regionalAdjustment - 1) * 100
    )
  );

  return {
    materialCostTrend,
    laborAvailabilityIndex,
    regionalAdjustment,
    marketConditionScore,
    notes,
  };
}
