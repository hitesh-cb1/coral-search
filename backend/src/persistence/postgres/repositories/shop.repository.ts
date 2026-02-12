import { IShopRepository } from '../../../domain/shop/shop.repository.interface'
import { Shop, CreateShopInput, UpdateShopInput } from '../../../domain/shop/shop.types'
import { getPrismaClient } from '../client'
import { ShopMapper } from '../mappers/shop.mapper'

// Postgres implementation of shop repository
export class PostgresShopRepository implements IShopRepository {
  private prisma = getPrismaClient()

  async create(input: CreateShopInput): Promise<Shop> {
    const prismaShop = await this.prisma.shopifyShop.create({
      data: {
        shopDomain: input.shopDomain,
        accessToken: input.accessToken,
      },
    })

    return ShopMapper.toDomain(prismaShop)
  }

  async findByDomain(shopDomain: string): Promise<Shop | null> {
    const shop = await this.prisma.shopifyShop.findUnique({
      where: { shopDomain },
    })
    return shop ? ShopMapper.toDomain(shop) : null
  }

  async findById(id: number): Promise<Shop | null> {
    const shop = await this.prisma.shopifyShop.findUnique({
      where: { id },
    })
    return shop ? ShopMapper.toDomain(shop) : null
  }

  async update(id: number, input: UpdateShopInput): Promise<Shop> {
    const prismaShop = await this.prisma.shopifyShop.update({
      where: { id },
      data: input,
    })

    return ShopMapper.toDomain(prismaShop)
  }

  async delete(id: number): Promise<void> {
    await this.prisma.shopifyShop.delete({
      where: { id },
    })
  }
}
