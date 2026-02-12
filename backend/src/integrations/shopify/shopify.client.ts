import {
  ShopifyProduct,
  ShopifyProductsResponse,
} from './shopify.types'

export class ShopifyClient {
  private readonly apiVersion = '2024-01'

  async getProducts(
    shop: string, 
    accessToken: string,
    onProgress?: (fetched: number, total?: number) => void
  ): Promise<ShopifyProduct[]> {
    const allProducts: ShopifyProduct[] = []
    let pageInfo: string | null = null
    let hasNextPage = true
    let totalFetched = 0

    while (hasNextPage) {
      const url = this.buildProductsUrl(shop, pageInfo)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`)
      }

      const data = await response.json() as ShopifyProductsResponse
      allProducts.push(...data.products)
      totalFetched += data.products.length

      // Call progress callback
      if (onProgress) {
        onProgress(totalFetched)
      }

      const linkHeader = response.headers.get('Link')
      if (linkHeader && linkHeader.includes('rel="next"')) {
        pageInfo = this.extractPageInfo(linkHeader)
      } else {
        hasNextPage = false
      }
    }

    return allProducts
  }

  private buildProductsUrl(shop: string, pageInfo: string | null): string {
    const baseUrl = `https://${shop}/admin/api/${this.apiVersion}/products.json`
    if (pageInfo) {
      return `${baseUrl}?page_info=${pageInfo}&limit=250`
    }
    return `${baseUrl}?limit=250`
  }

  private extractPageInfo(linkHeader: string): string | null {
    const match = linkHeader.match(/page_info=([^&>]+)/)
    return match ? match[1] : null
  }
}
