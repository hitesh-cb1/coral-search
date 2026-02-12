import { CreditTransaction, CreateCreditTransactionInput } from './payment.types'

export interface IPaymentRepository {
  createTransaction(input: CreateCreditTransactionInput): Promise<CreditTransaction>
  findTransactionById(id: number): Promise<CreditTransaction | null>
  findTransactionByPaymentId(paymentId: string): Promise<CreditTransaction | null>
  findTransactionsByUser(userId: number, limit?: number): Promise<CreditTransaction[]>
  updateTransactionStatus(id: number, status: 'pending' | 'completed' | 'failed' | 'refunded'): Promise<CreditTransaction>
  updateTransactionPaymentId(id: number, paymentId: string): Promise<CreditTransaction>
}

