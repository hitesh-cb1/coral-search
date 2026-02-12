export interface ShopifyInstallResponseDTO {
  success: boolean
  shop: string
  productsImported: number
  message: string
}

export interface ShopifyProductsResponseDTO {
  shop: string
  products: ShopifyProductDTO[]
  total: number
}

export interface ShopifyProductDTO {
  id: number
  shopifyProductId: string
  title: string
  description: string | null
  vendor: string | null
  productType: string | null
  handle: string
  status: string
  tags: string | null
  variants: ShopifyProductVariantDTO[]
  images: ShopifyProductImageDTO[]
  options: ShopifyProductOptionDTO[]
}

export interface ShopifyProductVariantDTO {
  id: number
  title: string
  sku: string | null
  price: string
  compareAtPrice: string | null
  inventoryQuantity: number | null
}

export interface ShopifyProductImageDTO {
  id: number
  src: string
  alt: string | null
  position: number
}

export interface ShopifyProductOptionDTO {
  id: number
  name: string
  values: string[]
}
