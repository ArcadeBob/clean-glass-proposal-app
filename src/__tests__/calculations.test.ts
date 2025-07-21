import {
  calculateItemPricing,
  calculateProposalPrice,
  calculateProposalPricing,
  calculateTotalProposal,
  ProposalCalculationInput,
} from '../lib/calculations/proposal-calculations';
import {
  canConvert,
  convertQuantity,
  linearFeetToSquareFeet,
  sheetsToSquareFeet,
  squareFeetToLinearFeet,
  squareFeetToSheets,
} from '../lib/calculations/unit-conversions';
import {
  validateCalculationInputs,
  validateCost,
  validateQuantity,
} from '../lib/calculations/validation';

describe('Proposal Calculation Engine', () => {
  describe('calculateProposalPricing', () => {
    it('should calculate basic proposal pricing correctly', () => {
      const input: ProposalCalculationInput = {
        baseCost: 1000,
        overheadPercentage: 15,
        profitMargin: 20,
        riskScore: 0,
      };

      const result = calculateProposalPricing(input);

      // Base cost: 1000
      // Overhead: 1000 * 0.15 = 150
      // Cost with overhead: 1000 + 150 = 1150
      // Profit: 1150 * 0.20 = 230
      // Cost with profit: 1150 + 230 = 1380
      // Risk adjustment: 1380 * 0 * 0.02 = 0
      // Total: 1380 + 0 = 1380
      // Win probability: 100 - 0 * 8 = 100

      expect(result.baseCost).toBe(1000);
      expect(result.overheadAmount).toBe(150);
      expect(result.overheadPercentage).toBe(15);
      expect(result.profitAmount).toBe(230);
      expect(result.profitMargin).toBe(20);
      expect(result.riskAdjustment).toBe(0);
      expect(result.totalCost).toBe(1380);
      expect(result.winProbability).toBe(100);
    });

    it('should handle risk adjustments correctly', () => {
      const input: ProposalCalculationInput = {
        baseCost: 1000,
        overheadPercentage: 15,
        profitMargin: 20,
        riskScore: 5,
      };

      const result = calculateProposalPricing(input);

      // Base cost: 1000
      // Overhead: 1000 * 0.15 = 150
      // Cost with overhead: 1000 + 150 = 1150
      // Profit: 1150 * 0.20 = 230
      // Cost with profit: 1150 + 230 = 1380
      // Risk adjustment: 1380 * 5 * 0.02 = 138
      // Total: 1380 + 138 = 1518
      // Win probability: 100 - 5 * 8 = 60

      expect(result.riskAdjustment).toBe(138);
      expect(result.totalCost).toBe(1518);
      expect(result.winProbability).toBe(60);
    });

    it('should handle edge cases', () => {
      // Zero base cost
      const zeroInput: ProposalCalculationInput = {
        baseCost: 0,
        overheadPercentage: 15,
        profitMargin: 20,
        riskScore: 0,
      };

      const zeroResult = calculateProposalPricing(zeroInput);
      expect(zeroResult.totalCost).toBe(0);
      expect(zeroResult.winProbability).toBe(100);

      // Maximum risk score
      const maxRiskInput: ProposalCalculationInput = {
        baseCost: 1000,
        overheadPercentage: 15,
        profitMargin: 20,
        riskScore: 10,
      };

      const maxRiskResult = calculateProposalPricing(maxRiskInput);
      expect(maxRiskResult.winProbability).toBe(20); // 100 - 10 * 8 = 20, but minimum is 10
    });
  });

  describe('calculateItemPricing', () => {
    it('should calculate item pricing correctly', () => {
      const result = calculateItemPricing(10, 50, 15, 20);

      // Base cost: 10 * 50 = 500
      // Overhead: 500 * 0.15 = 75
      // Cost with overhead: 500 + 75 = 575
      // Profit: 575 * 0.20 = 115
      // Total: 575 + 115 = 690

      expect(result.baseCost).toBe(500);
      expect(result.overheadAmount).toBe(75);
      expect(result.profitAmount).toBe(115);
      expect(result.totalCost).toBe(690);
    });

    it('should use default percentages when not provided', () => {
      const result = calculateItemPricing(5, 100);

      // Base cost: 5 * 100 = 500
      // Overhead: 500 * 0.15 = 75 (default)
      // Cost with overhead: 500 + 75 = 575
      // Profit: 575 * 0.20 = 115 (default)
      // Total: 575 + 115 = 690

      expect(result.baseCost).toBe(500);
      expect(result.overheadAmount).toBe(75);
      expect(result.profitAmount).toBe(115);
      expect(result.totalCost).toBe(690);
    });
  });

  describe('calculateTotalProposal', () => {
    it('should calculate total from individual items', () => {
      const items = [
        { quantity: 10, unitCost: 50 },
        { quantity: 5, unitCost: 100 },
      ];

      const result = calculateTotalProposal(items, 15, 20, 0);

      // Item 1: 10 * 50 = 500
      // Item 2: 5 * 100 = 500
      // Total base cost: 500 + 500 = 1000
      // Then apply standard calculation...

      expect(result.baseCost).toBe(1000);
      expect(result.overheadAmount).toBe(150);
      expect(result.profitAmount).toBe(230);
      expect(result.totalCost).toBe(1380);
    });

    it('should handle empty items array', () => {
      const result = calculateTotalProposal([], 15, 20, 0);

      expect(result.baseCost).toBe(0);
      expect(result.totalCost).toBe(0);
    });
  });

  describe('calculateProposalPrice', () => {
    it('should calculate wizard proposal price correctly', () => {
      const input = {
        squareFootage: 1000,
        glassType: 'clear',
        framingType: 'aluminum',
        hardwareType: 'standard',
        quantity: 1,
        overheadPercentage: 15,
        profitMargin: 20,
        riskFactor: 5,
      };

      const result = calculateProposalPrice(input);

      // Base cost per SF: 25
      // Glass multiplier: 1.0 (clear)
      // Framing multiplier: 1.0 (aluminum)
      // Hardware multiplier: 1.0 (standard)
      // Final base cost per SF: 25 * 1.0 * 1.0 * 1.0 = 25
      // Base cost: 1000 * 25 * 1 = 25000
      // Overhead: 25000 * 0.15 = 3750
      // With overhead: 25000 + 3750 = 28750
      // Profit: 28750 * 0.20 = 5750
      // Risk: 28750 * 0.05 = 1437.5
      // Final price: 28750 + 5750 + 1437.5 = 35937.5

      expect(result.baseCost).toBe(25000);
      expect(result.withOverhead).toBe(28750);
      expect(result.finalPrice).toBe(35937.5);
    });

    it('should apply glass type multipliers correctly', () => {
      const baseInput = {
        squareFootage: 100,
        glassType: 'clear',
        framingType: 'aluminum',
        hardwareType: 'standard',
        quantity: 1,
        overheadPercentage: 0,
        profitMargin: 0,
        riskFactor: 0,
      };

      const clearResult = calculateProposalPrice(baseInput);
      expect(clearResult.baseCost).toBe(2500); // 100 * 25 * 1.0

      const tintedInput = { ...baseInput, glassType: 'tinted' };
      const tintedResult = calculateProposalPrice(tintedInput);
      expect(tintedResult.baseCost).toBe(3000); // 100 * 25 * 1.2

      const temperedInput = { ...baseInput, glassType: 'tempered' };
      const temperedResult = calculateProposalPrice(temperedInput);
      expect(temperedResult.baseCost).toBe(3500); // 100 * 25 * 1.4
    });

    it('should apply framing type multipliers correctly', () => {
      const baseInput = {
        squareFootage: 100,
        glassType: 'clear',
        framingType: 'aluminum',
        hardwareType: 'standard',
        quantity: 1,
        overheadPercentage: 0,
        profitMargin: 0,
        riskFactor: 0,
      };

      const aluminumResult = calculateProposalPrice(baseInput);
      expect(aluminumResult.baseCost).toBe(2500); // 100 * 25 * 1.0

      const steelInput = { ...baseInput, framingType: 'steel' };
      const steelResult = calculateProposalPrice(steelInput);
      expect(steelResult.baseCost).toBe(3250); // 100 * 25 * 1.3

      const vinylInput = { ...baseInput, framingType: 'vinyl' };
      const vinylResult = calculateProposalPrice(vinylInput);
      expect(vinylResult.baseCost).toBe(2250); // 100 * 25 * 0.9
    });

    it('should handle unknown types gracefully', () => {
      const input = {
        squareFootage: 100,
        glassType: 'unknown',
        framingType: 'unknown',
        hardwareType: 'unknown',
        quantity: 1,
        overheadPercentage: 0,
        profitMargin: 0,
        riskFactor: 0,
      };

      const result = calculateProposalPrice(input);

      // Should use default multiplier of 1.0 for unknown types
      expect(result.baseCost).toBe(2500); // 100 * 25 * 1.0 * 1.0 * 1.0
    });
  });
});

