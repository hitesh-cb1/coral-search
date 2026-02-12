// Domain types - database agnostic
export interface Shop {
  id: number
  shopDomain: string
  accessToken: string
  isActive: boolean
  installedAt: Date
  updatedAt: Date
}

export interface CreateShopInput {
  shopDomain: string
  accessToken: string
}

export interface UpdateShopInput {
  accessToken?: string
  isActive?: boolean
}
