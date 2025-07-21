import { getContingencyRecommendation } from '@/lib/calculations/contingency-recommendation';
import { MarketAnalysisResult } from '@/lib/calculations/market-analysis';
import { RiskScoringResult } from '@/lib/risk-assessment';

describe('Contingency Recommendation Engine', () => {
  const baseRiskAssessment = (
    overrides: Partial<RiskScoringResult> = {}
  ): RiskScoringResult => ({
    totalRiskScore: 30,
    riskLevel: 'MEDIUM',
    contingencyRate: 0.1,
    factorBreakdown: [
      { name: 'Weather', score: 80 },
      { name: 'Material', score: 40 },
      { name: 'Labor', score: 20 },
    ],
    ...overrides,
  });

  const baseMarketAnalysis = (
    overrides: Partial<MarketAnalysisResult> = {}
  ): MarketAnalysisResult => ({
    materialCostTrend: 0.08,
    laborAvailabilityIndex: 70,
    regionalAdjustment: 1.1,
    marketConditionScore: 80,
    notes: [],
    ...overrides,
  });

  it('should recommend 5-10% for LOW risk', () => {
    const result = getContingencyRecommendation({
      riskAssessment: baseRiskAssessment({
        riskLevel: 'LOW',
        totalRiskScore: 10,
      }),
    });
    expect(result.recommendedContingencyRate).toBeGreaterThanOrEqual(0.05);
    expect(result.recommendedContingencyRate).toBeLessThanOrEqual(0.1);
    expect(result.explanation).toMatch(/Low risk/);
  });

  it('should recommend 10-20% for MEDIUM risk', () => {
    const result = getContingencyRecommendation({
      riskAssessment: baseRiskAssessment({
        riskLevel: 'MEDIUM',
        totalRiskScore: 35,
      }),
    });
    expect(result.recommendedContingencyRate).toBeGreaterThanOrEqual(0.1);
    expect(result.recommendedContingencyRate).toBeLessThanOrEqual(0.2);
    expect(result.explanation).toMatch(/Medium risk/);
  });

  it('should recommend 20-35% for HIGH risk', () => {
    const result = getContingencyRecommendation({
      riskAssessment: baseRiskAssessment({
        riskLevel: 'HIGH',
        totalRiskScore: 60,
      }),
    });
    expect(result.recommendedContingencyRate).toBeGreaterThanOrEqual(0.2);
    expect(result.recommendedContingencyRate).toBeLessThanOrEqual(0.35);
    expect(result.explanation).toMatch(/High risk/);
  });

  it('should recommend 35% for CRITICAL risk', () => {
    const result = getContingencyRecommendation({
      riskAssessment: baseRiskAssessment({
        riskLevel: 'CRITICAL',
        totalRiskScore: 90,
      }),
    });
    expect(result.recommendedContingencyRate).toBe(0.35);
    expect(result.explanation).toMatch(/Critical risk/);
  });

  it('should include weather and material recommendations for high scores', () => {
    const result = getContingencyRecommendation({
      riskAssessment: baseRiskAssessment({
        factorBreakdown: [
          { name: 'Weather', score: 85 },
          { name: 'Material', score: 70 },
          { name: 'Labor', score: 20 },
        ],
      }),
    });
    expect(
      result.recommendations.some(r => r.includes('weather protection'))
    ).toBe(true);
    expect(
      result.recommendations.some(r => r.includes('alternative suppliers'))
    ).toBe(true);
  });

  it('should include market analysis recommendations', () => {
    const result = getContingencyRecommendation({
      riskAssessment: baseRiskAssessment(),
      marketAnalysis: baseMarketAnalysis({
        materialCostTrend: 0.12,
        laborAvailabilityIndex: 60,
        marketConditionScore: 55,
      }),
    });
    expect(
      result.recommendations.some(r => r.includes('Material costs are rising'))
    ).toBe(true);
    expect(
      result.recommendations.some(r => r.includes('Labor availability is low'))
    ).toBe(true);
    expect(
      result.recommendations.some(r =>
        r.includes('Market conditions are challenging')
      )
    ).toBe(true);
  });

  it('should default to standard contingency if no high risks', () => {
    const result = getContingencyRecommendation({
      riskAssessment: baseRiskAssessment({
        factorBreakdown: [
          { name: 'Weather', score: 20 },
          { name: 'Material', score: 10 },
        ],
      }),
    });
    expect(
      result.recommendations.some(r => r.includes('Standard contingency'))
    ).toBe(true);
  });
});
