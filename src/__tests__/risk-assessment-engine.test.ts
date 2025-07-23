import { RiskScoringEngine } from '../lib/risk-assessment/engine';
import { RiskScoringInput } from '../lib/risk-assessment/types';

// Mock Prisma client
jest.mock('../lib/db', () => ({
  prisma: {
    riskCategory: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: '1',
          name: 'Technical Risks',
          description: 'Technical project risks',
          weight: 40,
          isActive: true,
          sortOrder: 1,
          riskFactors: [
            {
              id: '1',
              name: 'Height and Safety',
              description: 'Safety risks due to working at heights',
              categoryId: '1',
              weight: 25,
              scoringType: 'FORMULA',
              dataType: 'NUMERIC',
              minValue: 0,
              maxValue: 100,
              defaultValue: 10,
              formula: 'score = height * 0.8; if (score > 100) score = 100;',
              isActive: true,
              sortOrder: 1,
            },
          ],
        },
      ]),
    },
  },
}));

describe('RiskScoringEngine Security Fix', () => {
  let engine: RiskScoringEngine;

  beforeEach(async () => {
    engine = new RiskScoringEngine();
    await engine.initialize();
  });

  describe('Formula Security Validation', () => {
    it('should reject formulas with eval() calls', () => {
      const maliciousFormula = 'eval("alert(\'xss\')"); score = 50;';

      // Access the private method for testing
      const validateFormula = (engine as any).validateFormula.bind(engine);
      const result = validateFormula(maliciousFormula);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('forbidden pattern');
    });

    it('should reject formulas with Function constructor', () => {
      const maliciousFormula = 'Function("alert(\'xss\')")(); score = 50;';

      const validateFormula = (engine as any).validateFormula.bind(engine);
      const result = validateFormula(maliciousFormula);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('forbidden pattern');
    });

    it('should reject formulas with setTimeout calls', () => {
      const maliciousFormula =
        'setTimeout(() => alert("xss"), 1000); score = 50;';

      const validateFormula = (engine as any).validateFormula.bind(engine);
      const result = validateFormula(maliciousFormula);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('forbidden pattern');
    });

    it('should reject formulas that are too long', () => {
      const longFormula = 'score = ' + 'value + 1; '.repeat(100); // Over 500 characters

      const validateFormula = (engine as any).validateFormula.bind(engine);
      const result = validateFormula(longFormula);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too long');
    });

    it('should reject formulas that are too complex', () => {
      // Create a formula with too many operations but under length limit
      const complexFormula = 'score = ' + Array(60).fill('v+1').join('+');

      const validateFormula = (engine as any).validateFormula.bind(engine);
      const result = validateFormula(complexFormula);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too complex (max 50 operations)');
    });

    it('should accept valid formulas', () => {
      const validFormula = 'score = value * 2;';

      const validateFormula = (engine as any).validateFormula.bind(engine);
      const result = validateFormula(validFormula);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Safe Formula Evaluation', () => {
    it('should correctly evaluate simple mathematical formulas', () => {
      const formula = 'score = value * 2;';
      const value = 50;

      const calculateFormulaScore = (engine as any).calculateFormulaScore.bind(
        engine
      );
      const mockFactor = {
        name: 'Test Factor',
        formula,
        minValue: 0,
        maxValue: 100,
      };

      const result = calculateFormulaScore(mockFactor, value);
      expect(result).toBe(100); // 50 * 2
    });

    it('should correctly evaluate formulas with conditional statements', () => {
      const formula = 'score = height * 0.8; if (score > 100) score = 100;';
      const value = 150; // This should trigger the if condition

      const calculateFormulaScore = (engine as any).calculateFormulaScore.bind(
        engine
      );
      const mockFactor = {
        name: 'Test Factor',
        formula,
        minValue: 0,
        maxValue: 200,
      };

      const result = calculateFormulaScore(mockFactor, value);
      expect(result).toBe(100); // Capped at 100
    });

    it('should correctly evaluate formulas with mathematical functions', () => {
      const formula =
        'score = Math.pow(volatility * 2, 1.5); if (score > 100) score = 100;';
      const value = 25; // 25% volatility

      const calculateFormulaScore = (engine as any).calculateFormulaScore.bind(
        engine
      );
      const mockFactor = {
        name: 'Test Factor',
        formula,
        minValue: 0,
        maxValue: 50,
      };

      const result = calculateFormulaScore(mockFactor, value);
      // 25 * 2 = 50, pow(50, 1.5) = 353.55, but capped at 100
      expect(result).toBe(100);
    });

    it('should handle formulas with different variable names', () => {
      const formula = 'score = fluctuation * 3; if (score > 100) score = 100;';
      const value = 10; // 10% fluctuation

      const calculateFormulaScore = (engine as any).calculateFormulaScore.bind(
        engine
      );
      const mockFactor = {
        name: 'Test Factor',
        formula,
        minValue: 0,
        maxValue: 30,
      };

      const result = calculateFormulaScore(mockFactor, value);
      expect(result).toBe(30); // 10 * 3
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid formula syntax gracefully', () => {
      const invalidFormula = 'score = invalid syntax + + + ;';

      const calculateFormulaScore = (engine as any).calculateFormulaScore.bind(
        engine
      );
      const mockFactor = {
        name: 'Test Factor',
        formula: invalidFormula,
        minValue: 0,
        maxValue: 100,
      };

      const result = calculateFormulaScore(mockFactor, 50);
      expect(result).toBe(50); // Default fallback
    });

    it('should handle formulas that result in NaN', () => {
      const nanFormula = 'score = 0 / 0;'; // Results in NaN

      const calculateFormulaScore = (engine as any).calculateFormulaScore.bind(
        engine
      );
      const mockFactor = {
        name: 'Test Factor',
        formula: nanFormula,
        minValue: 0,
        maxValue: 100,
      };

      const result = calculateFormulaScore(mockFactor, 50);
      expect(result).toBe(50); // Default fallback
    });

    it('should handle formulas that result in Infinity', () => {
      const infinityFormula = 'score = 1 / 0;'; // Results in Infinity

      const calculateFormulaScore = (engine as any).calculateFormulaScore.bind(
        engine
      );
      const mockFactor = {
        name: 'Test Factor',
        formula: infinityFormula,
        minValue: 0,
        maxValue: 100,
      };

      const result = calculateFormulaScore(mockFactor, 50);
      expect(result).toBe(50); // Default fallback
    });
  });

  describe('Formula Parsing', () => {
    it('should parse assignment patterns correctly', () => {
      const parseFormula = (engine as any).parseFormula.bind(engine);

      const formula1 = 'score = value * 2;';
      const result1 = parseFormula(formula1);
      expect(result1).toBe('value * 2');

      const formula2 = 'score=value+1';
      const result2 = parseFormula(formula2);
      expect(result2).toBe('value+1');
    });

    it('should parse conditional statements correctly', () => {
      const parseFormula = (engine as any).parseFormula.bind(engine);

      const formula = 'score = height * 0.8; if (score > 100) score = 100;';
      const result = parseFormula(formula);
      expect(result).toBe('(score > 100) ? (100) : (value * 0.8)');
    });

    it('should handle complex conditional statements', () => {
      const parseFormula = (engine as any).parseFormula.bind(engine);

      const formula =
        'score = volatility * 2; if (volatility > 25) score = 100;';
      const result = parseFormula(formula);
      expect(result).toBe('(value > 25) ? (100) : (value * 2)');
    });
  });

  describe('Integration Test', () => {
    it('should process valid risk scoring input with formula factors', async () => {
      const input: RiskScoringInput = {
        factorInputs: {
          'Height and Safety': {
            value: 50,
            notes: 'Test height',
          },
        },
      };

      const result = await engine.calculateRiskScore(input);

      expect(result.factorScores).toHaveLength(1);
      expect(result.factorScores[0].factorName).toBe('Height and Safety');
      expect(result.factorScores[0].calculatedScore).toBeGreaterThan(0);
      expect(result.factorScores[0].calculatedScore).toBeLessThanOrEqual(100);
    });
  });
});
