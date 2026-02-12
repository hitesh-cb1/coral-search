import { Router } from 'express'
import { getEmbeddingController } from '../../bootstrap/controllers'
import { apiKeyAuth } from '../middleware/api-key-auth'
import { rateLimit } from '../middleware/rate-limit'

const embeddingController = getEmbeddingController()

export const embeddingRoutes = Router()

// Direct embedding API routes (API key auth required)
// These are the main APIs that users will call
embeddingRoutes.post('/v1/embeddings', apiKeyAuth, rateLimit, embeddingController.embeddings)

// Health check
embeddingRoutes.get('/health', (_req, res) => {
  res.json({
    service: 'CoralBricks Embedding API',
    status: 'healthy',
    version: 'v1',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/v1/embeddings',
    ],
  })
})