describe('Unit Conversion Functions', () => {
  describe('squareFeetToLinearFeet', () => {
    it('should convert square feet to linear feet correctly', () => {
      expect(squareFeetToLinearFeet(100)).toBe(25); // 100 / 4
      expect(squareFeetToLinearFeet(200, 8)).toBe(25); // 200 / 8
    });

    it('should handle zero and negative values', () => {
      expect(squareFeetToLinearFeet(0)).toBe(0);
      expect(squareFeetToLinearFeet(-100)).toBe(-25);
    });
  });

  describe('linearFeetToSquareFeet', () => {
    it('should convert linear feet to square feet correctly', () => {
      expect(linearFeetToSquareFeet(25)).toBe(100); // 25 * 4
      expect(linearFeetToSquareFeet(25, 8)).toBe(200); // 25 * 8
    });
  });

  describe('squareFeetToSheets', () => {
    it('should convert square feet to sheets correctly', () => {
      expect(squareFeetToSheets(32)).toBe(1); // 32 / (4 * 8)
      expect(squareFeetToSheets(64)).toBe(2); // 64 / (4 * 8)
      expect(squareFeetToSheets(100)).toBe(4); // 100 / 32, rounded up
    });
  });

  describe('sheetsToSquareFeet', () => {
    it('should convert sheets to square feet correctly', () => {
      expect(sheetsToSquareFeet(1)).toBe(32); // 1 * 4 * 8
      expect(sheetsToSquareFeet(2)).toBe(64); // 2 * 4 * 8
    });
  });

  describe('convertQuantity', () => {
    it('should convert between compatible units', () => {
      expect(convertQuantity(100, 'SF', 'LF')).toBe(25); // 100 * 0.25
      expect(convertQuantity(25, 'LF', 'SF')).toBe(100); // 25 * 4
      expect(convertQuantity(32, 'SF', 'SHEETS')).toBe(1); // 32 * 0.03125
    });

    it('should return same value for same unit', () => {
      expect(convertQuantity(100, 'SF', 'SF')).toBe(100);
    });

    it('should return original value for incompatible units', () => {
      expect(convertQuantity(100, 'SF', 'EACH')).toBe(100);
    });
  });

  describe('canConvert', () => {
    it('should return true for compatible units', () => {
      expect(canConvert('SF', 'LF')).toBe(true);
      expect(canConvert('LF', 'SF')).toBe(true);
      expect(canConvert('SF', 'SHEETS')).toBe(true);
    });

    it('should return true for same unit', () => {
      expect(canConvert('SF', 'SF')).toBe(true);
      expect(canConvert('EACH', 'EACH')).toBe(true);
    });

    it('should return false for incompatible units', () => {
      expect(canConvert('SF', 'EACH')).toBe(false);
      expect(canConvert('LF', 'LOT')).toBe(false);
    });
  });
});

