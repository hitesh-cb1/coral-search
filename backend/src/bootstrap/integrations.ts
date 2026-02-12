import { ShopifyClient } from '../integrations/shopify/shopify.client'
import { EmbeddingClient } from '../integrations/embedding-service/embedding.client'

let shopifyClientInstance: ShopifyClient | null = null
let embeddingClientInstance: EmbeddingClient | null = null

export function getShopifyClient(): ShopifyClient {
  if (!shopifyClientInstance) {
    shopifyClientInstance = new ShopifyClient()
  }
  return shopifyClientInstance
}

export function getEmbeddingClient(): EmbeddingClient {
  if (!embeddingClientInstance) {
    embeddingClientInstance = new EmbeddingClient()
  }
  return embeddingClientInstance
}

export function resetIntegrations(): void {
  shopifyClientInstance = null
  embeddingClientInstance = null
}
