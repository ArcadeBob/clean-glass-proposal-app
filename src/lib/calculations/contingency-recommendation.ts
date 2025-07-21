import { RiskScoringResult } from '@/lib/risk-assessment';
import { MarketAnalysisResult } from './market-analysis';

export interface ContingencyRecommendationInput {
  riskAssessment: RiskScoringResult;
  marketAnalysis?: MarketAnalysisResult;
}

export interface ContingencyRecommendationResult {
  recommendedContingencyRate: number; // e.g., 0.08 for 8%
  recommendations: string[];
  explanation: string;
}

export function getContingencyRecommendation(
  input: ContingencyRecommendationInput
): ContingencyRecommendationResult {
  const { riskAssessment, marketAnalysis } = input;
  const { totalRiskScore, riskLevel, factorBreakdown } = riskAssessment;
  let recommendedContingencyRate = 0.08; // default
  let recommendations: string[] = [];
  let explanation = '';

  // Rule-based contingency rate
  if (riskLevel === 'LOW') {
    recommendedContingencyRate = 0.05 + (totalRiskScore / 100) * 0.05; // 5-10%
    explanation =
      'Low risk: contingency set between 5-10% based on risk score.';
  } else if (riskLevel === 'MEDIUM') {
    recommendedContingencyRate = 0.1 + ((totalRiskScore - 25) / 25) * 0.1; // 10-20%
    explanation =
      'Medium risk: contingency set between 10-20% based on risk score.';
  } else if (riskLevel === 'HIGH') {
    recommendedContingencyRate = 0.2 + ((totalRiskScore - 50) / 25) * 0.15; // 20-35%
    explanation =
      'High risk: contingency set between 20-35% based on risk score.';
  } else if (riskLevel === 'CRITICAL') {
    recommendedContingencyRate = 0.35;
    explanation = 'Critical risk: maximum contingency of 35% recommended.';
  }

  // Analyze top risk factors
  if (factorBreakdown && Array.isArray(factorBreakdown)) {
    const topFactors = factorBreakdown
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    for (const factor of topFactors) {
      if (factor.score > 60) {
        if (factor.name.toLowerCase().includes('weather')) {
          recommendations.push(
            'Consider weather protection measures for seasonal risks.'
          );
        } else if (factor.name.toLowerCase().includes('material')) {
          recommendations.push(
            'Identify alternative suppliers for material risk mitigation.'
          );
        } else if (factor.name.toLowerCase().includes('labor')) {
          recommendations.push(
            'Plan for labor shortages or secure backup crews.'
          );
        } else {
          recommendations.push(`Mitigate high risk in: ${factor.name}.`);
        }
      }
    }
  }

  // Market analysis-based recommendations
  if (marketAnalysis) {
    if (marketAnalysis.materialCostTrend > 0.1) {
      recommendations.push(
        'Material costs are rising rapidly; consider locking in prices early.'
      );
    }
    if (marketAnalysis.laborAvailabilityIndex < 65) {
      recommendations.push(
        'Labor availability is low; plan for potential delays or higher costs.'
      );
    }
    if (marketAnalysis.marketConditionScore < 60) {
      recommendations.push(
        'Market conditions are challenging; consider additional contingency.'
      );
    }
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'No specific high-risk factors identified. Standard contingency applies.'
    );
  }

  return {
    recommendedContingencyRate: Math.min(
      Math.max(recommendedContingencyRate, 0.05),
      0.35
    ),
    recommendations,
    explanation,
  };
}
