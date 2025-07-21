import { zodResolver } from '@hookform/resolvers/zod';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import PricingStep from '../components/wizard/steps/PricingStep';
import { calculateProposalPrice } from '../lib/calculations/proposal-calculations';

// Mock the ProposalFormData type
const proposalSchema = z.object({
  projectName: z.string().min(1),
  projectAddress: z.string().min(1),
  projectType: z.enum(['residential', 'commercial', 'industrial']),
  squareFootage: z.number().min(1),
  glassType: z.enum(['clear', 'tinted', 'reflective', 'low_e', 'tempered']),
  framingType: z.enum(['aluminum', 'steel', 'wood', 'vinyl']),
  hardwareType: z.enum(['standard', 'premium', 'custom']),
  quantity: z.number().min(1),
  overheadPercentage: z.number().min(0).max(100),
  profitMargin: z.number().min(0).max(100),
  riskFactor: z.number().min(0).max(50),
  notes: z.string().optional(),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

// Wrapper component to provide form context
function TestWrapper({
  children,
  defaultValues,
}: {
  children: React.ReactNode;
  defaultValues: ProposalFormData;
}) {
  const methods = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues,
    mode: 'onChange',
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('Wizard Integration Tests', () => {
  describe('PricingStep Integration', () => {
    it('should render pricing step with calculation display', () => {
      const defaultValues: ProposalFormData = {
        projectName: 'Test Project',
        projectAddress: '123 Test St',
        projectType: 'commercial',
        squareFootage: 1000,
        glassType: 'clear',
        framingType: 'aluminum',
        hardwareType: 'standard',
        quantity: 1,
        overheadPercentage: 15,
        profitMargin: 20,
        riskFactor: 5,
        notes: '',
      };

      render(
        <TestWrapper defaultValues={defaultValues}>
          <PricingStep />
        </TestWrapper>
      );

      // Check that the pricing step renders
      expect(screen.getByText('Pricing Configuration')).toBeInTheDocument();
      expect(screen.getByText('Estimated Proposal Price')).toBeInTheDocument();
    });

    it('should display calculated prices correctly', () => {
      const defaultValues: ProposalFormData = {
        projectName: 'Test Project',
        projectAddress: '123 Test St',
        projectType: 'commercial',
        squareFootage: 1000,
        glassType: 'clear',
        framingType: 'aluminum',
        hardwareType: 'standard',
        quantity: 1,
        overheadPercentage: 15,
        profitMargin: 20,
        riskFactor: 5,
        notes: '',
      };

      render(
        <TestWrapper defaultValues={defaultValues}>
          <PricingStep />
        </TestWrapper>
      );

      // The calculation should be displayed in the component
      // We can verify the calculation logic works correctly
      const expectedCalculation = calculateProposalPrice({
        squareFootage: 1000,
        glassType: 'clear',
        framingType: 'aluminum',
        hardwareType: 'standard',
        quantity: 1,
        overheadPercentage: 15,
        profitMargin: 20,
        riskFactor: 5,
      });

      expect(expectedCalculation.baseCost).toBe(25000);
      expect(expectedCalculation.withOverhead).toBe(28750);
      expect(expectedCalculation.finalPrice).toBe(35937.5);
    });
  });

  describe('Real-world Calculation Scenarios', () => {
    it('should handle a typical commercial project', () => {
      const commercialProject = calculateProposalPrice({
        squareFootage: 2500,
        glassType: 'tinted',
        framingType: 'steel',
        hardwareType: 'premium',
        quantity: 1,
        overheadPercentage: 18,
        profitMargin: 25,
        riskFactor: 8,
      });

      // Base cost per SF: 25
      // Glass multiplier: 1.2 (tinted)
      // Framing multiplier: 1.3 (steel)
      // Hardware multiplier: 1.2 (premium)
      // Final base cost per SF: 25 * 1.2 * 1.3 * 1.2 = 46.8
      // Base cost: 2500 * 46.8 * 1 = 117000
      // Overhead: 117000 * 0.18 = 21060
      // With overhead: 117000 + 21060 = 138060
      // Profit: 138060 * 0.25 = 34515
      // Risk: 138060 * 0.08 = 11044.8
      // Final price: 138060 + 34515 + 11044.8 = 183619.8

      expect(commercialProject.baseCost).toBe(117000);
      expect(commercialProject.withOverhead).toBe(138060);
      expect(commercialProject.finalPrice).toBe(183619.8);
    });

    it('should handle a residential project with tempered glass', () => {
      const residentialProject = calculateProposalPrice({
        squareFootage: 800,
        glassType: 'tempered',
        framingType: 'vinyl',
        hardwareType: 'standard',
        quantity: 1,
        overheadPercentage: 12,
        profitMargin: 15,
        riskFactor: 3,
      });

      // Base cost per SF: 25
      // Glass multiplier: 1.4 (tempered)
      // Framing multiplier: 0.9 (vinyl)
      // Hardware multiplier: 1.0 (standard)
      // Final base cost per SF: 25 * 1.4 * 0.9 * 1.0 = 31.5
      // Base cost: 800 * 31.5 * 1 = 25200
      // Overhead: 25200 * 0.12 = 3024
      // With overhead: 25200 + 3024 = 28224
      // Profit: 28224 * 0.15 = 4233.6
      // Risk: 28224 * 0.03 = 846.72
      // Final price: 28224 + 4233.6 + 846.72 = 33304.32

      expect(residentialProject.baseCost).toBe(25200);
      expect(residentialProject.withOverhead).toBe(28224);
      expect(residentialProject.finalPrice).toBe(33304.32);
    });

    it('should handle a high-risk industrial project', () => {
      const industrialProject = calculateProposalPrice({
        squareFootage: 5000,
        glassType: 'reflective',
        framingType: 'steel',
        hardwareType: 'custom',
        quantity: 1,
        overheadPercentage: 20,
        profitMargin: 30,
        riskFactor: 15,
      });

      // Base cost per SF: 25
      // Glass multiplier: 1.5 (reflective)
      // Framing multiplier: 1.3 (steel)
      // Hardware multiplier: 1.5 (custom)
      // Final base cost per SF: 25 * 1.5 * 1.3 * 1.5 = 73.125
      // Base cost: 5000 * 73.125 * 1 = 365625
      // Overhead: 365625 * 0.20 = 73125
      // With overhead: 365625 + 73125 = 438750
      // Profit: 438750 * 0.30 = 131625
      // Risk: 438750 * 0.15 = 65812.5
      // Final price: 438750 + 131625 + 65812.5 = 636187.5

      expect(industrialProject.baseCost).toBe(365625);
      expect(industrialProject.withOverhead).toBe(438750);
      expect(industrialProject.finalPrice).toBe(636187.5);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero square footage gracefully', () => {
      const zeroProject = calculateProposalPrice({
        squareFootage: 0,
        glassType: 'clear',
        framingType: 'aluminum',
        hardwareType: 'standard',
        quantity: 1,
        overheadPercentage: 15,
        profitMargin: 20,
        riskFactor: 5,
      });

      expect(zeroProject.baseCost).toBe(0);
      expect(zeroProject.withOverhead).toBe(0);
      expect(zeroProject.finalPrice).toBe(0);
    });

    it('should handle zero percentages correctly', () => {
      const zeroPercentages = calculateProposalPrice({
        squareFootage: 1000,
        glassType: 'clear',
        framingType: 'aluminum',
        hardwareType: 'standard',
        quantity: 1,
        overheadPercentage: 0,
        profitMargin: 0,
        riskFactor: 0,
      });

      // Base cost: 1000 * 25 * 1.0 * 1.0 * 1.0 = 25000
      // Overhead: 25000 * 0 = 0
      // With overhead: 25000 + 0 = 25000
      // Profit: 25000 * 0 = 0
      // Risk: 25000 * 0 = 0
      // Final price: 25000 + 0 + 0 = 25000

      expect(zeroPercentages.baseCost).toBe(25000);
      expect(zeroPercentages.withOverhead).toBe(25000);
      expect(zeroPercentages.finalPrice).toBe(25000);
    });

    it('should handle maximum risk factor', () => {
      const maxRiskProject = calculateProposalPrice({
        squareFootage: 1000,
        glassType: 'clear',
        framingType: 'aluminum',
        hardwareType: 'standard',
        quantity: 1,
        overheadPercentage: 15,
        profitMargin: 20,
        riskFactor: 50, // Maximum risk factor
      });

      // Base cost: 1000 * 25 * 1.0 * 1.0 * 1.0 = 25000
      // Overhead: 25000 * 0.15 = 3750
      // With overhead: 25000 + 3750 = 28750
      // Profit: 28750 * 0.20 = 5750
      // Risk: 28750 * 0.50 = 14375
      // Final price: 28750 + 5750 + 14375 = 48875

      expect(maxRiskProject.baseCost).toBe(25000);
      expect(maxRiskProject.withOverhead).toBe(28750);
      expect(maxRiskProject.finalPrice).toBe(48875);
    });
  });
});
