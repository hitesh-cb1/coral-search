import { Router } from 'express'

// Shopify webhook routes
export const shopifyWebhookRoutes = Router()

// Health check for Shopify webhooks
shopifyWebhookRoutes.get('/', (_req, res) => {
  res.json({
    service: 'Shopify Webhooks',
    status: 'ready',
  })
})
