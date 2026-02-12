export interface ShopifyShop {
  id: string
  domain: string
  name: string
  email: string
}

export interface ShopifyWebhook {
  id: string
  topic: string
  address: string
}

export interface ShopifyProduct {
  id: number
  title: string
  body_html: string | null
  vendor: string
  product_type: string
  handle: string
  status: string
  published_at: string | null
  created_at: string
  updated_at: string
  tags: string
  variants: ShopifyVariant[]
  images: ShopifyImage[]
  options: ShopifyOption[]
}

export interface ShopifyVariant {
  id: number
  product_id: number
  title: string
  price: string
  compare_at_price: string | null
  sku: string | null
  barcode: string | null
  inventory_quantity: number | null
  inventory_policy: string
  weight: number | null
  weight_unit: string
  position: number
  requires_shipping: boolean
  taxable: boolean
}

export interface ShopifyImage {
  id: number
  product_id: number
  src: string
  alt: string | null
  position: number
  width: number | null
  height: number | null
}

export interface ShopifyOption {
  id: number
  product_id: number
  name: string
  position: number
  values: string[]
}

export interface ShopifyProductsResponse {
  products: ShopifyProduct[]
}
