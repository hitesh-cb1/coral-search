import { embeddingConfig } from '../../config/embedding.config'
import {
  EmbedRequest,
  EmbedResponse,
  CountTokensRequest,
  CountTokensResponse,
  EmbedCommerceRequest,
  EmbedCommerceResponse,
  ProductInput,
  CoralApiResponse,
} from './embedding.types'

export class EmbeddingClient {
  constructor() {
    // No initialization needed for coral (uses fetch) or mock services
  }

  async embed(request: EmbedRequest): Promise<EmbedResponse> {
    const startTime = Date.now()

    switch (embeddingConfig.service) {
      case 'coral':
        return this.coralEmbed(request, startTime)
      case 'mock':
      default:
        return this.mockEmbed(request, startTime)
    }
  }

  async countTokens(request: CountTokensRequest): Promise<CountTokensResponse> {
    switch (embeddingConfig.service) {
      case 'coral':
        return this.coralCountTokens(request)
      case 'mock':
      default:
        return this.mockCountTokens(request)
    }
  }

  async embedCommerce(request: EmbedCommerceRequest): Promise<EmbedCommerceResponse> {
    const startTime = Date.now()

    switch (embeddingConfig.service) {
      case 'coral':
        return this.coralEmbedCommerce(request, startTime)
      case 'mock':
      default:
        return this.mockEmbedCommerce(request, startTime)
    }
  }

  // Client's coral embedding service methods
  private async coralEmbed(request: EmbedRequest, startTime: number): Promise<EmbedResponse> {
    if (!embeddingConfig.coral.url) {
      throw new Error('Coral embedding client not initialized - check CORAL_EMBEDDING_SERVICE_URL')
    }

    try {
      // Use the downstream_task or default to 'query'
      const task = request.downstream_task || 'query'

      // Make direct HTTP request
      const response = await fetch(`${embeddingConfig.coral.url}/v1/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${embeddingConfig.coral.apiKey || 'dummy-key'}`,
        },
        body: JSON.stringify({
          model: embeddingConfig.coral.model,
          input: [request.text],
          extra_body: { task }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json() as CoralApiResponse

      const latency = Date.now() - startTime

      // Handle standard OpenAI format
      const embeddings = data.data.map((item) => item.embedding)

      return {
        embeddings,
        model: data.model,
        usage: {
          tokens: data.usage.total_tokens,
          latency_ms: latency,
        },
      }
    } catch (error) {
      throw new Error(`Coral embedding failed: ${(error as Error).message}`)
    }
  }

  private async coralEmbedCommerce(request: EmbedCommerceRequest, startTime: number): Promise<EmbedCommerceResponse> {
    if (!embeddingConfig.coral.url) {
      throw new Error('Coral embedding client not initialized')
    }

    try {
      const productInput: ProductInput = {
        title: request.product_offering.title,
        category: request.product_offering.category,
        brand: request.product_offering.brand,
        color: request.product_offering.color,
        attributes: request.product_offering.attributes,
        identifiers: request.product_offering.identifiers,
        description: request.product_offering.description,
        price: request.product_offering.price?.toString(),
      }

      if (request.product_offering.bullets) {
        if (typeof request.product_offering.bullets === 'string') {
          productInput.bullets = request.product_offering.bullets.split('\n').filter(bullet => bullet.trim())
        } else {
          productInput.bullets = request.product_offering.bullets
        }
      }

      const productJson = JSON.stringify(productInput)

      // Use the downstream_task or default to 'product'
      const task = request.downstream_task || 'product'

      const response = await fetch(`${embeddingConfig.coral.url}/v1/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${embeddingConfig.coral.apiKey || 'dummy-key'}`,
        },
        body: JSON.stringify({
          model: embeddingConfig.coral.model,
          input: [productJson],
          extra_body: { task }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json() as CoralApiResponse

      const latency = Date.now() - startTime

      // Handle standard OpenAI format
      const embeddings = data.data.map((item) => item.embedding)

      return {
        embeddings,
        model: data.model,
        usage: {
          tokens: data.usage.total_tokens,
          latency_ms: latency,
        },
      }
    } catch (error) {
      throw new Error(`Coral commerce embedding failed: ${(error as Error).message}`)
    }
  }

  private async coralCountTokens(request: CountTokensRequest): Promise<CountTokensResponse> {
    // For coral service, use approximation (could be enhanced with actual endpoint)
    const tokens = Math.ceil(request.text.length / 4)
    
    return {
      tokens,
      text: request.text,
    }
  }

  // Mock service methods (for development/testing without API calls)
  private async mockEmbed(request: EmbedRequest, startTime: number): Promise<EmbedResponse> {
    // Generate deterministic random embeddings based on text hash
    const hash = this.simpleHash(request.text)
    const embeddings = this.generateDeterministicVector(hash, embeddingConfig.mock.dimensions)
    
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))
    
    const latency = Date.now() - startTime
    const tokens = Math.ceil(request.text.length / 4)

    return {
      embeddings: [embeddings],
      model: 'coralbricks-mock',
      usage: {
        tokens,
        latency_ms: latency,
      },
    }
  }

  private async mockEmbedCommerce(request: EmbedCommerceRequest, startTime: number): Promise<EmbedCommerceResponse> {
    const productText = this.productToText(request.product_offering)
    
    const embedRequest: EmbedRequest = {
      text: productText,
      downstream_task: request.downstream_task,
      output_data_type: request.output_data_type
    }
    
    const result = await this.mockEmbed(embedRequest, startTime)
    
    return {
      ...result,
      model: 'coralbricks-commerce-mock'
    }
  }

  private async mockCountTokens(request: CountTokensRequest): Promise<CountTokensResponse> {
    const tokens = Math.ceil(request.text.length / 4)
    
    return {
      tokens,
      text: request.text,
    }
  }

  // Utility methods
  private productToText(product: EmbedCommerceRequest['product_offering']): string {
    let text = product.title || ''
    
    if (product.description) {
      text += ` ${product.description}`
    }
    
    if (product.brand) {
      text += ` ${product.brand}`
    }
    
    if (product.category) {
      text += ` ${product.category}`
    }
    
    if (product.price) {
      text += ` ${product.price}`
    }
    
    if (product.attributes) {
      const attrs = Object.entries(product.attributes)
        .map(([key, value]) => `${key}: ${value}`)
        .join(' ')
      text += ` ${attrs}`
    }
    
    return text.trim()
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  private generateDeterministicVector(seed: number, dimensions: number): number[] {
    const vector: number[] = []
    let rng = seed
    
    for (let i = 0; i < dimensions; i++) {
      rng = (rng * 1664525 + 1013904223) % Math.pow(2, 32)
      vector.push((rng / Math.pow(2, 32)) * 2 - 1)
    }
    
    return vector
  }
}