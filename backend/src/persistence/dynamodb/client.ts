import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { awsConfig } from '../../config/aws.config'

let dynamoDbClient: DynamoDBClient | null = null
let dynamoDbDocumentClient: DynamoDBDocumentClient | null = null

export function getDynamoDBClient(): DynamoDBClient {
  if (!dynamoDbClient) {
    const config: any = {
      region: awsConfig.region,
    }

    // For local development with DynamoDB Local
    if (awsConfig.dynamodb.endpoint) {
      config.endpoint = awsConfig.dynamodb.endpoint
      // Disable SSL for local DynamoDB
      config.sslEnabled = false
      // DynamoDB Local requires dummy credentials (any values work)
      config.credentials = {
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy',
      }
    } else {
      // Production: use IAM credentials or environment variables
      if (awsConfig.accessKeyId && awsConfig.secretAccessKey) {
        // Explicitly use environment variable credentials if provided
        config.credentials = {
          accessKeyId: awsConfig.accessKeyId,
          secretAccessKey: awsConfig.secretAccessKey,
        }
      }
      // If credentials are not set, AWS SDK will automatically use:
      // 1. IAM role (EC2 instance profile) - recommended for EC2
      // 2. AWS credentials file (~/.aws/credentials)
      // 3. Other credential providers in the default chain
    }

    dynamoDbClient = new DynamoDBClient(config)
  }

  return dynamoDbClient
}

export function getDynamoDBDocumentClient(): DynamoDBDocumentClient {
  if (!dynamoDbDocumentClient) {
    dynamoDbDocumentClient = DynamoDBDocumentClient.from(getDynamoDBClient(), {
      marshallOptions: {
        removeUndefinedValues: true,
        convertEmptyValues: false,
      },
      unmarshallOptions: {
        wrapNumbers: false,
      },
    })
  }

  return dynamoDbDocumentClient
}

export async function disconnectDynamoDB(): Promise<void> {
  if (dynamoDbClient) {
    dynamoDbClient.destroy()
    dynamoDbClient = null
    dynamoDbDocumentClient = null
  }
}

