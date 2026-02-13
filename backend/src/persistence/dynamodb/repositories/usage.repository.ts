import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { getDynamoDBDocumentClient } from '../client'
import { awsConfig } from '../../../config/aws.config'
import { ApiUsageRecord, UsageStats } from '../types'
import { ApiKeyUsage, CreateUsageInput } from '../../../domain/api-key/api-key.types'
import { IUsageRepository } from '../../../domain/api-key/usage.repository.interface'

export class DynamoDBUsageRepository implements IUsageRepository {
  private readonly tableName = awsConfig.dynamodb.tableNames.apiUsage
  private readonly docClient = getDynamoDBDocumentClient()

  /**
   * Create a usage record in DynamoDB
   */
  async createUsage(input: CreateUsageInput): Promise<ApiKeyUsage> {
    const timestamp = new Date()
    const timestampISO = timestamp.toISOString()
    
    // Sort key format: timestamp#apiKeyId for efficient querying
    // Using ISO timestamp ensures chronological ordering
    const sortKey = `${timestampISO}#${input.apiKeyId}`

    const record: ApiUsageRecord = {
      userId: input.userId,
      sortKey,
      apiKeyId: input.apiKeyId,
      endpoint: input.endpoint,
      method: input.method,
      tokensUsed: input.tokensUsed || 0,
      latencyMs: input.latencyMs,
      inputSize: input.inputSize,
      outputSize: input.outputSize,
      success: input.success,
      errorCode: input.errorCode,
      timestamp: timestampISO,
      // Optional: Set TTL to 1 year from now (for automatic cleanup)
      // ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
    }

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: record,
      })
    )

    // Return domain model
    return {
      id: 0, // DynamoDB doesn't use auto-increment IDs
      userId: record.userId,
      apiKeyId: record.apiKeyId,
      endpoint: record.endpoint,
      method: record.method,
      tokensUsed: record.tokensUsed,
      latencyMs: record.latencyMs,
      inputSize: record.inputSize,
      outputSize: record.outputSize,
      success: record.success,
      errorCode: record.errorCode,
      timestamp: timestamp,
    }
  }

  /**
   * Query usage records by user (implements IUsageRepository)
   */
  async findUsageByUser(userId: number, limit = 100, startDate?: Date, endDate?: Date): Promise<ApiKeyUsage[]> {
    const keyConditionExpression = 'userId = :userId'
    const expressionAttributeValues: any = {
      ':userId': userId,
    }

    // Use FilterExpression for date filtering since sortKey includes apiKeyId
    // SortKey format: timestampISO#apiKeyId
    let filterExpression: string | undefined
    if (startDate || endDate) {
      const startISO = startDate?.toISOString() || '1970-01-01T00:00:00.000Z'
      const endISO = endDate?.toISOString() || new Date().toISOString()
      
      // Filter by timestamp field instead of sortKey for better date range filtering
      filterExpression = '#timestamp BETWEEN :startDate AND :endDate'
      expressionAttributeValues[':startDate'] = startISO
      expressionAttributeValues[':endDate'] = endISO
    }

    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: keyConditionExpression,
      FilterExpression: filterExpression,
      ExpressionAttributeNames: filterExpression ? { '#timestamp': 'timestamp' } : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ScanIndexForward: false, // Most recent first
      Limit: limit,
    })

    const result = await this.docClient.send(command)
    
    return (result.Items || []).map((item: Record<string, any>) => {
      const record = item as ApiUsageRecord
      return {
        id: 0,
        userId: record.userId,
        apiKeyId: record.apiKeyId,
        endpoint: record.endpoint,
        method: record.method,
        tokensUsed: record.tokensUsed,
        latencyMs: record.latencyMs,
        inputSize: record.inputSize,
        outputSize: record.outputSize,
        success: record.success,
        errorCode: record.errorCode,
        timestamp: new Date(record.timestamp),
      }
    })
  }

  /**
   * Query usage records by API key (implements IUsageRepository)
   */
  async findUsageByApiKey(userId: number, apiKeyId: number, limit = 100, startDate?: Date, endDate?: Date): Promise<ApiKeyUsage[]> {
    let keyConditionExpression = 'userId = :userId'
    const expressionAttributeValues: any = {
      ':userId': userId,
    }

    // Filter by API key and date range
    let filterExpression = 'apiKeyId = :apiKeyId'
    expressionAttributeValues[':apiKeyId'] = apiKeyId

    if (startDate || endDate) {
      const startISO = startDate?.toISOString() || '1970-01-01T00:00:00.000Z'
      const endISO = endDate?.toISOString() || new Date().toISOString()
      
      filterExpression += ' AND sortKey BETWEEN :startKey AND :endKey'
      expressionAttributeValues[':startKey'] = `${startISO}#${apiKeyId}`
      expressionAttributeValues[':endKey'] = `${endISO}#${apiKeyId}`
    }

    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: keyConditionExpression,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ScanIndexForward: false, // Most recent first
      Limit: limit,
    })

    const result = await this.docClient.send(command)
    
    return (result.Items || []).map((item: Record<string, any>) => {
      const record = item as ApiUsageRecord
      return {
        id: 0,
        userId: record.userId,
        apiKeyId: record.apiKeyId,
        endpoint: record.endpoint,
        method: record.method,
        tokensUsed: record.tokensUsed,
        latencyMs: record.latencyMs,
        inputSize: record.inputSize,
        outputSize: record.outputSize,
        success: record.success,
        errorCode: record.errorCode,
        timestamp: new Date(record.timestamp),
      }
    })
  }

  /**
   * Get aggregated usage statistics
   */
  async getUsageStats(userId: number, startDate?: Date, endDate?: Date): Promise<UsageStats> {
    console.log(`[DynamoDB] Getting usage stats for userId: ${userId}, startDate: ${startDate?.toISOString()}, endDate: ${endDate?.toISOString()}`)
    
    const records = await this.findUsageByUser(userId, 10000, startDate, endDate)
    
    console.log(`[DynamoDB] Found ${records.length} usage records`)

    if (records.length === 0) {
      console.log('[DynamoDB] No records found, returning zero stats')
      return {
        totalRequests: 0,
        totalTokens: 0,
        successRate: 0,
        avgLatency: 0,
      }
    }

    const totalRequests = records.length
    const totalTokens = records.reduce((sum, r) => sum + (r.tokensUsed || 0), 0)
    const successfulRequests = records.filter(r => r.success).length
    const successRate = (successfulRequests / totalRequests) * 100
    
    const latencies = records.filter(r => r.latencyMs !== undefined).map(r => r.latencyMs!)
    const avgLatency = latencies.length > 0
      ? latencies.reduce((sum, l) => sum + l, 0) / latencies.length
      : 0

    const stats = {
      totalRequests,
      totalTokens,
      successRate,
      avgLatency,
    }
    
    console.log('[DynamoDB] Calculated stats:', stats)
    return stats
  }

  /**
   * Get daily usage breakdown
   */
  async getDailyUsage(userId: number, startDate?: Date, endDate?: Date): Promise<Array<{
    date: string
    tokens: number
    requests: number
  }>> {
    console.log(`[DynamoDB] Getting daily usage for userId: ${userId}, startDate: ${startDate?.toISOString()}, endDate: ${endDate?.toISOString()}`)
    
    const records = await this.findUsageByUser(userId, 10000, startDate, endDate)
    console.log(`[DynamoDB] Found ${records.length} usage records for daily breakdown`)
    
    // Group records by date (YYYY-MM-DD)
    const dailyMap = new Map<string, { tokens: number; requests: number }>()
    
    records.forEach(record => {
      const recordDate = new Date(record.timestamp)
      const dateKey = recordDate.toISOString().split('T')[0] // YYYY-MM-DD
      
      const existing = dailyMap.get(dateKey) || { tokens: 0, requests: 0 }
      dailyMap.set(dateKey, {
        tokens: existing.tokens + (record.tokensUsed || 0),
        requests: existing.requests + 1,
      })
    })
    
    // Convert to array and sort by date
    const dailyUsage = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        tokens: data.tokens,
        requests: data.requests,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
    
    console.log(`[DynamoDB] Daily usage breakdown:`, dailyUsage)
    return dailyUsage
  }

  async getRequestCountsByKeyPrefixForUser(_userId: number): Promise<Record<string, number>> {
    return {}
  }
}

