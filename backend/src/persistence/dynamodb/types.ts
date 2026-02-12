// DynamoDB types for API usage tracking

export interface ApiUsageRecord {
  // Partition key: userId
  userId: number
  
  // Sort key: timestamp#apiKeyId (for efficient querying)
  sortKey: string // Format: `${timestamp}#${apiKeyId}`
  
  // Request Info
  apiKeyId: number
  endpoint: string // "/api/v1/embed", "/api/v1/count-tokens"
  method: string // "POST"
  
  // Usage Metrics
  tokensUsed: number
  latencyMs?: number
  
  // Request Details
  inputSize?: number
  outputSize?: number
  
  // Status
  success: boolean
  errorCode?: string
  
  // Timestamp (ISO string for easy querying)
  timestamp: string // ISO 8601 format
  
  // TTL for automatic cleanup (optional, in seconds since epoch)
  ttl?: number
}

// For querying usage by user
export interface UserUsageQuery {
  userId: number
  startDate?: Date
  endDate?: Date
  limit?: number
}

// For querying usage by API key
export interface ApiKeyUsageQuery {
  userId: number
  apiKeyId: number
  startDate?: Date
  endDate?: Date
  limit?: number
}

// Aggregated usage stats
export interface UsageStats {
  totalRequests: number
  totalTokens: number
  successRate: number
  avgLatency: number
}

