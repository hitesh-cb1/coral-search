import { IProductRepository } from './product.repository.interface'
import { Product, CreateProductInput } from './product.types'
import { ShopifyProduct } from '../../integrations/shopify/shopify.types'

// Business logic - handles product operations
export class ProductService {
  constructor(private readonly productRepository: IProductRepository) {}

  async bulkImportFromShopify(
    shopId: number, 
    shopifyProducts: ShopifyProduct[],
    onProgress?: (processed: number) => void
  ): Promise<number> {
    // Transform Shopify products to domain format
    const products: CreateProductInput[] = shopifyProducts.map((sp) => ({
      shopifyProductId: sp.id.toString(),
      shopId,
      title: sp.title,
      description: sp.body_html || undefined,
      vendor: sp.vendor,
      productType: sp.product_type,
      handle: sp.handle,
      status: sp.status,
      publishedAt: sp.published_at ? new Date(sp.published_at) : undefined,
      shopifyCreatedAt: new Date(sp.created_at),
      shopifyUpdatedAt: new Date(sp.updated_at),
      tags: sp.tags,
      
      // Transform variants
      variants: sp.variants.map((v) => ({
        shopifyVariantId: v.id.toString(),
        title: v.title,
        sku: v.sku || undefined,
        barcode: v.barcode || undefined,
        price: v.price,
        compareAtPrice: v.compare_at_price || undefined,
        inventoryQuantity: v.inventory_quantity || undefined,
        inventoryPolicy: v.inventory_policy,
        weight: v.weight || undefined,
        weightUnit: v.weight_unit,
        position: v.position,
        requiresShipping: v.requires_shipping,
        taxable: v.taxable,
      })),
      
      // Transform images
      images: sp.images.map((img) => ({
        shopifyImageId: img.id.toString(),
        src: img.src,
        alt: img.alt || undefined,
        position: img.position,
        width: img.width || undefined,
        height: img.height || undefined,
      })),
      
      // Transform options
      options: sp.options.map((opt) => ({
        shopifyOptionId: opt.id.toString(),
        name: opt.name,
        position: opt.position,
        values: opt.values,
      })),
    }))

    // Bulk upsert products with progress tracking
    const count = await this.productRepository.bulkUpsert(products, onProgress)

    return count
  }

  async getProductsByShop(shopId: number): Promise<Product[]> {
    return this.productRepository.findByShopId(shopId)
  }

  async getProductByShopifyId(shopId: number, shopifyProductId: string): Promise<Product | null> {
    return this.productRepository.findByShopifyProductId(shopId, shopifyProductId)
  }
}
