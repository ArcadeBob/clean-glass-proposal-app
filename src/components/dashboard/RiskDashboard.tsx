import { MarketAnalysisResult } from '@/lib/calculations/market-analysis';
import { RiskScoringResult } from '@/lib/risk-assessment';

interface RiskDashboardProps {
  riskAssessment: RiskScoringResult;
  marketAnalysis?: MarketAnalysisResult;
  contingencyRecommendation?: {
    recommendedContingencyRate: number;
    recommendations: string[];
    explanation: string;
  };
}

// Simple circular gauge for risk score
function RiskScoreGauge({ score }: { score: number }) {
  const radius = 40;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const percent = Math.min(Math.max(score, 0), 100) / 100;
  const strokeDashoffset = circumference - percent * circumference;
  let color = '#22c55e'; // green
  if (score >= 75)
    color = '#ef4444'; // red
  else if (score >= 50)
    color = '#f59e42'; // orange
  else if (score >= 25) color = '#eab308'; // yellow

  return (
    <svg height={radius * 2} width={radius * 2}>
      <circle
        stroke="#e5e7eb"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={circumference + ' ' + circumference}
        style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s' }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        strokeLinecap="round"
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        fontSize="1.5rem"
        fill="#111827"
        fontWeight={700}
      >
        {score.toFixed(1)}
      </text>
    </svg>
  );
}

export default function RiskDashboard({
  riskAssessment,
  marketAnalysis,
  contingencyRecommendation,
}: RiskDashboardProps) {
  const topFactors = riskAssessment.factorBreakdown
    ? [...riskAssessment.factorBreakdown]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-8 items-center">
        <div className="flex flex-col items-center">
          <RiskScoreGauge score={riskAssessment.totalRiskScore} />
          <div className="mt-2 text-lg font-semibold text-gray-800">
            Risk Score
          </div>
          <div className="text-sm text-gray-500">
            {riskAssessment.riskLevel}
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-md font-semibold text-gray-900 mb-2">
            Top Risk Factors
          </h3>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {topFactors.map(factor => (
              <li key={factor.name}>
                <span className="font-medium">{factor.name}:</span>{' '}
                {factor.score.toFixed(1)} / 100
              </li>
            ))}
          </ul>
        </div>
        {contingencyRecommendation && (
          <div className="flex-1">
            <h3 className="text-md font-semibold text-orange-900 mb-2">
              Contingency
            </h3>
            <div className="text-orange-700 font-medium mb-1">
              Recommended:{' '}
              {(
                contingencyRecommendation.recommendedContingencyRate * 100
              ).toFixed(1)}
              %
            </div>
            <div className="text-xs text-orange-700 mb-1">
              {contingencyRecommendation.explanation}
            </div>
            <ul className="list-disc list-inside text-xs text-orange-700">
              {contingencyRecommendation.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-md font-semibold text-gray-900 mb-2">
          Risk Factor Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 border">Factor</th>
                <th className="px-2 py-1 border">Score</th>
              </tr>
            </thead>
            <tbody>
              {riskAssessment.factorBreakdown?.map(
                (factor: { name: string; score: number }) => (
                  <tr key={factor.name}>
                    <td className="px-2 py-1 border">{factor.name}</td>
                    <td className="px-2 py-1 border">
                      {factor.score.toFixed(1)}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {marketAnalysis && (
        <div>
          <h3 className="text-md font-semibold text-yellow-900 mb-2">
            Market Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-yellow-700 font-medium">
                Material Trend:
              </span>
              <span className="ml-2 text-yellow-900">
                {(marketAnalysis.materialCostTrend * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-yellow-700 font-medium">
                Labor Availability:
              </span>
              <span className="ml-2 text-yellow-900">
                {marketAnalysis.laborAvailabilityIndex}/100
              </span>
            </div>
            <div>
              <span className="text-yellow-700 font-medium">
                Regional Adjustment:
              </span>
              <span className="ml-2 text-yellow-900">
                {((marketAnalysis.regionalAdjustment - 1) * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-yellow-700 font-medium">
                Market Condition:
              </span>
              <span className="ml-2 text-yellow-900">
                {marketAnalysis.marketConditionScore}/100
              </span>
            </div>
          </div>
          {marketAnalysis.notes.length > 0 && (
            <div className="mt-2 text-xs text-yellow-700">
              <span className="font-medium">Notes:</span>
              <ul className="mt-1 list-disc list-inside">
                {marketAnalysis.notes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
