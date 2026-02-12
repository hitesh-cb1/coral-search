import 'dotenv/config'

export const apiKeyConfig = {
  // Token limits
  limits: {
    // Maximum tokens per API key (total)
    totalTokensPerKey: parseInt(process.env.API_KEY_TOKEN_LIMIT_TOTAL || '10000', 10),
    
    // Maximum tokens per API call
    tokensPerCall: parseInt(process.env.API_KEY_TOKEN_LIMIT_PER_CALL || '10', 10),
  },
  
  // Key generation settings
  generation: {
    prefix: 'ak_',
    length: 32, // Total length including prefix
  },
  
  // Default settings for new API keys
  defaults: {
    isActive: true,
    usageLimit: null, // No API call limit (unlimited calls, just tracking)
  },
} as const

// Validation
if (apiKeyConfig.limits.totalTokensPerKey <= 0) {
  throw new Error('API_KEY_TOKEN_LIMIT_TOTAL must be a positive number')
}

if (apiKeyConfig.limits.tokensPerCall <= 0) {
  throw new Error('API_KEY_TOKEN_LIMIT_PER_CALL must be a positive number')
}

if (apiKeyConfig.limits.tokensPerCall > apiKeyConfig.limits.totalTokensPerKey) {
  throw new Error('API_KEY_TOKEN_LIMIT_PER_CALL cannot be greater than API_KEY_TOKEN_LIMIT_TOTAL')
}