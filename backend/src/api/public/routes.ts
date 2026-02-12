import { Router } from 'express'
import { getShopifyController } from '../../bootstrap/controllers'

const shopifyController = getShopifyController()

export const publicRoutes = Router()

publicRoutes.get('/shopify/:shopDomain/products', shopifyController.getProducts)
publicRoutes.get('/shopify/:shopDomain/sync-status', shopifyController.getSyncStatus)
publicRoutes.post('/shopify/:shopDomain/sync', shopifyController.syncProducts)
publicRoutes.post('/shopify/register', shopifyController.registerShop)
publicRoutes.post('/shopify/:shopDomain/uninstall', shopifyController.uninstallShop)
