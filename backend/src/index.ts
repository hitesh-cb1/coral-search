import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { config } from './config/index.js'
import { publicRoutes } from './api/public/routes'
import { internalRoutes } from './api/internal/routes'
import { marketplaceRoutes } from './api/marketplace/routes'
import { embeddingRoutes } from './api/embedding/routes'
import { shopifyWebhookRoutes } from './webhooks/shopify/routes'
import { requestLogger } from './api/middleware/request-logger'
import { errorHandler } from './api/middleware/error-handler'
import { logger } from './infrastructure/logging/logger'

const app = express()

// CORS middleware (allow requests from any origin)
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-get-latency', 'X-Debug'],
  exposedHeaders: ['X-latency-ms', 'X-Debug-Info']
}))

// Global middleware
app.use(express.json())
app.use(requestLogger)

// Health check / root route
app.get('/', (_req, res) => {
  res.json({
    service: 'CoralBricks Backend',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.env,
    endpoints: {
      // Legacy Shopify endpoints
      shopify: '/shopify/auth, /shopify/:shopDomain/products, /shopify/:shopDomain/sync-status',
      
      // New Marketplace API endpoints
      marketplace: '/marketplace/v1',
      auth: '/marketplace/v1/auth/register, /marketplace/v1/auth/login, /marketplace/v1/auth/google',
      user: '/marketplace/v1/user/profile, /marketplace/v1/user/api-keys, /marketplace/v1/user/link-google',
      
      // Main Embedding API endpoints
      embedding: '/api/v1/embeddings',
      
      // Other endpoints
      webhooks: '/webhooks/shopify',
      internal: '/internal',
    },
  })
})

// Route mounting
app.use('/', publicRoutes)                    // Legacy Shopify routes
app.use('/internal', internalRoutes)          // Internal/admin routes
app.use('/marketplace', marketplaceRoutes)    // Marketplace user management
app.use('/api', embeddingRoutes)              // Main embedding APIs (legacy path)
app.use('/', embeddingRoutes)                 // OpenAI-style path: /v1/embeddings
app.use('/webhooks/shopify', shopifyWebhookRoutes) // Webhooks

// Error handling (must be last)
app.use(errorHandler)

// Use PORT from environment (required for AWS, Heroku, etc.)
const PORT = parseInt(process.env.PORT || '3000', 10)
const HOST = process.env.HOST || '0.0.0.0'

// Start server
const server = app.listen(PORT, HOST, () => {
  logger.info(`🚀 Server ready at: http://${HOST}:${PORT}`)
  logger.info(`⭐️ Environment: ${config.env}`)
  logger.info(`🔑 Marketplace API: http://${HOST}:${PORT}/marketplace/v1`)
  logger.info(`🤖 Embedding API: http://${HOST}:${PORT}/api/v1`)
  logger.info(`📚 See sample requests: https://github.com/prisma/prisma-examples/blob/latest/orm/express/README.md#using-the-rest-api`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})

export { app }
