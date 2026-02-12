import {
  ShopifyProduct as PrismaShopifyProduct,
  ShopifyProductVariant as PrismaShopifyProductVariant,
  ShopifyProductImage as PrismaShopifyProductImage,
  ShopifyProductOption as PrismaShopifyProductOption,
} from '../../../../prisma/generated/client'
import {
  Product,
  ProductVariant,
  ProductImage,
  ProductOption,
} from '../../../domain/product/product.types'

type PrismaProductWithRelations = PrismaShopifyProduct & {
  variants: PrismaShopifyProductVariant[]
  images: PrismaShopifyProductImage[]
  options: PrismaShopifyProductOption[]
}

export class ProductMapper {
  static toDomain(prismaProduct: PrismaProductWithRelations): Product {
    return {
      id: prismaProduct.id,
      shopifyProductId: prismaProduct.shopifyProductId,
      shopId: prismaProduct.shopId,
      title: prismaProduct.title,
      description: prismaProduct.description,
      vendor: prismaProduct.vendor,
      productType: prismaProduct.productType,
      handle: prismaProduct.handle,
      status: prismaProduct.status,
      publishedAt: prismaProduct.publishedAt,
      shopifyCreatedAt: prismaProduct.shopifyCreatedAt,
      shopifyUpdatedAt: prismaProduct.shopifyUpdatedAt,
      tags: prismaProduct.tags,
      variants: prismaProduct.variants.map((v) => ProductMapper.variantToDomain(v)),
      images: prismaProduct.images.map((img) => ProductMapper.imageToDomain(img)),
      options: prismaProduct.options.map((opt) => ProductMapper.optionToDomain(opt)),
      createdAt: prismaProduct.createdAt,
      updatedAt: prismaProduct.updatedAt,
    }
  }

  static variantToDomain(prismaVariant: PrismaShopifyProductVariant): ProductVariant {
    return {
      id: prismaVariant.id,
      shopifyVariantId: prismaVariant.shopifyVariantId,
      productId: prismaVariant.productId,
      title: prismaVariant.title,
      sku: prismaVariant.sku,
      barcode: prismaVariant.barcode,
      price: prismaVariant.price,
      compareAtPrice: prismaVariant.compareAtPrice,
      inventoryQuantity: prismaVariant.inventoryQuantity,
      inventoryPolicy: prismaVariant.inventoryPolicy,
      weight: prismaVariant.weight,
      weightUnit: prismaVariant.weightUnit,
      position: prismaVariant.position,
      requiresShipping: prismaVariant.requiresShipping,
      taxable: prismaVariant.taxable,
      createdAt: prismaVariant.createdAt,
      updatedAt: prismaVariant.updatedAt,
    }
  }

  static imageToDomain(prismaImage: PrismaShopifyProductImage): ProductImage {
    return {
      id: prismaImage.id,
      shopifyImageId: prismaImage.shopifyImageId,
      productId: prismaImage.productId,
      src: prismaImage.src,
      alt: prismaImage.alt,
      position: prismaImage.position,
      width: prismaImage.width,
      height: prismaImage.height,
      createdAt: prismaImage.createdAt,
      updatedAt: prismaImage.updatedAt,
    }
  }

  static optionToDomain(prismaOption: PrismaShopifyProductOption): ProductOption {
    return {
      id: prismaOption.id,
      shopifyOptionId: prismaOption.shopifyOptionId,
      productId: prismaOption.productId,
      name: prismaOption.name,
      position: prismaOption.position,
      values: prismaOption.values, // Already a JSON string
      createdAt: prismaOption.createdAt,
      updatedAt: prismaOption.updatedAt,
    }
  }
}
