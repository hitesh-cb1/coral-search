export type LogLevel = 'info' | 'error' | 'warn' | 'debug'

export interface LogContext {
  shopId?: string
  shopDomain?: string
  requestId?: string
  [key: string]: any
}
