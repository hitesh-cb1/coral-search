import { Response, NextFunction } from 'express'
import { getRateLimitsForUser } from '../../config/rate-limit.config'
import { AuthenticatedRequest } from './api-key-auth'

// In-memory store for rate limiting
// Map<userId, { count: number, tokens: number, windowStart: number }>
const rateLimitStore = new Map<number, { count: number, tokens: number, windowStart: number }>()

// Clean up old entries every 10 seconds to prevent memory leaks
setInterval(() => {
    const now = Date.now()
    for (const [userId, data] of rateLimitStore.entries()) {
        if (now - data.windowStart > 10000) { // Clean up entries older than 10 seconds
            rateLimitStore.delete(userId)
        }
    }
}, 10000)

export const rateLimit = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Skip if no user (should rely on apiKeyAuth)
        if (!req.user || !req.user.id) {
            res.status(401).json({
                success: false,
                error: 'Authentication required for rate limiting'
            })
            return
        }

        const userId = req.user.id

        // Database is the single source of truth for rate limits
        // These values are set when API keys are created and can be overridden by admin
        const dbRequestsPerSecond = req.apiKey?.requestsPerSecond
        const dbTokensPerMonth = req.apiKey?.tokensPerMonth

        // Safety fallback: if DB values are missing (shouldn't happen), use config
        // This should only occur in edge cases - log a warning
        if (dbRequestsPerSecond === undefined || dbTokensPerMonth === undefined) {
          const isVerified = req.apiKey?.isVerified ?? false
          const hasPaid = req.apiKey?.hasPaid ?? false
          const configLimits = getRateLimitsForUser(isVerified, hasPaid)
          
          console.warn(`[RateLimit] Missing DB rate limits for user ${userId}, falling back to config. This should not happen.`)
          
          // Use config as fallback (shouldn't happen in normal operation)
          const limits = {
            requestsPerSecond: configLimits.requestsPerSecond,
            tokensPerMinute: configLimits.tokensPerMinute,
            tokensPerMonth: configLimits.tokensPerMonth,
          }
          
          console.log(`[RateLimit] User: ${userId}, Limit: ${limits.requestsPerSecond} RPS (config fallback)`)
          
          // Continue with fallback limits
          const now = Date.now()
          let userRateData = rateLimitStore.get(userId)
          
          if (!userRateData || now - userRateData.windowStart > 1000) {
            userRateData = { count: 0, tokens: 0, windowStart: now }
            rateLimitStore.set(userId, userRateData)
          }
          
          if (userRateData.count >= limits.requestsPerSecond) {
            const isVerified = req.apiKey?.isVerified ?? false
            const errorMessage = isVerified
              ? `Rate limit exceeded. Maximum ${limits.requestsPerSecond} requests per second.`
              : `Rate limit exceeded. Maximum ${limits.requestsPerSecond} requests per second. Verify your email to increase your rate limit.`
            res.status(429).json({
              success: false,
              error: errorMessage
            })
            return
          }
          
          const inputTokens = req.body ? Math.ceil(JSON.stringify(req.body).length / 4) : 0
          if (limits.tokensPerMinute && userRateData.tokens + inputTokens > limits.tokensPerMinute) {
            res.status(429).json({
              success: false,
              error: `Token rate limit exceeded. Maximum ${limits.tokensPerMinute} tokens per minute.`
            })
            return
          }
          
          userRateData.count++
          userRateData.tokens += inputTokens
          rateLimitStore.set(userId, userRateData)
          next()
          return
        }

        // Normal path: use database values (single source of truth)
        // Database stores requestsPerSecond and tokensPerMonth
        // tokensPerMonth is checked elsewhere (account-level limits), not here
        const requestsPerSecond = dbRequestsPerSecond

        // Safety check: ensure requestsPerSecond is a valid number
        if (typeof requestsPerSecond !== 'number' || requestsPerSecond <= 0 || isNaN(requestsPerSecond)) {
          console.error(`[RateLimit] User: ${userId}, Invalid requestsPerSecond value: ${requestsPerSecond}. Falling back to config.`)
          const isVerified = req.apiKey?.isVerified ?? false
          const hasPaid = req.apiKey?.hasPaid ?? false
          const configLimits = getRateLimitsForUser(isVerified, hasPaid)
          const fallbackRPS = configLimits.requestsPerSecond
          
          console.log(`[RateLimit] User: ${userId}, Using fallback limit: ${fallbackRPS} RPS`)
          
          // Continue with fallback
          const now = Date.now()
          let userRateData = rateLimitStore.get(userId)
          
          if (!userRateData || now - userRateData.windowStart > 1000) {
            userRateData = { count: 0, tokens: 0, windowStart: now }
            rateLimitStore.set(userId, userRateData)
          }
          
          if (userRateData.count >= fallbackRPS) {
            const isVerified = req.apiKey?.isVerified ?? false
            const errorMessage = isVerified
              ? `Rate limit exceeded. Maximum ${fallbackRPS} requests per second.`
              : `Rate limit exceeded. Maximum ${fallbackRPS} requests per second. Verify your email to increase your rate limit.`
            res.status(429).json({
              success: false,
              error: errorMessage
            })
            return
          }
          
          userRateData.count++
          rateLimitStore.set(userId, userRateData)
          next()
          return
        }

        console.log(`[RateLimit] User: ${userId}, Limit: ${requestsPerSecond} RPS (DB), Current count: ${rateLimitStore.get(userId)?.count || 0}`)

        // Estimate tokens from request body (rough approximation: 4 chars = 1 token)
        // This is a heuristic; actual usage is calculated by the model later but we limit ingress here.
        const inputTokens = req.body ? Math.ceil(JSON.stringify(req.body).length / 4) : 0

        const now = Date.now()
        let userRateData = rateLimitStore.get(userId)

        if (!userRateData || now - userRateData.windowStart > 1000) {
            // New window or reset (1 second window)
            userRateData = { count: 0, tokens: 0, windowStart: now }
            rateLimitStore.set(userId, userRateData)
        }

        // Check request limit (from database - single source of truth)
        if (userRateData.count >= requestsPerSecond) {
            console.log(`[RateLimit] User: ${userId}, Rate limit exceeded: ${userRateData.count}/${requestsPerSecond}`)
            const isVerified = req.apiKey?.isVerified ?? false
            const errorMessage = isVerified
              ? `Rate limit exceeded. Maximum ${requestsPerSecond} requests per second.`
              : `Rate limit exceeded. Maximum ${requestsPerSecond} requests per second. Verify your email to increase your rate limit.`
            res.status(429).json({
                success: false,
                error: errorMessage
            })
            return
        }

        // Note: tokensPerMonth is checked at account level, not in rate limiting middleware
        // tokensPerMinute is not stored in DB, so we skip per-minute token limiting
        // when using DB as single source of truth

        // Increment usage
        userRateData.count++
        userRateData.tokens += inputTokens

        // Update store (if object reference held, update happens, but explicit set is safer for some cache implementations)
        rateLimitStore.set(userId, userRateData) // Not strictly needed as we modified object ref, but good practice

        next()
    } catch (error) {
        console.error('Rate limit error:', error)
        next() // Fail open
    }
}
