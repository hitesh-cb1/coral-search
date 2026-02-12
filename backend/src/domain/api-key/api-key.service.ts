import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { IApiKeyRepository } from './api-key.repository.interface'
import { IUsageRepository } from './usage.repository.interface'
import { 
  ApiKey, 
  CreateApiKeyInput, 
  UpdateApiKeyInput, 
  ApiKeyWithSecret,
  CreateUsageInput,
  ApiKeyUsage
} from './api-key.types'
import { authConfig } from '../../config/auth.config'
import { apiKeyConfig } from '../../config/api-key.config'
import { freemiumConfig } from '../../config/freemium.config'
import { ValidationError, NotFoundError } from '../../shared/errors/app-error'
import { encryptApiKey, decryptApiKey } from '../../shared/crypto/encryption'

export class ApiKeyService {
  constructor(
    private readonly apiKeyRepository: IApiKeyRepository,
    private readonly usageRepository: IUsageRepository
  ) {}

  async createApiKey(input: CreateApiKeyInput): Promise<ApiKeyWithSecret> {
    // Validate input
    if (!input.name.trim()) {
      throw new ValidationError('API key name is required')
    }
    
    // Generate secure API key
    const secretKey = this.generateSecretKey()
    // Use bcrypt for hash validation (more secure than simple hash)
    const keyHash = await this.hashKey(secretKey)
    const keyPrefix = secretKey.substring(0, 8)
    
    // Encrypt the full key for storage
    const encryptedKey = encryptApiKey(secretKey)
    
    // No token limits at API key level - account-level limits apply
    const inputWithLimits = {
      ...input,
      usageLimit: apiKeyConfig.defaults.usageLimit || undefined,  // No API call limit (just tracking)
    }
    
    // Create API key with encrypted key
    const apiKey = await this.apiKeyRepository.create(inputWithLimits, keyHash, keyPrefix, encryptedKey)
    
    return {
      ...apiKey,
      secretKey, // Only returned on creation
    }
  }

  async getApiKeysByUser(userId: number): Promise<ApiKey[]> {
    return this.apiKeyRepository.findByUserId(userId)
  }

  async validateApiKey(key: string): Promise<ApiKey> {
    if (!key.startsWith(authConfig.apiKey.prefix)) {
      throw new ValidationError('Invalid API key format')
    }
    
    // Find API key by comparing hashes
    const apiKey = await this.findApiKeyBySecret(key)
    
    if (!apiKey) {
      throw new ValidationError('Invalid API key')
    }
    
    if (!apiKey.isActive) {
      throw new ValidationError('API key is deactivated')
    }
    
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new ValidationError('API key has expired')
    }
    
    // Token limits are now account-level, not API key level
    // Account balance validation happens in the embedding controller
    
    // Update last used timestamp
    await this.apiKeyRepository.updateLastUsed(apiKey.id)
    
