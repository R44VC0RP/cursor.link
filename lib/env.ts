// Environment variable validation
// This ensures all required environment variables are present at build/runtime

interface EnvVars {
  INBOUND_API_KEY: string
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  DATABASE_URL: string
  NEXT_PUBLIC_APP_URL?: string
}

// Validate required environment variables
export function validateEnv(): EnvVars {
  const missingVars: string[] = []
  
  const requiredVars = [
    'INBOUND_API_KEY',
    'GITHUB_CLIENT_ID', 
    'GITHUB_CLIENT_SECRET',
    'DATABASE_URL'
  ] as const
  
  for (const key of requiredVars) {
    if (!process.env[key] || process.env[key] === '') {
      missingVars.push(key)
    }
  }
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    )
  }
  
  return {
    INBOUND_API_KEY: process.env.INBOUND_API_KEY!,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID!,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET!,
    DATABASE_URL: process.env.DATABASE_URL!,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  }
}

// Export validated environment variables
export const env = validateEnv()
