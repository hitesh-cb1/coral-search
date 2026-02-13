import { getApiUrl } from './api'

/**
 * API Endpoints
 * Centralized endpoint definitions for the application
 */

export const endpoints = {
  // Authentication endpoints
  auth: {
    login: () => getApiUrl('marketplace/v1/auth/login'),
    register: () => getApiUrl('marketplace/v1/auth/register'),
    google: () => getApiUrl('marketplace/v1/auth/google'),
    logout: () => getApiUrl('auth/logout'),
    refreshToken: () => getApiUrl('auth/refresh'),
    forgotPassword: () => getApiUrl('marketplace/v1/auth/forgot-password'),
    validateResetToken: (token: string) => getApiUrl(`marketplace/v1/auth/reset-password/${token}`),
    resetPassword: () => getApiUrl('marketplace/v1/auth/reset-password'),
    verifyEmail: () => getApiUrl('auth/verify-email'),
  },

  // User endpoints
  user: {
    profile: () => getApiUrl('marketplace/v1/user/profile'),
    update: () => getApiUrl('marketplace/v1/user/profile'),
    updateProfile: () => getApiUrl('user/profile'),
    changePassword: () => getApiUrl('user/change-password'),
    deleteAccount: () => getApiUrl('user/account'),
  },

  // API Keys endpoints
  apiKeys: {
    list: () => getApiUrl('marketplace/v1/user/api-keys'),
    create: () => getApiUrl('marketplace/v1/user/api-keys'),
    reveal: (id: string) => getApiUrl(`marketplace/v1/user/api-keys/${id}/reveal`),
    regenerate: (id: string) => getApiUrl(`marketplace/v1/user/api-keys/${id}/regenerate`),
    update: (id: string) => getApiUrl(`marketplace/v1/user/api-keys/${id}`),
    delete: (id: string) => getApiUrl(`marketplace/v1/user/api-keys/${id}`),
    usage: (id: string) => getApiUrl(`marketplace/v1/user/api-keys/${id}/usage`),
  },

  // Embeddings endpoints (OpenAI-style: /v1/embeddings)
  embeddings: {
    embed: () => getApiUrl('v1/embeddings'),
  },

  // Usage endpoints
  usage: {
    getUsage: (startDate?: string, endDate?: string) => {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      const query = params.toString()
      return getApiUrl(`marketplace/v1/usage${query ? `?${query}` : ''}`)
    },
    getDailyUsage: (startDate?: string, endDate?: string) => {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      const query = params.toString()
      return getApiUrl(`marketplace/v1/user/daily-usage${query ? `?${query}` : ''}`)
    },
    getStats: () => getApiUrl('marketplace/v1/user/usage-stats'),
  },

  // Budget endpoints
  budget: {
    get: () => getApiUrl('marketplace/v1/user/budget'),
    update: () => getApiUrl('marketplace/v1/user/budget'),
  },

  // Payment endpoints
  payment: {
    createCheckoutSession: () => getApiUrl('marketplace/v1/payment/create-checkout-session'),
    verifyPayment: () => getApiUrl('marketplace/v1/payment/verify'),
    getTransactions: () => getApiUrl('marketplace/v1/payment/transactions'),
    getPaymentMethods: () => getApiUrl('marketplace/v1/payment/payment-methods'),
    deletePaymentMethod: (paymentMethodId: string) => getApiUrl(`marketplace/v1/payment/payment-methods/${paymentMethodId}`),
  },

  // Admin endpoints
  admin: {
    login: () => getApiUrl('internal/admin/login'),
    users: () => getApiUrl('internal/admin/users'),
    getUserApiKeys: (userId: string) => getApiUrl(`internal/admin/users/${userId}/api-keys`),
    updateUserRateLimits: (userId: string) => getApiUrl(`internal/admin/users/${userId}/rate-limits`),
  },

  // Search comparison endpoints (no auth required - demo)
  search: {
    coral: () => getApiUrl('marketplace/v1/search/coral'),
    openai: () => getApiUrl('marketplace/v1/search/openai'),
  },

  // Contact form (no auth)
  contact: {
    submit: () => getApiUrl('marketplace/v1/contact'),
  },

  // Marketplace endpoints (Try API flow)
  marketplace: {
    requestVerification: () => getApiUrl('marketplace/v1/request-verification'),
    validateVerificationToken: (token: string) => getApiUrl(`marketplace/v1/verify-email/${token}`),
    verifyEmail: () => getApiUrl('marketplace/v1/verify-email'),
    tryApi: () => getApiUrl('marketplace/v1/try-api'),
    guest: () => getApiUrl('marketplace/v1/try-api/guest'),
  },
} as const

