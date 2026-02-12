import { Router } from 'express'
import { marketplaceV1Routes } from './v1/routes'

// AWS Marketplace routes with versioning
export const marketplaceRoutes = Router()

// Mount versioned routes
marketplaceRoutes.use('/v1', marketplaceV1Routes)

// Health check for marketplace API
marketplaceRoutes.get('/health', (_req, res) => {
  res.json({
    service: 'CoralBricks Marketplace API',
    status: 'healthy',
    version: 'v1',
    timestamp: new Date().toISOString(),
  })
})

// Future versions:
// marketplaceRoutes.use('/v2', marketplaceV2Routes)
