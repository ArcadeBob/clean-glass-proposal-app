/**
 * Environment Configuration Guide
 * 
 * This file provides guidance and helper functions for setting up
 * environment variables across different deployment environments.
 */

import { env, isProduction, isStaging, getBaseUrl } from './env'

/**
 * Environment-specific database configurations
 */
export const getDatabaseConfig = () => {
  if (isProduction) {
    return {
      url: env.DATABASE_URL,
      directUrl: env.DIRECT_URL,
      // Production-specific Prisma settings
      connection: {
        maxWait: 10000, // 10 seconds
        timeout: 60000, // 60 seconds
        maxConnections: 10,
      }
    }
  }

  if (isStaging) {
    return {
      url: env.DATABASE_URL,
      directUrl: env.DIRECT_URL,
      connection: {
        maxWait: 5000,
        timeout: 30000,
        maxConnections: 5,
      }
    }
  }

  // Development
  return {
    url: env.DATABASE_URL,
    directUrl: env.DIRECT_URL,
    connection: {
      maxWait: 2000,
      timeout: 10000,
      maxConnections: 3,
    }
  }
}

/**
 * Authentication configuration based on environment
 */
export const getAuthConfig = () => {
  return {
    secret: env.NEXTAUTH_SECRET,
    url: getBaseUrl(),
    providers: {
      // Google OAuth removed for now - can be added back later
      credentials: true,
    },
    // Session configuration
    session: {
      maxAge: isProduction ? 7 * 24 * 60 * 60 : 24 * 60 * 60, // 7 days prod, 1 day dev
      updateAge: isProduction ? 24 * 60 * 60 : 60 * 60, // 1 day prod, 1 hour dev
    }
  }
}

/**
 * Email configuration (when implemented)
 */
export const getEmailConfig = () => {
  if (!env.EMAIL_FROM || !env.SMTP_HOST) {
    return null // Email not configured
  }

  return {
    from: env.EMAIL_FROM,
    transport: {
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT || '587'),
      secure: env.SMTP_PORT === '465',
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      }
    }
  }
}

/**
 * File storage configuration (when implemented)
 */
export const getStorageConfig = () => {
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY || !env.AWS_S3_BUCKET) {
    return null // AWS S3 not configured
  }

  return {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION || 'us-east-1',
    bucket: env.AWS_S3_BUCKET,
  }
}

/**
 * Deployment Environment Setup Guide
 */
export const DEPLOYMENT_GUIDE = {
  development: {
    description: 'Local development environment',
    envFile: '.env.local in clean-glass-proposal directory',
    required: [
      'DATABASE_URL',
      'DIRECT_URL', 
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ],
    notes: [
      'Use local PostgreSQL or development cloud database',
      'Generate NEXTAUTH_SECRET with: openssl rand -base64 32',
      'Set NEXTAUTH_URL to http://localhost:3000',
      'Google OAuth removed for now - credentials auth only'
    ]
  },

  staging: {
    description: 'Staging environment for testing',
    envFile: 'Configure in deployment platform (Vercel, Railway, etc.)',
    required: [
      'DATABASE_URL',
      'DIRECT_URL',
      'NEXTAUTH_SECRET', 
      'NEXTAUTH_URL',
      'NODE_ENV=staging'
    ],
    notes: [
      'Use staging database instance',
      'Use production-strength NEXTAUTH_SECRET',
      'Set NEXTAUTH_URL to staging domain',
      'Google OAuth removed for now - credentials auth only'
    ]
  },

  production: {
    description: 'Production environment',
    envFile: 'Configure in deployment platform (Vercel, Railway, etc.)',
    required: [
      'DATABASE_URL',
      'DIRECT_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'NODE_ENV=production'
    ],
    optional: [
      'VERCEL_ANALYTICS_ID',
      'SENTRY_DSN',
      'EMAIL_FROM',
      'SMTP_HOST',
      'AWS_S3_BUCKET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET'
    ],
    notes: [
      'Use production database with connection pooling',
      'Use strong NEXTAUTH_SECRET (never reuse from other environments)',
      'Set NEXTAUTH_URL to production domain', 
      'Google OAuth removed for now - can be added back to optional if needed',
      'Set up monitoring and analytics',
      'Configure email service for notifications',
      'Set up file storage for PDF generation'
    ]
  }
} as const

/**
 * Environment validation status
 */
export const getEnvironmentStatus = () => {
  const emailConfigured = getEmailConfig() !== null
  const storageConfigured = getStorageConfig() !== null
  
  return {
    environment: env.NODE_ENV,
    baseUrl: getBaseUrl(),
    database: 'configured',
    authentication: 'configured (credentials only)',
    googleOAuth: 'removed (can be added back later)',
    email: emailConfigured ? 'configured' : 'not configured',
    storage: storageConfigured ? 'configured' : 'not configured',
    analytics: env.VERCEL_ANALYTICS_ID ? 'configured' : 'not configured',
    monitoring: env.SENTRY_DSN ? 'configured' : 'not configured',
  }
} 