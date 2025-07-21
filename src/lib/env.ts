import { z } from 'zod'

// Environment validation schema
const envSchema = z.object({
  // Database Configuration
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required"),

  // NextAuth Configuration  
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  NEXTAUTH_URL: z.string().min(1, "NEXTAUTH_URL is required"),

  // OAuth Providers (removed for now - can be added back later)
  // GOOGLE_CLIENT_ID: z.string().optional(),
  // GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Application Configuration
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  
  // Optional: Future integrations
  EMAIL_FROM: z.string().email().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  
  // Analytics & Monitoring (optional)
  VERCEL_ANALYTICS_ID: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  
  // Storage (optional for future file uploads)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
})

// Parse and validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((issue: z.ZodIssue) => 
        `${issue.path.join('.')}: ${issue.message}`
      )
      
      // During build time, be more lenient
      if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
        console.warn('⚠️ Environment variables not fully configured during build')
        console.warn('Missing variables:', missingVars.join(', '))
        // Return a partial env for build
        return {
          DATABASE_URL: process.env.DATABASE_URL || '',
          DIRECT_URL: process.env.DIRECT_URL || '',
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
          NEXTAUTH_URL: process.env.NEXTAUTH_URL || '',
          NODE_ENV: process.env.NODE_ENV || 'production'
        }
      }
      
      throw new Error(
        `❌ Invalid environment variables:\n${missingVars.join('\n')}\n\nPlease check your .env.local file.`
      )
    }
    throw error
  }
}

// Export validated environment variables  
export const env = validateEnv()

// Helper function to check if we're in production
export const isProduction = env.NODE_ENV === 'production'
export const isDevelopment = env.NODE_ENV === 'development'
export const isStaging = env.NODE_ENV === 'staging'

// Helper to get the base URL for the current environment
export const getBaseUrl = () => {
  if (isProduction) {
    // Will be set by Vercel automatically or specified in production env
    return env.NEXTAUTH_URL
  }
  return env.NEXTAUTH_URL || 'http://localhost:3000'
} 