import { Request, Response } from 'express'
import { ShopService } from '../../../domain/shop/shop.service'
import { ProductService } from '../../../domain/product/product.service'
import { ShopifyApiMapper } from '../mappers/shopify.mapper'

export class ShopifyController {
  constructor(
    private readonly shopService: ShopService,
    private readonly productService: ProductService
  ) {}

  getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shopDomain } = req.params

      if (!shopDomain || typeof shopDomain !== 'string') {
        res.status(400).json({ error: 'Shop domain is required' })
        return
      }

      const shop = await this.shopService.getShopByDomain(shopDomain)
      if (!shop) {
        res.status(404).json({ error: 'Shop not found' })
        return
      }

      const products = await this.productService.getProductsByShop(shop.id)
      const productsDTO = ShopifyApiMapper.productsToDTO(products)

      res.json({
        shop: shop.shopDomain,
        products: productsDTO,
        total: products.length,
      })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  }

  getSyncStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shopDomain } = req.params

      if (!shopDomain || typeof shopDomain !== 'string') {
        res.status(400).json({ error: 'Shop domain is required' })
        return
      }

      const syncStatus = this.shopService.getSyncStatus(shopDomain)
      
      if (!syncStatus) {
        res.json({
          shopDomain,
          status: 'idle',
          message: 'No sync in progress'
        })
        return
      }

      const progress = syncStatus.totalProducts > 0 
        ? Math.round((syncStatus.processedProducts / syncStatus.totalProducts) * 100)
        : 0

      const duration = syncStatus.completedAt 
        ? syncStatus.completedAt.getTime() - syncStatus.startedAt.getTime()
        : Date.now() - syncStatus.startedAt.getTime()

      res.json({
        shopDomain: syncStatus.shopDomain,
        status: syncStatus.status,
        totalProducts: syncStatus.totalProducts,
        processedProducts: syncStatus.processedProducts,
        progress: progress,
        startedAt: syncStatus.startedAt,
        completedAt: syncStatus.completedAt,
        duration: Math.round(duration / 1000), // seconds
        error: syncStatus.error,
        message: this.getSyncStatusMessage(syncStatus.status, progress, syncStatus.processedProducts, syncStatus.totalProducts)
      })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  }

  syncProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shopDomain } = req.params

      if (!shopDomain || typeof shopDomain !== 'string') {
        res.status(400).json({ error: 'Shop domain is required' })
        return
      }

      const shop = await this.shopService.getShopByDomain(shopDomain)
      if (!shop) {
        res.status(404).json({ error: 'Shop not found' })
        return
      }

      const count = await this.shopService.syncProducts(
        shop.id,
        shop.shopDomain,
        shop.accessToken
      )

      res.json({
        success: true,
        shop: shop.shopDomain,
        productsImported: count,
        message: 'Products synced successfully',
      })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  }

  registerShop = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🟢 Shop registration request received from Shopify app')
      console.log('Request body:', req.body)

      const { shop, accessToken } = req.body

      if (!shop || typeof shop !== 'string') {
        console.log('❌ Missing shop parameter')
        res.status(400).json({ error: 'Shop domain is required' })
        return
      }

      if (!accessToken || typeof accessToken !== 'string') {
        console.log('❌ Missing accessToken parameter')
        res.status(400).json({ error: 'Access token is required' })
        return
      }

      console.log('✅ Registering shop:', shop)

      const existingShop = await this.shopService.getShopByDomain(shop)

      let shopRecord
      if (existingShop) {
        console.log('📝 Updating existing shop')
        shopRecord = await this.shopService.updateShop(existingShop.id, {
          accessToken,
          isActive: true,
        })
      } else {
        console.log('🆕 Creating new shop')
        shopRecord = await this.shopService.createShop({
          shopDomain: shop,
          accessToken,
        })
      }

      console.log('🔄 Starting product sync...')
      const syncStartTime = Date.now()
      
      const productsImported = await this.shopService.syncProducts(
        shopRecord.id,
        shop,
        accessToken
      )
      
      const syncTime = Date.now() - syncStartTime
      console.log(`⏱️ Product sync completed in ${Math.round(syncTime / 1000 * 100) / 100} seconds (${productsImported} products)`)

      console.log('✅ Shop registered successfully. Products imported:', productsImported)

      res.json({
        success: true,
        shop: shop,
        productsImported,
        message: 'Shop registered and products synced successfully',
      })
    } catch (error) {
      console.error('❌ Error in registerShop:', error)
      res.status(500).json({ error: (error as Error).message })
    }
  }

  uninstallShop = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shopDomain } = req.params

      if (!shopDomain || typeof shopDomain !== 'string') {
        res.status(400).json({ error: 'Shop domain is required' })
        return
      }

      console.log('🔴 Uninstalling shop:', shopDomain)

      await this.shopService.uninstallShop(shopDomain)

      console.log('✅ Shop uninstalled successfully')

      res.json({
        success: true,
        shop: shopDomain,
        message: 'Shop uninstalled successfully',
      })
    } catch (error) {
      console.error('❌ Error in uninstallShop:', error)
      res.status(500).json({ error: (error as Error).message })
    }
  }

  private getSyncStatusMessage(status: string, progress: number, processed: number, total: number): string {
    switch (status) {
      case 'idle':
        return 'No sync in progress'
      case 'fetching':
        return `Fetching products from Shopify... (${processed} fetched)`
      case 'importing':
        return `Importing products to database... (${processed}/${total} - ${progress}%)`
      case 'completed':
        return `Sync completed successfully! ${processed} products imported`
      case 'error':
        return 'Sync failed with error'
      default:
        return 'Unknown status'
    }
  }
}
