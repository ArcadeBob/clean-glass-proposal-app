import { prisma } from '@/lib/db';
import {
  DataType,
  RiskCategoryConfig,
  RiskCategoryScore,
  RiskFactorConfig,
  RiskFactorScore,
  RiskScoringInput,
  RiskScoringResult,
  ScoringType,
} from './types';
import {
  calculateContingencyRate,
  calculateRiskLevel,
  generateRiskRecommendations,
  normalizeToScale,
  validateRiskFactorInput,
} from './utils';

/**
 * Core risk scoring engine that processes multiple weighted factors
 * and generates composite risk scores (0-100 scale)
 */
export class RiskScoringEngine {
  private riskFactors: RiskFactorConfig[] = [];
  private riskCategories: RiskCategoryConfig[] = [];
  private isInitialized = false;

  /**
   * Initialize the engine by loading risk factors from database
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load risk categories with their factors
      const categories = await (prisma as any).riskCategory.findMany({
        where: { isActive: true },
        include: {
          riskFactors: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });

      // Transform to our internal format
      this.riskCategories = categories.map((category: any) => ({
        id: category.id,
        name: category.name,
        description: category.description || undefined,
        weight: Number(category.weight),
        isActive: category.isActive,
        sortOrder: category.sortOrder,
        factors: category.riskFactors.map((factor: any) => ({
          id: factor.id,
          name: factor.name,
          description: factor.description || undefined,
          categoryId: factor.categoryId,
          categoryName: category.name,
          categoryWeight: Number(category.weight),
          weight: Number(factor.weight),
          scoringType: factor.scoringType as ScoringType,
          dataType: factor.dataType as DataType,
          minValue: factor.minValue ? Number(factor.minValue) : undefined,
          maxValue: factor.maxValue ? Number(factor.maxValue) : undefined,
          defaultValue: factor.defaultValue
            ? Number(factor.defaultValue)
            : undefined,
          options: factor.options,
          formula: factor.formula || undefined,
          isActive: factor.isActive,
          sortOrder: factor.sortOrder,
        })),
      }));

      // Flatten factors for easy access
      this.riskFactors = this.riskCategories.flatMap(
        category => category.factors
      );
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize RiskScoringEngine:', error);
      throw new Error('Failed to load risk factors from database');
    }
  }

  /**
   * Calculate comprehensive risk score for a project
   */
  async calculateRiskScore(
    input: RiskScoringInput
  ): Promise<RiskScoringResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const warnings: string[] = [];
    const factorScores: RiskFactorScore[] = [];
    const categoryScores: RiskCategoryScore[] = [];

    // Process each risk factor
    for (const factor of this.riskFactors) {
      let factorInput = input.factorInputs[factor.name];

      if (!factorInput) {
        // Use default value if available, otherwise skip
        if (factor.defaultValue !== undefined) {
          factorInput = { value: factor.defaultValue };
        } else {
          warnings.push(`No input provided for risk factor: ${factor.name}`);
          continue;
        }
      }

      // Validate input
      const validation = validateRiskFactorInput(
        factorInput.value,
        factor.dataType,
        factor.minValue,
        factor.maxValue
      );

      if (!validation.isValid) {
        warnings.push(`Invalid input for ${factor.name}: ${validation.error}`);
        continue;
      }

      // Calculate factor score
      const calculatedScore = this.calculateFactorScore(
        factor,
        factorInput.value
      );
      const weightedScore = (calculatedScore * factor.weight) / 100;

      factorScores.push({
        factorId: factor.id,
        factorName: factor.name,
        categoryId: factor.categoryId,
        categoryName: factor.categoryName,
        weight: factor.weight,
        inputValue: factorInput.value,
        calculatedScore,
        weightedScore,
        scoringMethod: factor.scoringType,
        dataType: factor.dataType,
        notes: factorInput.notes,
        formula: factor.formula,
        options: factor.options,
      });
    }

    // Calculate category scores
    for (const category of this.riskCategories) {
      const categoryFactors = factorScores.filter(
        f => f.categoryId === category.id
      );

      if (categoryFactors.length === 0) {
        continue;
      }

      const categoryScore =
        categoryFactors.reduce(
          (sum, factor) => sum + factor.calculatedScore,
          0
        ) / categoryFactors.length;
      const weightedCategoryScore = (categoryScore * category.weight) / 100;

      categoryScores.push({
        categoryId: category.id,
        categoryName: category.name,
        weight: category.weight,
        score: categoryScore,
        weightedScore: weightedCategoryScore,
        factorCount: categoryFactors.length,
        factors: categoryFactors,
      });
    }

    // Calculate total risk score
    const totalRiskScore = Math.min(
      100,
      Math.max(
        0,
        categoryScores.reduce(
          (sum, category) => sum + category.weightedScore,
          0
        )
      )
    );

