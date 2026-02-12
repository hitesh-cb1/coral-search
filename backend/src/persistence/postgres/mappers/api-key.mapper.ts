import { ApiKey as PrismaApiKey, ApiUsage as PrismaApiUsage } from '../../../../prisma/generated/client'
import { ApiKey, ApiKeyUsage } from '../../../domain/api-key/api-key.types'
import { apiKeyConfig } from '../../../config/api-key.config'

export class ApiKeyMapper {
  static toDomain(prismaApiKey: PrismaApiKey): ApiKey {
    return {
      id: prismaApiKey.id,
      userId: prismaApiKey.userId,
      name: prismaApiKey.name,
      keyPrefix: prismaApiKey.keyPrefix,
      isActive: prismaApiKey.isActive,
      usageLimit: undefined, // Not stored in database - account-level limits apply
      usageCount: prismaApiKey.usageCount,
      // Token limits are now account-level, not API key level
      // Keep defaults for backward compatibility during migration
      tokenLimit: 0,
      tokenUsed: 0,
      // Rate limits for Try API flow
      requestsPerSecond: prismaApiKey.requestsPerSecond,
      tokensPerMonth: prismaApiKey.tokensPerMonth,
      tokensUsedThisMonth: prismaApiKey.tokensUsedThisMonth,
      monthResetDate: prismaApiKey.monthResetDate,
      expiresAt: prismaApiKey.expiresAt || undefined,
      lastUsedAt: prismaApiKey.lastUsedAt || undefined,
      createdAt: prismaApiKey.createdAt,
      updatedAt: prismaApiKey.updatedAt,
    }
  }

  static usageToDomain(prismaUsage: PrismaApiUsage): ApiKeyUsage {
    return {
      id: prismaUsage.id,
      userId: prismaUsage.userId,
      apiKeyId: prismaUsage.apiKeyId,
      endpoint: prismaUsage.endpoint,
      method: prismaUsage.method,
      tokensUsed: prismaUsage.tokensUsed,
      latencyMs: prismaUsage.latencyMs || undefined,
      inputSize: prismaUsage.inputSize || undefined,
      outputSize: prismaUsage.outputSize || undefined,
      success: prismaUsage.success,
      errorCode: prismaUsage.errorCode || undefined,
      timestamp: prismaUsage.timestamp,
    }
  }
}