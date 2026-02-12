export const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  s3: {
    bucket: process.env.S3_BUCKET,
  },
  sqs: {
    queueUrl: process.env.SQS_QUEUE_URL,
  },
  sns: {
    topicArn: process.env.SNS_TOPIC_ARN,
  },
  dynamodb: {
    endpoint: process.env.DYNAMODB_ENDPOINT, // For local development (DynamoDB Local)
    tableNames: {
      apiUsage: process.env.DYNAMODB_API_USAGE_TABLE || 'coralbricks-api-usage',
    },
  },
} as const
