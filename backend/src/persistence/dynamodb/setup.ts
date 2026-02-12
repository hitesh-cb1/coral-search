import { CreateTableCommand, DescribeTableCommand, ResourceInUseException } from '@aws-sdk/client-dynamodb'
import { getDynamoDBClient } from './client'
import { awsConfig } from '../../config/aws.config'
import { logger } from '../../infrastructure/logging/logger'

/**
 * Initialize DynamoDB tables
 * Creates tables if they don't exist (safe for development)
 */
export async function initializeDynamoDBTables(): Promise<void> {
  const client = getDynamoDBClient()
  const tableName = awsConfig.dynamodb.tableNames.apiUsage

  try {
    // Check if table already exists
    try {
      await client.send(
        new DescribeTableCommand({
          TableName: tableName,
        })
      )
      logger.info(`✅ DynamoDB table "${tableName}" already exists`)
      return
    } catch (error: any) {
      // Table doesn't exist, we'll create it
      if (error.name !== 'ResourceNotFoundException') {
        throw error
      }
    }

    // Create the table
    logger.info(`📦 Creating DynamoDB table "${tableName}"...`)

    await client.send(
      new CreateTableCommand({
        TableName: tableName,
        AttributeDefinitions: [
          {
            AttributeName: 'userId',
            AttributeType: 'N', // Number
          },
          {
            AttributeName: 'sortKey',
            AttributeType: 'S', // String
          },
        ],
        KeySchema: [
          {
            AttributeName: 'userId',
            KeyType: 'HASH', // Partition key
          },
          {
            AttributeName: 'sortKey',
            KeyType: 'RANGE', // Sort key
          },
        ],
        BillingMode: 'PAY_PER_REQUEST', // On-demand pricing
      })
    )

    logger.info(`✅ DynamoDB table "${tableName}" created successfully`)
  } catch (error: any) {
    if (error instanceof ResourceInUseException) {
      // Table was created between check and create (race condition)
      logger.info(`✅ DynamoDB table "${tableName}" already exists (created concurrently)`)
    } else {
      logger.error(`❌ Failed to create DynamoDB table "${tableName}":`, error)
      // Don't throw - allow app to start even if table creation fails
      // In production, tables should be created via infrastructure-as-code
      if (awsConfig.dynamodb.endpoint) {
        // Only warn in local development
        logger.warn(`⚠️  Continuing without DynamoDB table. Make sure to create it manually or check your AWS credentials.`)
      } else {
        // In production, this is more critical
        logger.error(`⚠️  DynamoDB table creation failed. Please create the table manually or via infrastructure-as-code.`)
      }
    }
  }
}

