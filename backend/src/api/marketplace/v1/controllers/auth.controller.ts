import { Request, Response } from 'express'
import { UserService } from '../../../../domain/user/user.service'
import { ValidationError, PasswordNotSetError } from '../../../../shared/errors/app-error'
import { emailService } from '../../../../shared/email/email.service'
import { logger } from '../../../../shared/logger'

import { ApiKeyService } from '../../../../domain/api-key/api-key.service'

export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly apiKeyService: ApiKeyService
  ) { }

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, firstName, lastName, guestApiKey } = req.body

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required'
        })
        return
      }

      let guestUserId: number | undefined

      if (guestApiKey && typeof guestApiKey === 'string') {
        try {
          // Validate the API key and get the associated user
          const apiKey = await this.apiKeyService.validateApiKey(guestApiKey)
          if (apiKey) {
            guestUserId = apiKey.userId
            logger.info(`Linking guest user ${guestUserId} during registration`)
          }
        } catch (error) {
          logger.warn('Failed to validate guest API key during registration:', error)
          // Continue with normal registration if guest key is invalid
        }
      }

      const result = await this.userService.register({
        email,
        password,
        firstName,
        lastName,
      }, guestUserId)

      // Get verification token for the new user
      const userWithAuth = await this.userService.getUserByEmailWithAuth(email)
      const verificationToken = userWithAuth?.verificationToken

      // Send welcome email with verification link (fire and forget)
      try {
        if (verificationToken) {
          await emailService.sendWelcomeEmail(email, firstName, verificationToken)
          logger.info(`Welcome email with verification link sent to ${email}`)
        } else {
          // If no verification token (e.g., guest user claiming account), just send welcome
          await emailService.sendWelcomeEmail(email, firstName)
          logger.info(`Welcome email sent to ${email}`)
        }
      } catch (emailError) {
        logger.error('Failed to send welcome email:', emailError)
        // Don't block registration on email failure
      }

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            emailVerified: result.user.emailVerified,
            createdAt: result.user.createdAt,
          },
          token: result.token,
        },
        message: 'User registered successfully',
      })
    } catch (error) {
      console.error('Registration error:', error)
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        })
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Internal server error'
        console.error('Registration failed:', errorMessage, error)
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        })
      }
    }
  }

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required'
        })
        return
      }

      const result = await this.userService.login({ email, password })

      res.json({
        success: true,
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            emailVerified: result.user.emailVerified,
            createdAt: result.user.createdAt,
          },
          token: result.token,
        },
        message: 'Login successful',
      })
    } catch (error) {
      console.error('Login error:', error)
      if (error instanceof PasswordNotSetError) {
        res.status(403).json({
          success: false,
          error: error.message,
          code: 'PASSWORD_NOT_SET',
          email: error.email
        })
      } else if (error instanceof ValidationError) {
        res.status(401).json({
          success: false,
          error: error.message
        })
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Internal server error'
        console.error('Login failed:', errorMessage, error)
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        })
      }
    }
  }

  googleLogin = async (req: Request, res: Response): Promise<void> => {
    try {
      const { idToken, guestApiKey } = req.body

      if (!idToken) {
        res.status(400).json({
          success: false,
          error: 'Google ID token is required'
        })
        return
      }

      let guestUserId: number | undefined
      if (guestApiKey && typeof guestApiKey === 'string') {
        try {
          const apiKey = await this.apiKeyService.validateApiKey(guestApiKey)
          if (apiKey) {
            guestUserId = apiKey.userId
            logger.info(`Linking guest user ${guestUserId} during Google sign-in`)
          }
        } catch (error) {
          logger.warn('Failed to validate guest API key during Google sign-in:', error)
        }
      }

      const result = await this.userService.googleLogin({ idToken, guestUserId })

      res.json({
        success: true,
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            emailVerified: result.user.emailVerified,
            createdAt: result.user.createdAt,
          },
          token: result.token,
        },
        message: 'Google login successful',
      })
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(401).json({
          success: false,
          error: error.message
        })
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        })
      }
    }
  }

  linkGoogleAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      const { idToken } = req.body
      const userId = (req as any).user?.id // From JWT middleware

      if (!idToken) {
        res.status(400).json({
          success: false,
          error: 'Google ID token is required'
        })
        return
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        })
        return
      }

      const user = await this.userService.linkGoogleAccount(userId, idToken)

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
          },
        },
        message: 'Google account linked successfully',
      })
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        })
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        })
      }
    }
  }
  verifyToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: 'Authorization token required'
        })
        return
      }

      const token = authHeader.substring(7)
      const user = await this.userService.verifyToken(token)

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
          },
        },
        message: 'Token is valid',
      })
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      })
    }
  }

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required'
        })
        return
      }

      // Request password reset (returns token if user exists and has password)
      const resetToken = await this.userService.requestPasswordReset(email)

      // Send email if token was generated (user exists and has password)
      if (resetToken) {
        try {
          await emailService.sendPasswordResetEmail(email, resetToken)
          logger.info(`Password reset email sent to ${email}`)
        } catch (emailError) {
          logger.error('Failed to send password reset email:', emailError)
          // Continue - don't reveal error to user
        }
      }

      // Always return success (don't reveal if user exists)
      res.json({
        success: true,
        data: {
          message: 'If an account with that email exists, a password reset link has been sent.'
        }
      })
    } catch (error) {
      logger.error('Forgot password error:', error)
      // Always return success (don't reveal errors)
      res.json({
        success: true,
        data: {
          message: 'If an account with that email exists, a password reset link has been sent.'
        }
      })
    }
  }

  validateResetToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.params

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'Reset token is required',
        })
        return
      }

      // Validate the token
      const result = await this.userService.validatePasswordResetToken(token)

      res.json({
        success: true,
        data: {
          email: result.email,
          isValid: true,
        },
      })
    } catch (error) {
      logger.error('Validate reset token error:', error)

      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message,
        })
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Internal server error'
        res.status(500).json({
          success: false,
          error: 'Failed to validate reset token',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        })
      }
    }
  }

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, password } = req.body

      if (!token || !password) {
        res.status(400).json({
          success: false,
          error: 'Token and password are required'
        })
        return
      }

      await this.userService.resetPassword(token, password)

      res.json({
        success: true,
        data: {
          message: 'Password has been reset successfully'
        }
      })
    } catch (error) {
      logger.error('Reset password error:', error)
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        })
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to reset password'
        })
      }
    }
  }
}