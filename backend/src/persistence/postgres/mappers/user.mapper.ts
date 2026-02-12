import { User as PrismaUser } from '../../../../prisma/generated/client'
import { User, UserWithAuth } from '../../../domain/user/user.types'

export class UserMapper {
  static toDomain(prismaUser: PrismaUser): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      firstName: prismaUser.firstName || undefined,
      lastName: prismaUser.lastName || undefined,
      isActive: prismaUser.isActive,
      emailVerified: prismaUser.emailVerified,
      isVerified: prismaUser.isVerified,
      verificationToken: prismaUser.verificationToken || undefined,
      verificationTokenExpiry: prismaUser.verificationTokenExpiry || undefined,
      passwordResetToken: prismaUser.passwordResetToken || undefined,
      passwordResetTokenExpiry: prismaUser.passwordResetTokenExpiry || undefined,
      tokenBalance: Number(prismaUser.tokenBalance), // Convert BigInt to number
      stripeCustomerId: prismaUser.stripeCustomerId || null,
      monthlyBudgetLimit: prismaUser.monthlyBudgetLimit ? Number(prismaUser.monthlyBudgetLimit) : null,
      dailyBudgetLimit: prismaUser.dailyBudgetLimit ? Number(prismaUser.dailyBudgetLimit) : null,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    }
  }

  static toDomainWithAuth(prismaUser: PrismaUser): UserWithAuth {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      firstName: prismaUser.firstName || undefined,
      lastName: prismaUser.lastName || undefined,
      isActive: prismaUser.isActive,
      emailVerified: prismaUser.emailVerified,
      isVerified: prismaUser.isVerified,
      verificationToken: prismaUser.verificationToken || undefined,
      verificationTokenExpiry: prismaUser.verificationTokenExpiry || undefined,
      passwordResetToken: prismaUser.passwordResetToken || undefined,
      passwordResetTokenExpiry: prismaUser.passwordResetTokenExpiry || undefined,
      tokenBalance: Number(prismaUser.tokenBalance), // Convert BigInt to number
      passwordHash: prismaUser.passwordHash || undefined,
      googleId: prismaUser.googleId || undefined,
      awsId: prismaUser.awsId || undefined,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    }
  }
}