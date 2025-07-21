import RiskDashboard from '@/components/dashboard/RiskDashboard';
import { MarketAnalysisResult } from '@/lib/calculations/market-analysis';
import { RiskScoringResult } from '@/lib/risk-assessment';
import { render, screen } from '@testing-library/react';

// Mock the risk assessment module
jest.mock('@/lib/risk-assessment', () => ({
  RiskScoringResult: jest.fn(),
}));

describe('RiskDashboard', () => {
  const mockRiskAssessment: RiskScoringResult = {
    totalRiskScore: 65.5,
    riskLevel: 'HIGH',
    contingencyRate: 0.15,
    factorBreakdown: [
      { name: 'Weather Conditions', score: 85.0 },
      { name: 'Material Availability', score: 70.0 },
      { name: 'Labor Shortage', score: 60.0 },
    ],
  };

  const mockMarketAnalysis: MarketAnalysisResult = {
    materialCostTrend: 0.12,
    laborAvailabilityIndex: 65,
    regionalAdjustment: 1.08,
    marketConditionScore: 58,
    notes: ['Material costs rising faster than expected'],
  };

  const mockContingencyRecommendation = {
    recommendedContingencyRate: 0.25,
    recommendations: ['Consider weather protection measures'],
    explanation:
      'High risk: contingency set between 20-35% based on risk score.',
  };

  it('renders risk score gauge with correct value', () => {
    render(
      <RiskDashboard
        riskAssessment={mockRiskAssessment}
        marketAnalysis={mockMarketAnalysis}
        contingencyRecommendation={mockContingencyRecommendation}
      />
    );

    expect(screen.getByText('65.5')).toBeInTheDocument();
    expect(screen.getByText('Risk Score')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('displays top risk factors', () => {
    render(
      <RiskDashboard
        riskAssessment={mockRiskAssessment}
        marketAnalysis={mockMarketAnalysis}
        contingencyRecommendation={mockContingencyRecommendation}
      />
    );

    expect(screen.getByText('Top Risk Factors')).toBeInTheDocument();
    expect(screen.getByText('Weather Conditions')).toBeInTheDocument();
    expect(screen.getByText('Material Availability')).toBeInTheDocument();
    expect(screen.getByText('Labor Shortage')).toBeInTheDocument();
    expect(screen.getByText('85.0')).toBeInTheDocument();
    expect(screen.getByText('70.0')).toBeInTheDocument();
    expect(screen.getByText('60.0')).toBeInTheDocument();
  });

  it('displays contingency recommendation when provided', () => {
    render(
      <RiskDashboard
        riskAssessment={mockRiskAssessment}
        marketAnalysis={mockMarketAnalysis}
        contingencyRecommendation={mockContingencyRecommendation}
      />
    );

    expect(screen.getByText('Contingency')).toBeInTheDocument();
    expect(
      screen.getByText(/High risk: contingency set between 20-35%/)
    ).toBeInTheDocument();
    expect(
      screen.getByText('Consider weather protection measures')
    ).toBeInTheDocument();
  });

  it('displays market analysis when provided', () => {
    render(
      <RiskDashboard
        riskAssessment={mockRiskAssessment}
        marketAnalysis={mockMarketAnalysis}
        contingencyRecommendation={mockContingencyRecommendation}
      />
    );

    expect(screen.getByText('Market Analysis')).toBeInTheDocument();
    expect(screen.getByText('Material Trend:')).toBeInTheDocument();
    expect(screen.getByText('12.0%')).toBeInTheDocument();
    expect(screen.getByText('Labor Availability:')).toBeInTheDocument();
    expect(screen.getByText('65/100')).toBeInTheDocument();
    expect(screen.getByText('Regional Adjustment:')).toBeInTheDocument();
    expect(screen.getByText('8.0%')).toBeInTheDocument();
    expect(screen.getByText('Market Condition:')).toBeInTheDocument();
    expect(screen.getByText('58/100')).toBeInTheDocument();
    expect(
      screen.getByText('Material costs rising faster than expected')
    ).toBeInTheDocument();
  });

  it('renders risk factor breakdown table', () => {
    render(
      <RiskDashboard
        riskAssessment={mockRiskAssessment}
        marketAnalysis={mockMarketAnalysis}
        contingencyRecommendation={mockContingencyRecommendation}
      />
    );

    expect(screen.getByText('Risk Factor Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Factor')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();

    // Check for all factors in the table
    expect(screen.getByText('Weather Conditions')).toBeInTheDocument();
    expect(screen.getByText('Material Availability')).toBeInTheDocument();
    expect(screen.getByText('Labor Shortage')).toBeInTheDocument();
  });

  it('handles missing optional props gracefully', () => {
    render(<RiskDashboard riskAssessment={mockRiskAssessment} />);

    // Should still render the main risk dashboard
    expect(screen.getByText('Risk Score')).toBeInTheDocument();
    expect(screen.getByText('Top Risk Factors')).toBeInTheDocument();
    expect(screen.getByText('Risk Factor Breakdown')).toBeInTheDocument();

    // Should not render optional sections
    expect(screen.queryByText('Contingency')).not.toBeInTheDocument();
    expect(screen.queryByText('Market Analysis')).not.toBeInTheDocument();
  });

  it('handles empty factor breakdown', () => {
    const riskAssessmentWithoutFactors = {
      ...mockRiskAssessment,
      factorBreakdown: undefined,
    };

    render(<RiskDashboard riskAssessment={riskAssessmentWithoutFactors} />);

    expect(screen.getByText('Risk Score')).toBeInTheDocument();
    expect(screen.getByText('Top Risk Factors')).toBeInTheDocument();
    expect(screen.getByText('Risk Factor Breakdown')).toBeInTheDocument();
  });
});
