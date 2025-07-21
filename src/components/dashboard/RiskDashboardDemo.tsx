import { getContingencyRecommendation } from '@/lib/calculations/contingency-recommendation';
import { MarketAnalysisResult } from '@/lib/calculations/market-analysis';
import { RiskScoringResult } from '@/lib/risk-assessment';
import RiskDashboard from './RiskDashboard';

export default function RiskDashboardDemo() {
  // Sample risk assessment data
  const sampleRiskAssessment: RiskScoringResult = {
    totalRiskScore: 65.5,
    riskLevel: 'HIGH',
    contingencyRate: 0.15,
    factorBreakdown: [
      { name: 'Weather Conditions', score: 85.0 },
      { name: 'Material Availability', score: 70.0 },
      { name: 'Labor Shortage', score: 60.0 },
      { name: 'Site Access', score: 45.0 },
      { name: 'Regulatory Compliance', score: 30.0 },
      { name: 'Equipment Reliability', score: 25.0 },
    ],
  };

  // Sample market analysis data
  const sampleMarketAnalysis: MarketAnalysisResult = {
    materialCostTrend: 0.12, // 12% increase
    laborAvailabilityIndex: 65, // 65/100
    regionalAdjustment: 1.08, // 8% increase
    marketConditionScore: 58, // 58/100
    notes: [
      'Material costs rising faster than expected',
      'Labor availability below regional average',
      'Regional market showing moderate stress',
    ],
  };

  // Get contingency recommendation
  const contingencyRecommendation = getContingencyRecommendation({
    riskAssessment: sampleRiskAssessment,
    marketAnalysis: sampleMarketAnalysis,
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Risk Analysis Dashboard
        </h2>
        <p className="text-sm text-gray-600">
          Sample data showing risk assessment, market analysis, and contingency
          recommendations
        </p>
      </div>

      <RiskDashboard
        riskAssessment={sampleRiskAssessment}
        marketAnalysis={sampleMarketAnalysis}
        contingencyRecommendation={contingencyRecommendation}
      />
    </div>
  );
}
