import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { IUserRepository } from './user.repository.interface'
import {
  User,
  CreateUserInput,
  UpdateUserInput,
  LoginInput,
  LoginResult,
  RegisterInput,
  GoogleLoginInput,
  UserWithAuth
} from './user.types'
import { authConfig } from '../../config/auth.config'
import { freemiumConfig } from '../../config/freemium.config'
import { tokenGrants, rateLimitConfig } from '../../config/rate-limit.config'
import { ValidationError, NotFoundError, PasswordNotSetError } from '../../shared/errors/app-error'
import { GoogleOAuthClient, GoogleUserInfo } from '../../integrations/google-oauth/google-oauth.client'
import { getApiKeyService } from '../../bootstrap/services'

export class UserService {
  private googleOAuth?: GoogleOAuthClient

  constructor(private readonly userRepository: IUserRepository) {
    // Initialize Google OAuth client if credentials are available
    try {
      this.googleOAuth = new GoogleOAuthClient()
    } catch (error) {
      // Google OAuth not configured - that's okay, just won't be available
      console.warn('Google OAuth not configured:', (error as Error).message)
    }
  }

  async register(input: RegisterInput, guestUserId?: number): Promise<LoginResult> {
    // Validate input
    await this.validateRegistrationInput(input)

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(input.email)
    if (existingUser) {
      throw new ValidationError('User with this email already exists')
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 12)

    let user: User

    if (guestUserId) {
      // CLAIM ACCOUNT FLOW: Update existing guest user
      const guestUser = await this.userRepository.findById(guestUserId)
      if (!guestUser) {
        // Fallback to creating new user if guest not found (shouldn't happen)
        console.warn(`Guest user ${guestUserId} not found during registration. Creating new user instead.`)
      } else {
        // Generate verification token for email verification
        const verificationToken = crypto.randomBytes(32).toString('hex')
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

        // Update the guest user to be a real user (but still require email verification)
        user = await this.userRepository.update(guestUserId, {
          email: input.email.toLowerCase().trim(),
          passwordHash: passwordHash,
          firstName: input.firstName?.trim(),
          lastName: input.lastName?.trim(),
          emailVerified: false, // Require email verification
          isVerified: false,   // Require email verification for higher limits
          verificationToken,
          verificationTokenExpiry,
          // meaningful: preserve their token balance!
        })

        // Generate JWT token
        const token = this.generateToken(user)
        return { user, token }
      }
    }

    // Generate verification token for email verification
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create user with free tier tokens
    // Users start unverified and must verify email to get higher rate limits
    user = await this.userRepository.create({
      email: input.email.toLowerCase().trim(),
      password: passwordHash,
      firstName: input.firstName?.trim(),
      lastName: input.lastName?.trim(),
      tokenBalance: freemiumConfig.freeTier.initialTokens,
      emailVerified: false, // Start unverified
      isVerified: false,    // Start unverified - must verify email
      verificationToken,
      verificationTokenExpiry,
    })

    // Generate JWT token
    const token = this.generateToken(user)

    return { user, token }
  }

  async login(input: LoginInput): Promise<LoginResult> {
    // Find user with auth data
    const userWithAuth = await this.userRepository.findByEmailWithAuth(input.email.toLowerCase().trim())
    if (!userWithAuth) {
      throw new ValidationError('Invalid email or password')
    }

    // Check if user is active
    if (!userWithAuth.isActive) {
      throw new ValidationError('Account is deactivated')
    }

    // Verify password
    if (!userWithAuth.passwordHash) {
      // User has no password - this happens when they used Try API but didn't complete verification
      throw new PasswordNotSetError(userWithAuth.email)
    }

    const isValidPassword = await bcrypt.compare(input.password, userWithAuth.passwordHash)
    if (!isValidPassword) {
      throw new ValidationError('Invalid email or password')
    }

    // Remove sensitive data
    const { passwordHash, googleId, awsId, ...user } = userWithAuth

    // Generate JWT token
    const token = this.generateToken(user)

    return { user, token }
  }

