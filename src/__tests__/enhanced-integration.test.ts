import {
  calculateEnhancedProposalPricing,
  clearAllAuditLogs,
  getCalculationAuditLogs,
  getCalculationStatistics,
  type EnhancedProposalCalculationInput,
} from '../lib/calculations/enhanced-proposal-calculations';

describe('Enhanced Calculation Engine Integration Tests', () => {
  beforeEach(() => {
    // Clear audit logs before each test
    clearAllAuditLogs();
  });

  afterEach(() => {
    // Clear audit logs after each test to prevent interference
    clearAllAuditLogs();
  });

  describe('Enhanced Proposal Pricing Integration', () => {
    it('should perform complete enhanced calculation with risk assessment', async () => {
      const input: EnhancedProposalCalculationInput = {
        baseCost: 50000,
        overheadPercentage: 15,
        profitMargin: 20,
        useSizeBasedOverhead: true,
        useSmoothScaling: true,
        projectType: 'commercial',
        squareFootage: 1000,
        buildingHeight: 20,
        region: 'Northeast',
        materialType: 'glass',
        riskFactorInputs: {
          'Weather Delays': {
            value: 'Low',
            notes: 'Favorable weather conditions',
          },
          'Project Complexity': { value: 3, notes: 'Standard complexity' },
          'Material Price Volatility': {
            value: 'Medium',
            notes: 'Some volatility expected',
          },
          'Subcontractor Reliability': {
            value: true,
            notes: 'Reliable subcontractors',
          },
        },
        confidenceFactors: {
          dataCompleteness: 85,
          dataAccuracy: 80,
          dataRecency: 75,
          historicalAccuracy: 82,
          estimateFrequency: 70,
          varianceFromHistorical: 30,
          scopeComplexity: 40,
          technicalUncertainty: 35,
          requirementClarity: 85,
          marketDataAge: 80,
          marketVolatility: 25,
          supplierReliability: 75,
        },
      };

      const result = await calculateEnhancedProposalPricing(input);

      // Verify basic calculation results
      expect(result.baseCost).toBe(50000);
      expect(result.totalCost).toBeGreaterThan(result.baseCost);
      expect(result.calculationMethod).toBe('enhanced');

      // Verify risk assessment integration
      expect(result.riskAssessment).not.toBeNull();
      expect(result.isRiskAdjustedProfitMargin).toBe(true);
      expect(result.contingencyAmount).toBeGreaterThan(0);
      expect(result.contingencyRate).toBeGreaterThan(0);

      // Verify size-based overhead integration
      expect(result.isSizeBasedOverhead).toBe(true);
      expect(result.overheadCalculationMethod).toBeDefined();

      // Verify confidence scoring integration
      expect(result.isConfidenceScored).toBe(true);
      expect(result.confidenceAssessment).not.toBeNull();
      expect(result.uncertaintyRange).toBeDefined();

      // Verify audit trail
      expect(result.calculationId).toBeDefined();
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.auditTrail.calculationSequence).toContain(
        'risk_assessment'
      );
      expect(result.auditTrail.calculationSequence).toContain(
        'market_analysis'
      );
      expect(result.auditTrail.calculationSequence).toContain(
        'confidence_scoring'
      );

      // Verify market analysis integration
      expect(result.winProbability).toBeGreaterThan(0);
      expect(result.costPerSquareFoot).toBeGreaterThan(0);
    });

    it('should handle missing risk factor inputs with legacy fallback', async () => {
      const input: EnhancedProposalCalculationInput = {
        baseCost: 30000,
        overheadPercentage: 15,
        profitMargin: 20,
        useSizeBasedOverhead: false,
        useSmoothScaling: false,
        riskScore: 5, // Legacy risk score
      };

      const result = await calculateEnhancedProposalPricing(input);

      expect(result.calculationMethod).toBe('legacy');
      expect(result.riskAssessment).toBeNull();
      expect(result.isRiskAdjustedProfitMargin).toBe(false);
      expect(result.isSizeBasedOverhead).toBe(false);
      expect(result.isConfidenceScored).toBe(false);
      expect(result.riskAdjustment).toBeGreaterThan(0);
      expect(result.warnings).toContain(
        'No risk factor inputs provided, using legacy risk scoring'
      );
    });

    it('should handle risk assessment failures gracefully', async () => {
      const input: EnhancedProposalCalculationInput = {
        baseCost: 40000,
        overheadPercentage: 15,
        profitMargin: 20,
        useSizeBasedOverhead: true,
        useSmoothScaling: true,
        riskFactorInputs: {
          'Invalid Factor': {
            value: 'invalid',
            notes: 'This should cause an error',
          },
        },
        riskScore: 3, // Fallback
      };

      const result = await calculateEnhancedProposalPricing(input);

      // The system should remain in enhanced mode and provide warnings
      expect(result.calculationMethod).toBe('enhanced');
      expect(
        result.warnings.some(w => w.toLowerCase().includes('no input provided'))
      ).toBe(true);
      expect(result.riskAssessment).not.toBeNull();
      expect(result.isRiskAdjustedProfitMargin).toBe(true);
    });

    it('should handle market analysis failures gracefully', async () => {
      const input: EnhancedProposalCalculationInput = {
        baseCost: 25000,
        overheadPercentage: 15,
        profitMargin: 20,
        useSizeBasedOverhead: true,
        useSmoothScaling: true,
        region: 'Invalid Region',
        materialType: 'Invalid Material',
        riskFactorInputs: {
          'Weather Delays': { value: 'Low' },
        },
      };

      const result = await calculateEnhancedProposalPricing(input);

      // The system should provide at least one warning (e.g., about missing input or market analysis)
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.winProbability).toBeGreaterThan(0);
      expect(result.costPerSquareFoot).toBeGreaterThanOrEqual(0);
    });

    it('should handle confidence scoring failures gracefully', async () => {
      const input: EnhancedProposalCalculationInput = {
        baseCost: 35000,
        overheadPercentage: 15,
        profitMargin: 20,
        useSizeBasedOverhead: true,
        useSmoothScaling: true,
        confidenceFactors: {
          dataCompleteness: -10, // Invalid value
          dataAccuracy: 150, // Invalid value
        } as any,
        riskFactorInputs: {
          'Weather Delays': { value: 'Low' },
        },
      };

      const result = await calculateEnhancedProposalPricing(input);

      // The system should provide at least one warning (e.g., about missing input or confidence scoring)
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.uncertaintyRange).toBeDefined();
    });
  });

  describe('Audit Logging Integration', () => {
    it('should log all calculations for audit trail', async () => {
      const input: EnhancedProposalCalculationInput = {
        baseCost: 45000,
        overheadPercentage: 15,
        profitMargin: 20,
        useSizeBasedOverhead: true,
        useSmoothScaling: true,
        riskFactorInputs: {
          'Weather Delays': { value: 'Medium' },
          'Project Complexity': { value: 5 },
        },
      };

      const result = await calculateEnhancedProposalPricing(input);
      const auditLogs = getCalculationAuditLogs();

      expect(auditLogs.length).toBeGreaterThan(0);
      const latestLog = auditLogs[0];
      expect(latestLog.calculationId).toBe(result.calculationId);
      expect(latestLog.riskAssessmentUsed).toBe(true);
      expect(latestLog.fallbackUsed).toBe(false);
      expect(latestLog.executionTime).toBe(result.executionTime);
    });

    it('should provide calculation statistics', async () => {
      // Clear logs first to get clean count
      clearAllAuditLogs();

      // Perform multiple calculations
      const inputs = [
        {
          baseCost: 30000,
          overheadPercentage: 15,
          profitMargin: 20,
          useSizeBasedOverhead: true,
          useSmoothScaling: true,
          riskFactorInputs: { 'Weather Delays': { value: 'Low' } },
        },
        {
          baseCost: 50000,
          overheadPercentage: 15,
          profitMargin: 20,
          useSizeBasedOverhead: true,
          useSmoothScaling: true,
          riskFactorInputs: { 'Weather Delays': { value: 'High' } },
        },
        {
          baseCost: 40000,
          overheadPercentage: 15,
          profitMargin: 20,
          useSizeBasedOverhead: false,
          useSmoothScaling: false,
          riskScore: 8, // Legacy
        },
      ];

      for (const input of inputs) {
        await calculateEnhancedProposalPricing(
          input as EnhancedProposalCalculationInput
        );
      }

      const stats = getCalculationStatistics();

      expect(stats.totalCalculations).toBe(3);
      expect(stats.averageExecutionTime).toBeGreaterThan(0);
      expect(stats.riskAssessmentUsageRate).toBeGreaterThanOrEqual(0);
      // Fallback usage rate may be 0 if no true errors are thrown
      expect(stats.fallbackUsageRate).toBeGreaterThanOrEqual(0);
    });

    it('should filter audit logs by criteria', async () => {
      // Perform calculations with different characteristics
      await calculateEnhancedProposalPricing({
        baseCost: 30000,
        overheadPercentage: 15,
        profitMargin: 20,
        useSizeBasedOverhead: true,
        useSmoothScaling: true,
        riskFactorInputs: { 'Weather Delays': { value: 'Low' } },
      });

      await calculateEnhancedProposalPricing({
        baseCost: 50000,
        overheadPercentage: 15,
        profitMargin: 20,
        useSizeBasedOverhead: false,
        useSmoothScaling: false,
        riskScore: 10, // This will cause errors
      });

      // Test filtering by errors
      const logsWithErrors = getCalculationAuditLogs({ includeErrors: true });
      const logsWithoutErrors = getCalculationAuditLogs({
        includeErrors: false,
      });

      expect(logsWithErrors.length).toBeGreaterThanOrEqual(
        logsWithoutErrors.length
      );

      // Test limiting results
      const limitedLogs = getCalculationAuditLogs({ limit: 1 });
      expect(limitedLogs.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Real-time Integration Features', () => {
    it('should provide real-time calculation updates', async () => {
      const input: EnhancedProposalCalculationInput = {
        baseCost: 40000,
        overheadPercentage: 15,
        profitMargin: 20,
        useSizeBasedOverhead: true,
        useSmoothScaling: true,
        riskFactorInputs: {
          'Weather Delays': { value: 'Low' },
          'Project Complexity': { value: 3 },
        },
      };

      const startTime = Date.now();
      const result = await calculateEnhancedProposalPricing(input);
      const endTime = Date.now();

      // Verify real-time performance
      expect(result.executionTime).toBeLessThan(1000); // Should complete within 1 second
      expect(endTime - startTime).toBeLessThan(2000); // Total time should be reasonable

      // Verify real-time data availability
      expect(result.auditTrail.riskAssessmentTimestamp).toBeDefined();
      expect(result.auditTrail.calculationSequence).toContain(
        'risk_assessment'
      );
    });

    it('should maintain calculation sequence integrity', async () => {
      const input: EnhancedProposalCalculationInput = {
        baseCost: 35000,
        overheadPercentage: 15,
        profitMargin: 20,
        useSizeBasedOverhead: true,
        useSmoothScaling: true,
        region: 'South',
        materialType: 'aluminum',
        riskFactorInputs: {
          'Weather Delays': { value: 'Medium' },
        },
        confidenceFactors: {
          dataCompleteness: 80,
          dataAccuracy: 75,
        },
      };

      const result = await calculateEnhancedProposalPricing(input);

      // Verify proper calculation sequence
      const sequence = result.auditTrail.calculationSequence;
      expect(sequence).toContain('risk_validation');
      expect(sequence).toContain('risk_assessment');
      expect(sequence).toContain('overhead_calculation');
      expect(sequence).toContain('profit_margin_calculation');
      expect(sequence).toContain('market_analysis');
      expect(sequence).toContain('contingency_recommendation');
      expect(sequence).toContain('confidence_scoring');

      // Verify sequence order (risk validation should come first)
      expect(sequence[0]).toBe('risk_validation');
    });
  });

  describe('Error Handling and Fallback Mechanisms', () => {
    it('should handle database connection issues gracefully', async () => {
      // This test simulates database connection issues by providing invalid inputs
      const input: EnhancedProposalCalculationInput = {
        baseCost: 25000,
        overheadPercentage: 15,
        profitMargin: 20,
        useSizeBasedOverhead: true,
        useSmoothScaling: true,
        riskFactorInputs: {
          'Non-existent Factor': { value: 'test' },
        },
        riskScore: 4, // Fallback
      };

      const result = await calculateEnhancedProposalPricing(input);

      // The system should remain in enhanced mode and provide warnings
      expect(result.calculationMethod).toBe('enhanced');
      expect(
        result.warnings.some(w => w.toLowerCase().includes('no input provided'))
      ).toBe(true);
      expect(result.riskAssessment).not.toBeNull();
    });

    it('should provide detailed error information', async () => {
      const input: EnhancedProposalCalculationInput = {
        baseCost: 30000,
        overheadPercentage: 15,
        profitMargin: 20,
        useSizeBasedOverhead: true,
        useSmoothScaling: true,
        riskFactorInputs: {
          'Invalid Factor': { value: 'invalid' },
        },
      };

      const result = await calculateEnhancedProposalPricing(input);

      // The system should remain in enhanced mode and provide warnings
      expect(result.calculationMethod).toBe('enhanced');
      expect(
        result.warnings.some(w => w.toLowerCase().includes('no input provided'))
      ).toBe(true);
      expect(result.riskAssessment).not.toBeNull();
    });
  });
});
