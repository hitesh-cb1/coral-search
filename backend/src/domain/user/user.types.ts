// Domain types for user management (database-agnostic)

export interface User {
  id: number
  email: string
  firstName?: string
  lastName?: string
  isActive: boolean
  emailVerified: boolean
  isVerified: boolean // Try API flow: true after email verification
  verificationToken?: string | null
  verificationTokenExpiry?: Date | null
  passwordResetToken?: string | null
  passwordResetTokenExpiry?: Date | null
  tokenBalance: number
  stripeCustomerId?: string | null
  monthlyBudgetLimit?: number | null
  dailyBudgetLimit?: number | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserInput {
  email: string
  password?: string // Optional for OAuth users
  firstName?: string
  lastName?: string
  googleId?: string
  awsId?: string
  emailVerified?: boolean
  isVerified?: boolean
  verificationToken?: string | null
  verificationTokenExpiry?: Date | null
  tokenBalance?: number // Optional - defaults to free tier amount
}

export interface UpdateUserInput {
  email?: string
  firstName?: string
  lastName?: string
  isActive?: boolean
  emailVerified?: boolean
  isVerified?: boolean
  verificationToken?: string | null
  verificationTokenExpiry?: Date | null
  passwordResetToken?: string | null
  passwordResetTokenExpiry?: Date | null
  passwordHash?: string
  googleId?: string
  awsId?: string
  stripeCustomerId?: string | null
  monthlyBudgetLimit?: number | null
  dailyBudgetLimit?: number | null
  tokenBalance?: bigint
}

export interface UserWithAuth extends User {
  passwordHash?: string
  googleId?: string
  awsId?: string
}

// Authentication types
export interface LoginInput {
  email: string
  password: string
}

export interface LoginResult {
  user: User
  token: string
}

export interface RegisterInput {
  email: string
  password: string
  firstName?: string
  lastName?: string
  guestApiKey?: string
}

// Google OAuth types
export interface GoogleLoginInput {
  idToken: string
  /** When provided, claim this guest user with Google identity instead of creating a new user */
  guestUserId?: number
}