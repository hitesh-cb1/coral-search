import { getPrismaClient } from '../client'
import { IPaymentRepository } from '../../../domain/payment/payment.repository.interface'
import { CreditTransaction, CreateCreditTransactionInput } from '../../../domain/payment/payment.types'

export class PostgresPaymentRepository implements IPaymentRepository {
  private prisma = getPrismaClient()

  async createTransaction(input: CreateCreditTransactionInput): Promise<CreditTransaction> {
    const prismaTransaction = await this.prisma.creditTransaction.create({
      data: {
        userId: input.userId,
        type: input.type,
        amount: input.amount, // Prisma accepts number and converts to BigInt internally
        cost: input.cost !== undefined ? input.cost : null,
        currency: input.currency || 'USD',
        paymentProvider: input.paymentProvider || null,
        paymentId: input.paymentId || null,
        paymentStatus: input.paymentStatus || null,
        description: input.description || null,
        metadata: input.metadata || undefined,
      },
    })

    return this.toDomain(prismaTransaction)
  }

  async findTransactionById(id: number): Promise<CreditTransaction | null> {
    const prismaTransaction = await this.prisma.creditTransaction.findUnique({
      where: { id },
    })

    return prismaTransaction ? this.toDomain(prismaTransaction) : null
  }

  async findTransactionByPaymentId(paymentId: string): Promise<CreditTransaction | null> {
    const prismaTransaction = await this.prisma.creditTransaction.findFirst({
      where: { paymentId },
    })

    return prismaTransaction ? this.toDomain(prismaTransaction) : null
  }

  async findTransactionsByUser(userId: number, limit: number = 50): Promise<CreditTransaction[]> {
    const prismaTransactions = await this.prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return prismaTransactions.map(t => this.toDomain(t))
  }

  async updateTransactionStatus(
    id: number,
    status: 'pending' | 'completed' | 'failed' | 'refunded'
  ): Promise<CreditTransaction> {
    const prismaTransaction = await this.prisma.creditTransaction.update({
      where: { id },
      data: { paymentStatus: status },
    })

    return this.toDomain(prismaTransaction)
  }

  async updateTransactionPaymentId(id: number, paymentId: string): Promise<CreditTransaction> {
    const prismaTransaction = await this.prisma.creditTransaction.update({
      where: { id },
      data: { paymentId },
    })

    return this.toDomain(prismaTransaction)
  }

  private toDomain(prismaTransaction: any): CreditTransaction {
    return {
      id: prismaTransaction.id,
      userId: prismaTransaction.userId,
      type: prismaTransaction.type as 'purchase' | 'free_tier' | 'refund',
      amount: Number(prismaTransaction.amount), // Convert BigInt to number
      cost: prismaTransaction.cost ? Number(prismaTransaction.cost) : null,
      currency: prismaTransaction.currency,
      paymentProvider: prismaTransaction.paymentProvider,
      paymentId: prismaTransaction.paymentId,
      paymentStatus: prismaTransaction.paymentStatus as 'pending' | 'completed' | 'failed' | 'refunded' | null,
      description: prismaTransaction.description,
      metadata: prismaTransaction.metadata as Record<string, any> | null,
      createdAt: prismaTransaction.createdAt,
      updatedAt: prismaTransaction.updatedAt,
    }
  }
}

