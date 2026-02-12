import { ECSClient, ListTasksCommand, DescribeTasksCommand } from '@aws-sdk/client-ecs'
import { EC2Client, DescribeNetworkInterfacesCommand } from '@aws-sdk/client-ec2'
import { awsConfig } from '../../config/aws.config'
import { logger } from '../logging/logger'

interface CachedEndpoint {
  ip: string
  port: number
  timestamp: Date
}

/**
 * Service discovery for ECS services using AWS SDK
 * Discovers the public IP address of running ECS tasks dynamically
 */
export class ServiceDiscovery {
  private ecsClient: ECSClient
  private ec2Client: EC2Client
  private clusterName: string
  private cache: Map<string, CachedEndpoint> = new Map()
  private cacheTTL: number = 5 * 60 * 1000 // 5 minutes

  constructor(clusterName: string) {
    const config: any = {
      region: awsConfig.region,
    }

    // Use explicit credentials if provided, otherwise use default credential chain
    if (awsConfig.accessKeyId && awsConfig.secretAccessKey) {
      config.credentials = {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      }
    }

    this.ecsClient = new ECSClient(config)
    this.ec2Client = new EC2Client(config)
    this.clusterName = clusterName
  }

  /**
   * Discover current public IP for an ECS service
   * @param serviceName ECS service name
   * @param port Service port (default: 8001)
   * @returns Public IP address or null if not found
   */
  async discoverServiceIP(serviceName: string, port: number = 8001): Promise<string | null> {
    try {
      // Check cache first
      const cached = this.cache.get(serviceName)
      if (cached && this.isCacheValid(cached)) {
        logger.debug(`Using cached IP for service: ${serviceName} -> ${cached.ip}:${cached.port}`)
        return cached.ip
      }

      logger.debug(`Discovering IP for service: ${serviceName}`)

      // List tasks in the service
      const listTasksResponse = await this.ecsClient.send(
        new ListTasksCommand({
          cluster: this.clusterName,
          serviceName: serviceName,
          desiredStatus: 'RUNNING',
        })
      )

      const taskArns = listTasksResponse.taskArns || []
      if (taskArns.length === 0) {
        logger.warn(`No running tasks found for service: ${serviceName}`)
        return null
      }

      // Get task details (use first running task)
      const describeTasksResponse = await this.ecsClient.send(
        new DescribeTasksCommand({
          cluster: this.clusterName,
          tasks: [taskArns[0]],
        })
      )

      const task = describeTasksResponse.tasks?.[0]
      if (!task) {
        logger.warn(`No task details found for service: ${serviceName}`)
        return null
      }

      logger.debug('Task details:', {
        taskArn: task.taskArn,
        lastStatus: task.lastStatus,
        attachments: task.attachments?.length,
      })

      // Find network interface attachment
      const networkAttachment = task.attachments?.find(
        (attachment) => attachment.type === 'ElasticNetworkInterface'
      )

      if (!networkAttachment) {
        logger.warn(`No network interface found for service: ${serviceName}`)
        return null
      }

      // Get network interface ID
      const networkInterfaceId = networkAttachment.details?.find(
        (detail) => detail.name === 'networkInterfaceId'
      )?.value

      if (!networkInterfaceId) {
        logger.warn(`No network interface details found for service: ${serviceName}`)
        return null
      }

      logger.debug('Network interface ID:', networkInterfaceId)

      // Get public IP from EC2
      const describeNetworkInterfacesResponse = await this.ec2Client.send(
        new DescribeNetworkInterfacesCommand({
          NetworkInterfaceIds: [networkInterfaceId],
        })
      )

      const publicIp =
        describeNetworkInterfacesResponse.NetworkInterfaces?.[0]?.Association?.PublicIp

      if (publicIp) {
        logger.info(`✓ Discovered ${serviceName}: ${publicIp}:${port}`)

        // Cache the result
        this.cache.set(serviceName, {
          ip: publicIp,
          port,
          timestamp: new Date(),
        })

        return publicIp
      } else {
        logger.warn(`No public IP found for service: ${serviceName}`)
        return null
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Error discovering IP for ${serviceName}: ${errorMessage}`, error instanceof Error ? error : undefined)
      return null
    }
  }

  /**
   * Get the full endpoint URL for a service
   * @param serviceName ECS service name
   * @param port Service port (default: 8001)
   * @param path API path (default: '/search')
   * @returns Full endpoint URL or null if service not found
   */
  async getServiceEndpoint(serviceName: string, port: number = 8001, path: string = '/search'): Promise<string | null> {
    const ip = await this.discoverServiceIP(serviceName, port)
    if (!ip) {
      return null
    }
    return `http://${ip}:${port}${path}`
  }

  /**
   * Check if cached endpoint is still valid
   */
  private isCacheValid(cached: CachedEndpoint): boolean {
    const now = new Date()
    const age = now.getTime() - cached.timestamp.getTime()
    return age < this.cacheTTL
  }

  /**
   * Clear the cache for a specific service or all services
   */
  clearCache(serviceName?: string): void {
    if (serviceName) {
      this.cache.delete(serviceName)
    } else {
      this.cache.clear()
    }
  }
}

