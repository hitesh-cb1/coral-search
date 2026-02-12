import 'dotenv/config'

export const embeddingConfig = {
  // Service selection: 'coral' | 'mock'
  service: process.env.EMBEDDING_SERVICE || 'mock',
  
  // Client's coral embedding service (production)
  coral: {
    url: process.env.CORAL_EMBEDDING_SERVICE_URL,
    apiKey: process.env.CORAL_EMBEDDING_SERVICE_API_KEY,
    model: 'coral_embed',
    dimensions: 1536,
  },
  
  // Mock service (for development/testing without API calls)
  mock: {
    dimensions: 1536,
  },
} as const