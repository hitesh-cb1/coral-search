import { User, CreateUserInput, UpdateUserInput, UserWithAuth } from './user.types'

export interface IUserRepository {
  // Basic CRUD
  create(input: CreateUserInput): Promise<User>
  findById(id: number): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  update(id: number, input: UpdateUserInput): Promise<User>
  delete(id: number): Promise<void>

  // Authentication specific
  findByEmailWithAuth(email: string): Promise<UserWithAuth | null>
  findByGoogleId(googleId: string): Promise<User | null>
  findByAwsId(awsId: string): Promise<User | null>

  // Token balance management (account-level freemium)
  getTokenBalance(userId: number): Promise<number>
  deductTokens(userId: number, tokens: number): Promise<void>
  addTokens(userId: number, tokens: number): Promise<void>

  // Budget management
  getMonthlyBudgetLimit(userId: number): Promise<number | null>
  updateMonthlyBudgetLimit(userId: number, limit: number | null): Promise<void>

  // Stripe Customer management
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<void>

  // Email verification for Try API flow
  findByVerificationToken(token: string): Promise<UserWithAuth | null>

  // Password reset
  findByPasswordResetToken(token: string): Promise<UserWithAuth | null>

  // Admin queries
  findAll(limit?: number, offset?: number): Promise<User[]>
  countUsers(): Promise<number>
}