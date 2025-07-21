/**
 * Risk level enum matching the database schema
 */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Scoring type enum matching the database schema
 */
export type ScoringType =
  | 'LINEAR'
  | 'EXPONENTIAL'
  | 'THRESHOLD'
  | 'CATEGORICAL'
  | 'FORMULA';

/**
 * Data type enum matching the database schema
 */
export type DataType =
  | 'NUMERIC'
  | 'PERCENTAGE'
  | 'CURRENCY'
  | 'CATEGORICAL'
  | 'BOOLEAN'
  | 'DATE';

/**
 * Input data for risk scoring calculations
 */
export interface RiskScoringInput {
  // Project context
  projectType?: string;
  squareFootage?: number;
  buildingHeight?: number;
  region?: string;

  // Risk factor inputs - keyed by factor name
  factorInputs: Record<string, RiskFactorInput>;

  // Optional overrides
  categoryWeights?: Record<string, number>;
  factorWeights?: Record<string, number>;
}

/**
 * Individual risk factor input value
 */
export interface RiskFactorInput {
  value: number | string | boolean;
  notes?: string;
}

/**
 * Result of risk scoring calculation
 */
export interface RiskScoringResult {
  // Overall risk assessment
  totalRiskScore: number; // 0-100 scale
  riskLevel: RiskLevel;
  confidence: number; // 0-1 scale

  // Breakdown by category
  categoryScores: RiskCategoryScore[];

  // Individual factor scores
  factorScores: RiskFactorScore[];

  // Recommendations
  recommendations: string[];
  contingencyRate: number; // 0.05 to 0.15 (5% to 15%)

  // Metadata
  calculationTimestamp: Date;
  factorsProcessed: number;
  warnings: string[];
}

/**
 * Risk score for a specific category
 */
export interface RiskCategoryScore {
  categoryId: string;
  categoryName: string;
  weight: number;
  score: number; // 0-100 scale
  weightedScore: number; // weight * score
  factorCount: number;
  factors: RiskFactorScore[];
}

/**
 * Risk score for a specific factor
 */
export interface RiskFactorScore {
  factorId: string;
  factorName: string;
  categoryId: string;
  categoryName: string;
  weight: number;
  inputValue: number | string | boolean;
  calculatedScore: number; // 0-100 scale
  weightedScore: number; // weight * calculatedScore
  scoringMethod: ScoringType;
  dataType: DataType;
  notes?: string;
  formula?: string;
  options?: any;
}

/**
 * Database risk factor with scoring configuration
 */
export interface RiskFactorConfig {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  categoryWeight: number;
  weight: number;
  scoringType: ScoringType;
  dataType: DataType;
  minValue?: number;
  maxValue?: number;
  defaultValue?: number;
  options?: any;
  formula?: string;
  isActive: boolean;
  sortOrder: number;
}

/**
 * Risk category configuration
 */
export interface RiskCategoryConfig {
  id: string;
  name: string;
  description?: string;
  weight: number;
  isActive: boolean;
  sortOrder: number;
  factors: RiskFactorConfig[];
}