    return apiKey
  }

  async regenerateApiKey(id: number): Promise<ApiKeyWithSecret> {
    // Get existing API key
    const existingKey = await this.apiKeyRepository.findById(id)
    if (!existingKey) {
      throw new NotFoundError('API key not found')
    }
    
    // Generate new secret key
    const secretKey = this.generateSecretKey()
    const keyHash = await this.hashKey(secretKey)
    const keyPrefix = secretKey.substring(0, 8)
    
    // Encrypt the new key
    const encryptedKey = encryptApiKey(secretKey)
    
    // Update the key data (hash, prefix, and encrypted key)
    await this.apiKeyRepository.updateKeyData(id, keyHash, keyPrefix, encryptedKey)
    
    // Get the updated key
    const updatedKey = await this.apiKeyRepository.findById(id)
    
    // Return the updated key with the new secret
    return {
      ...updatedKey!,
      secretKey, // Return new full key
    }
  }

  /**
   * Get the full API key by ID (decrypts from database)
   * Only use this when user is authenticated and requesting their own key
   */
  async getApiKeySecret(id: number, userId: number): Promise<string | null> {
    // Verify the key belongs to the user
    const apiKey = await this.apiKeyRepository.findById(id)
    if (!apiKey || apiKey.userId !== userId) {
      return null
    }
    
    // Get encrypted key from database
    const encryptedKey = await this.apiKeyRepository.getEncryptedKey(id)
    if (!encryptedKey) {
      return null
    }
    
    // Decrypt and return
    try {
      return decryptApiKey(encryptedKey)
    } catch (error) {
      console.error('Failed to decrypt API key:', error)
      return null
    }
  }

  async updateApiKey(id: number, input: UpdateApiKeyInput): Promise<ApiKey> {
    return this.apiKeyRepository.update(id, input)
  }

  async deleteApiKey(id: number): Promise<void> {
    const existingKey = await this.apiKeyRepository.findById(id)
    if (!existingKey) {
      throw new NotFoundError('API key not found')
    }
    
    await this.apiKeyRepository.delete(id)
  }

  async logUsage(input: CreateUsageInput): Promise<ApiKeyUsage> {
    // Increment usage count in PostgreSQL (for quick analytics)
    await this.apiKeyRepository.incrementUsage(input.apiKeyId)
    
    // Log detailed usage to DynamoDB (for scalable analytics and history)
    return this.usageRepository.createUsage(input)
  }

  /**
   * Update rate limits for all API keys belonging to a user
   * This keeps database columns accurate for display purposes
   * Note: Actual rate limiting uses config-based limits, not these columns
   */
  async updateRateLimitsForUser(userId: number, requestsPerSecond: number, tokensPerMonth: bigint): Promise<void> {
    await this.apiKeyRepository.updateRateLimitsForUser(userId, requestsPerSecond, tokensPerMonth)
  }

  async validateTokenUsage(requestedTokens: number): Promise<void> {
    // Check per-request token limit (from centralized config)
    if (requestedTokens > freemiumConfig.limits.tokensPerCall) {
      throw new ValidationError(`Request exceeds maximum token limit of ${freemiumConfig.limits.tokensPerCall} tokens per call`)
    }
  }

  async getUsageHistory(userId: number, limit = 100, startDate?: Date, endDate?: Date): Promise<ApiKeyUsage[]> {
    return this.usageRepository.findUsageByUser(userId, limit, startDate, endDate)
  }

  async getUsageStats(userId: number, startDate?: Date, endDate?: Date) {
    return this.usageRepository.getUsageStats(userId, startDate, endDate)
  }

  async getDailyUsage(userId: number, startDate?: Date, endDate?: Date) {
    return this.usageRepository.getDailyUsage(userId, startDate, endDate)
  }

  async getUsageHistoryByApiKey(userId: number, apiKeyId: number, limit = 100, startDate?: Date, endDate?: Date): Promise<ApiKeyUsage[]> {
    return this.usageRepository.findUsageByApiKey(userId, apiKeyId, limit, startDate, endDate)
  }

  private generateSecretKey(): string {
    // Generate a secure random key
    const randomBytes = crypto.randomBytes(24) // 24 bytes = 32 chars in base64
    const randomString = randomBytes.toString('base64')
      .replace(/[+/=]/g, '') // Remove special chars
      .substring(0, authConfig.apiKey.length - authConfig.apiKey.prefix.length)
    
    return authConfig.apiKey.prefix + randomString
  }

  private async findApiKeyBySecret(secretKey: string): Promise<ApiKey | null> {
    // Get the prefix to narrow down search
    const keyPrefix = secretKey.substring(0, 8)
    
    // Find all keys with this prefix
    const keysWithPrefix = await this.apiKeyRepository.findByKeyPrefix(keyPrefix)
    
    // Verify hash for each key
    for (const key of keysWithPrefix) {
      // Get the stored hash for this key
      const storedHash = await this.apiKeyRepository.getKeyHash(key.id)
      if (!storedHash) continue
      
      // Verify the hash matches using bcrypt
      const isValid = await this.verifyKeyHash(secretKey, storedHash)
      if (isValid) {
        return key
      }
    }
    
    return null
  }

  private async hashKey(key: string): Promise<string> {
    // Use bcrypt for secure hashing (similar to password hashing)
    const saltRounds = 10
    return bcrypt.hash(key, saltRounds)
  }

  private async verifyKeyHash(key: string, hash: string): Promise<boolean> {
    return bcrypt.compare(key, hash)
  }
}