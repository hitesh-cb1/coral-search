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

/**
 * Admin authentication middleware
 * Checks if the user is authenticated AND is the admin user
 * Admin email is configured via ADMIN_EMAIL environment variable
 */
export const adminAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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
    const adminEmail = process.env.ADMIN_EMAIL

    if (!adminEmail) {
      res.status(500).json({ 
        success: false, 
        error: 'Admin email not configured' 
      })
      return
    }

    try {
      const decoded = jwt.verify(token, authConfig.jwt.secret) as { userId: number; email: string; isAdmin?: boolean }
      
      // Check if this is an admin token (from admin login)
      if (decoded.isAdmin && decoded.userId === 0) {
        // Admin token - verify email matches
        if (decoded.email.toLowerCase() !== adminEmail.toLowerCase()) {
          res.status(403).json({ 
            success: false, 
            error: 'Admin access required' 
          })
          return
        }

        req.user = {
          id: 0,
          email: decoded.email,
        }

        next()
        return
      }

      // Regular user token - verify user exists and is admin
      const userService = getUserService()
      const user = await userService.getUserById(decoded.userId)
      
      if (!user.isActive) {
        res.status(401).json({ 
          success: false, 
          error: 'Account is deactivated' 
        })
        return
      }

      // Check if user is the admin
      if (user.email.toLowerCase() !== adminEmail.toLowerCase()) {
        res.status(403).json({ 
          success: false, 
          error: 'Admin access required' 
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

