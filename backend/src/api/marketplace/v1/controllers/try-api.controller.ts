import { Request, Response } from 'express'
import { UserService } from '../../../../domain/user/user.service'
import { ApiKeyService } from '../../../../domain/api-key/api-key.service'
import { emailService } from '../../../../shared/email/email.service'
import { ValidationError } from '../../../../shared/errors/app-error'
import { logger } from '../../../../shared/logger'
import crypto from 'crypto'

export class TryApiController {
    constructor(
        private readonly userService: UserService,
        private readonly apiKeyService: ApiKeyService
    ) { }

    /**
     * POST /marketplace/v1/try-api/guest
     * Generate API key for guest user (no email required)
     */
    guestLogin = async (req: Request, res: Response): Promise<void> => {
        try {
            // Create guest user (with random email)
            const user = await this.userService.createGuestUser()

            // Create API key for the user
            const apiKeyResult = await this.apiKeyService.createApiKey({
                userId: user.id,
                name: 'Guest Key',
            })

            // Return API key
            res.status(201).json({
                success: true,
                data: {
                    apiKey: apiKeyResult.secretKey,
                    rateLimit: {
                        requestsPerSecond: apiKeyResult.requestsPerSecond,
                        tokensPerMonth: Number(apiKeyResult.tokensPerMonth),
                    },
                    message: 'Guest API key generated',
                },
            })
        } catch (error) {
            logger.error('Guest login error:', error)
            const errorMessage = error instanceof Error ? error.message : 'Internal server error'
            const errorStack = error instanceof Error ? error.stack : undefined
            
            // Log full error details for debugging
            console.error('Guest API key creation failed:', {
                error: errorMessage,
                stack: errorStack,
                errorType: error?.constructor?.name,
            })
            
            res.status(500).json({
                success: false,
                error: 'Failed to generate guest key',
                details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
                ...(process.env.NODE_ENV === 'development' && errorStack ? { stack: errorStack } : {}),
            })
        }
    }

