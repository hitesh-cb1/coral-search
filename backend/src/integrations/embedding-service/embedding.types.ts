// Types for embedding service integration

export interface EmbedRequest {
  text: string
  output_data_type?: 'float32' | 'int8' | 'uint8' | 'binary' | 'ubinary'
  downstream_task?: 'query' | 'product'
}

export interface EmbedResponse {
  embeddings: number[][]
  model: string
  usage: {
    tokens: number
    latency_ms: number
  }
}

export interface CountTokensRequest {
  text: string
}

export interface CountTokensResponse {
  tokens: number
  text: string
}

export interface EmbedCommerceRequest {
  product_offering: {
    title?: string
    description?: string
    price?: number | string
    category?: string
    brand?: string
    color?: string
    attributes?: Record<string, any>
    identifiers?: Record<string, any>
    bullets?: string[] | string
  }
  output_data_type?: 'float32' | 'int8' | 'uint8' | 'binary' | 'ubinary'
  downstream_task?: 'query' | 'product'
}

export interface EmbedCommerceResponse {
  embeddings: number[][]
  model: string
  usage: {
    tokens: number
    latency_ms: number
  }
}

// Client's coral embedding service types
export interface CoralEmbedRequest {
  model: string
  input: string[]
  extra_body: {
    task: 'query' | 'product'
  }
}

export interface CoralEmbedResponse {
  embeddings: string[] // Base64 encoded embeddings
  count: number
  dimension: number
  model_name: string
  input_tokens: number
}

// Coral API response format (OpenAI-compatible)
export interface CoralApiResponse {
  object: 'list'
  data: Array<{
    object: 'embedding'
    embedding: number[]
    index: number
  }>
  model: string
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

// Client's input models (matching their Pydantic models)
export interface QueryInput {
  query: string
}

export interface ProductInput {
  title?: string
  category?: string
  brand?: string
  color?: string
  attributes?: Record<string, any>
  identifiers?: Record<string, any>
  bullets?: string[]
  description?: string
  price?: string
}