import { Shop, CreateShopInput, UpdateShopInput } from './shop.types'

// Repository interface - persistence agnostic
export interface IShopRepository {
  create(input: CreateShopInput): Promise<Shop>
  findByDomain(shopDomain: string): Promise<Shop | null>
  findById(id: number): Promise<Shop | null>
  update(id: number, input: UpdateShopInput): Promise<Shop>
  delete(id: number): Promise<void>
}