    /**
     * POST /marketplace/v1/try-api
     * Generate API key with just email (no password required)
     */
    tryApi = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email } = req.body

            // Validate email
            if (!email || typeof email !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'Email is required',
                })
                return
            }

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(email)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid email format',
                })
                return
            }

            // Check if user already exists
            let user = await this.userService.getUserByEmail(email)
            let apiKey: any
            let isNewUser = false

            if (user) {
                // User exists - check if they already have an API key
                const existingKeys = await this.apiKeyService.getApiKeysByUser(user.id)

                if (existingKeys.length > 0) {
                    // Return existing key info (without the actual key)
                    apiKey = existingKeys[0]

                    res.json({
                        success: true,
                        data: {
                            message: 'You already have an API key. Check your email for the key.',
                            email: user.email,
                            isVerified: user.isVerified,
                            rateLimit: {
                                requestsPerSecond: apiKey.requestsPerSecond,
                                tokensPerMonth: Number(apiKey.tokensPerMonth),
                            },
                        },
                    })
                    return
                }
            } else {
                // Create unverified user (email only, no password)
                user = await this.userService.createUnverifiedUser(email)
                isNewUser = true
            }

            // Create API key for the user
            const apiKeyResult = await this.apiKeyService.createApiKey({
                userId: user.id,
                name: 'Try API Key',
            })

            // Send email with API key
            try {
                await emailService.sendTryApiEmail(email, apiKeyResult.secretKey)
                logger.info(`Try API email sent to ${email}`)
            } catch (emailError) {
                logger.error('Failed to send Try API email:', emailError)
                // Don't fail the request if email fails - user still gets the key in response
            }

            // Return API key and rate limits
            res.status(isNewUser ? 201 : 200).json({
                success: true,
                data: {
                    apiKey: apiKeyResult.secretKey,
                    email: user.email,
                    isVerified: user.isVerified,
                    rateLimit: {
                        requestsPerSecond: apiKeyResult.requestsPerSecond,
                        tokensPerMonth: Number(apiKeyResult.tokensPerMonth),
                    },
                    message: 'API key sent to your email. Verify your email to unlock higher limits.',
                },
            })
        } catch (error) {
            logger.error('Try API error:', error)

            if (error instanceof ValidationError) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                })
            } else {
                const errorMessage = error instanceof Error ? error.message : 'Internal server error'
                res.status(500).json({
                    success: false,
                    error: 'Failed to generate API key',
                    details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
                })
            }
        }
    }

    /**
     * POST /marketplace/v1/request-verification
     * Request email verification link
     * If user already has a password, mark them as verified directly
     */
    requestVerification = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email } = req.body

            if (!email) {
                res.status(400).json({
                    success: false,
                    error: 'Email is required',
                })
                return
            }

            // Find user with auth info to check if they have a password
            const user = await this.userService.getUserByEmailWithAuth(email)

            if (!user) {
                res.status(404).json({
                    success: false,
                    error: 'User not found',
                })
                return
            }

            if (user.isVerified) {
                res.status(400).json({
                    success: false,
                    error: 'Email is already verified',
                })
                return
            }

            // Generate verification token and send email
            // All users (with or without password) need to verify via email link
            const verificationToken = crypto.randomBytes(32).toString('hex')
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

            // Save verification token
            await this.userService.setVerificationToken(user.id, verificationToken, expiresAt)

            // Send verification email
            try {
                await emailService.sendVerificationEmail(email, verificationToken)
                logger.info(`Verification email sent to ${email}`)
            } catch (emailError) {
                logger.error('Failed to send verification email:', emailError)
                throw new Error('Failed to send verification email')
            }

            res.json({
                success: true,
                data: {
                    message: 'Verification email sent. Please check your inbox.',
                },
            })
        } catch (error) {
            logger.error('Request verification error:', error)

            if (error instanceof ValidationError) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                })
            } else {
                const errorMessage = error instanceof Error ? error.message : 'Internal server error'
                res.status(500).json({
                    success: false,
                    error: 'Failed to send verification email',
                    details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
                })
            }
        }
    }

    /**
     * GET /marketplace/v1/verify-email/:token
     * Validate verification token without completing verification
     */
    validateVerificationToken = async (req: Request, res: Response): Promise<void> => {
        try {
            const { token } = req.params

            if (!token) {
                res.status(400).json({
                    success: false,
                    error: 'Verification token is required',
                })
                return
            }

            // Validate the token
            const result = await this.userService.validateVerificationToken(token)

            res.json({
                success: true,
                data: {
                    email: result.email,
                    isValid: true,
                },
            })
        } catch (error) {
            logger.error('Validate verification token error:', error)

            if (error instanceof ValidationError) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                })
            } else {
                const errorMessage = error instanceof Error ? error.message : 'Internal server error'
                res.status(500).json({
                    success: false,
                    error: 'Failed to validate verification token',
                    details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
                })
            }
        }
    }

    /**
     * POST /marketplace/v1/verify-email
     * Verify email with token - grants 100M tokens and increases rate limits
     */
    verifyEmail = async (req: Request, res: Response): Promise<void> => {
        try {
            const { token } = req.body

            if (!token || typeof token !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'Verification token is required',
                })
                return
            }

            // Verify the token and upgrade user
            const result = await this.userService.verifyEmailToken(token)

            res.json({
                success: true,
                data: {
                    user: {
                        id: result.user.id,
                        email: result.user.email,
                        firstName: result.user.firstName,
                        lastName: result.user.lastName,
                        isVerified: result.user.isVerified,
                        tokenBalance: Number(result.user.tokenBalance),
                    },
                    token: result.token,
                    message: 'Email verified successfully! You received 100M tokens and higher rate limits.',
                },
            })
        } catch (error) {
            logger.error('Verify email error:', error)

            if (error instanceof ValidationError) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                })
            } else {
                const errorMessage = error instanceof Error ? error.message : 'Internal server error'
                res.status(500).json({
                    success: false,
                    error: 'Failed to verify email',
                    details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
                })
            }
        }
    }
}
