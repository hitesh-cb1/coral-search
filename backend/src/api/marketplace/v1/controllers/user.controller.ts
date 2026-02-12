import { Request, Response } from 'express'
import { UserService } from '../../../../domain/user/user.service'
import { ApiKeyService } from '../../../../domain/api-key/api-key.service'
import { PaymentService } from '../../../../domain/payment/payment.service'
import { ValidationError, NotFoundError } from '../../../../shared/errors/app-error'

interface AuthenticatedRequest extends Request {
  user?: {
    id: number
    email: string
  }
}

export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly apiKeyService: ApiKeyService,
    private readonly paymentService: PaymentService
  ) {}

  getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        })
        return
      }

      const user = await this.userService.getUserById(req.user.id)

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            emailVerified: user.emailVerified,
            isActive: user.isActive,
            tokenBalance: user.tokenBalance,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      })
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ 
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

  updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        })
        return
      }

      const { firstName, lastName } = req.body

      const updatedUser = await this.userService.updateUser(req.user.id, {
        firstName,
        lastName,
      })

      res.json({
        success: true,
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            emailVerified: updatedUser.emailVerified,
            isActive: updatedUser.isActive,
            tokenBalance: updatedUser.tokenBalance,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
          },
        },
        message: 'Profile updated successfully',
      })
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
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

  createApiKey = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        })
        return
      }

      const { name, expiresAt } = req.body

      if (!name) {
        res.status(400).json({ 
          success: false, 
          error: 'API key name is required' 
        })
        return
      }

      const apiKeyWithSecret = await this.apiKeyService.createApiKey({
        userId: req.user.id,
        name,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        // usageLimit is set server-side to 5 calls
      })

      res.status(201).json({
        success: true,
        data: {
          apiKey: {
            id: apiKeyWithSecret.id,
            name: apiKeyWithSecret.name,
            keyPrefix: apiKeyWithSecret.keyPrefix,
            secretKey: apiKeyWithSecret.secretKey, // Only returned on creation
            isActive: apiKeyWithSecret.isActive,
            usageLimit: apiKeyWithSecret.usageLimit,
            usageCount: apiKeyWithSecret.usageCount,
            expiresAt: apiKeyWithSecret.expiresAt,
            createdAt: apiKeyWithSecret.createdAt,
          },
        },
        message: `API key created successfully. Save the secret key - it will not be shown again. Token limits are now account-level.`,
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

  getApiKeys = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        })
        return
      }

      const apiKeys = await this.apiKeyService.getApiKeysByUser(req.user.id)
      const includeSecrets = req.query.includeSecrets === 'true' // Optional query param

      // If includeSecrets is true, fetch full keys for each
      const keysWithSecrets = includeSecrets 
        ? await Promise.all(apiKeys.map(async (key) => {
            const secretKey = await this.apiKeyService.getApiKeySecret(key.id, req.user!.id)
            return {
              ...key,
              secretKey: secretKey || undefined,
            }
          }))
        : apiKeys

      res.json({
        success: true,
        data: {
          apiKeys: keysWithSecrets.map(key => ({
            id: key.id,
            name: key.name,
            keyPrefix: key.keyPrefix,
            secretKey: (key as any).secretKey, // Only included if includeSecrets=true
            isActive: key.isActive,
            usageLimit: key.usageLimit,
            usageCount: key.usageCount,
            expiresAt: key.expiresAt,
            lastUsedAt: key.lastUsedAt,
            createdAt: key.createdAt,
            updatedAt: key.updatedAt,
          })),
        },
      })
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      })
    }
  }

  revealApiKey = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        })
        return
      }

      const { keyId } = req.params

      if (!keyId || Array.isArray(keyId)) {
        res.status(400).json({ 
          success: false, 
          error: 'API key ID is required' 
        })
        return
      }

      // Get the full key (decrypted from database)
      const secretKey = await this.apiKeyService.getApiKeySecret(parseInt(keyId), req.user.id)
      
      if (!secretKey) {
        res.status(404).json({ 
          success: false, 
          error: 'API key not found or could not be retrieved' 
        })
        return
      }

      // Get key metadata
      const existingKey = await this.apiKeyService.getApiKeysByUser(req.user.id)
      const keyData = existingKey.find(k => k.id.toString() === keyId)
      
      if (!keyData) {
        res.status(404).json({ 
          success: false, 
          error: 'API key not found' 
        })
        return
      }

      res.json({
        success: true,
        data: {
          apiKey: {
            id: keyData.id,
            name: keyData.name,
            keyPrefix: keyData.keyPrefix,
            secretKey: secretKey, // Full decrypted key
            isActive: keyData.isActive,
            usageLimit: keyData.usageLimit,
            usageCount: keyData.usageCount,
            expiresAt: keyData.expiresAt,
            createdAt: keyData.createdAt,
          },
        },
        message: 'API key revealed. Copy it now - this is your existing key.',
      })
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ 
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

  regenerateApiKey = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        })
        return
      }

      const { keyId } = req.params

      if (!keyId || Array.isArray(keyId)) {
        res.status(400).json({ 
          success: false, 
          error: 'API key ID is required' 
        })
        return
      }

      // First verify the key belongs to the user
      const existingKey = await this.apiKeyService.getApiKeysByUser(req.user.id)
      const keyExists = existingKey.find(k => k.id.toString() === keyId)
      
      if (!keyExists) {
        res.status(404).json({ 
          success: false, 
          error: 'API key not found' 
        })
        return
      }

      const regeneratedKey = await this.apiKeyService.regenerateApiKey(parseInt(keyId))

      res.json({
        success: true,
        data: {
          apiKey: {
            id: regeneratedKey.id,
            name: regeneratedKey.name,
            keyPrefix: regeneratedKey.keyPrefix,
            secretKey: regeneratedKey.secretKey, // Full key returned
            isActive: regeneratedKey.isActive,
            usageLimit: regeneratedKey.usageLimit,
            usageCount: regeneratedKey.usageCount,
            expiresAt: regeneratedKey.expiresAt,
            createdAt: regeneratedKey.createdAt,
          },
        },
        message: 'API key regenerated successfully. The old key is now invalid. Save the new key - it will not be shown again.',
      })
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ 
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

  deleteApiKey = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        })
        return
      }

      const { keyId } = req.params

      if (!keyId || Array.isArray(keyId)) {
        res.status(400).json({ 
          success: false, 
          error: 'API key ID is required' 
        })
        return
      }

      await this.apiKeyService.deleteApiKey(parseInt(keyId))

      res.json({
        success: true,
        message: 'API key deleted successfully',
      })
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ 
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

  getUsageStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        })
        return
      }

      const { startDate, endDate } = req.query

      const stats = await this.apiKeyService.getUsageStats(
        req.user.id,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      )

      res.json({
        success: true,
        data: {
          stats,
        },
      })
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      })
    }
  }

  getDailyUsage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        })
        return
      }

      const { startDate, endDate } = req.query

      const dailyUsage = await this.apiKeyService.getDailyUsage(
        req.user.id,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      )

      res.json({
        success: true,
        data: {
          dailyUsage,
        },
      })
    } catch (error) {
      console.error('Error getting daily usage:', error)
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      })
    }
  }

  getBudget = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        })
        return
      }

      const [monthlyLimit, dailyLimit] = await Promise.all([
        this.userService.getMonthlyBudgetLimit(req.user.id),
        this.userService.getDailyBudgetLimit(req.user.id),
      ])

      const now = new Date()
      const transactions = await this.paymentService.getUserTransactions(req.user.id, 1000)
      const completedPurchases = transactions.filter(
        (t) => t.paymentStatus === 'completed' && t.cost !== null && t.type === 'purchase'
      )

      // Monthly: current spend this month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      const monthlyTransactions = completedPurchases.filter((t) => {
        const createdAt = new Date(t.createdAt)
        return createdAt >= startOfMonth && createdAt <= endOfMonth
      })
      const monthlySpend = monthlyTransactions.reduce((sum: number, t) => sum + (t.cost || 0), 0)
      const monthlyResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)

      // Daily: current spend today
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      const dailyTransactions = completedPurchases.filter((t) => {
        const createdAt = new Date(t.createdAt)
        return createdAt >= startOfDay && createdAt <= endOfDay
      })
      const dailySpend = dailyTransactions.reduce((sum: number, t) => sum + (t.cost || 0), 0)
      const dailyResetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

      res.json({
        success: true,
        data: {
          monthly: {
            current: Number(monthlySpend.toFixed(2)),
            limit: monthlyLimit ? Number(monthlyLimit) : null,
            resetDate: monthlyResetDate.toISOString(),
          },
          daily: {
            current: Number(dailySpend.toFixed(2)),
            limit: dailyLimit ? Number(dailyLimit) : null,
            resetDate: dailyResetDate.toISOString(),
          },
        },
      })
    } catch (error) {
      console.error('Error getting budget:', error)
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      })
    }
  }

  updateBudget = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        })
        return
      }

      const { limit, dailyLimit } = req.body

      if (limit !== null && limit !== undefined && (typeof limit !== 'number' || limit < 0)) {
        res.status(400).json({
          success: false,
          error: 'Monthly budget limit must be a positive number or null',
        })
        return
      }
      if (dailyLimit !== null && dailyLimit !== undefined && (typeof dailyLimit !== 'number' || dailyLimit < 0)) {
        res.status(400).json({
          success: false,
          error: 'Daily budget limit must be a positive number or null',
        })
        return
      }

      const updates: Promise<void>[] = []
      if (limit !== undefined) {
        updates.push(this.userService.updateMonthlyBudgetLimit(req.user.id, limit === null ? null : limit))
      }
      if (dailyLimit !== undefined) {
        updates.push(this.userService.updateDailyBudgetLimit(req.user.id, dailyLimit === null ? null : dailyLimit))
      }
      if (updates.length > 0) {
        await Promise.all(updates)
      }

      res.json({
        success: true,
        message: 'Budget updated successfully',
      })
    } catch (error) {
      console.error('Error updating budget:', error)
      const message = error instanceof Error ? error.message : 'Internal server error'
      res.status(400).json({ 
        success: false, 
        error: message 
      })
    }
  }
}