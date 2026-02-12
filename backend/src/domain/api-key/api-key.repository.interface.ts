import { ApiKey, CreateApiKeyInput, UpdateApiKeyInput, ApiKeyUsage, CreateUsageInput } from './api-key.types'

export interface IApiKeyRepository {
  // API Key CRUD
  create(input: CreateApiKeyInput, keyHash: string, keyPrefix: string, encryptedKey?: string): Promise<ApiKey>
  findById(id: number): Promise<ApiKey | null>
  findByKeyHash(keyHash: string): Promise<ApiKey | null>
  findByKeyPrefix(keyPrefix: string): Promise<ApiKey[]>
  findByUserId(userId: number): Promise<ApiKey[]>
  update(id: number, input: UpdateApiKeyInput): Promise<ApiKey>
  updateKeyData(id: number, keyHash: string, keyPrefix: string, encryptedKey?: string): Promise<void>
  getEncryptedKey(id: number): Promise<string | null>
  getKeyHash(id: number): Promise<string | null>
  delete(id: number): Promise<void>
  
  // Usage tracking (PostgreSQL - for quick counters)
  incrementUsage(id: number): Promise<void>
  updateLastUsed(id: number): Promise<void>
  
  // Update rate limits for all API keys belonging to a user
  updateRateLimitsForUser(userId: number, requestsPerSecond: number, tokensPerMonth: bigint): Promise<void>
  
  // Note: Detailed usage logging is now handled by IUsageRepository (DynamoDB)
}