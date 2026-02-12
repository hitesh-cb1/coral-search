import { Request, Response } from 'express'
import { searchComparisonConfig } from '../../../../config/search-comparison.config'
import { ServiceDiscovery } from '../../../../infrastructure/aws/service-discovery'
import { logger } from '../../../../infrastructure/logging/logger'

interface SearchRequest {
  query: string
  k?: number
}

// Singleton service discovery instance
let serviceDiscoveryInstance: ServiceDiscovery | null = null

function getServiceDiscovery(): ServiceDiscovery {
  if (!serviceDiscoveryInstance) {
    if (!searchComparisonConfig.clusterName) {
      throw new Error('ECS_CLUSTER_NAME environment variable is required for service discovery')
    }
    logger.info(`Initializing service discovery for cluster: ${searchComparisonConfig.clusterName}`)
    serviceDiscoveryInstance = new ServiceDiscovery(searchComparisonConfig.clusterName)
  }

  return serviceDiscoveryInstance
}

async function getCoralEndpoint(): Promise<string> {
  // FALLBACK MODE: Use direct endpoint if configured (for testing without AWS credentials)
  if (searchComparisonConfig.coral.fallbackEndpoint) {
    const fallbackUrl = `${searchComparisonConfig.coral.fallbackEndpoint}/search`
    logger.info(`⚠️  Using fallback endpoint for Coral (no AWS credentials): ${fallbackUrl}`)
    return fallbackUrl
  }

  if (!searchComparisonConfig.coral.serviceName) {
    throw new Error('CORAL_SEARCH_SERVICE_NAME environment variable is required')
  }

  logger.debug(`Discovering endpoint for Coral service: ${searchComparisonConfig.coral.serviceName}`)

  try {
    const discovery = getServiceDiscovery()
    const endpoint = await discovery.getServiceEndpoint(
      searchComparisonConfig.coral.serviceName,
      searchComparisonConfig.coral.port,
      '/search'
    )

    if (!endpoint) {
      throw new Error(`Failed to discover endpoint for Coral service: ${searchComparisonConfig.coral.serviceName}`)
    }

    logger.info(`Using discovered Coral endpoint: ${endpoint}`)
    return endpoint
  } catch (error) {
    logger.error(`Error during Coral service discovery:`, error)
    throw new Error(`Service discovery failed for Coral: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function getOpenAIEndpoint(): Promise<string> {
  // FALLBACK MODE: Use direct endpoint if configured (for testing without AWS credentials)
  if (searchComparisonConfig.openai.fallbackEndpoint) {
    const fallbackUrl = `${searchComparisonConfig.openai.fallbackEndpoint}/search`
    logger.info(`⚠️  Using fallback endpoint for OpenAI (no AWS credentials): ${fallbackUrl}`)
    return fallbackUrl
  }

  if (!searchComparisonConfig.openai.serviceName) {
    throw new Error('OPENAI_SEARCH_SERVICE_NAME environment variable is required')
  }

  logger.debug(`Discovering endpoint for OpenAI service: ${searchComparisonConfig.openai.serviceName}`)

  try {
    const discovery = getServiceDiscovery()
    const endpoint = await discovery.getServiceEndpoint(
      searchComparisonConfig.openai.serviceName,
      searchComparisonConfig.openai.port,
      '/search'
    )

    if (!endpoint) {
      throw new Error(`Failed to discover endpoint for OpenAI service: ${searchComparisonConfig.openai.serviceName}`)
    }

    logger.info(`Using discovered OpenAI endpoint: ${endpoint}`)
    return endpoint
  } catch (error) {
    logger.error(`Error during OpenAI service discovery:`, error)
    throw new Error(`Service discovery failed for OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export class SearchComparisonController {
  searchCoral = async (req: Request, res: Response): Promise<void> => {
    try {
      const { query, k = 10 } = req.body as SearchRequest

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Query is required and must be a string',
        })
        return
      }

      const endpoint = await getCoralEndpoint()
      logger.debug(`Making Coral search request to: ${endpoint}`)

      // Add timeout to fetch (30 seconds)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, k }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch (e) {
          // If response is not JSON, use status text
          errorData = { error: response.statusText }
        }

        logger.error(`Coral search failed: ${response.status} - ${JSON.stringify(errorData)}`)
        res.status(response.status).json({
          success: false,
          error: errorData.error || errorData.detail || `HTTP ${response.status}`,
        })
        return
      }

      const data = await response.json()
      logger.debug(`Coral search successful`)

      res.json({
        success: true,
        data,
      })
    } catch (error) {
      logger.error('Coral search error:', error)
      let errorMessage = 'Unknown error'

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout (30s)'
        } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
          errorMessage = `Connection failed: ${error.message}`
        } else {
          errorMessage = error.message
        }
      }

      res.status(500).json({
        success: false,
        error: `Failed to call Coral search service: ${errorMessage}`,
      })
    }
  }

  searchOpenAI = async (req: Request, res: Response): Promise<void> => {
    try {
      const { query, k = 10 } = req.body as SearchRequest

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Query is required and must be a string',
        })
        return
      }

      const endpoint = await getOpenAIEndpoint()
      logger.debug(`Making OpenAI search request to: ${endpoint}`)

      // Add timeout to fetch (30 seconds)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, k }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch (e) {
          // If response is not JSON, use status text
          errorData = { error: response.statusText }
        }

        logger.error(`OpenAI search failed: ${response.status} - ${JSON.stringify(errorData)}`)
        res.status(response.status).json({
          success: false,
          error: errorData.error || errorData.detail || `HTTP ${response.status}`,
        })
        return
      }

      const data = await response.json()
      logger.debug(`OpenAI search successful`)

      res.json({
        success: true,
        data,
      })
    } catch (error) {
      logger.error('OpenAI search error:', error)
      let errorMessage = 'Unknown error'

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout (30s)'
        } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
          errorMessage = `Connection failed: ${error.message}`
        } else {
          errorMessage = error.message
        }
      }

      res.status(500).json({
        success: false,
        error: `Failed to call OpenAI search service: ${errorMessage}`,
      })
    }
  }
}

