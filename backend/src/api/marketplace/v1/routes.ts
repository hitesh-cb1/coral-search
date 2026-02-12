import express, { Router } from 'express'
import { getAuthController, getUserController, getPaymentController, getSearchComparisonController, getTryApiController, getContactController } from '../../../bootstrap/controllers'
import { jwtAuth } from '../../middleware/jwt-auth'

const authController = getAuthController()
const userController = getUserController()
const paymentController = getPaymentController()
const searchComparisonController = getSearchComparisonController()
const tryApiController = getTryApiController()
const contactController = getContactController()

export const marketplaceV1Routes = Router()

// Try API routes (no auth required - email only)
marketplaceV1Routes.post('/try-api/guest', tryApiController.guestLogin)
marketplaceV1Routes.post('/try-api', tryApiController.tryApi)
marketplaceV1Routes.post('/request-verification', tryApiController.requestVerification)
marketplaceV1Routes.get('/verify-email/:token', tryApiController.validateVerificationToken)
marketplaceV1Routes.post('/verify-email', tryApiController.verifyEmail)

// Authentication routes (no auth required)
marketplaceV1Routes.post('/auth/register', authController.register)
marketplaceV1Routes.post('/auth/login', authController.login)
marketplaceV1Routes.post('/auth/google', authController.googleLogin)
marketplaceV1Routes.post('/auth/verify', authController.verifyToken)
marketplaceV1Routes.post('/auth/forgot-password', authController.forgotPassword)
marketplaceV1Routes.get('/auth/reset-password/:token', authController.validateResetToken)
marketplaceV1Routes.post('/auth/reset-password', authController.resetPassword)

// User management routes (JWT auth required)
marketplaceV1Routes.get('/user/profile', jwtAuth, userController.getProfile)
marketplaceV1Routes.put('/user/profile', jwtAuth, userController.updateProfile)
marketplaceV1Routes.post('/user/link-google', jwtAuth, authController.linkGoogleAccount)
marketplaceV1Routes.post('/user/api-keys', jwtAuth, userController.createApiKey)
marketplaceV1Routes.get('/user/api-keys', jwtAuth, userController.getApiKeys)
marketplaceV1Routes.get('/user/api-keys/:keyId/reveal', jwtAuth, userController.revealApiKey)
marketplaceV1Routes.post('/user/api-keys/:keyId/regenerate', jwtAuth, userController.regenerateApiKey)
marketplaceV1Routes.delete('/user/api-keys/:keyId', jwtAuth, userController.deleteApiKey)
marketplaceV1Routes.get('/user/usage-stats', jwtAuth, userController.getUsageStats)
marketplaceV1Routes.get('/user/daily-usage', jwtAuth, userController.getDailyUsage)
marketplaceV1Routes.get('/user/budget', jwtAuth, userController.getBudget)
marketplaceV1Routes.put('/user/budget', jwtAuth, userController.updateBudget)

// Payment routes
marketplaceV1Routes.post('/payment/create-checkout-session', jwtAuth, paymentController.createCheckoutSession)
marketplaceV1Routes.post('/payment/verify', jwtAuth, paymentController.verifyPayment)
marketplaceV1Routes.get('/payment/transactions', jwtAuth, paymentController.getTransactions)
marketplaceV1Routes.get('/payment/payment-methods', jwtAuth, paymentController.getPaymentMethods)
marketplaceV1Routes.delete('/payment/payment-methods/:paymentMethodId', jwtAuth, paymentController.deletePaymentMethod)
// Webhook route - no auth (Stripe signs the request), needs raw body for signature verification
marketplaceV1Routes.post('/payment/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook)

// Search comparison routes (no auth required - demo endpoints)
marketplaceV1Routes.post('/search/coral', searchComparisonController.searchCoral)
marketplaceV1Routes.post('/search/openai', searchComparisonController.searchOpenAI)

// Contact form (no auth required)
marketplaceV1Routes.post('/contact', contactController.submit)