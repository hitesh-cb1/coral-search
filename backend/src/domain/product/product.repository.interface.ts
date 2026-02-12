import { Product, CreateProductInput } from './product.types'

// Repository interface - persistence agnostic
export interface IProductRepository {
  create(input: CreateProductInput): Promise<Product>
  bulkUpsert(products: CreateProductInput[], onProgress?: (processed: number) => void): Promise<number>
  findByShopId(shopId: number): Promise<Product[]>
  findByShopifyProductId(shopId: number, shopifyProductId: string): Promise<Product | null>
  deleteByShopId(shopId: number): Promise<number>
}
