import 'dotenv/config'

export const freemiumConfig = {
  // Free tier settings
  freeTier: {
    // Initial free tokens for new users (100 million tokens)
    initialTokens: parseInt(process.env.FREE_TIER_INITIAL_TOKENS || '100000000', 10),
  },
  
  // Token limits
  limits: {
    // Maximum tokens per API call (same as before)
    tokensPerCall: parseInt(process.env.API_KEY_TOKEN_LIMIT_PER_CALL || '10', 10),
  },
  
  // Pricing: $0.01 = 1M tokens (100M tokens per $1)
  pricing: {
    // Tokens per dollar (100000000 = 100M tokens per $1, so $0.01 = 1M tokens)
    tokensPerDollar: parseInt(process.env.TOKENS_PER_DOLLAR || '100000000', 10),
    
    // Purchase increments in cents (1 cent increments - no restrictions)
    purchaseIncrementCents: parseInt(process.env.PURCHASE_INCREMENT_CENTS || '1', 10), // $0.01 increments
    minPurchaseCents: parseInt(process.env.MIN_PURCHASE_CENTS || '500', 10), // $5.00 minimum
  },
} as const

// Validation
if (freemiumConfig.freeTier.initialTokens <= 0) {
  throw new Error('FREE_TIER_INITIAL_TOKENS must be a positive number')
}

if (freemiumConfig.limits.tokensPerCall <= 0) {
  throw new Error('API_KEY_TOKEN_LIMIT_PER_CALL must be a positive number')
}

if (freemiumConfig.pricing.tokensPerDollar <= 0) {
  throw new Error('TOKENS_PER_DOLLAR must be a positive number')
}

