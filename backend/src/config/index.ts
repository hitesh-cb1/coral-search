import 'dotenv/config'
import { databaseConfig } from './database.config'
import { serverConfig } from './server.config'
import { awsConfig } from './aws.config'
import { embeddingConfig } from './embedding.config'
import { authConfig } from './auth.config'
import { apiKeyConfig } from './api-key.config'
import { freemiumConfig } from './freemium.config'
import { searchComparisonConfig } from './search-comparison.config'

export const config = {
  database: databaseConfig,
  server: serverConfig,
  aws: awsConfig,
  embedding: embeddingConfig,
  auth: authConfig,
  apiKey: apiKeyConfig,
  freemium: freemiumConfig,
  searchComparison: searchComparisonConfig,
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',
} as const

export { databaseConfig, serverConfig, awsConfig, embeddingConfig, authConfig, apiKeyConfig, freemiumConfig, searchComparisonConfig }
