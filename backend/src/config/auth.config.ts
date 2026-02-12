import 'dotenv/config'

export const authConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // Password requirements
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
  },
  
  // API Key configuration
  apiKey: {
    prefix: 'ak_',
    length: 32, // Total length including prefix
    defaultName: 'Default API Key',
  },
  
  // OAuth configuration (future)
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
  },
} as const