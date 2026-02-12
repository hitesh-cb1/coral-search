import { IProductRepository } from '../../../domain/product/product.repository.interface'
import { Product, CreateProductInput } from '../../../domain/product/product.types'
import { getPrismaClient } from '../client'
import { ProductMapper } from '../mappers/product.mapper'

// Postgres implementation of product repository
export class PostgresProductRepository implements IProductRepository {
  private prisma = getPrismaClient()

  async create(input: CreateProductInput): Promise<Product> {
    const prismaProduct = await this.prisma.shopifyProduct.create({
      data: {
        shopifyProductId: input.shopifyProductId,
        shopId: input.shopId,
        title: input.title,
        description: input.description,
        vendor: input.vendor,
        productType: input.productType,
        handle: input.handle,
        status: input.status || 'active',
        publishedAt: input.publishedAt,
        shopifyCreatedAt: input.shopifyCreatedAt,
        shopifyUpdatedAt: input.shopifyUpdatedAt,
        tags: input.tags,
        
        // Create nested variants
        variants: {
          create: input.variants.map((v) => ({
            shopifyVariantId: v.shopifyVariantId,
            title: v.title,
            sku: v.sku,
            barcode: v.barcode,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            inventoryQuantity: v.inventoryQuantity,
            inventoryPolicy: v.inventoryPolicy,
            weight: v.weight,
            weightUnit: v.weightUnit,
            position: v.position || 1,
            requiresShipping: v.requiresShipping ?? true,
            taxable: v.taxable ?? true,
          })),
        },
        
        // Create nested images
        images: {
          create: input.images.map((img) => ({
            shopifyImageId: img.shopifyImageId,
            src: img.src,
            alt: img.alt,
            position: img.position || 1,
            width: img.width,
            height: img.height,
          })),
        },
        
        // Create nested options
        options: {
          create: input.options.map((opt) => ({
            shopifyOptionId: opt.shopifyOptionId,
            name: opt.name,
            position: opt.position || 1,
            values: JSON.stringify(opt.values),
          })),
        },
      },
      include: {
        variants: true,
        images: true,
        options: true,
      },
    })

    return ProductMapper.toDomain(prismaProduct)
  }

  async bulkUpsert(products: CreateProductInput[], onProgress?: (processed: number) => void): Promise<number> {
    // Process each product in a transaction
    let count = 0
    
    for (const product of products) {
      await this.prisma.$transaction(async (tx) => {
        // Upsert the product
        const upsertedProduct = await tx.shopifyProduct.upsert({
          where: {
            shopId_shopifyProductId: {
              shopId: product.shopId,
              shopifyProductId: product.shopifyProductId,
            },
          },
          update: {
            title: product.title,
            description: product.description,
            vendor: product.vendor,
            productType: product.productType,
            handle: product.handle,
            status: product.status || 'active',
            publishedAt: product.publishedAt,
            shopifyCreatedAt: product.shopifyCreatedAt,
            shopifyUpdatedAt: product.shopifyUpdatedAt,
            tags: product.tags,
          },
          create: {
            shopifyProductId: product.shopifyProductId,
            shopId: product.shopId,
            title: product.title,
            description: product.description,
            vendor: product.vendor,
            productType: product.productType,
            handle: product.handle,
            status: product.status || 'active',
            publishedAt: product.publishedAt,
            shopifyCreatedAt: product.shopifyCreatedAt,
            shopifyUpdatedAt: product.shopifyUpdatedAt,
            tags: product.tags,
          },
        })

        // Delete existing variants, images, options (will be recreated)
        await tx.shopifyProductVariant.deleteMany({
          where: { productId: upsertedProduct.id },
        })
        await tx.shopifyProductImage.deleteMany({
          where: { productId: upsertedProduct.id },
        })
        await tx.shopifyProductOption.deleteMany({
          where: { productId: upsertedProduct.id },
        })

        // Create new variants
        if (product.variants.length > 0) {
          await tx.shopifyProductVariant.createMany({
            data: product.variants.map((v) => ({
              productId: upsertedProduct.id,
              shopifyVariantId: v.shopifyVariantId,
              title: v.title,
              sku: v.sku,
              barcode: v.barcode,
              price: v.price,
              compareAtPrice: v.compareAtPrice,
              inventoryQuantity: v.inventoryQuantity,
              inventoryPolicy: v.inventoryPolicy,
              weight: v.weight,
              weightUnit: v.weightUnit,
              position: v.position || 1,
              requiresShipping: v.requiresShipping ?? true,
              taxable: v.taxable ?? true,
            })),
          })
        }

        // Create new images
        if (product.images.length > 0) {
          await tx.shopifyProductImage.createMany({
            data: product.images.map((img) => ({
              productId: upsertedProduct.id,
              shopifyImageId: img.shopifyImageId,
              src: img.src,
              alt: img.alt,
              position: img.position || 1,
              width: img.width,
              height: img.height,
            })),
          })
        }

        // Create new options
        if (product.options.length > 0) {
          await tx.shopifyProductOption.createMany({
            data: product.options.map((opt) => ({
              productId: upsertedProduct.id,
              shopifyOptionId: opt.shopifyOptionId,
              name: opt.name,
              position: opt.position || 1,
              values: JSON.stringify(opt.values),
            })),
          })
        }

        count++
        
        // Call progress callback
        if (onProgress) {
          onProgress(count)
        }
      })
    }

    return count
  }

  async findByShopId(shopId: number): Promise<Product[]> {
    const products = await this.prisma.shopifyProduct.findMany({
      where: { shopId },
      include: {
        variants: { orderBy: { position: 'asc' } },
        images: { orderBy: { position: 'asc' } },
        options: { orderBy: { position: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return products.map(ProductMapper.toDomain)
  }

  async findByShopifyProductId(
    shopId: number,
    shopifyProductId: string
  ): Promise<Product | null> {
    const product = await this.prisma.shopifyProduct.findUnique({
      where: {
        shopId_shopifyProductId: {
          shopId,
          shopifyProductId,
        },
      },
      include: {
        variants: { orderBy: { position: 'asc' } },
        images: { orderBy: { position: 'asc' } },
        options: { orderBy: { position: 'asc' } },
      },
    })

    return product ? ProductMapper.toDomain(product) : null
  }

  async deleteByShopId(shopId: number): Promise<number> {
    const result = await this.prisma.shopifyProduct.deleteMany({
      where: { shopId },
    })

    return result.count
  }
}
