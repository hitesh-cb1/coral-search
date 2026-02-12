import { Request, Response, NextFunction } from 'express'
import { getApiKeyService } from '../../bootstrap/services'
import { ValidationError } from '../../shared/errors/app-error'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number
    email: string
  }
  apiKey?: {
    id: number
    userId: number
    isVerified?: boolean
    hasPaid?: boolean
    requestsPerSecond?: number // Database rate limit (admin override)
    tokensPerMonth?: bigint // Database rate limit (admin override)
  }
}

export const apiKeyAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'API key required. Use: Authorization: Bearer your_api_key'
      })
      return
    }

    const apiKey = authHeader.substring(7)

    try {
      const apiKeyService = getApiKeyService()
      const validatedKey = await apiKeyService.validateApiKey(apiKey)

      // Get fresh user verification status (in case it was updated after API key creation)
      const isVerified = validatedKey.user?.isVerified ?? false
      const hasPaid = validatedKey.user?.hasPaid ?? false

      console.log(`[APIKeyAuth] API Key: ${validatedKey.id}, User: ${validatedKey.userId}, Verified: ${isVerified}, Paid: ${hasPaid}, RPS: ${validatedKey.requestsPerSecond}, Tokens/Month: ${validatedKey.tokensPerMonth}`)

      req.apiKey = {
        id: validatedKey.id,
        userId: validatedKey.userId,
        isVerified,
        hasPaid,
        // Include database rate limits (may be overridden by admin)
        requestsPerSecond: validatedKey.requestsPerSecond,
        tokensPerMonth: validatedKey.tokensPerMonth,
      }

      // Also set user info for convenience
      req.user = {
        id: validatedKey.userId,
        email: '', // We don't have email in API key, but some controllers might expect this
      }

      next()
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(401).json({
          success: false,
          error: error.message
        })
      } else {
        res.status(401).json({
          success: false,
          error: 'Invalid API key'
        })
      }
      return
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    })
  }
}