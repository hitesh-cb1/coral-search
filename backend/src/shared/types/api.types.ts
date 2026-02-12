// API-specific types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ErrorResponse {
  error: string
  code?: string
  statusCode: number
}
