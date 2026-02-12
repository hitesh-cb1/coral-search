import { Router } from 'express'
import { AdminController } from './controllers/admin.controller'
import { adminAuth } from '../middleware/admin-auth'

export const internalRoutes = Router()

const adminController = new AdminController()

// Admin login (no auth required)
internalRoutes.post('/admin/login', adminController.login)

// Admin routes (require admin authentication)
internalRoutes.get('/admin/users', adminAuth, adminController.getAllUsers)
internalRoutes.get('/admin/users/:userId/api-keys', adminAuth, adminController.getUserApiKeys)
internalRoutes.put('/admin/users/:userId/rate-limits', adminAuth, adminController.updateUserRateLimits)
