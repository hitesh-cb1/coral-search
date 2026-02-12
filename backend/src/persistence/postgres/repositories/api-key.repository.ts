import { getPrismaClient } from '../client'
import { IApiKeyRepository } from '../../../domain/api-key/api-key.repository.interface'
import {
  ApiKey,
  CreateApiKeyInput,
  UpdateApiKeyInput,
  ApiKeyUsage,
  CreateUsageInput
} from '../../../domain/api-key/api-key.types'
import { ApiKeyMapper } from '../mappers/api-key.mapper'
import { apiKeyConfig } from '../../../config/api-key.config'
import { getRateLimitsForUser, rateLimitConfig } from '../../../config/rate-limit.config'

export class PostgresApiKeyRepository implements IApiKeyRepository {
  private prisma = getPrismaClient()

  async create(input: CreateApiKeyInput, keyHash: string, keyPrefix: string, encryptedKey?: string): Promise<ApiKey> {
    // Calculate month reset date (first day of next month)
    const now = new Date()
    const monthResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // Use the user's current tier (unverified / verified / paid) so new keys get the same limits as existing ones
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: { isVerified: true, emailVerified: true }
    })
    const isVerified = user ? (user.isVerified || user.emailVerified) : false
    const paidTxCount = await this.prisma.creditTransaction.count({
      where: {
        userId: input.userId,
        type: 'purchase',
        paymentStatus: 'completed'
      }
    })
    const hasPaid = paidTxCount > 0
    const limits = getRateLimitsForUser(isVerified, hasPaid)

    const prismaApiKey = await this.prisma.apiKey.create({
      data: {
        userId: input.userId,
        name: input.name,
        keyHash,
        keyPrefix,
        encryptedKey: encryptedKey || null,
        // Rate limits: stored in DB (single source of truth)
        // Initial values from config, can be overridden by admin or status changes
        requestsPerSecond: limits.requestsPerSecond,
        tokensPerMonth: limits.tokensPerMonth,
        tokensUsedThisMonth: 0,
        monthResetDate,
        // usageLimit is not stored in database - account-level limits apply
        expiresAt: input.expiresAt,
      },
    })

    return ApiKeyMapper.toDomain(prismaApiKey)
  }

  async findById(id: number): Promise<ApiKey | null> {
    const prismaApiKey = await this.prisma.apiKey.findUnique({
      where: { id },
    })

    return prismaApiKey ? ApiKeyMapper.toDomain(prismaApiKey) : null
  }

  async findByKeyHash(keyHash: string): Promise<ApiKey | null> {
    const prismaApiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
    })

    return prismaApiKey ? ApiKeyMapper.toDomain(prismaApiKey) : null
  }

  async findByKeyPrefix(keyPrefix: string): Promise<ApiKey[]> {
    const prismaApiKeys = await this.prisma.apiKey.findMany({
      where: { keyPrefix },
      include: {
        user: {
          select: {
            isVerified: true,
            emailVerified: true // Also get emailVerified as fallback
          }
        }
      }
    })

    // Check for payment history and get fresh verification status for each user
    const keysWithUserStatus = await Promise.all(prismaApiKeys.map(async (key) => {
      let hasPaid = false
      let isVerified = false

      if (key.user) {
        // Use isVerified from relation, or fallback to emailVerified
        isVerified = key.user.isVerified || key.user.emailVerified || false

        // Check if user has any completed purchase transactions
        const paidTxCount = await this.prisma.creditTransaction.count({
          where: {
            userId: key.userId,
            type: 'purchase',
            paymentStatus: 'completed'
          }
        })
        hasPaid = paidTxCount > 0
      } else {
        // Fallback: fetch user directly if relation is missing
        const user = await this.prisma.user.findUnique({
          where: { id: key.userId },
          select: { isVerified: true, emailVerified: true }
        })
        if (user) {
          isVerified = user.isVerified || user.emailVerified || false
        }
      }

      return {
        ...ApiKeyMapper.toDomain(key),
        user: {
          isVerified,
          hasPaid
        }
      }
    }))

    return keysWithUserStatus
  }

  async findByUserId(userId: number): Promise<ApiKey[]> {
    const prismaApiKeys = await this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return prismaApiKeys.map(ApiKeyMapper.toDomain)
  }

  async update(id: number, input: UpdateApiKeyInput): Promise<ApiKey> {
    const prismaApiKey = await this.prisma.apiKey.update({
      where: { id },
      data: {
        name: input.name,
        isActive: input.isActive,
        // usageLimit is not stored in database - account-level limits apply
        expiresAt: input.expiresAt,
      },
    })

    return ApiKeyMapper.toDomain(prismaApiKey)
  }

  async updateKeyData(id: number, keyHash: string, keyPrefix: string, encryptedKey?: string): Promise<void> {
    await this.prisma.apiKey.update({
      where: { id },
      data: {
        keyHash,
        keyPrefix,
        encryptedKey: encryptedKey !== undefined ? encryptedKey : undefined,
      },
    })
  }

  async getEncryptedKey(id: number): Promise<string | null> {
    const prismaApiKey = await this.prisma.apiKey.findUnique({
      where: { id },
      select: { encryptedKey: true },
    })
    return prismaApiKey?.encryptedKey || null
  }

  async getKeyHash(id: number): Promise<string | null> {
    const prismaApiKey = await this.prisma.apiKey.findUnique({
      where: { id },
      select: { keyHash: true },
    })
    return prismaApiKey?.keyHash || null
  }

  async delete(id: number): Promise<void> {
    await this.prisma.apiKey.delete({
      where: { id },
    })
  }

  async incrementUsage(id: number): Promise<void> {
    await this.prisma.apiKey.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    })
  }

  async updateLastUsed(id: number): Promise<void> {
    await this.prisma.apiKey.update({
      where: { id },
      data: {
        lastUsedAt: new Date(),
      },
    })
  }

  async updateRateLimitsForUser(userId: number, requestsPerSecond: number, tokensPerMonth: bigint): Promise<void> {
    // Update rate limits for all API keys belonging to this user
    // Database is the single source of truth - rate limiting middleware reads from here
    // Called when: user status changes (verified/paid) or admin override
    await this.prisma.apiKey.updateMany({
      where: { userId },
      data: {
        requestsPerSecond,
        tokensPerMonth,
      },
    })
  }

  // Usage logging methods removed - now handled by DynamoDB via IUsageRepository
}