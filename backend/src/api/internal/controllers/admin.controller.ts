import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { authConfig } from '../../../config/auth.config'
import { AuthenticatedRequest } from '../../middleware/jwt-auth'
import { getUserRepository, getApiKeyRepository, getPaymentRepository, getUsageRepository } from '../../../bootstrap/repositories'
import { getApiKeyService } from '../../../bootstrap/services'

export class AdminController {
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

      const adminEmail = process.env.ADMIN_EMAIL
      const adminPassword = process.env.ADMIN_PASSWORD

      if (!adminEmail || !adminPassword) {
        res.status(500).json({ 
          success: false, 
          error: 'Admin credentials not configured' 
        })
        return
      }

      // Verify email and password match env variables
      if (email.toLowerCase().trim() !== adminEmail.toLowerCase().trim() || password !== adminPassword) {
        res.status(401).json({ 
          success: false, 
          error: 'Invalid email or password' 
        })
        return
      }

      // Generate admin JWT token
      const token = jwt.sign(
        { 
          userId: 0, // Special admin user ID
          email: adminEmail,
          isAdmin: true
        },
        authConfig.jwt.secret,
        { 
          expiresIn: authConfig.jwt.expiresIn
        }
      )

      res.json({
        success: true,
        data: {
          user: {
            email: adminEmail,
            isAdmin: true,
          },
          token: token,
        },
        message: 'Admin login successful',
      })
    } catch (error) {
      console.error('Admin login error:', error)
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      })
    }
  }

  getAllUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0

      const userRepository = getUserRepository()
      const apiKeyRepository = getApiKeyRepository()
      const paymentRepository = getPaymentRepository()
      const usageRepository = getUsageRepository()
      const users = await userRepository.findAll(limit, offset)
      const totalCount = await userRepository.countUsers()

      // Get additional stats for each user
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          // Get API keys for this user
          const apiKeys = await apiKeyRepository.findByUserId(user.id)
          
          // Get payment/transaction data
          const transactions = await paymentRepository.findTransactionsByUser(user.id, 1000) // Get all transactions
          
          // Calculate money-related stats
          const completedPurchases = transactions.filter(
            t => t.type === 'purchase' && t.paymentStatus === 'completed' && t.cost !== null
          )
          const totalSpent = completedPurchases.reduce((sum, t) => sum + (t.cost || 0), 0)
          const transactionCount = transactions.length
          const lastTransaction = transactions.length > 0 ? transactions[0].createdAt : null
          
          // Get API usage stats (all time)
          const usageStats = await usageRepository.getUsageStats(user.id)
          
          return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            emailVerified: user.emailVerified,
            isActive: user.isActive,
            tokenBalance: user.tokenBalance.toString(), // Convert BigInt to string
            stripeCustomerId: user.stripeCustomerId,
            monthlyBudgetLimit: user.monthlyBudgetLimit?.toString() || null,
            dailyBudgetLimit: user.dailyBudgetLimit?.toString() || null,
            googleId: user.googleId ? 'Linked' : null,
            awsId: user.awsId ? 'Linked' : null,
            apiKeyCount: apiKeys.length,
            // Money-related info
            totalSpent: totalSpent.toFixed(2),
            transactionCount,
            lastTransaction,
            // API usage stats
            apiCalls: usageStats.totalRequests,
            tokenUsage: usageStats.totalTokens,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }
        })
      )

      res.json({
        success: true,
        data: {
          users: usersWithStats,
          pagination: {
            total: totalCount,
            limit,
            offset,
            hasMore: offset + limit < totalCount,
          },
        },
      })
    } catch (error) {
      console.error('Error fetching users:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users',
      })
    }
  }

  getUserApiKeys = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId, 10)
      
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID',
        })
        return
      }

      const apiKeyRepository = getApiKeyRepository()
      const apiKeys = await apiKeyRepository.findByUserId(userId)

      // Get rate limits from first API key (all keys for a user should have same limits)
      const rateLimits = apiKeys.length > 0 ? {
        requestsPerSecond: apiKeys[0].requestsPerSecond,
        tokensPerMonth: apiKeys[0].tokensPerMonth.toString(),
      } : {
        requestsPerSecond: 0,
        tokensPerMonth: '0',
      }

      res.json({
        success: true,
        data: {
          userId,
          apiKeyCount: apiKeys.length,
          rateLimits,
        },
      })
    } catch (error) {
      console.error('Error fetching user API keys:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user API keys',
      })
    }
  }

  updateUserRateLimits = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId, 10)
      const { requestsPerSecond, tokensPerMonth } = req.body

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID',
        })
        return
      }

      if (requestsPerSecond === undefined || tokensPerMonth === undefined) {
        res.status(400).json({
          success: false,
          error: 'requestsPerSecond and tokensPerMonth are required',
        })
        return
      }

      const requestsPerSecondNum = parseInt(requestsPerSecond, 10)
      const tokensPerMonthBigInt = BigInt(tokensPerMonth)

      if (isNaN(requestsPerSecondNum) || requestsPerSecondNum < 0) {
        res.status(400).json({
          success: false,
          error: 'requestsPerSecond must be a non-negative integer',
        })
        return
      }

      // Verify user exists
      const userRepository = getUserRepository()
      const user = await userRepository.findById(userId)
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        })
        return
      }

      // Update rate limits for all API keys belonging to this user
      const apiKeyService = getApiKeyService()
      await apiKeyService.updateRateLimitsForUser(userId, requestsPerSecondNum, tokensPerMonthBigInt)

      res.json({
        success: true,
        data: {
          userId,
          rateLimits: {
            requestsPerSecond: requestsPerSecondNum,
            tokensPerMonth: tokensPerMonth.toString(),
          },
        },
        message: 'Rate limits updated successfully',
      })
    } catch (error) {
      console.error('Error updating user rate limits:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update user rate limits',
      })
    }
  }
}

