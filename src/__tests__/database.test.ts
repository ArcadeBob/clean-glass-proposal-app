import {
  CreateGeneralContractorSchema,
  CreateProposalWithItemsSchema,
  ProposalItemSchema,
  UpdateGeneralContractorSchema,
  UpdateProposalSchema,
} from '../lib/api-schemas';

describe('Database Validation Schemas', () => {
  describe('CreateProposalWithItemsSchema', () => {
    it('should validate a valid proposal with items', () => {
      const validProposal = {
        title: 'Test Proposal',
        description: 'Test description',
        status: 'DRAFT',
        totalAmount: 10000,
        overheadPercentage: 15,
        profitMargin: 20,
        projectName: 'Test Project',
        projectAddress: '123 Test St',
        projectType: 'COMMERCIAL',
        squareFootage: 1000,
        items: [
          {
            name: 'Test Item',
            description: 'Test item description',
            quantity: 10,
            unit: 'SF',
            unitCost: 50,
            totalCost: 500,
            category: 'GLASS',
          },
        ],
      };

      const result = CreateProposalWithItemsSchema.safeParse(validProposal);
      expect(result.success).toBe(true);
    });

    it('should reject invalid proposal data', () => {
      const invalidProposal = {
        title: '', // Empty title
        totalAmount: -1000, // Negative amount
        overheadPercentage: 150, // Over 100%
      };

      const result = CreateProposalWithItemsSchema.safeParse(invalidProposal);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it('should handle proposal without items', () => {
      const proposalWithoutItems = {
        title: 'Test Proposal',
        totalAmount: 10000,
        overheadPercentage: 15,
        profitMargin: 20,
      };

      const result =
        CreateProposalWithItemsSchema.safeParse(proposalWithoutItems);
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateProposalSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        title: 'Updated Title',
        status: 'SENT',
      };

      const result = UpdateProposalSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should reject invalid partial updates', () => {
      const invalidUpdate = {
        totalAmount: -500,
        overheadPercentage: 200,
      };

      const result = UpdateProposalSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateGeneralContractorSchema', () => {
    it('should validate a valid general contractor', () => {
      const validContractor = {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '(555) 123-4567',
        address: '123 Main St',
        company: 'Smith Construction',
      };

      const result = CreateGeneralContractorSchema.safeParse(validContractor);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidContractor = {
        name: 'John Smith',
        email: 'invalid-email',
      };

      const result = CreateGeneralContractorSchema.safeParse(invalidContractor);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email');
      }
    });

    it('should allow contractor with only name', () => {
      const minimalContractor = {
        name: 'John Smith',
      };

      const result = CreateGeneralContractorSchema.safeParse(minimalContractor);
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateGeneralContractorSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        email: 'newemail@example.com',
        phone: '(555) 987-6543',
      };

      const result = UpdateGeneralContractorSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });
  });

  describe('ProposalItemSchema', () => {
    it('should validate a valid proposal item', () => {
      const validItem = {
        name: 'Glass Panel',
        description: 'Tempered glass panel',
        quantity: 100,
        unit: 'SF',
        unitCost: 25.5,
        totalCost: 2550,
        category: 'GLASS',
      };

      const result = ProposalItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('should reject negative quantities', () => {
      const invalidItem = {
        name: 'Glass Panel',
        quantity: -10,
        unitCost: 25,
        totalCost: 250,
      };

      const result = ProposalItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('should reject negative costs', () => {
      const invalidItem = {
        name: 'Glass Panel',
        quantity: 10,
        unitCost: -25,
        totalCost: -250,
      };

      const result = ProposalItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('should use default values', () => {
      const minimalItem = {
        name: 'Glass Panel',
        quantity: 10,
        unitCost: 25,
        totalCost: 250,
      };

      const result = ProposalItemSchema.safeParse(minimalItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unit).toBe('SF');
        expect(result.data.category).toBe('GLASS');
      }
    });
  });

  describe('Schema Edge Cases', () => {
    it('should handle decimal values correctly', () => {
      const proposalWithDecimals = {
        title: 'Test Proposal',
        totalAmount: 12345.67,
        overheadPercentage: 12.5,
        profitMargin: 18.75,
        squareFootage: 1234.56,
      };

      const result =
        CreateProposalWithItemsSchema.safeParse(proposalWithDecimals);
      expect(result.success).toBe(true);
    });

    it('should handle optional date fields', () => {
      const proposalWithDates = {
        title: 'Test Proposal',
        totalAmount: 10000,
        validUntil: '2024-12-31T23:59:59.999Z',
        estimatedStartDate: '2024-01-15T00:00:00.000Z',
        estimatedEndDate: '2024-06-30T23:59:59.999Z',
      };

      const result = CreateProposalWithItemsSchema.safeParse(proposalWithDates);
      expect(result.success).toBe(true);
    });

    it('should handle all project types', () => {
      const projectTypes = [
        'COMMERCIAL',
        'RESIDENTIAL',
        'INDUSTRIAL',
        'INSTITUTIONAL',
        'RETAIL',
        'HOSPITALITY',
        'HEALTHCARE',
        'EDUCATIONAL',
        'OTHER',
      ];

      projectTypes.forEach(projectType => {
        const proposal = {
          title: 'Test Proposal',
          totalAmount: 10000,
          projectType,
        };

        const result = CreateProposalWithItemsSchema.safeParse(proposal);
        expect(result.success).toBe(true);
      });
    });

    it('should handle all item categories', () => {
      const categories = [
        'GLASS',
        'FRAMING',
        'HARDWARE',
        'SEALANT',
        'ACCESSORIES',
        'LABOR',
        'EQUIPMENT',
        'MATERIALS',
        'OTHER',
      ];

      categories.forEach(category => {
        const item = {
          name: 'Test Item',
          quantity: 10,
          unitCost: 25,
          totalCost: 250,
          category,
        };

        const result = ProposalItemSchema.safeParse(item);
        expect(result.success).toBe(true);
      });
    });
  });
});
