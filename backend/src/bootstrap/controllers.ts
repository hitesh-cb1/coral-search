// Controller composition - centralized instantiation
import { ShopifyController } from '../api/public/controllers/shopify.controller'
import { AuthController } from '../api/marketplace/v1/controllers/auth.controller'
import { UserController } from '../api/marketplace/v1/controllers/user.controller'
import { EmbeddingController } from '../api/marketplace/v1/controllers/embedding.controller'
import { PaymentController } from '../api/marketplace/v1/controllers/payment.controller'
import { SearchComparisonController } from '../api/marketplace/v1/controllers/search-comparison.controller'
import { TryApiController } from '../api/marketplace/v1/controllers/try-api.controller'
import { ContactController } from '../api/marketplace/v1/controllers/contact.controller'
import { getShopService, getProductService, getUserService, getApiKeyService, getEmbeddingService, getPaymentService } from './services'

// Singleton instances
let shopifyControllerInstance: ShopifyController | null = null
let authControllerInstance: AuthController | null = null
let userControllerInstance: UserController | null = null
let embeddingControllerInstance: EmbeddingController | null = null
let paymentControllerInstance: PaymentController | null = null
let searchComparisonControllerInstance: SearchComparisonController | null = null
let tryApiControllerInstance: TryApiController | null = null
let contactControllerInstance: ContactController | null = null

export function getShopifyController(): ShopifyController {
  if (!shopifyControllerInstance) {
    shopifyControllerInstance = new ShopifyController(
      getShopService(),
      getProductService()
    )
  }
  return shopifyControllerInstance
}

export function getAuthController(): AuthController {
  if (!authControllerInstance) {
    authControllerInstance = new AuthController(
      getUserService(),
      getApiKeyService()
    )
  }
  return authControllerInstance
}

export function getUserController(): UserController {
  if (!userControllerInstance) {
    userControllerInstance = new UserController(
      getUserService(),
      getApiKeyService(),
      getPaymentService()
    )
  }
  return userControllerInstance
}

export function getEmbeddingController(): EmbeddingController {
  if (!embeddingControllerInstance) {
    embeddingControllerInstance = new EmbeddingController(
      getEmbeddingService(),
      getApiKeyService(),
      getUserService()
    )
  }
  return embeddingControllerInstance
}

export function getPaymentController(): PaymentController {
  if (!paymentControllerInstance) {
    paymentControllerInstance = new PaymentController(getPaymentService())
  }
  return paymentControllerInstance
}

export function getSearchComparisonController(): SearchComparisonController {
  if (!searchComparisonControllerInstance) {
    searchComparisonControllerInstance = new SearchComparisonController()
  }
  return searchComparisonControllerInstance
}

export function getTryApiController(): TryApiController {
  if (!tryApiControllerInstance) {
    tryApiControllerInstance = new TryApiController(
      getUserService(),
      getApiKeyService()
    )
  }
  return tryApiControllerInstance
}

export function getContactController(): ContactController {
  if (!contactControllerInstance) {
    contactControllerInstance = new ContactController()
  }
  return contactControllerInstance
}

// For testing: reset instances
export function resetControllers(): void {
  shopifyControllerInstance = null
  authControllerInstance = null
  userControllerInstance = null
  embeddingControllerInstance = null
  paymentControllerInstance = null
  searchComparisonControllerInstance = null
  tryApiControllerInstance = null
  contactControllerInstance = null
}
