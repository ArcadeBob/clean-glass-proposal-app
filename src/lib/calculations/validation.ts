import { z } from 'zod';

/**
 * Validation schemas for proposal calculations
 */

export const QuantitySchema = z.object({
  value: z.number().positive('Quantity must be positive'),
  unit: z.enum(['SF', 'LF', 'EACH', 'LOT', 'TUBES', 'SHEETS']),
});

export const CostSchema = z.object({
  value: z.number().min(0, 'Cost cannot be negative'),
  currency: z.string().default('USD'),
});

export const ProjectDetailsSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  address: z.string().min(1, 'Project address is required'),
  type: z.enum([
    'COMMERCIAL',
    'RESIDENTIAL',
    'INDUSTRIAL',
    'INSTITUTIONAL',
    'RETAIL',
    'HOSPITALITY',
    'HEALTHCARE',
    'EDUCATIONAL',
    'OTHER',
  ]),
  squareFootage: z.number().positive('Square footage must be positive'),
});

export const GlassSpecificationsSchema = z.object({
  glassType: z.string().min(1, 'Glass type is required'),
  thickness: z.number().positive('Thickness must be positive'),
  framing: z.string().min(1, 'Framing type is required'),
  hardware: z
    .array(z.string())
    .min(1, 'At least one hardware item is required'),
});

export const PricingSchema = z.object({
  overheadPercentage: z
    .number()
    .min(0)
    .max(100, 'Overhead must be between 0 and 100%'),
  profitMargin: z
    .number()
    .min(0)
    .max(100, 'Profit margin must be between 0 and 100%'),
  riskScore: z.number().min(0).max(10, 'Risk score must be between 0 and 10'),
});

export const ProposalItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: QuantitySchema,
  unitCost: CostSchema,
  category: z.enum([
    'GLASS',
    'FRAMING',
    'HARDWARE',
    'SEALANT',
    'ACCESSORIES',
    'LABOR',
    'EQUIPMENT',
    'MATERIALS',
    'OTHER',
  ]),
});

export const ProposalSchema = z.object({
  title: z.string().min(1, 'Proposal title is required'),
  description: z.string().optional(),
  projectDetails: ProjectDetailsSchema,
  glassSpecifications: GlassSpecificationsSchema,
  pricing: PricingSchema,
  items: z.array(ProposalItemSchema).min(1, 'At least one item is required'),
});

/**
 * Validation functions
 */

export function validateQuantity(
  quantity: number,
  unit: string
): { isValid: boolean; error?: string } {
  try {
    QuantitySchema.parse({ value: quantity, unit });
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid quantity' };
  }
}

export function validateCost(cost: number): {
  isValid: boolean;
  error?: string;
} {
  try {
    CostSchema.parse({ value: cost });
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid cost' };
  }
}

export function validateProjectDetails(details: any): {
  isValid: boolean;
  error?: string;
} {
  try {
    ProjectDetailsSchema.parse(details);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid project details' };
  }
}

export function validateProposal(proposal: any): {
  isValid: boolean;
  error?: string;
} {
  try {
    ProposalSchema.parse(proposal);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid proposal' };
  }
}

/**
 * Business logic validation
 */

export function validateCalculationInputs(inputs: {
  baseCost: number;
  overheadPercentage: number;
  profitMargin: number;
  riskScore: number;
}): { isValid: boolean; error?: string } {
  const { baseCost, overheadPercentage, profitMargin, riskScore } = inputs;

  if (baseCost < 0) {
    return { isValid: false, error: 'Base cost cannot be negative' };
  }

  if (overheadPercentage < 0 || overheadPercentage > 100) {
    return {
      isValid: false,
      error: 'Overhead percentage must be between 0 and 100',
    };
  }

  if (profitMargin < 0 || profitMargin > 100) {
    return { isValid: false, error: 'Profit margin must be between 0 and 100' };
  }

  if (riskScore < 0 || riskScore > 10) {
    return { isValid: false, error: 'Risk score must be between 0 and 10' };
  }

  return { isValid: true };
}
