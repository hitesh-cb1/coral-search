// Common shared types
export type Nullable<T> = T | null

export interface PaginationParams {
  skip?: number
  take?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  skip: number
  take: number
}
