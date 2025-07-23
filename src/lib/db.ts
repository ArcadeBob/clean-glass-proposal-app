import { Prisma, PrismaClient } from '@prisma/client';
import { getDatabaseConfig } from './env-config';

// Enhanced PrismaClient configuration with connection pooling and error handling
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Database configuration
const dbConfig = getDatabaseConfig();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    datasources: {
      db: {
        url: dbConfig.url,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Type definitions for better type safety
type ProposalWhereUniqueInput = Prisma.ProposalWhereUniqueInput;
type ProposalCreateInput = Prisma.ProposalCreateInput;
type ProposalUpdateInput = Prisma.ProposalUpdateInput;
type ProposalItemCreateInput = Prisma.ProposalItemCreateInput;
type ProposalItemUpdateInput = Prisma.ProposalItemUpdateInput;
type GeneralContractorCreateInput = Prisma.GeneralContractorCreateInput;
type GeneralContractorUpdateInput = Prisma.GeneralContractorUpdateInput;

// Enhanced error classification
export enum DatabaseErrorType {
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  DEADLOCK = 'DEADLOCK',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  UNKNOWN = 'UNKNOWN',
}

// Enhanced database error class
export class DatabaseError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public errorType: DatabaseErrorType = DatabaseErrorType.UNKNOWN,
    public retryable: boolean = false,
    public originalError?: any
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 100,
  maxDelay: 5000,
  backoffMultiplier: 2,
};

// Enhanced error handling with retry logic
export function handleDatabaseError(
  error: any,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): DatabaseError {
  console.error('Database error:', {
    code: error.code,
    message: error.message,
    meta: error.meta,
    timestamp: new Date().toISOString(),
  });

  // Prisma error codes mapping
  const errorMap: Record<
    string,
    { type: DatabaseErrorType; statusCode: number; retryable: boolean }
  > = {
    // Connection and timeout errors (retryable)
    P1001: {
      type: DatabaseErrorType.CONNECTION_TIMEOUT,
      statusCode: 503,
      retryable: true,
    },
    P1008: {
      type: DatabaseErrorType.CONNECTION_TIMEOUT,
      statusCode: 503,
      retryable: true,
    },
    P1017: {
      type: DatabaseErrorType.CONNECTION_TIMEOUT,
      statusCode: 503,
      retryable: true,
    },

    // Deadlock errors (retryable)
    P2034: {
      type: DatabaseErrorType.DEADLOCK,
      statusCode: 409,
      retryable: true,
    },

    // Constraint violations (not retryable)
    P2002: {
      type: DatabaseErrorType.CONSTRAINT_VIOLATION,
      statusCode: 409,
      retryable: false,
    },
    P2003: {
      type: DatabaseErrorType.CONSTRAINT_VIOLATION,
      statusCode: 400,
      retryable: false,
    },
    P2004: {
      type: DatabaseErrorType.CONSTRAINT_VIOLATION,
      statusCode: 400,
      retryable: false,
    },

    // Not found errors (not retryable)
    P2025: {
      type: DatabaseErrorType.NOT_FOUND,
      statusCode: 404,
      retryable: false,
    },

    // Validation errors (not retryable)
    P2007: {
      type: DatabaseErrorType.VALIDATION_ERROR,
      statusCode: 400,
      retryable: false,
    },
    P2011: {
      type: DatabaseErrorType.VALIDATION_ERROR,
      statusCode: 400,
      retryable: false,
    },
    P2012: {
      type: DatabaseErrorType.VALIDATION_ERROR,
      statusCode: 400,
      retryable: false,
    },
    P2013: {
      type: DatabaseErrorType.VALIDATION_ERROR,
      statusCode: 400,
      retryable: false,
    },
    P2014: {
      type: DatabaseErrorType.VALIDATION_ERROR,
      statusCode: 400,
      retryable: false,
    },
    P2015: {
      type: DatabaseErrorType.VALIDATION_ERROR,
      statusCode: 400,
      retryable: false,
    },
    P2016: {
      type: DatabaseErrorType.VALIDATION_ERROR,
      statusCode: 400,
      retryable: false,
    },
    P2017: {
      type: DatabaseErrorType.VALIDATION_ERROR,
      statusCode: 400,
      retryable: false,
    },
    P2018: {
      type: DatabaseErrorType.VALIDATION_ERROR,
      statusCode: 400,
      retryable: false,
    },
    P2019: {
      type: DatabaseErrorType.VALIDATION_ERROR,
      statusCode: 400,
      retryable: false,
    },
    P2020: {
      type: DatabaseErrorType.VALIDATION_ERROR,
      statusCode: 400,
      retryable: false,
    },
    P2021: {
      type: DatabaseErrorType.VALIDATION_ERROR,
      statusCode: 400,
      retryable: false,
    },
    P2022: {
      type: DatabaseErrorType.VALIDATION_ERROR,
      statusCode: 400,
      retryable: false,
    },
    P2023: {
      type: DatabaseErrorType.VALIDATION_ERROR,
      statusCode: 400,
      retryable: false,
    },
    P2024: {
      type: DatabaseErrorType.VALIDATION_ERROR,
      statusCode: 400,
      retryable: false,
    },

    // Transaction errors (retryable)
    P2026: {
      type: DatabaseErrorType.TRANSACTION_FAILED,
      statusCode: 500,
      retryable: true,
    },
    P2027: {
      type: DatabaseErrorType.TRANSACTION_FAILED,
      statusCode: 500,
      retryable: true,
    },
  };

  const errorInfo = errorMap[error.code] || {
    type: DatabaseErrorType.UNKNOWN,
    statusCode: 500,
    retryable: false,
  };

  return new DatabaseError(
    getErrorMessage(error, errorInfo.type),
    errorInfo.statusCode,
    errorInfo.type,
    errorInfo.retryable,
    error
  );
}

// Get user-friendly error messages
function getErrorMessage(error: any, errorType: DatabaseErrorType): string {
  switch (errorType) {
    case DatabaseErrorType.CONNECTION_TIMEOUT:
      return 'Database connection timeout. Please try again.';
    case DatabaseErrorType.DEADLOCK:
      return 'Database deadlock detected. Please try again.';
    case DatabaseErrorType.CONSTRAINT_VIOLATION:
      if (error.code === 'P2002') {
        return 'A record with this unique field already exists.';
      }
      if (error.code === 'P2003') {
        return 'Foreign key constraint failed.';
      }
      return 'Data constraint violation.';
    case DatabaseErrorType.NOT_FOUND:
      return 'Record not found.';
    case DatabaseErrorType.VALIDATION_ERROR:
      return 'Data validation failed.';
    case DatabaseErrorType.TRANSACTION_FAILED:
      return 'Database transaction failed. Please try again.';
    default:
      return 'Database operation failed.';
  }
}

// Retry mechanism with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG,
  context: string = 'database operation'
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const dbError = handleDatabaseError(error, retryConfig);

      // Don't retry if error is not retryable or we've exhausted retries
      if (!dbError.retryable || attempt === retryConfig.maxRetries) {
        throw dbError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        retryConfig.baseDelay *
          Math.pow(retryConfig.backoffMultiplier, attempt),
        retryConfig.maxDelay
      );

      console.warn(
        `Retrying ${context} (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}) after ${delay}ms`
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Transaction wrapper with proper error handling
export async function withTransaction<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  context: string = 'transaction'
): Promise<T> {
  return withRetry(
    async () => {
      return await prisma.$transaction(
        async tx => {
          try {
            return await operation(tx);
          } catch (error) {
            console.error(`Transaction failed in ${context}:`, error);
            throw error; // This will trigger automatic rollback
          }
        },
        {
          maxWait: dbConfig.connection.maxWait,
          timeout: dbConfig.connection.timeout,
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        }
      );
    },
    DEFAULT_RETRY_CONFIG,
    context
  );
}

// Connection health check
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    return {
      healthy: true,
      latency,
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Enhanced database utility functions with retry and error handling
export async function getProposalsByUserId(userId: string) {
  return withRetry(
    async () => {
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
    },
    DEFAULT_RETRY_CONFIG,
    'getProposalsByUserId'
  );
}

export async function getProposalById(id: string, userId?: string) {
  return withRetry(
    async () => {
      if (userId) {
        // For findUnique with userId filter, we need to use findFirst
        return await prisma.proposal.findFirst({
          where: { id, userId },
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

      return await prisma.proposal.findUnique({
        where: { id },
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
    },
    DEFAULT_RETRY_CONFIG,
    'getProposalById'
  );
}

export async function createProposal(
  data: Omit<ProposalCreateInput, 'user'>,
  userId: string
) {
  return withRetry(
    async () => {
      return await prisma.proposal.create({
        data: {
          ...data,
          user: {
            connect: { id: userId },
          },
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
    },
    DEFAULT_RETRY_CONFIG,
    'createProposal'
  );
}

export async function updateProposal(
  id: string,
  data: ProposalUpdateInput,
  userId?: string
) {
  return withRetry(
    async () => {
      if (userId) {
        // Verify ownership before update
        const existing = await prisma.proposal.findFirst({
          where: { id, userId },
        });
        if (!existing) {
          throw new DatabaseError(
            'Proposal not found or access denied',
            404,
            DatabaseErrorType.NOT_FOUND
          );
        }
      }

      return await prisma.proposal.update({
        where: { id },
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
    },
    DEFAULT_RETRY_CONFIG,
    'updateProposal'
  );
}

export async function deleteProposal(id: string, userId?: string) {
  return withRetry(
    async () => {
      if (userId) {
        // Verify ownership before delete
        const existing = await prisma.proposal.findFirst({
          where: { id, userId },
        });
        if (!existing) {
          throw new DatabaseError(
            'Proposal not found or access denied',
            404,
            DatabaseErrorType.NOT_FOUND
          );
        }
      }

      return await prisma.proposal.delete({
        where: { id },
      });
    },
    DEFAULT_RETRY_CONFIG,
    'deleteProposal'
  );
}

export async function getGeneralContractors() {
  return withRetry(
    async () => {
      return await prisma.generalContractor.findMany({
        orderBy: { name: 'asc' },
      });
    },
    DEFAULT_RETRY_CONFIG,
    'getGeneralContractors'
  );
}

export async function getGeneralContractorById(id: string) {
  return withRetry(
    async () => {
      return await prisma.generalContractor.findUnique({
        where: { id },
      });
    },
    DEFAULT_RETRY_CONFIG,
    'getGeneralContractorById'
  );
}

export async function createGeneralContractor(
  data: GeneralContractorCreateInput
) {
  return withRetry(
    async () => {
      return await prisma.generalContractor.create({
        data,
      });
    },
    DEFAULT_RETRY_CONFIG,
    'createGeneralContractor'
  );
}

export async function updateGeneralContractor(
  id: string,
  data: GeneralContractorUpdateInput
) {
  return withRetry(
    async () => {
      return await prisma.generalContractor.update({
        where: { id },
        data,
      });
    },
    DEFAULT_RETRY_CONFIG,
    'updateGeneralContractor'
  );
}

export async function deleteGeneralContractor(id: string) {
  return withRetry(
    async () => {
      return await prisma.generalContractor.delete({
        where: { id },
      });
    },
    DEFAULT_RETRY_CONFIG,
    'deleteGeneralContractor'
  );
}

export async function getProposalItems(proposalId: string) {
  return withRetry(
    async () => {
      return await prisma.proposalItem.findMany({
        where: { proposalId },
        orderBy: { createdAt: 'asc' },
      });
    },
    DEFAULT_RETRY_CONFIG,
    'getProposalItems'
  );
}

export async function createProposalItem(data: ProposalItemCreateInput) {
  return withRetry(
    async () => {
      return await prisma.proposalItem.create({
        data,
      });
    },
    DEFAULT_RETRY_CONFIG,
    'createProposalItem'
  );
}

export async function updateProposalItem(
  id: string,
  data: ProposalItemUpdateInput
) {
  return withRetry(
    async () => {
      return await prisma.proposalItem.update({
        where: { id },
        data,
      });
    },
    DEFAULT_RETRY_CONFIG,
    'updateProposalItem'
  );
}

export async function deleteProposalItem(id: string) {
  return withRetry(
    async () => {
      return await prisma.proposalItem.delete({
        where: { id },
      });
    },
    DEFAULT_RETRY_CONFIG,
    'deleteProposalItem'
  );
}

// Type for creating proposal items without the proposal relationship
type ProposalItemCreateWithoutProposalInput = Omit<
  ProposalItemCreateInput,
  'proposal'
>;

// Bulk operations with transaction support
export async function createProposalWithItems(
  proposalData: Omit<ProposalCreateInput, 'user'>,
  items: ProposalItemCreateWithoutProposalInput[],
  userId: string
) {
  return withTransaction(async tx => {
    // Create proposal
    const proposal = await tx.proposal.create({
      data: {
        ...proposalData,
        user: {
          connect: { id: userId },
        },
      },
      include: {
        generalContractor: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create items if provided
    if (items && items.length > 0) {
      await tx.proposalItem.createMany({
        data: items.map(item => ({
          ...item,
          proposalId: proposal.id,
        })),
      });

      // Fetch the complete proposal with items
      return await tx.proposal.findUnique({
        where: { id: proposal.id },
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

    return proposal;
  }, 'createProposalWithItems');
}

// Graceful shutdown handler
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('Database connection closed gracefully');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

// Handle process termination
process.on('SIGINT', disconnectDatabase);
process.on('SIGTERM', disconnectDatabase);
