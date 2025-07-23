import { z } from 'zod';

// Proposal schemas
export const CreateProposalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z
    .enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'])
    .default('DRAFT'),
  totalAmount: z.number().min(0, 'Total amount must be non-negative'),
  overheadPercentage: z.number().min(0).max(100).default(15),
  profitMargin: z.number().min(0).max(100).default(20),
  riskScore: z.number().min(0).max(10).optional(),
  winProbability: z.number().min(0).max(100).optional(),
  projectName: z.string().optional(),
  projectAddress: z.string().optional(),
  projectType: z
    .enum([
      'COMMERCIAL',
      'RESIDENTIAL',
      'INDUSTRIAL',
      'INSTITUTIONAL',
      'RETAIL',
      'HOSPITALITY',
      'HEALTHCARE',
      'EDUCATIONAL',
      'OTHER',
    ])
    .optional(),
  squareFootage: z.number().min(0).optional(),
  validUntil: z.string().datetime().optional(),
  estimatedStartDate: z.string().datetime().optional(),
  estimatedEndDate: z.string().datetime().optional(),
  generalContractorId: z.string().optional(),
});

export const UpdateProposalSchema = CreateProposalSchema.partial();

export const ProposalItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().default('SF'),
  unitCost: z.number().min(0, 'Unit cost must be non-negative'),
  totalCost: z.number().min(0, 'Total cost must be non-negative'),
  category: z
    .enum([
      'GLASS',
      'FRAMING',
      'HARDWARE',
      'SEALANT',
      'ACCESSORIES',
      'LABOR',
      'EQUIPMENT',
      'MATERIALS',
      'OTHER',
    ])
    .default('GLASS'),
});

export const CreateProposalWithItemsSchema = CreateProposalSchema.extend({
  items: z.array(ProposalItemSchema).optional(),
});

// General Contractor schemas
export const CreateGeneralContractorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  company: z.string().optional(),
});

export const UpdateGeneralContractorSchema =
  CreateGeneralContractorSchema.partial();

// Query parameter schemas
export const ProposalQuerySchema = z.object({
  status: z
    .enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'])
    .optional(),
  projectType: z
    .enum([
      'COMMERCIAL',
      'RESIDENTIAL',
      'INDUSTRIAL',
      'INSTITUTIONAL',
      'RETAIL',
      'HOSPITALITY',
      'HEALTHCARE',
      'EDUCATIONAL',
      'OTHER',
    ])
    .optional(),
  limit: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().min(1).max(100))
    .optional(),
  offset: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().min(0))
    .optional(),
  search: z.string().optional(),
});

export const GeneralContractorQuerySchema = z.object({
  search: z.string().optional(),
  limit: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().min(1).max(100))
    .optional(),
  offset: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().min(0))
    .optional(),
});

// Response schemas
export const ProposalResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum([
    'DRAFT',
    'SENT',
    'ACCEPTED',
    'REJECTED',
    'EXPIRED',
    'CANCELLED',
  ]),
  totalAmount: z.number(),
  overheadPercentage: z.number(),
  profitMargin: z.number(),
  riskScore: z.number().nullable(),
  winProbability: z.number().nullable(),
  projectName: z.string().nullable(),
  projectAddress: z.string().nullable(),
  projectType: z
    .enum([
      'COMMERCIAL',
      'RESIDENTIAL',
      'INDUSTRIAL',
      'INSTITUTIONAL',
      'RETAIL',
      'HOSPITALITY',
      'HEALTHCARE',
      'EDUCATIONAL',
      'OTHER',
    ])
    .nullable(),
  squareFootage: z.number().nullable(),
  proposalDate: z.date(),
  validUntil: z.date().nullable(),
  estimatedStartDate: z.date().nullable(),
  estimatedEndDate: z.date().nullable(),
  userId: z.string(),
  generalContractorId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  version: z.number(),
  generalContractor: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string().nullable(),
      phone: z.string().nullable(),
      address: z.string().nullable(),
      company: z.string().nullable(),
    })
    .nullable(),
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      quantity: z.number(),
      unit: z.string(),
      unitCost: z.number(),
      totalCost: z.number(),
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
      proposalId: z.string(),
      createdAt: z.date(),
      updatedAt: z.date(),
    })
  ),
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
  }),
});

export const GeneralContractorResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  company: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ProposalItemResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  quantity: z.number(),
  unit: z.string(),
  unitCost: z.number(),
  totalCost: z.number(),
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
  proposalId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Import standardized response schemas
export { ApiResponseSchema, PaginatedResponseSchema } from './api-response';

// Legacy schemas for backward compatibility
export const ErrorResponseSchema = z.object({
  message: z.string(),
  errors: z
    .array(
      z.object({
        field: z.string().optional(),
        message: z.string(),
      })
    )
    .optional(),
});

export const SuccessResponseSchema = z.object({
  message: z.string(),
  data: z.any().optional(),
});

// Legacy paginated schema
export const LegacyPaginatedResponseSchema = z.object({
  data: z.array(z.any()),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean(),
  }),
});
