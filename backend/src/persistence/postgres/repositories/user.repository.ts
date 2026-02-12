import { getPrismaClient } from '../client'
import { IUserRepository } from '../../../domain/user/user.repository.interface'
import { User, CreateUserInput, UpdateUserInput, UserWithAuth } from '../../../domain/user/user.types'
import { UserMapper } from '../mappers/user.mapper'

export class PostgresUserRepository implements IUserRepository {
  private prisma = getPrismaClient()

  async create(input: CreateUserInput): Promise<User> {
    const prismaUser = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.password,
        firstName: input.firstName,
        lastName: input.lastName,
        googleId: input.googleId,
        awsId: input.awsId,
        emailVerified: input.emailVerified || false,
        isVerified: input.isVerified || false,
        verificationToken: input.verificationToken,
        verificationTokenExpiry: input.verificationTokenExpiry,
        // Initialize with free tier tokens (defaults to config value if not provided)
        tokenBalance: input.tokenBalance ?? 100000000, // Prisma accepts number and converts to BigInt internally
      },
    })

    return UserMapper.toDomain(prismaUser)
  }

  async findById(id: number): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { id },
    })

    return prismaUser ? UserMapper.toDomain(prismaUser) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { email },
    })

    return prismaUser ? UserMapper.toDomain(prismaUser) : null
  }

  async findByEmailWithAuth(email: string): Promise<UserWithAuth | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { email },
    })

    return prismaUser ? UserMapper.toDomainWithAuth(prismaUser) : null
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { googleId },
    })

    return prismaUser ? UserMapper.toDomain(prismaUser) : null
  }

  async findByAwsId(awsId: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { awsId },
    })

    return prismaUser ? UserMapper.toDomain(prismaUser) : null
  }

  async update(id: number, input: UpdateUserInput): Promise<User> {
    const prismaUser = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        isActive: input.isActive,
        emailVerified: input.emailVerified,
        isVerified: input.isVerified,
        verificationToken: input.verificationToken,
        verificationTokenExpiry: input.verificationTokenExpiry,
        passwordResetToken: input.passwordResetToken,
        passwordResetTokenExpiry: input.passwordResetTokenExpiry,
        passwordHash: input.passwordHash,
        googleId: input.googleId,
        awsId: input.awsId,
        stripeCustomerId: input.stripeCustomerId,
        monthlyBudgetLimit: input.monthlyBudgetLimit,
        tokenBalance: input.tokenBalance,
      },
    })

    return UserMapper.toDomain(prismaUser)
  }

  async delete(id: number): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    })
  }

  async findAll(limit = 50, offset = 0): Promise<User[]> {
    const prismaUsers = await this.prisma.user.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    })

    return prismaUsers.map(UserMapper.toDomain)
  }

  async countUsers(): Promise<number> {
    return this.prisma.user.count()
  }

  async getTokenBalance(userId: number): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tokenBalance: true },
    })
    return user?.tokenBalance ? Number(user.tokenBalance) : 0 // Convert BigInt to number
  }

  async deductTokens(userId: number, tokens: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        tokenBalance: {
          decrement: tokens,
        },
      },
    })
  }

  async addTokens(userId: number, tokens: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        tokenBalance: {
          increment: tokens,
        },
      },
    })
  }

  async getMonthlyBudgetLimit(userId: number): Promise<number | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { monthlyBudgetLimit: true },
    })
    return user?.monthlyBudgetLimit ? Number(user.monthlyBudgetLimit) : null
  }

  async updateMonthlyBudgetLimit(userId: number, limit: number | null): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        monthlyBudgetLimit: limit,
      },
    })
  }

  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        stripeCustomerId,
      },
    })
  }

  async findByVerificationToken(token: string): Promise<UserWithAuth | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { verificationToken: token },
    })

    return prismaUser ? UserMapper.toDomainWithAuth(prismaUser) : null
  }

  async findByPasswordResetToken(token: string): Promise<UserWithAuth | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { passwordResetToken: token },
    })

    return prismaUser ? UserMapper.toDomainWithAuth(prismaUser) : null
  }
}