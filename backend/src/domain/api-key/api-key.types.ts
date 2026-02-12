// Domain types for API key management

export interface ApiKey {
  id: number
  userId: number
  name: string
  keyPrefix: string // First 8 chars for display (e.g., "ak_12345...")
  isActive: boolean
  usageLimit?: number // API call limit (5 calls)
  usageCount: number
  tokenLimit: number // Total token limit per API key (10,000)
  tokenUsed: number  // Total tokens used
  // Rate limits for Try API flow
  requestsPerSecond: number
  tokensPerMonth: bigint
  tokensUsedThisMonth: bigint
  monthResetDate: Date
  expiresAt?: Date
  lastUsedAt?: Date
  createdAt: Date
  updatedAt: Date
  user?: {
    isVerified: boolean
    hasPaid?: boolean
  }
}

export interface CreateApiKeyInput {
  userId: number
  name: string
  usageLimit?: number
  expiresAt?: Date
}

export interface UpdateApiKeyInput {
  name?: string
  isActive?: boolean
  usageLimit?: number
  expiresAt?: Date
}

export interface ApiKeyWithSecret extends ApiKey {
  secretKey: string // Full key, only returned on creation
}

export interface ApiKeyUsage {
  id: number
  userId: number
  apiKeyId: number
  endpoint: string
  method: string
  tokensUsed: number
  latencyMs?: number
  inputSize?: number
  outputSize?: number
  success: boolean
  errorCode?: string
  timestamp: Date
}

export interface CreateUsageInput {
  userId: number
  apiKeyId: number
  endpoint: string
  method: string
  tokensUsed?: number
  latencyMs?: number
  inputSize?: number
  outputSize?: number
  success: boolean
  errorCode?: string
}