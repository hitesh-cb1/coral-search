export const databaseConfig = {
  postgres: {
    url: process.env.DATABASE_URL!,
  },
  // Future: DynamoDB config
  dynamodb: {
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.DYNAMODB_ENDPOINT,
  },
  // Future: Redis config
  redis: {
    url: process.env.REDIS_URL,
  },
} as const
