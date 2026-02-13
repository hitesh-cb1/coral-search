/**
 * Reads usage data from the usage_events table (written by the client's inference server).
 * Table columns: request_id, api_key_prefix, account_id, task, billable_tokens, input_items, status, latency_ms, bucket_groups, created_at
 */
import { getPrismaClient } from '../client'
import { IApiKeyRepository } from '../../../domain/api-key/api-key.repository.interface'
import { IUsageRepository } from '../../../domain/api-key/usage.repository.interface'
import { ApiKeyUsage, CreateUsageInput } from '../../../domain/api-key/api-key.types'

interface UsageEventRow {
  request_id: string
  api_key_prefix: string
  account_id: string
  task: string
  billable_tokens: number
  input_items: number
  status: string
  latency_ms: number | null
  bucket_groups: number
  created_at: Date
}

export class PostgresUsageEventsRepository implements IUsageRepository {
  constructor(private readonly apiKeyRepository: IApiKeyRepository) {}

  private get prisma() {
    return getPrismaClient()
  }

  /**
   * No-op: usage is now written by the client's server (api.coralbricks.ai), not by this backend.
   */
  async createUsage(_input: CreateUsageInput): Promise<ApiKeyUsage> {
    return {
      id: 0,
      userId: _input.userId,
      apiKeyId: _input.apiKeyId,
      endpoint: _input.endpoint,
      method: _input.method,
      tokensUsed: _input.tokensUsed ?? 0,
      latencyMs: _input.latencyMs,
      inputSize: _input.inputSize,
      outputSize: _input.outputSize,
      success: _input.success,
      errorCode: _input.errorCode,
      timestamp: new Date(),
    }
  }

  private rowToUsage(row: UsageEventRow, apiKeyId: number): ApiKeyUsage {
    return {
      id: 0,
      userId: parseInt(row.account_id, 10),
      apiKeyId,
      endpoint: '/v1/embeddings',
      method: 'POST',
      tokensUsed: row.billable_tokens ?? 0,
      latencyMs: row.latency_ms != null ? Math.round(row.latency_ms) : undefined,
      inputSize: row.input_items ?? undefined,
      outputSize: undefined,
      success: row.status === 'completed',
      errorCode: row.status === 'completed' ? undefined : row.status,
      timestamp: new Date(row.created_at),
    }
  }

  async findUsageByUser(
    userId: number,
    limit = 100,
    startDate?: Date,
    endDate?: Date
  ): Promise<ApiKeyUsage[]> {
    const accountId = String(userId)
    const start = startDate ?? new Date(0)
    const end = endDate ?? new Date(8640000000000000)

    const rows = await this.prisma.$queryRaw<UsageEventRow[]>`
      SELECT request_id, api_key_prefix, account_id, task, billable_tokens, input_items, status, latency_ms, bucket_groups, created_at
      FROM usage_events
      WHERE account_id = ${accountId}
        AND created_at >= ${start}
        AND created_at <= ${end}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `

    const apiKeysByPrefix = new Map<string, number>()
    for (const row of rows) {
      if (apiKeysByPrefix.has(row.api_key_prefix)) continue
      const keys = await this.apiKeyRepository.findByKeyPrefix(row.api_key_prefix)
      const keyForUser = keys.find((k) => k.userId === userId)
      if (keyForUser) apiKeysByPrefix.set(row.api_key_prefix, keyForUser.id)
    }

    return rows.map((row) =>
      this.rowToUsage(row, apiKeysByPrefix.get(row.api_key_prefix) ?? 0)
    )
  }

  async findUsageByApiKey(
    userId: number,
    apiKeyId: number,
    limit = 100,
    startDate?: Date,
    endDate?: Date
  ): Promise<ApiKeyUsage[]> {
    const key = await this.apiKeyRepository.findById(apiKeyId)
    if (!key || key.userId !== userId) return []

    const accountId = String(userId)
    const prefix = key.keyPrefix
    const start = startDate ?? new Date(0)
    const end = endDate ?? new Date(8640000000000000)

    const rows = await this.prisma.$queryRaw<UsageEventRow[]>`
      SELECT request_id, api_key_prefix, account_id, task, billable_tokens, input_items, status, latency_ms, bucket_groups, created_at
      FROM usage_events
      WHERE account_id = ${accountId}
        AND api_key_prefix = ${prefix}
        AND created_at >= ${start}
        AND created_at <= ${end}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `

    return rows.map((row) => this.rowToUsage(row, apiKeyId))
  }

  async getUsageStats(
    userId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalRequests: number
    totalTokens: number
    successRate: number
    avgLatency: number
  }> {
    const accountId = String(userId)
    const start = startDate ?? new Date(0)
    const end = endDate ?? new Date(8640000000000000)

    const result = await this.prisma.$queryRaw<
      { total_requests: bigint; total_tokens: string; success_count: bigint; avg_latency: string | null }[]
    >`
      SELECT
        COUNT(*)::bigint AS total_requests,
        COALESCE(SUM(billable_tokens), 0)::text AS total_tokens,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::bigint AS success_count,
        AVG(latency_ms)::text AS avg_latency
      FROM usage_events
      WHERE account_id = ${accountId}
        AND created_at >= ${start}
        AND created_at <= ${end}
    `

    const row = result[0]
    if (!row) {
      return {
        totalRequests: 0,
        totalTokens: 0,
        successRate: 0,
        avgLatency: 0,
      }
    }

    const totalRequests = Number(row.total_requests)
    const totalTokens = parseInt(row.total_tokens, 10) || 0
    const successCount = Number(row.success_count)
    const successRate = totalRequests > 0 ? (successCount / totalRequests) * 100 : 0
    const avgLatency = row.avg_latency != null ? parseFloat(row.avg_latency) : 0

    return {
      totalRequests,
      totalTokens,
      successRate,
      avgLatency: Number.isFinite(avgLatency) ? avgLatency : 0,
    }
  }

  async getDailyUsage(
    userId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{ date: string; tokens: number; requests: number }>> {
    const accountId = String(userId)
    const start = startDate ?? new Date(0)
    const end = endDate ?? new Date(8640000000000000)

    const rows = await this.prisma.$queryRaw<
      { date: string; tokens: string; requests: bigint }[]
    >`
      SELECT
        DATE(created_at)::text AS date,
        COALESCE(SUM(billable_tokens), 0)::text AS tokens,
        COUNT(*)::bigint AS requests
      FROM usage_events
      WHERE account_id = ${accountId}
        AND created_at >= ${start}
        AND created_at <= ${end}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    return rows.map((r) => ({
      date: r.date,
      tokens: parseInt(r.tokens, 10) || 0,
      requests: Number(r.requests),
    }))
  }

  async getRequestCountsByKeyPrefixForUser(userId: number): Promise<Record<string, number>> {
    const accountId = String(userId)
    const rows = await this.prisma.$queryRaw<{ api_key_prefix: string; cnt: bigint }[]>`
      SELECT api_key_prefix, COUNT(*)::bigint AS cnt
      FROM usage_events
      WHERE account_id = ${accountId}
      GROUP BY api_key_prefix
    `
    const out: Record<string, number> = {}
    for (const r of rows) {
      out[r.api_key_prefix] = Number(r.cnt)
    }
    return out
  }
}
