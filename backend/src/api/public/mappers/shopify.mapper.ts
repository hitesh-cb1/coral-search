// Maps between API DTOs and Domain types
import { Product } from '../../../domain/product/product.types'
import {
  ShopifyProductDTO,
  ShopifyProductVariantDTO,
  ShopifyProductImageDTO,
  ShopifyProductOptionDTO,
} from '../dtos/shopify.dto'

export class ShopifyApiMapper {
  static productToDTO(product: Product): ShopifyProductDTO {
    return {
      id: product.id,
      shopifyProductId: product.shopifyProductId,
      title: product.title,
      description: product.description,
      vendor: product.vendor,
      productType: product.productType,
      handle: product.handle,
      status: product.status,
      tags: product.tags,
      variants: product.variants.map(this.variantToDTO),
      images: product.images.map(this.imageToDTO),
      options: product.options.map(this.optionToDTO),
    }
  }

  static variantToDTO(variant: any): ShopifyProductVariantDTO {
    return {
      id: variant.id,
      title: variant.title,
      sku: variant.sku,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      inventoryQuantity: variant.inventoryQuantity,
    }
  }

  static imageToDTO(image: any): ShopifyProductImageDTO {
    return {
      id: image.id,
      src: image.src,
      alt: image.alt,
      position: image.position,
    }
  }

  static optionToDTO(option: any): ShopifyProductOptionDTO {
    return {
      id: option.id,
      name: option.name,
      values: JSON.parse(option.values), // Parse JSON string to array
    }
  }

  static productsToDTO(products: Product[]): ShopifyProductDTO[] {
    return products.map(this.productToDTO)
  }
}
