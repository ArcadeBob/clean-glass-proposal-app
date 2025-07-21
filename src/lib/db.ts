import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Database utility functions
export async function getProposalsByUserId(userId: string) {
  return await prisma.proposal.findMany({
    where: { userId },
    include: {
      generalContractor: true,
      items: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProposalById(id: string, userId?: string) {
  const where: any = { id };
  if (userId) {
    where.userId = userId;
  }

  return await prisma.proposal.findUnique({
    where,
    include: {
      generalContractor: true,
      items: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function createProposal(data: any, userId: string) {
  return await prisma.proposal.create({
    data: {
      ...data,
      userId,
    },
    include: {
      generalContractor: true,
      items: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function updateProposal(id: string, data: any, userId?: string) {
  const where: any = { id };
  if (userId) {
    where.userId = userId;
  }

  return await prisma.proposal.update({
    where,
    data,
    include: {
      generalContractor: true,
      items: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function deleteProposal(id: string, userId?: string) {
  const where: any = { id };
  if (userId) {
    where.userId = userId;
  }

  return await prisma.proposal.delete({
    where,
  });
}

export async function getGeneralContractors() {
  return await prisma.generalContractor.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function getGeneralContractorById(id: string) {
  return await prisma.generalContractor.findUnique({
    where: { id },
  });
}

export async function createGeneralContractor(data: any) {
  return await prisma.generalContractor.create({
    data,
  });
}

export async function updateGeneralContractor(id: string, data: any) {
  return await prisma.generalContractor.update({
    where: { id },
    data,
  });
}

export async function deleteGeneralContractor(id: string) {
  return await prisma.generalContractor.delete({
    where: { id },
  });
}

export async function getProposalItems(proposalId: string) {
  return await prisma.proposalItem.findMany({
    where: { proposalId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createProposalItem(data: any) {
  return await prisma.proposalItem.create({
    data,
  });
}

export async function updateProposalItem(id: string, data: any) {
  return await prisma.proposalItem.update({
    where: { id },
    data,
  });
}

export async function deleteProposalItem(id: string) {
  return await prisma.proposalItem.delete({
    where: { id },
  });
}

// Error handling utilities
export class DatabaseError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export function handleDatabaseError(error: any): DatabaseError {
  console.error('Database error:', error);

  if (error.code === 'P2002') {
    return new DatabaseError(
      'A record with this unique field already exists',
      409
    );
  }

  if (error.code === 'P2025') {
    return new DatabaseError('Record not found', 404);
  }

  if (error.code === 'P2003') {
    return new DatabaseError('Foreign key constraint failed', 400);
  }

  return new DatabaseError('Database operation failed', 500);
}
