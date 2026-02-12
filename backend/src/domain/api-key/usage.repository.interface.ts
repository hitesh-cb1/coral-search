import { ApiKeyUsage, CreateUsageInput } from './api-key.types'

export interface IUsageRepository {
  // Usage logging
  createUsage(input: CreateUsageInput): Promise<ApiKeyUsage>
  findUsageByApiKey(userId: number, apiKeyId: number, limit?: number, startDate?: Date, endDate?: Date): Promise<ApiKeyUsage[]>
  findUsageByUser(userId: number, limit?: number, startDate?: Date, endDate?: Date): Promise<ApiKeyUsage[]>
  
  // Analytics
  getUsageStats(userId: number, startDate?: Date, endDate?: Date): Promise<{
    totalRequests: number
    totalTokens: number
    successRate: number
    avgLatency: number
  }>
  getDailyUsage(userId: number, startDate?: Date, endDate?: Date): Promise<Array<{
    date: string // YYYY-MM-DD format
    tokens: number
    requests: number
  }>>
}

