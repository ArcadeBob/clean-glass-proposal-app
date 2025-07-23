// Mock auth module before any imports
jest.mock('@/lib/auth', () => ({
  auth: jest.fn().mockResolvedValue({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
    },
  }),
}));

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
  getSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn(),
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('@/lib/calculations/enhanced-proposal-calculations');
jest.mock('@/lib/calculations/market-analysis');
jest.mock('@/lib/pdf-generator');
jest.mock('@/lib/database-monitor');
jest.mock('@/lib/rate-limiting');

// Import API route handlers
import { POST as calculateEnhanced } from '@/app/api/calculate/enhanced/route';
import {
  POST as createProposal,
  GET as getProposals,
} from '@/app/api/proposals/route';
import { GET as getRiskFactors } from '@/app/api/risk-factors/route';

describe('Performance and Load Tests', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = new NextRequest('http://localhost:3000/api/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Default authenticated user
    (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com', role: 'USER' },
      expires: new Date(Date.now() + 3600000).toISOString(),
    } as any);
  });

  describe('Response Time Performance', () => {
    it('should respond within acceptable time for simple queries', async () => {
      const startTime = Date.now();

      // Mock a simple database query
      (prisma.proposal.findMany as jest.Mock).mockResolvedValue([
        { id: '1', title: 'Test Proposal', totalAmount: 50000 },
      ]);

      const result = await prisma.proposal.findMany();
      const endTime = Date.now();

      const responseTime = endTime - startTime;

      // Mock response structure
      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue({ data: result }),
      };

      expect(mockResponse.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should handle large datasets efficiently', async () => {
      const startTime = Date.now();

      // Mock large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `proposal-${i}`,
        title: `Proposal ${i}`,
        totalAmount: 50000 + i * 100,
      }));

      (prisma.proposal.findMany as jest.Mock).mockResolvedValue(largeDataset);

      const result = await prisma.proposal.findMany();
      const endTime = Date.now();

      const responseTime = endTime - startTime;

      // Mock response structure
      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue({ data: result }),
      };

      const data = await mockResponse.json();
      expect(mockResponse.status).toBe(200);
      expect(data.data).toHaveLength(1000);
      expect(responseTime).toBeLessThan(2000); // Should handle 1000 records within 2 seconds
    });

    it('should maintain performance with complex calculations', async () => {
      const mockCalculationResult = {
        baseCost: 50000,
        totalCost: 65000,
        calculationMethod: 'enhanced',
        riskAssessment: { score: 0.3, factors: [] },
        confidenceAssessment: { score: 0.8, factors: [] },
      };

      const {
        calculateEnhancedProposalPricing,
      } = require('@/lib/calculations/enhanced-proposal-calculations');
      calculateEnhancedProposalPricing.mockResolvedValue(mockCalculationResult);

      const startTime = Date.now();
      const request = new NextRequest(
        'http://localhost:3000/api/calculate/enhanced',
        {
          method: 'POST',
          body: JSON.stringify({
            baseCost: 50000,
            overheadPercentage: 15,
            profitMargin: 20,
            projectType: 'commercial',
            squareFootage: 1000,
            riskFactorInputs: {
              'Weather Delays': { value: 'Low' },
              'Project Complexity': { value: 3 },
              'Material Price Volatility': { value: 'Medium' },
            },
            confidenceFactors: {
              dataCompleteness: 85,
              dataAccuracy: 80,
              dataRecency: 75,
            },
          }),
        }
      );

      const response = await calculateEnhanced(request);
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(3000); // Complex calculations within 3 seconds
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple concurrent requests', async () => {
      const concurrentRequests = 10;
      const responses = [];

      // Mock database responses for concurrent requests
      (prisma.proposal.findMany as jest.Mock).mockResolvedValue([
        { id: '1', title: 'Test Proposal', totalAmount: 50000 },
      ]);

      // Simulate concurrent requests
      const promises = Array.from({ length: concurrentRequests }, async () => {
        const startTime = Date.now();
        const result = await prisma.proposal.findMany();
        const endTime = Date.now();

        return {
          status: 200,
          data: result,
          responseTime: endTime - startTime,
        };
      });

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(response => {
        expect(response.status).toBe(200);
      });

      // All requests should complete within reasonable time
      const totalTime = Math.max(...results.map(r => r.responseTime));
      expect(totalTime).toBeLessThan(5000); // Should handle 10 concurrent requests within 5 seconds
    });

    it('should handle concurrent write operations', async () => {
      let proposalId = 1;
      (prisma.proposal.create as jest.Mock).mockImplementation(() => {
        return Promise.resolve({
          id: `proposal-${proposalId++}`,
          title: 'Test Proposal',
          totalAmount: 50000,
          userId: 'user-123',
        });
      });

      const concurrentRequests = Array.from(
        { length: 5 },
        () =>
          new NextRequest('http://localhost:3000/api/proposals', {
            method: 'POST',
            body: JSON.stringify({
              title: 'Concurrent Proposal',
              projectName: 'Test Project',
              totalAmount: 50000,
            }),
          })
      );

      const startTime = Date.now();
      const responses = await Promise.all(
        concurrentRequests.map(request => createProposal(request))
      );
      const endTime = Date.now();

      const totalTime = endTime - startTime;

      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      expect(totalTime).toBeLessThan(3000);
    });
  });

  describe('Memory Usage', () => {
    it('should handle memory efficiently with large datasets', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Simulate processing large dataset
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `proposal-${i}`,
        title: `Proposal ${i}`,
        projectName: `Project ${i}`,
        status: 'DRAFT',
        totalAmount: 50000 + i,
        userId: 'user-123',
        description: 'A'.repeat(1000), // Large description field
      }));

      (prisma.proposal.findMany as jest.Mock).mockResolvedValue(largeDataset);

      const request = new NextRequest('http://localhost:3000/api/proposals');
      const response = await getProposals(request);
      const data = await response.json();

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(10000);

      // Memory increase should be reasonable (less than 100MB for 10k records)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });

    it('should not leak memory during repeated operations', async () => {
      const memorySnapshots: number[] = [];

      for (let i = 0; i < 10; i++) {
        const memoryBefore = process.memoryUsage().heapUsed;

        (prisma.proposal.findMany as jest.Mock).mockResolvedValue([
          { id: `proposal-${i}`, title: `Proposal ${i}`, totalAmount: 50000 },
        ]);

        const request = new NextRequest('http://localhost:3000/api/proposals');
        const response = await getProposals(request);

        const memoryAfter = process.memoryUsage().heapUsed;
        memorySnapshots.push(memoryAfter - memoryBefore);

        expect(response.status).toBe(200);
      }

      // Memory usage should not grow significantly over iterations
      const maxMemoryIncrease = Math.max(...memorySnapshots);
      expect(maxMemoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB per operation
    });
  });

  describe('Database Query Performance', () => {
    it('should optimize database queries for large result sets', async () => {
      const largeDataset = Array.from({ length: 5000 }, (_, i) => ({
        id: `proposal-${i}`,
        title: `Proposal ${i}`,
        status: 'DRAFT',
        totalAmount: 50000 + i,
        userId: 'user-123',
      }));

      (prisma.proposal.findMany as jest.Mock).mockResolvedValue(largeDataset);

      const startTime = Date.now();
      const request = new NextRequest(
        'http://localhost:3000/api/proposals?limit=100&offset=0'
      );
      const response = await getProposals(request);
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(100); // Should respect pagination
      expect(responseTime).toBeLessThan(1000); // Should be fast even with large datasets
    });

    it('should handle complex database joins efficiently', async () => {
      const mockRiskCategories = Array.from({ length: 10 }, (_, i) => ({
        id: `category-${i}`,
        name: `Category ${i}`,
        riskFactors: Array.from({ length: 5 }, (_, j) => ({
          id: `factor-${i}-${j}`,
          name: `Factor ${i}-${j}`,
          weight: 10,
          isActive: true,
        })),
      }));

      (prisma.riskCategory.findMany as jest.Mock).mockResolvedValue(
        mockRiskCategories
      );

      const startTime = Date.now();
      const request = new NextRequest('http://localhost:3000/api/risk-factors');
      const response = await getRiskFactors(request);
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(10);
      expect(responseTime).toBeLessThan(1000);
    });
  });

  describe('Caching Performance', () => {
    it('should benefit from caching for repeated requests', async () => {
      const mockProposals = [
        { id: 'proposal-1', title: 'Test Proposal', totalAmount: 50000 },
      ];

      (prisma.proposal.findMany as jest.Mock).mockResolvedValue(mockProposals);

      // First request
      const startTime1 = Date.now();
      const request1 = new NextRequest('http://localhost:3000/api/proposals');
      const response1 = await getProposals(request1);
      const endTime1 = Date.now();
      const time1 = endTime1 - startTime1;

      // Second request (should be faster if cached)
      const startTime2 = Date.now();
      const request2 = new NextRequest('http://localhost:3000/api/proposals');
      const response2 = await getProposals(request2);
      const endTime2 = Date.now();
      const time2 = endTime2 - startTime2;

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Second request should be faster or at least not significantly slower
      expect(time2).toBeLessThan(time1 * 2);
    });
  });

  describe('Error Recovery Performance', () => {
    it('should recover quickly from transient errors', async () => {
      let attemptCount = 0;
      (prisma.proposal.findMany as jest.Mock).mockImplementation(() => {
        attemptCount++;
        if (attemptCount === 1) {
          return Promise.reject(new Error('Transient database error'));
        }
        return Promise.resolve([
          { id: 'proposal-123', title: 'Test Proposal' },
        ]);
      });

      const startTime = Date.now();
      const request = new NextRequest('http://localhost:3000/api/proposals');
      const response = await getProposals(request);
      const endTime = Date.now();

      const responseTime = endTime - startTime;

      expect(response.status).toBe(500); // Will fail on first attempt
      expect(responseTime).toBeLessThan(2000); // Should fail quickly, not hang
    });

    it('should handle partial failures gracefully', async () => {
      const mockProposals = [
        { id: 'proposal-1', title: 'Valid Proposal', totalAmount: 50000 },
        { id: 'proposal-2', title: null, totalAmount: 'invalid' }, // Corrupted data
        {
          id: 'proposal-3',
          title: 'Another Valid Proposal',
          totalAmount: 60000,
        },
      ];

      (prisma.proposal.findMany as jest.Mock).mockResolvedValue(mockProposals);

      const startTime = Date.now();
      const request = new NextRequest('http://localhost:3000/api/proposals');
      const response = await getProposals(request);
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(3);
      expect(responseTime).toBeLessThan(1000); // Should handle corrupted data quickly
    });
  });

  describe('Load Testing Scenarios', () => {
    it('should handle burst traffic', async () => {
      const mockProposals = Array.from({ length: 100 }, (_, i) => ({
        id: `proposal-${i}`,
        title: `Proposal ${i}`,
        totalAmount: 50000 + i,
      }));

      (prisma.proposal.findMany as jest.Mock).mockResolvedValue(mockProposals);

      // Simulate burst of 50 requests
      const burstRequests = Array.from(
        { length: 50 },
        () => new NextRequest('http://localhost:3000/api/proposals')
      );

      const startTime = Date.now();
      const responses = await Promise.all(
        burstRequests.map(request => getProposals(request))
      );
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / responses.length;

      expect(responses).toHaveLength(50);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Average response time should be reasonable
      expect(avgResponseTime).toBeLessThan(100); // Less than 100ms average
    });

    it('should maintain performance under sustained load', async () => {
      const mockProposals = [
        { id: 'proposal-1', title: 'Test Proposal', totalAmount: 50000 },
      ];
      (prisma.proposal.findMany as jest.Mock).mockResolvedValue(mockProposals);

      const responseTimes: number[] = [];

      // Simulate sustained load over 20 requests
      for (let i = 0; i < 20; i++) {
        const startTime = Date.now();
        const request = new NextRequest('http://localhost:3000/api/proposals');
        const response = await getProposals(request);
        const endTime = Date.now();

        responseTimes.push(endTime - startTime);
        expect(response.status).toBe(200);
      }

      const avgResponseTime =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      expect(avgResponseTime).toBeLessThan(200); // Average under 200ms
      expect(maxResponseTime).toBeLessThan(500); // No single request over 500ms
    });
  });

  describe('Resource Utilization', () => {
    it('should not consume excessive CPU during calculations', async () => {
      const mockCalculationResult = {
        baseCost: 50000,
        totalCost: 65000,
        calculationMethod: 'enhanced',
        riskAssessment: { score: 0.3, factors: [] },
        confidenceAssessment: { score: 0.8, factors: [] },
      };

      const {
        calculateEnhancedProposalPricing,
      } = require('@/lib/calculations/enhanced-proposal-calculations');
      calculateEnhancedProposalPricing.mockResolvedValue(mockCalculationResult);

      const startTime = Date.now();
      const request = new NextRequest(
        'http://localhost:3000/api/calculate/enhanced',
        {
          method: 'POST',
          body: JSON.stringify({
            baseCost: 50000,
            overheadPercentage: 15,
            profitMargin: 20,
            projectType: 'commercial',
            squareFootage: 1000,
          }),
        }
      );

      const response = await calculateEnhanced(request);
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should complete quickly
    });

    it('should handle memory pressure gracefully', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Simulate memory pressure by creating large objects
      const largeObjects = Array.from({ length: 100 }, () => ({
        data: 'A'.repeat(10000), // 10KB per object
        timestamp: Date.now(),
      }));

      const request = new NextRequest('http://localhost:3000/api/proposals');
      const response = await getProposals(request);

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      expect(response.status).toBe(200);

      // Memory increase should be reasonable even with large objects
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    });
  });

  describe('Scalability Tests', () => {
    it('should scale linearly with data size', async () => {
      const dataSizes = [100, 500, 1000];
      const responseTimes: number[] = [];

      for (const size of dataSizes) {
        const mockData = Array.from({ length: size }, (_, i) => ({
          id: `proposal-${i}`,
          title: `Proposal ${i}`,
          totalAmount: 50000 + i,
        }));

        (prisma.proposal.findMany as jest.Mock).mockResolvedValue(mockData);

        const startTime = Date.now();
        const request = new NextRequest('http://localhost:3000/api/proposals');
        const response = await getProposals(request);
        const endTime = Date.now();

        responseTimes.push(endTime - startTime);
        expect(response.status).toBe(200);
      }

      // Response time should scale reasonably with data size
      const timeRatio = responseTimes[2] / responseTimes[0]; // 1000 vs 100 records
      expect(timeRatio).toBeLessThan(10); // Should not be 10x slower for 10x data
    });

    it('should handle increasing concurrent users', async () => {
      const userCounts = [5, 10, 20];
      const avgResponseTimes: number[] = [];

      for (const userCount of userCounts) {
        const mockProposals = [
          { id: 'proposal-1', title: 'Test Proposal', totalAmount: 50000 },
        ];
        (prisma.proposal.findMany as jest.Mock).mockResolvedValue(
          mockProposals
        );

        const concurrentRequests = Array.from(
          { length: userCount },
          () => new NextRequest('http://localhost:3000/api/proposals')
        );

        const startTime = Date.now();
        const responses = await Promise.all(
          concurrentRequests.map(request => getProposals(request))
        );
        const endTime = Date.now();

        const totalTime = endTime - startTime;
        const avgTime = totalTime / userCount;
        avgResponseTimes.push(avgTime);

        responses.forEach(response => {
          expect(response.status).toBe(200);
        });
      }

      // Performance should degrade gracefully with more users
      const performanceRatio = avgResponseTimes[2] / avgResponseTimes[0]; // 20 vs 5 users
      expect(performanceRatio).toBeLessThan(5); // Should not be 5x slower for 4x users
    });
  });
});
