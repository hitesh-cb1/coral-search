// Repository composition - centralized instantiation
import { PostgresShopRepository } from '../persistence/postgres/repositories/shop.repository'
import { PostgresProductRepository } from '../persistence/postgres/repositories/product.repository'
import { PostgresUserRepository } from '../persistence/postgres/repositories/user.repository'
import { PostgresApiKeyRepository } from '../persistence/postgres/repositories/api-key.repository'
import { PostgresPaymentRepository } from '../persistence/postgres/repositories/payment.repository'
import { DynamoDBUsageRepository } from '../persistence/dynamodb/repositories/usage.repository'
import { IShopRepository } from '../domain/shop/shop.repository.interface'
import { IProductRepository } from '../domain/product/product.repository.interface'
import { IUserRepository } from '../domain/user/user.repository.interface'
import { IApiKeyRepository } from '../domain/api-key/api-key.repository.interface'
import { IPaymentRepository } from '../domain/payment/payment.repository.interface'
import { IUsageRepository } from '../domain/api-key/usage.repository.interface'

// Singleton instances
let shopRepositoryInstance: IShopRepository | null = null
let productRepositoryInstance: IProductRepository | null = null
let userRepositoryInstance: IUserRepository | null = null
let apiKeyRepositoryInstance: IApiKeyRepository | null = null
let paymentRepositoryInstance: IPaymentRepository | null = null
let usageRepositoryInstance: IUsageRepository | null = null

export function getShopRepository(): IShopRepository {
  if (!shopRepositoryInstance) {
    shopRepositoryInstance = new PostgresShopRepository()
  }
  return shopRepositoryInstance
}

export function getProductRepository(): IProductRepository {
  if (!productRepositoryInstance) {
    productRepositoryInstance = new PostgresProductRepository()
  }
  return productRepositoryInstance
}

export function getUserRepository(): IUserRepository {
  if (!userRepositoryInstance) {
    userRepositoryInstance = new PostgresUserRepository()
  }
  return userRepositoryInstance
}

export function getApiKeyRepository(): IApiKeyRepository {
  if (!apiKeyRepositoryInstance) {
    apiKeyRepositoryInstance = new PostgresApiKeyRepository()
  }
  return apiKeyRepositoryInstance
}

export function getPaymentRepository(): IPaymentRepository {
  if (!paymentRepositoryInstance) {
    paymentRepositoryInstance = new PostgresPaymentRepository()
  }
  return paymentRepositoryInstance
}

export function getUsageRepository(): IUsageRepository {
  if (!usageRepositoryInstance) {
    usageRepositoryInstance = new DynamoDBUsageRepository()
  }
  return usageRepositoryInstance
}

// For testing: reset instances
export function resetRepositories(): void {
  shopRepositoryInstance = null
  productRepositoryInstance = null
  userRepositoryInstance = null
  apiKeyRepositoryInstance = null
  paymentRepositoryInstance = null
  usageRepositoryInstance = null
}