describe('Validation Functions', () => {
  describe('validateCalculationInputs', () => {
    it('should validate correct inputs', () => {
      const validInput = {
        baseCost: 1000,
        overheadPercentage: 15,
        profitMargin: 20,
        riskScore: 5,
      };

      const result = validateCalculationInputs(validInput);
      expect(result.isValid).toBe(true);
    });

    it('should reject negative base cost', () => {
      const invalidInput = {
        baseCost: -100,
        overheadPercentage: 15,
        profitMargin: 20,
        riskScore: 5,
      };

      const result = validateCalculationInputs(invalidInput);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Base cost cannot be negative');
    });

    it('should reject invalid overhead percentage', () => {
      const invalidInput = {
        baseCost: 1000,
        overheadPercentage: 150,
        profitMargin: 20,
        riskScore: 5,
      };

      const result = validateCalculationInputs(invalidInput);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain(
        'Overhead percentage must be between 0 and 100'
      );
    });

    it('should reject invalid profit margin', () => {
      const invalidInput = {
        baseCost: 1000,
        overheadPercentage: 15,
        profitMargin: -10,
        riskScore: 5,
      };

      const result = validateCalculationInputs(invalidInput);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Profit margin must be between 0 and 100');
    });

    it('should reject invalid risk score', () => {
      const invalidInput = {
        baseCost: 1000,
        overheadPercentage: 15,
        profitMargin: 20,
        riskScore: 15,
      };

      const result = validateCalculationInputs(invalidInput);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Risk score must be between 0 and 10');
    });
  });

  describe('validateQuantity', () => {
    it('should validate correct quantity', () => {
      const result = validateQuantity(100, 'SF');
      expect(result.isValid).toBe(true);
    });

    it('should reject negative quantity', () => {
      const result = validateQuantity(-100, 'SF');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Quantity must be positive');
    });

    it('should reject invalid unit', () => {
      const result = validateQuantity(100, 'INVALID');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateCost', () => {
    it('should validate correct cost', () => {
      const result = validateCost(100);
      expect(result.isValid).toBe(true);
    });

    it('should reject negative cost', () => {
      const result = validateCost(-100);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Cost cannot be negative');
    });
  });
});
