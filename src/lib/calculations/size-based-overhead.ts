import { z } from 'zod';

// Validation schemas
export const SizeBasedOverheadSchema = z.object({
  baseCost: z.number().min(0),
  projectSize: z.number().min(0).optional(), // Alternative to baseCost for explicit size input
  useSmoothScaling: z.boolean().default(true),
  includeBreakdown: z.boolean().default(false),
});

export type SizeBasedOverheadInput = z.infer<typeof SizeBasedOverheadSchema>;

export interface OverheadTier {
  maxSize: number;
  rate: number;
  description: string;
}

export interface OverheadBreakdown {
  administrative: number;
  equipment: number;
  insurance: number;
  other: number;
}

export interface SizeBasedOverheadResult {
  projectSize: number;
  overheadRate: number;
  overheadAmount: number;
  tier: OverheadTier;
  breakdown?: OverheadBreakdown;
  calculationMethod: 'tiered' | 'smooth' | 'fixed';
  warnings: string[];
}

// Default overhead tiers based on project size
export const DEFAULT_OVERHEAD_TIERS: OverheadTier[] = [
  { maxSize: 50000, rate: 0.18, description: 'Small projects (<$50k)' },
  { maxSize: 200000, rate: 0.16, description: 'Medium projects ($50k-$200k)' },
  { maxSize: 500000, rate: 0.14, description: 'Large projects ($200k-$500k)' },
  {
    maxSize: 1000000,
    rate: 0.12,
    description: 'Very large projects ($500k-$1M)',
  },
  { maxSize: Infinity, rate: 0.1, description: 'Mega projects (>$1M)' },
];

// Overhead category breakdown percentages
export const OVERHEAD_CATEGORIES = {
  administrative: 0.45, // 45% of overhead
  equipment: 0.3, // 30% of overhead
  insurance: 0.15, // 15% of overhead
  other: 0.1, // 10% of overhead
};

/**
 * Size-Based Overhead Rate Calculator
 * Implements dynamic overhead rates based on project size with smooth scaling
 */
export class SizeBasedOverheadCalculator {
  private tiers: OverheadTier[];

  constructor(tiers: OverheadTier[] = DEFAULT_OVERHEAD_TIERS) {
    this.tiers = [...tiers].sort((a, b) => a.maxSize - b.maxSize);
  }

  /**
   * Calculate overhead rate based on project size
   */
  calculateOverheadRate(
    projectSize: number,
    useSmoothScaling: boolean = true
  ): {
    rate: number;
    tier: OverheadTier;
    method: 'tiered' | 'smooth' | 'fixed';
  } {
    if (projectSize <= 0 || this.tiers.length === 0) {
      return {
        rate: this.tiers[0]?.rate || 0.15,
        tier: this.tiers[0] || {
          maxSize: Infinity,
          rate: 0.15,
          description: 'Default',
        },
        method: 'fixed',
      };
    }

    if (!useSmoothScaling) {
      // Use tiered approach - find the appropriate tier
      // For boundary conditions: if projectSize equals tier boundary, use the next tier
      const tier =
        this.tiers.find(t => projectSize < t.maxSize) ||
        this.tiers[this.tiers.length - 1];
      return {
        rate: tier.rate,
        tier,
        method: 'tiered',
      };
    }

    // Use smooth scaling to avoid abrupt rate changes
    return this.calculateSmoothRate(projectSize);
  }

  /**
   * Calculate smooth overhead rate using interpolation
   */
  private calculateSmoothRate(projectSize: number): {
    rate: number;
    tier: OverheadTier;
    method: 'smooth';
  } {
    // Find the two tiers that bracket the project size
    let lowerTier: OverheadTier | null = null;
    let upperTier: OverheadTier | null = null;

    for (let i = 0; i < this.tiers.length; i++) {
      if (projectSize < this.tiers[i].maxSize) {
        upperTier = this.tiers[i];
        lowerTier = i > 0 ? this.tiers[i - 1] : null;
        break;
      }
    }

    // If no upper tier found, use the highest tier
    if (!upperTier) {
      upperTier = this.tiers[this.tiers.length - 1];
      lowerTier = this.tiers[this.tiers.length - 2] || null;
    }

    // If no lower tier, use the current tier (no interpolation needed)
    if (!lowerTier) {
      return {
        rate: upperTier.rate,
        tier: upperTier,
        method: 'smooth',
      };
    }

    // For boundary conditions, use exact tier rates
    if (Math.abs(projectSize - lowerTier.maxSize) < 1) {
      return {
        rate: upperTier.rate,
        tier: upperTier,
        method: 'smooth',
      };
    }

    // Calculate interpolation factor
    const sizeRange = upperTier.maxSize - lowerTier.maxSize;
    const interpolationFactor = (projectSize - lowerTier.maxSize) / sizeRange;

    // Apply smooth curve (ease-in-out) to avoid linear interpolation
    const smoothFactor = this.applySmoothCurve(interpolationFactor);

    // Interpolate between the two rates
    const rateDifference = upperTier.rate - lowerTier.rate;
    const interpolatedRate = lowerTier.rate + rateDifference * smoothFactor;

    return {
      rate: interpolatedRate,
      tier: upperTier, // Use upper tier for description
      method: 'smooth',
    };
  }

