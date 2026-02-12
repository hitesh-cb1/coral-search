// Service composition - centralized instantiation
import { ShopService } from '../domain/shop/shop.service'
import { ProductService } from '../domain/product/product.service'
import { UserService } from '../domain/user/user.service'
import { ApiKeyService } from '../domain/api-key/api-key.service'
import { PaymentService } from '../domain/payment/payment.service'
import { getShopRepository, getProductRepository, getUserRepository, getApiKeyRepository, getPaymentRepository, getUsageRepository } from './repositories'
import { getShopifyClient, getEmbeddingClient } from './integrations'

// Singleton instances
let shopServiceInstance: ShopService | null = null
let productServiceInstance: ProductService | null = null
let userServiceInstance: UserService | null = null
let apiKeyServiceInstance: ApiKeyService | null = null
let paymentServiceInstance: PaymentService | null = null

export function getShopService(): ShopService {
  if (!shopServiceInstance) {
    shopServiceInstance = new ShopService(
      getShopRepository(),
      getProductRepository(),
      getShopifyClient()
    )
  }
  return shopServiceInstance
}

export function getProductService(): ProductService {
  if (!productServiceInstance) {
    productServiceInstance = new ProductService(getProductRepository())
  }
  return productServiceInstance
}

export function getUserService(): UserService {
  if (!userServiceInstance) {
    userServiceInstance = new UserService(getUserRepository())
  }
  return userServiceInstance
}

export function getApiKeyService(): ApiKeyService {
  if (!apiKeyServiceInstance) {
    apiKeyServiceInstance = new ApiKeyService(
      getApiKeyRepository(),
      getUsageRepository()
    )
  }
  return apiKeyServiceInstance
}

export function getEmbeddingService() {
  return getEmbeddingClient()
}

export function getPaymentService(): PaymentService {
  if (!paymentServiceInstance) {
    paymentServiceInstance = new PaymentService(
      getPaymentRepository(),
      getUserRepository()
    )
  }
  return paymentServiceInstance
}

// For testing: reset instances
export function resetServices(): void {
  shopServiceInstance = null
  productServiceInstance = null
  userServiceInstance = null
  apiKeyServiceInstance = null
  paymentServiceInstance = null
}