  async getUserById(id: number): Promise<User> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }
    return user
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email.toLowerCase().trim())
  }

  async getUserByEmailWithAuth(email: string): Promise<UserWithAuth | null> {
    return this.userRepository.findByEmailWithAuth(email.toLowerCase().trim())
  }

  /**
   * Mark a user as verified directly
   * NOTE: This method is deprecated - isVerified should only be set via email verification link
   * Kept for backward compatibility but should not be used in new code
   * @deprecated Use verifyEmailToken instead
   */
  async markUserAsVerified(userId: number): Promise<User> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Only set isVerified via email verification - this method should not be used
    console.warn('markUserAsVerified is deprecated - users should verify via email link')
    
    return this.userRepository.update(userId, {
      isVerified: true,
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    })
  }

  async updateUser(id: number, input: UpdateUserInput): Promise<User> {
    // Check if user exists
    const existingUser = await this.userRepository.findById(id)
    if (!existingUser) {
      throw new NotFoundError('User not found')
    }

    return this.userRepository.update(id, input)
  }

  async googleLogin(input: GoogleLoginInput): Promise<LoginResult> {
    if (!this.googleOAuth) {
      throw new ValidationError('Google OAuth is not configured')
    }

    // Verify Google ID token
    let googleUserInfo: GoogleUserInfo
    try {
      googleUserInfo = await this.googleOAuth.verifyIdToken(input.idToken)
    } catch (error) {
      throw new ValidationError('Invalid Google ID token')
    }

    // Check if user exists with this Google ID
    let user = await this.userRepository.findByGoogleId(googleUserInfo.id)

    if (user) {
      // Existing Google user - just login
      if (!user.isActive) {
        throw new ValidationError('Account is deactivated')
      }
    } else {
      // Check if user exists with this email (link accounts)
      const existingUser = await this.userRepository.findByEmail(googleUserInfo.email)

      if (existingUser) {
        // Link Google account to existing email account
        // Don't change isVerified - user must verify via email link for higher rate limits
        user = await this.userRepository.update(existingUser.id, {
          googleId: googleUserInfo.id,
          emailVerified: googleUserInfo.email_verified, // Google's verification status (for reference)
          // Keep existing isVerified status - don't auto-verify
        })
      } else {
        // Create new user with Google account and free tier tokens
        // Note: emailVerified from Google is just for reference, isVerified must be set via email verification link
        user = await this.userRepository.create({
          email: googleUserInfo.email.toLowerCase().trim(),
          googleId: googleUserInfo.id,
          firstName: googleUserInfo.given_name,
          lastName: googleUserInfo.family_name,
          emailVerified: googleUserInfo.email_verified, // Google's verification status (for reference)
          isVerified: false, // Must verify via email link to get higher rate limits
          tokenBalance: freemiumConfig.freeTier.initialTokens,
        })
      }
    }

    // Generate JWT token
    const token = this.generateToken(user)

    return { user, token }
  }

  async linkGoogleAccount(userId: number, idToken: string): Promise<User> {
    if (!this.googleOAuth) {
      throw new ValidationError('Google OAuth is not configured')
    }

    // Verify Google ID token
    let googleUserInfo: GoogleUserInfo
    try {
      googleUserInfo = await this.googleOAuth.verifyIdToken(idToken)
    } catch (error) {
      throw new ValidationError('Invalid Google ID token')
    }

    // Check if this Google account is already linked to another user
    const existingGoogleUser = await this.userRepository.findByGoogleId(googleUserInfo.id)
    if (existingGoogleUser && existingGoogleUser.id !== userId) {
      throw new ValidationError('This Google account is already linked to another user')
    }

    // Get current user
    const user = await this.getUserById(userId)

    // Verify email matches (security check)
    if (user.email.toLowerCase() !== googleUserInfo.email.toLowerCase()) {
      throw new ValidationError('Google account email does not match your account email')
    }

    // Link Google account
    return this.userRepository.update(userId, {
      googleId: googleUserInfo.id,
      emailVerified: googleUserInfo.email_verified,
    })
  }
  async verifyToken(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, authConfig.jwt.secret) as { userId: number }
      return this.getUserById(decoded.userId)
    } catch (error) {
      throw new ValidationError('Invalid or expired token')
    }
  }

  private generateToken(user: User): string {
    const secret = authConfig.jwt.secret
    if (!secret) {
      throw new Error('JWT secret is not configured')
    }

    return jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      secret,
      {
        expiresIn: '7d' // Use string literal for now
      }
    )
  }

  async getTokenBalance(userId: number): Promise<number> {
    return this.userRepository.getTokenBalance(userId)
  }

  async deductTokens(userId: number, tokens: number): Promise<void> {
    const currentBalance = await this.getTokenBalance(userId)
    if (currentBalance < tokens) {
      throw new ValidationError('Insufficient token balance')
    }
    await this.userRepository.deductTokens(userId, tokens)
  }

  async addTokens(userId: number, tokens: number): Promise<void> {
    await this.userRepository.addTokens(userId, tokens)
  }

  async validateTokenBalance(userId: number, requestedTokens: number): Promise<void> {
    const balance = await this.getTokenBalance(userId)
    if (balance < requestedTokens) {
      throw new ValidationError(`Insufficient token balance. Available: ${balance}, Requested: ${requestedTokens}`)
    }
  }

  async getMonthlyBudgetLimit(userId: number): Promise<number | null> {
    return this.userRepository.getMonthlyBudgetLimit(userId)
  }

  async updateMonthlyBudgetLimit(userId: number, limit: number | null): Promise<void> {
    if (limit !== null && limit < 0) {
      throw new ValidationError('Budget limit must be a positive number')
    }
    await this.userRepository.updateMonthlyBudgetLimit(userId, limit)
  }

  private async validateRegistrationInput(input: RegisterInput): Promise<void> {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(input.email)) {
      throw new ValidationError('Invalid email format')
    }

    // Password validation
    if (input.password.length < authConfig.password.minLength) {
      throw new ValidationError(`Password must be at least ${authConfig.password.minLength} characters long`)
    }

    if (authConfig.password.requireUppercase && !/[A-Z]/.test(input.password)) {
      throw new ValidationError('Password must contain at least one uppercase letter')
    }

    if (authConfig.password.requireLowercase && !/[a-z]/.test(input.password)) {
      throw new ValidationError('Password must contain at least one lowercase letter')
    }

    if (authConfig.password.requireNumbers && !/\d/.test(input.password)) {
      throw new ValidationError('Password must contain at least one number')
    }
  }

  // Try API Flow Methods

  /**
   * Create an unverified user with just email (no password)
   * Used for Try API flow
   */
  async createUnverifiedUser(email: string): Promise<User> {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format')
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email.toLowerCase().trim())
    if (existingUser) {
      throw new ValidationError('User with this email already exists')
    }

    // Create user without password (unverified)
    const user = await this.userRepository.create({
      email: email.toLowerCase().trim(),
      password: undefined, // No password for unverified users
      tokenBalance: 0, // No tokens until verified (will be converted to bigint by repository)
    })

    return user
  }

  /**
   * Create a guest user with a random email
   * Used for Guest API Key flow (zero friction)
   */
  async createGuestUser(): Promise<User> {
    // Generate a unique anonymous email
    const uuid = crypto.randomUUID()
    const email = `guest_${uuid}@anonymous.coralbricks.com`

    // Create user without password (unverified)
    const user = await this.userRepository.create({
      email: email,
      password: undefined,
      tokenBalance: freemiumConfig.freeTier.initialTokens, // Give full 100M tokens to guest
      isVerified: false,
    })

    return user
  }

  /**
   * Set verification token for a user
   */
  async setVerificationToken(userId: number, token: string, expiresAt: Date): Promise<void> {
    await this.userRepository.update(userId, {
      verificationToken: token,
      verificationTokenExpiry: expiresAt,
    })
  }

  /**
   * Validate verification token without completing verification
   * Returns user info if token is valid, throws error otherwise
   */
  async validateVerificationToken(token: string): Promise<{ email: string; isVerified: boolean }> {
    // Find user by verification token
    const user = await this.userRepository.findByVerificationToken(token)

    if (!user) {
      throw new ValidationError('Invalid or expired verification token')
    }

    // Check if token is expired
    if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
      throw new ValidationError('Verification token has expired')
    }

    // Check if already verified
    if (user.isVerified) {
      throw new ValidationError('Email is already verified. This link has already been used.')
    }

    return {
      email: user.email,
      isVerified: user.isVerified,
    }
  }

  /**
   * Verify email token and upgrade user to verified status
   * Updates rate limits only - no token grants
   */
  async verifyEmailToken(token: string): Promise<LoginResult> {
    // Find user by verification token
    const user = await this.userRepository.findByVerificationToken(token)

    if (!user) {
      throw new ValidationError('Invalid or expired verification token')
    }

    // Check if token is expired
    if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
      throw new ValidationError('Verification token has expired')
    }

    // Check if already verified
    if (user.isVerified) {
      throw new ValidationError('Email is already verified')
    }

    // Update user: mark as verified, keep existing token balance
    // Only rate limits are updated, no token grants
    const updatedUser = await this.userRepository.update(user.id, {
      isVerified: true,
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
      // Keep existing token balance - no changes
    })

    // Update rate limits for all API keys belonging to this user
    // This keeps database columns accurate for display purposes
    // Note: Actual rate limiting uses config-based limits, but we update DB for consistency
    const verifiedLimits = rateLimitConfig.verified
    const apiKeyService = getApiKeyService()
    await apiKeyService.updateRateLimitsForUser(
      user.id,
      verifiedLimits.requestsPerSecond,
      BigInt(verifiedLimits.tokensPerMonth)
    )

    // Generate JWT token
    const jwtToken = this.generateToken(updatedUser)

    return { user: updatedUser, token: jwtToken }
  }

  /**
   * Request password reset - generates token
   * Returns the reset token if user exists and has a password, null otherwise
   * (Doesn't reveal if user exists for security)
   */
  async requestPasswordReset(email: string): Promise<string | null> {
    const user = await this.userRepository.findByEmail(email.toLowerCase().trim())

    if (!user) {
      // Don't reveal if user exists for security
      return null
    }

    // Check if user has a password (OAuth-only users can't reset password)
    const userWithAuth = await this.userRepository.findByEmailWithAuth(email.toLowerCase().trim())
    if (!userWithAuth?.passwordHash) {
      // Don't reveal if user exists for security
      return null
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save reset token
    await this.userRepository.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetTokenExpiry: expiresAt,
    })

    return resetToken
  }

  /**
   * Validate password reset token without resetting password
   * Returns user info if token is valid, throws error otherwise
   */
  async validatePasswordResetToken(token: string): Promise<{ email: string }> {
    // Find user by reset token
    const user = await this.userRepository.findByPasswordResetToken(token)

    if (!user) {
      throw new ValidationError('Invalid or expired password reset token')
    }

    // Check if token is expired
    if (user.passwordResetTokenExpiry && user.passwordResetTokenExpiry < new Date()) {
      throw new ValidationError('Password reset token has expired')
    }

    return {
      email: user.email,
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find user by reset token
    const user = await this.userRepository.findByPasswordResetToken(token)

    if (!user) {
      throw new ValidationError('Invalid or expired password reset token')
    }

    // Check if token is expired
    if (user.passwordResetTokenExpiry && user.passwordResetTokenExpiry < new Date()) {
      throw new ValidationError('Password reset token has expired')
    }

    // Validate password
    if (newPassword.length < authConfig.password.minLength) {
      throw new ValidationError(`Password must be at least ${authConfig.password.minLength} characters long`)
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12)

    // Update password and clear reset token
    await this.userRepository.update(user.id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetTokenExpiry: null,
    })
  }
}