import { IShopRepository } from './shop.repository.interface'
import { Shop, CreateShopInput, UpdateShopInput } from './shop.types'
import { ShopifyClient } from '../../integrations/shopify/shopify.client'
import { IProductRepository } from '../product/product.repository.interface'
import { ProductService } from '../product/product.service'

// In-memory sync status tracking
interface SyncStatus {
  shopId: number
  shopDomain: string
  status: 'idle' | 'fetching' | 'importing' | 'completed' | 'error'
  totalProducts: number
  processedProducts: number
  startedAt: Date
  completedAt?: Date
  error?: string
}

export class ShopService {
  private syncStatuses = new Map<string, SyncStatus>()

  constructor(
    private readonly shopRepository: IShopRepository,
    private readonly productRepository: IProductRepository,
    private readonly shopifyClient: ShopifyClient
  ) {}

  async syncProducts(shopId: number, shopDomain: string, accessToken: string): Promise<number> {
    const startTime = Date.now()
    
    // Initialize sync status
    this.syncStatuses.set(shopDomain, {
      shopId,
      shopDomain,
      status: 'fetching',
      totalProducts: 0,
      processedProducts: 0,
      startedAt: new Date(),
    })

    try {
      // Fetch products from Shopify with progress tracking
      const shopifyProducts = await this.shopifyClient.getProducts(
        shopDomain, 
        accessToken,
        (fetched: number, total?: number) => {
          // Update progress during fetching
          const status = this.syncStatuses.get(shopDomain)
          if (status) {
            status.totalProducts = total || fetched
            status.processedProducts = fetched
            this.syncStatuses.set(shopDomain, status)
          }
        }
      )

      // Update status to importing
      const status = this.syncStatuses.get(shopDomain)
      if (status) {
        status.status = 'importing'
        status.totalProducts = shopifyProducts.length
        status.processedProducts = 0
        this.syncStatuses.set(shopDomain, status)
      }

      // Import products with progress tracking
      const productService = new ProductService(this.productRepository)
      const count = await productService.bulkImportFromShopify(
        shopId, 
        shopifyProducts,
        (processed: number) => {
          // Update progress during import
          const status = this.syncStatuses.get(shopDomain)
          if (status) {
            status.processedProducts = processed
            this.syncStatuses.set(shopDomain, status)
          }
        }
      )

      const totalTime = Date.now() - startTime
      console.log(`⏱️ [${shopDomain}] Product sync completed: ${count} products in ${Math.round(totalTime / 1000 * 100) / 100} seconds`)

      // Mark as completed
      const finalStatus = this.syncStatuses.get(shopDomain)
      if (finalStatus) {
        finalStatus.status = 'completed'
        finalStatus.processedProducts = count
        finalStatus.completedAt = new Date()
        this.syncStatuses.set(shopDomain, finalStatus)
      }

      return count
    } catch (error) {
      const totalTime = Date.now() - startTime
      console.log(`⏱️ [${shopDomain}] Product sync failed after ${Math.round(totalTime / 1000 * 100) / 100} seconds`)
      
      // Mark as error
      const errorStatus = this.syncStatuses.get(shopDomain)
      if (errorStatus) {
        errorStatus.status = 'error'
        errorStatus.error = (error as Error).message
        errorStatus.completedAt = new Date()
        this.syncStatuses.set(shopDomain, errorStatus)
      }
      throw error
    }
  }

  getSyncStatus(shopDomain: string): SyncStatus | null {
    return this.syncStatuses.get(shopDomain) || null
  }

  clearSyncStatus(shopDomain: string): void {
    this.syncStatuses.delete(shopDomain)
  }

  async getShopByDomain(shopDomain: string): Promise<Shop | null> {
    return this.shopRepository.findByDomain(shopDomain)
  }

  async createShop(input: CreateShopInput): Promise<Shop> {
    return this.shopRepository.create(input)
  }

  async updateShop(shopId: number, updates: UpdateShopInput): Promise<Shop> {
    return this.shopRepository.update(shopId, updates)
  }

  async uninstallShop(shopDomain: string): Promise<void> {
    const shop = await this.shopRepository.findByDomain(shopDomain)
    if (!shop) {
      throw new Error(`Shop ${shopDomain} not found`)
    }

    await this.shopRepository.update(shop.id, { isActive: false })
    
    // Clear sync status on uninstall
    this.clearSyncStatus(shopDomain)
  }
}