  /**
   * Apply smooth curve to interpolation factor
   * Uses ease-in-out curve for more natural transitions
   */
  private applySmoothCurve(factor: number): number {
    // Ease-in-out curve: smooth acceleration and deceleration
    if (factor < 0.5) {
      return 2 * factor * factor;
    } else {
      return 1 - Math.pow(-2 * factor + 2, 2) / 2;
    }
  }

  /**
   * Calculate overhead breakdown by category
   */
  calculateOverheadBreakdown(overheadAmount: number): OverheadBreakdown {
    return {
      administrative: overheadAmount * OVERHEAD_CATEGORIES.administrative,
      equipment: overheadAmount * OVERHEAD_CATEGORIES.equipment,
      insurance: overheadAmount * OVERHEAD_CATEGORIES.insurance,
      other: overheadAmount * OVERHEAD_CATEGORIES.other,
    };
  }

  /**
   * Main calculation method
   */
  calculate(input: SizeBasedOverheadInput): SizeBasedOverheadResult {
    const {
      baseCost,
      projectSize: explicitSize,
      useSmoothScaling,
      includeBreakdown,
    } = input;

    const projectSize = explicitSize || baseCost;
    const warnings: string[] = [];

    // Validate project size
    if (projectSize <= 0) {
      warnings.push('Project size must be greater than 0');
    }

    // Calculate overhead rate
    const { rate, tier, method } = this.calculateOverheadRate(
      projectSize,
      useSmoothScaling
    );

    // Calculate overhead amount
    const overheadAmount = baseCost * rate;

    // Generate breakdown if requested
    let breakdown: OverheadBreakdown | undefined;
    if (includeBreakdown) {
      breakdown = this.calculateOverheadBreakdown(overheadAmount);
    }

    // Add warnings for edge cases
    if (projectSize > 10000000) {
      warnings.push(
        'Project size exceeds typical range - consider manual rate adjustment'
      );
    }

    if (rate < 0.05) {
      warnings.push('Overhead rate is very low - verify calculation accuracy');
    }

    return {
      projectSize,
      overheadRate: rate,
      overheadAmount,
      tier,
      breakdown,
      calculationMethod: method,
      warnings,
    };
  }

  /**
   * Get overhead rate for a specific project size (utility method)
   */
  getOverheadRate(
    projectSize: number,
    useSmoothScaling: boolean = true
  ): number {
    return this.calculateOverheadRate(projectSize, useSmoothScaling).rate;
  }

  /**
   * Get all available tiers
   */
  getTiers(): OverheadTier[] {
    return [...this.tiers];
  }

  /**
   * Update tiers (useful for testing or customization)
   */
  updateTiers(newTiers: OverheadTier[]): void {
    this.tiers = [...newTiers].sort((a, b) => a.maxSize - b.maxSize);
  }
}

/**
 * Utility function for backward compatibility
 * Returns the appropriate overhead rate for a given project size
 */
export function getSizeBasedOverheadRate(
  projectSize: number,
  useSmoothScaling: boolean = true,
  customTiers?: OverheadTier[]
): number {
  const calculator = new SizeBasedOverheadCalculator(customTiers);
  return calculator.getOverheadRate(projectSize, useSmoothScaling);
}

/**
 * Utility function to calculate overhead amount with size-based rate
 */
export function calculateSizeBasedOverhead(
  baseCost: number,
  projectSize?: number,
  useSmoothScaling: boolean = true,
  customTiers?: OverheadTier[]
): {
  overheadRate: number;
  overheadAmount: number;
  tier: OverheadTier;
  method: 'tiered' | 'smooth' | 'fixed';
} {
  const calculator = new SizeBasedOverheadCalculator(customTiers);
  const actualProjectSize = projectSize || baseCost;
  const { rate, tier, method } = calculator.calculateOverheadRate(
    actualProjectSize,
    useSmoothScaling
  );

  return {
    overheadRate: rate,
    overheadAmount: baseCost * rate,
    tier,
    method,
  };
}

/**
 * Legacy compatibility function
 * Maintains the same interface as the old fixed overhead calculation
 */
export function calculateOverheadWithSizeAdjustment(
  baseCost: number,
  fixedOverheadRate: number = 15,
  projectSize?: number,
  useSizeBased: boolean = true
): {
  overheadRate: number;
  overheadAmount: number;
  isSizeBased: boolean;
} {
  if (!useSizeBased || !projectSize) {
    return {
      overheadRate: fixedOverheadRate,
      overheadAmount: (baseCost * fixedOverheadRate) / 100,
      isSizeBased: false,
    };
  }

  const calculator = new SizeBasedOverheadCalculator();
  const { rate, tier } = calculator.calculateOverheadRate(projectSize, true);

  return {
    overheadRate: rate * 100, // Convert to percentage for consistency
    overheadAmount: baseCost * rate,
    isSizeBased: true,
  };
}