    // Determine risk level
    const riskLevel = calculateRiskLevel(totalRiskScore);
    const contingencyRate = calculateContingencyRate(riskLevel);

    // Generate recommendations
    const topRiskFactors = factorScores
      .filter(f => f.calculatedScore > 50)
      .sort((a, b) => b.calculatedScore - a.calculatedScore)
      .slice(0, 5)
      .map(f => ({ name: f.factorName, score: f.calculatedScore }));

    const recommendations = generateRiskRecommendations(
      riskLevel,
      topRiskFactors
    );

    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(factorScores, warnings);

    return {
      totalRiskScore,
      riskLevel,
      confidence,
      categoryScores,
      factorScores,
      recommendations,
      contingencyRate,
      calculationTimestamp: new Date(),
      factorsProcessed: factorScores.length,
      warnings,
    };
  }

  /**
   * Calculate individual factor score based on scoring method
   */
  private calculateFactorScore(factor: RiskFactorConfig, value: any): number {
    switch (factor.scoringType) {
      case 'LINEAR':
        return this.calculateLinearScore(factor, value);
      case 'EXPONENTIAL':
        return this.calculateExponentialScore(factor, value);
      case 'THRESHOLD':
        return this.calculateThresholdScore(factor, value);
      case 'CATEGORICAL':
        return this.calculateCategoricalScore(factor, value);
      case 'FORMULA':
        return this.calculateFormulaScore(factor, value);
      default:
        return 0;
    }
  }

  /**
   * Linear interpolation scoring
   */
  private calculateLinearScore(
    factor: RiskFactorConfig,
    value: number
  ): number {
    if (factor.minValue === undefined || factor.maxValue === undefined) {
      return 50; // Default to middle if no range defined
    }

    return normalizeToScale(value, factor.minValue, factor.maxValue);
  }

  /**
   * Exponential scoring for non-linear risks
   */
  private calculateExponentialScore(
    factor: RiskFactorConfig,
    value: number
  ): number {
    if (factor.minValue === undefined || factor.maxValue === undefined) {
      return 50;
    }

    const normalized = normalizeToScale(
      value,
      factor.minValue,
      factor.maxValue
    );
    // Apply exponential curve: higher values get exponentially higher scores
    return Math.pow(normalized / 100, 0.7) * 100;
  }

  /**
   * Threshold-based scoring
   */
  private calculateThresholdScore(
    factor: RiskFactorConfig,
    value: number
  ): number {
    if (factor.minValue === undefined || factor.maxValue === undefined) {
      return 50;
    }

    const normalized = normalizeToScale(
      value,
      factor.minValue,
      factor.maxValue
    );

    // Threshold scoring: low risk below 30%, medium 30-70%, high above 70%
    if (normalized < 30) {
      return 25;
    } else if (normalized < 70) {
      return 50;
    } else {
      return 75;
    }
  }

  /**
   * Categorical scoring based on predefined options
   */
  private calculateCategoricalScore(
    factor: RiskFactorConfig,
    value: string
  ): number {
    if (!factor.options?.values || !Array.isArray(factor.options.values)) {
      return 50;
    }

    const option = factor.options.values.find(
      (opt: any) => opt.label === value
    );
    return option?.score || 50;
  }

  /**
   * Formula-based scoring using custom JavaScript expressions
   */
  private calculateFormulaScore(factor: RiskFactorConfig, value: any): number {
    if (!factor.formula) {
      return 50;
    }

    try {
      // Create a safe evaluation context
      const context = {
        value,
        minValue: factor.minValue || 0,
        maxValue: factor.maxValue || 100,
        score: 0,
      };

      // Execute the formula with the context
      const formula = factor.formula.replace(
        /score\s*=\s*/,
        'context.score = '
      );
      eval(formula);

      return Math.max(0, Math.min(100, context.score));
    } catch (error) {
      console.error(`Error evaluating formula for ${factor.name}:`, error);
      return 50;
    }
  }

  /**
   * Calculate confidence score based on data completeness and quality
   */
  private calculateConfidence(
    factorScores: RiskFactorScore[],
    warnings: string[]
  ): number {
    const totalFactors = this.riskFactors.length;
    const processedFactors = factorScores.length;

    // Base confidence on data completeness
    let confidence = processedFactors / totalFactors;

    // Reduce confidence for warnings
    confidence -= warnings.length * 0.05;

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Get all available risk factors
   */
  getRiskFactors(): RiskFactorConfig[] {
    return [...this.riskFactors];
  }

  /**
   * Get risk categories
   */
  getRiskCategories(): RiskCategoryConfig[] {
    return [...this.riskCategories];
  }
}
