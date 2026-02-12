// Domain types - database agnostic
export interface Product {
  id: number
  shopifyProductId: string
  shopId: number
  title: string
  description: string | null
  vendor: string | null
  productType: string | null
  handle: string
  status: string
  publishedAt: Date | null
  shopifyCreatedAt: Date | null
  shopifyUpdatedAt: Date | null
  tags: string | null
  variants: ProductVariant[]
  images: ProductImage[]
  options: ProductOption[]
  createdAt: Date
  updatedAt: Date
}

export interface ProductVariant {
  id: number
  shopifyVariantId: string
  productId: number
  title: string
  sku: string | null
  barcode: string | null
  price: string
  compareAtPrice: string | null
  inventoryQuantity: number | null
  inventoryPolicy: string | null
  weight: number | null
  weightUnit: string | null
  position: number
  requiresShipping: boolean
  taxable: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProductImage {
  id: number
  shopifyImageId: string
  productId: number
  src: string
  alt: string | null
  position: number
  width: number | null
  height: number | null
  createdAt: Date
  updatedAt: Date
}

export interface ProductOption {
  id: number
  shopifyOptionId: string
  productId: number
  name: string
  position: number
  values: string // JSON string array
  createdAt: Date
  updatedAt: Date
}

export interface CreateProductInput {
  shopifyProductId: string
  shopId: number
  title: string
  description?: string
  vendor?: string
  productType?: string
  handle: string
  status?: string
  publishedAt?: Date
  shopifyCreatedAt?: Date
  shopifyUpdatedAt?: Date
  tags?: string
  variants: CreateProductVariantInput[]
  images: CreateProductImageInput[]
  options: CreateProductOptionInput[]
}

export interface CreateProductVariantInput {
  shopifyVariantId: string
  title: string
  sku?: string
  barcode?: string
  price: string
  compareAtPrice?: string
  inventoryQuantity?: number
  inventoryPolicy?: string
  weight?: number
  weightUnit?: string
  position?: number
  requiresShipping?: boolean
  taxable?: boolean
}

export interface CreateProductImageInput {
  shopifyImageId: string
  src: string
  alt?: string
  position?: number
  width?: number
  height?: number
}

export interface CreateProductOptionInput {
  shopifyOptionId: string
  name: string
  position?: number
  values: string[] // Will be JSON stringified
}

export interface BulkCreateProductInput {
  products: CreateProductInput[]
}
