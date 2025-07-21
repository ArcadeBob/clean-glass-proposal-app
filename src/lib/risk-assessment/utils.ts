import { RiskLevel } from './types';

/**
 * Calculate risk level based on total risk score (0-100)
 */
export function calculateRiskLevel(totalRiskScore: number): RiskLevel {
  if (totalRiskScore < 25) {
    return 'LOW';
  } else if (totalRiskScore < 50) {
    return 'MEDIUM';
  } else if (totalRiskScore < 75) {
    return 'HIGH';
  } else {
    return 'CRITICAL';
  }
}

/**
 * Calculate contingency rate based on risk level
 */
export function calculateContingencyRate(riskLevel: RiskLevel): number {
  switch (riskLevel) {
    case 'LOW':
      return 0.05; // 5%
    case 'MEDIUM':
      return 0.08; // 8%
    case 'HIGH':
      return 0.12; // 12%
    case 'CRITICAL':
      return 0.15; // 15%
    default:
      return 0.08;
  }
}

/**
 * Normalize a value to a 0-100 scale
 */
export function normalizeToScale(
  value: number,
  minValue: number,
  maxValue: number
): number {
  if (maxValue === minValue) {
    return 50; // Default to middle if range is zero
  }

  const normalized = ((value - minValue) / (maxValue - minValue)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

/**
 * Validate risk factor input based on data type
 */
export function validateRiskFactorInput(
  value: any,
  dataType: string,
  minValue?: number,
  maxValue?: number
): { isValid: boolean; error?: string } {
  switch (dataType) {
    case 'NUMERIC':
    case 'PERCENTAGE':
    case 'CURRENCY':
      if (typeof value !== 'number') {
        return { isValid: false, error: 'Value must be a number' };
      }
      if (minValue !== undefined && value < minValue) {
        return { isValid: false, error: `Value must be at least ${minValue}` };
      }
      if (maxValue !== undefined && value > maxValue) {
        return { isValid: false, error: `Value must be at most ${maxValue}` };
      }
      break;

    case 'BOOLEAN':
      if (typeof value !== 'boolean') {
        return { isValid: false, error: 'Value must be a boolean' };
      }
      break;

    case 'CATEGORICAL':
      if (typeof value !== 'string') {
        return { isValid: false, error: 'Value must be a string' };
      }
      break;

    case 'DATE':
      if (!(value instanceof Date) && typeof value !== 'string') {
        return { isValid: false, error: 'Value must be a date' };
      }
      break;
  }

  return { isValid: true };
}

/**
 * Generate risk recommendations based on risk level and factors
 */
export function generateRiskRecommendations(
  riskLevel: RiskLevel,
  topRiskFactors: Array<{ name: string; score: number }>
): string[] {
  const recommendations: string[] = [];

  // Base recommendations by risk level
  switch (riskLevel) {
    case 'LOW':
      recommendations.push(
        'Standard project management practices should be sufficient.'
      );
      break;
    case 'MEDIUM':
      recommendations.push(
        'Implement enhanced monitoring and regular risk reviews.'
      );
      recommendations.push(
        'Consider additional safety measures and quality controls.'
      );
      break;
    case 'HIGH':
      recommendations.push('Develop comprehensive risk mitigation plan.');
      recommendations.push(
        'Increase project oversight and monitoring frequency.'
      );
      recommendations.push('Consider additional insurance coverage.');
      break;
    case 'CRITICAL':
      recommendations.push('Requires senior management review and approval.');
      recommendations.push('Implement aggressive risk mitigation strategies.');
      recommendations.push(
        'Consider project scope reduction or timeline extension.'
      );
      recommendations.push('Engage specialized consultants if needed.');
      break;
  }

  // Factor-specific recommendations
  topRiskFactors.forEach(factor => {
    if (factor.score > 70) {
      recommendations.push(
        `High priority: Address ${factor.name} risk factor.`
      );
    }
  });

  return recommendations;
}
