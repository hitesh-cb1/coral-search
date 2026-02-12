import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { authConfig } from '../../config/auth.config'
import { getUserService } from '../../bootstrap/services'

interface AuthenticatedRequest extends Request {
  user?: {
    id: number
    email: string
  }
}

export const jwtAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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

    try {
      const decoded = jwt.verify(token, authConfig.jwt.secret) as { userId: number; email: string }
      
      // Verify user still exists and is active
      const userService = getUserService()
      const user = await userService.getUserById(decoded.userId)
      
      if (!user.isActive) {
        res.status(401).json({ 
          success: false, 
          error: 'Account is deactivated' 
        })
        return
      }

      req.user = {
        id: user.id,
        email: user.email,
      }

      next()
    } catch (jwtError) {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      })
      return
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Authentication error' 
    })
  }
}