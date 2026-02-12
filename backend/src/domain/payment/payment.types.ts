export interface CreditTransaction {
  id: number
  userId: number
  type: 'purchase' | 'free_tier' | 'refund'
  amount: number // Tokens purchased/added
  cost: number | null // Cost in USD (null for free tier)
  currency: string
  paymentProvider: string | null // "stripe", "paypal", etc.
  paymentId: string | null // External payment ID
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded' | null
  description: string | null
  metadata: Record<string, any> | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateCreditTransactionInput {
  userId: number
  type: 'purchase' | 'free_tier' | 'refund'
  amount: number
  cost?: number | null
  currency?: string
  paymentProvider?: string | null
  paymentId?: string | null
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded' | null
  description?: string | null
  metadata?: Record<string, any> | null
}

export interface CreateCheckoutSessionInput {
  userId: number
  amountCents: number // Amount in cents (e.g., 500 = $5.00)
}

export interface CheckoutSessionResult {
  sessionId: string
  url: string
}

