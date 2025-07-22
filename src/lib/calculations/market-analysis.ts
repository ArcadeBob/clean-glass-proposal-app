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

export interface BenchmarkResult {
  marketAverage: number;
  marketMedian: number;
  marketStdDev: number;
  percentile: number;
  varianceFromAverage: number;
  category: 'below' | 'at' | 'above';
  confidence: number;
  sampleSize: number;
  recentSampleSize: number;
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

/**
 * Benchmark a project's cost/SF against market data
 * @param params { region, projectType, costPerSF, effectiveDate? }
 * @param marketData Array<{ value: number, region: string, projectType?: string, effectiveDate?: string }>
 */
export function benchmarkProjectCost(
  params: {
    region: string;
    projectType?: string;
    costPerSF: number;
    effectiveDate?: string;
  },
  marketData: Array<{
    value: number;
    region: string;
    projectType?: string;
    effectiveDate?: string;
  }>
): BenchmarkResult {
  const { region, projectType, costPerSF, effectiveDate } = params;
  const notes: string[] = [];

  // Filter market data by region and (if available) projectType
  let filtered = marketData.filter(d => d.region === region);
  if (projectType) {
    const withType = filtered.filter(d => d.projectType === projectType);
    if (withType.length > 0) filtered = withType;
    else
      notes.push(
        'No market data for this project type; using all types in region.'
      );
  }
  if (filtered.length === 0) {
    notes.push('No market data for this region; using all available data.');
    filtered = marketData;
  }

  // Sort by value
  const values = filtered.map(d => d.value).sort((a, b) => a - b);
  const sampleSize = values.length;
  if (sampleSize === 0) {
    return {
      marketAverage: 0,
      marketMedian: 0,
      marketStdDev: 0,
      percentile: 0,
      varianceFromAverage: 0,
      category: 'at',
      confidence: 0,
      sampleSize: 0,
      recentSampleSize: 0,
      notes: ['No market data available.'],
    };
  }

  // Market average
  const marketAverage = values.reduce((a, b) => a + b, 0) / sampleSize;
  // Market median
  const marketMedian = values[Math.floor(sampleSize / 2)];
  // Market std dev
  const mean = marketAverage;
  const marketStdDev = Math.sqrt(
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / sampleSize
  );
  // Percentile
  const lessThan = values.filter(v => v < costPerSF).length;
  const percentile = (lessThan / sampleSize) * 100;
  // Variance from average
  const varianceFromAverage =
    ((costPerSF - marketAverage) / marketAverage) * 100;
  // Category (within ±5% of average is 'at')
  let category: 'below' | 'at' | 'above' = 'at';
  if (varianceFromAverage < -5) category = 'below';
  else if (varianceFromAverage > 5) category = 'above';

  // Confidence: based on sample size and recency
  let recentSampleSize = 0;
  if (effectiveDate) {
    const cutoff = new Date(effectiveDate);
    cutoff.setFullYear(cutoff.getFullYear() - 2); // last 2 years
    recentSampleSize = filtered.filter(
      d => d.effectiveDate && new Date(d.effectiveDate) >= cutoff
    ).length;
  }
  const confidence = Math.min(1, sampleSize / 20 + recentSampleSize / 10); // crude: 20+ samples and 10+ recent = 100%

  return {
    marketAverage,
    marketMedian,
    marketStdDev,
    percentile,
    varianceFromAverage,
    category,
    confidence,
    sampleSize,
    recentSampleSize,
    notes,
  };
}

/**
 * Calculate win probability using a logistic regression model (mock coefficients)
 * @param features { costPerSF, riskScore, marketPercentile, projectType, region }
 * @returns win probability (0-100%)
 */
export function calculateWinProbability({
  costPerSF,
  riskScore,
  marketPercentile,
  projectType,
  region,
}: {
  costPerSF: number;
  riskScore: number;
  marketPercentile: number;
  projectType?: string;
  region?: string;
}): number {
  // Mock coefficients (to be learned from data in real use)
  const intercept = -1.2;
  const coefCostPerSF = -0.04;
  const coefRiskScore = -0.08;
  const coefMarketPercentile = -0.03;
  // Optionally add projectType/region coefficients if desired

  // Logistic regression formula: p = 1 / (1 + exp(-(b0 + b1*x1 + ...)))
  const z =
    intercept +
    coefCostPerSF * costPerSF +
    coefRiskScore * riskScore +
    coefMarketPercentile * marketPercentile;
  const p = 1 / (1 + Math.exp(-z));
  return Math.round(p * 1000) / 10; // 0-100% rounded to 0.1%
}

/**
 * Recommend pricing packages based on market and win probability
 * @param params { baseCost, marketAverage, marketPercentile, winProbability, minMargin, maxMargin }
 * @returns Array of package options
 */
export function recommendPackages({
  baseCost,
  marketAverage,
  marketPercentile,
  winProbability,
  minMargin = 8,
  maxMargin = 20,
}: {
  baseCost: number;
  marketAverage: number;
  marketPercentile: number;
  winProbability: number;
  minMargin?: number;
  maxMargin?: number;
}) {
  // Aggressive: 5% below market, min margin
  const aggressiveMargin = minMargin;
  const aggressivePrice = Math.max(
    baseCost * (1 + aggressiveMargin / 100),
    marketAverage * 0.95
  );
  // Competitive: at market, mid margin
  const competitiveMargin = (minMargin + maxMargin) / 2;
  const competitivePrice = Math.max(
    baseCost * (1 + competitiveMargin / 100),
    marketAverage
  );
  // Premium: 5% above market, max margin
  const premiumMargin = maxMargin;
  const premiumPrice = Math.max(
    baseCost * (1 + premiumMargin / 100),
    marketAverage * 1.05
  );
  // Estimate win probability for each (simple adjustment)
  const aggrWin = Math.min(100, winProbability + 15);
  const compWin = winProbability;
  const premWin = Math.max(5, winProbability - 15);
  return [
    {
      label: 'Aggressive',
      price: Math.round(aggressivePrice * 100) / 100,
      margin: aggressiveMargin,
      estimatedWinProbability: aggrWin,
      notes: ['Lowest price, highest win chance, lowest margin'],
    },
    {
      label: 'Competitive',
      price: Math.round(competitivePrice * 100) / 100,
      margin: competitiveMargin,
      estimatedWinProbability: compWin,
      notes: ['Market price, balanced win chance and margin'],
    },
    {
      label: 'Premium',
      price: Math.round(premiumPrice * 100) / 100,
      margin: premiumMargin,
      estimatedWinProbability: premWin,
      notes: ['Highest price, lowest win chance, highest margin'],
    },
  ];
}

/**
 * Aggregate proposal stats for reporting dashboard
 * @param proposals Array<{ status, costPerSF, margin, region, projectType, date, outcome }>
 * @returns { winRates, avgCostPerSF, avgMargin } grouped by year/region/type
 */
export function getProposalStats(
  proposals: Array<{
    status: string;
    costPerSF: number;
    margin: number;
    region?: string;
    projectType?: string;
    date: string;
    outcome?: 'WON' | 'LOST';
  }>
) {
  const byYear: Record<string, any> = {};
  for (const p of proposals) {
    const year = new Date(p.date).getFullYear();
    if (!byYear[year])
      byYear[year] = { count: 0, won: 0, costSum: 0, marginSum: 0 };
    byYear[year].count++;
    if (p.outcome === 'WON' || p.status === 'ACCEPTED') byYear[year].won++;
    byYear[year].costSum += p.costPerSF;
    byYear[year].marginSum += p.margin;
  }
  const winRates = Object.fromEntries(
    Object.entries(byYear).map(([year, stats]) => [
      year,
      stats.count ? stats.won / stats.count : 0,
    ])
  );
  const avgCostPerSF = Object.fromEntries(
    Object.entries(byYear).map(([year, stats]) => [
      year,
      stats.count ? stats.costSum / stats.count : 0,
    ])
  );
  const avgMargin = Object.fromEntries(
    Object.entries(byYear).map(([year, stats]) => [
      year,
      stats.count ? stats.marginSum / stats.count : 0,
    ])
  );
  return { winRates, avgCostPerSF, avgMargin };
}

/**
 * Aggregate market data trends for reporting dashboard
 * @param marketData Array<{ value, region, projectType, effectiveDate }>
 * @returns { trends } cost/SF by year/region/type
 */
export function getMarketTrends(
  marketData: Array<{
    value: number;
    region?: string;
    projectType?: string;
    effectiveDate: string;
  }>
) {
  const byYear: Record<string, { sum: number; count: number }> = {};
  for (const d of marketData) {
    const year = new Date(d.effectiveDate).getFullYear();
    if (!byYear[year]) byYear[year] = { sum: 0, count: 0 };
    byYear[year].sum += d.value;
    byYear[year].count++;
  }
  const trends = Object.fromEntries(
    Object.entries(byYear).map(([year, stats]) => [
      year,
      stats.count ? stats.sum / stats.count : 0,
    ])
  );
  return { trends };
}
