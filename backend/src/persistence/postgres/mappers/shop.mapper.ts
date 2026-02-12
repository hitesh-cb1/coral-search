import { ShopifyShop as PrismaShopifyShop } from '../../../../prisma/generated/client'
import { Shop } from '../../../domain/shop/shop.types'

export class ShopMapper {
  static toDomain(prismaShop: PrismaShopifyShop): Shop {
    return {
      id: prismaShop.id,
      shopDomain: prismaShop.shopDomain,
      accessToken: prismaShop.accessToken,
      isActive: prismaShop.isActive,
      installedAt: prismaShop.installedAt,
      updatedAt: prismaShop.updatedAt,
    }
  }
}
