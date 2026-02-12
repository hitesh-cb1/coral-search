import 'dotenv/config'
import { logger } from '../infrastructure/logging/logger'

export const searchComparisonConfig = {
  // Service discovery is now required (static IPs no longer work)
  clusterName: process.env.ECS_CLUSTER_NAME || '',

  // Service names for ECS service discovery
  coral: {
    serviceName: process.env.CORAL_SEARCH_SERVICE_NAME || '',
    port: parseInt(process.env.CORAL_SEARCH_PORT || '8001', 10),
    // TEMPORARY: Fallback direct endpoint for testing without AWS credentials
    // Find current IP in AWS Console: ECS → Cluster → Service → Tasks → Running Task → Public IP
    fallbackEndpoint: process.env.CORAL_SEARCH_FALLBACK_ENDPOINT || '',
  },
  openai: {
    serviceName: process.env.OPENAI_SEARCH_SERVICE_NAME || '',
    port: parseInt(process.env.OPENAI_SEARCH_PORT || '8001', 10),
    // TEMPORARY: Fallback direct endpoint for testing without AWS credentials
    fallbackEndpoint: process.env.OPENAI_SEARCH_FALLBACK_ENDPOINT || '',
  },
} as const

// Validate configuration on startup
const missingConfig: string[] = []

if (!searchComparisonConfig.clusterName) {
  missingConfig.push('ECS_CLUSTER_NAME')
}

if (!searchComparisonConfig.coral.serviceName) {
  missingConfig.push('CORAL_SEARCH_SERVICE_NAME')
}

if (!searchComparisonConfig.openai.serviceName) {
  missingConfig.push('OPENAI_SEARCH_SERVICE_NAME')
}

if (missingConfig.length > 0) {
  logger.error('❌ Missing required environment variables for search service discovery:', missingConfig)
  logger.error('Search comparison endpoints will not work without these variables!')
} else {
  logger.info('✅ Search Comparison Config:', {
    clusterName: searchComparisonConfig.clusterName,
    coral: {
      serviceName: searchComparisonConfig.coral.serviceName,
      port: searchComparisonConfig.coral.port,
    },
    openai: {
      serviceName: searchComparisonConfig.openai.serviceName,
      port: searchComparisonConfig.openai.port,
    },
  })
}

