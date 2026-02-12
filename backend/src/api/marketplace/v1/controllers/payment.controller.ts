import { Request, Response } from 'express'
import { PaymentService } from '../../../../domain/payment/payment.service'
import Stripe from 'stripe'

interface AuthenticatedRequest extends Request {
  user?: {
    id: number
    email: string
  }
}

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Create a Stripe checkout session for purchasing tokens
   * POST /marketplace/v1/payment/create-checkout-session
   */
  createCheckoutSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' })
        return
      }

      const { amountCents } = req.body

      if (!amountCents || typeof amountCents !== 'number' || amountCents <= 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid amount. Amount must be a positive number in cents.',
        })
        return
      }

      const result = await this.paymentService.createCheckoutSession({
        userId: req.user.id,
        amountCents,
      })

      res.json({
        success: true,
        data: {
          sessionId: result.sessionId,
          url: result.url,
        },
      })
    } catch (error) {
      console.error('Error creating checkout session:', error)
      const message = error instanceof Error ? error.message : 'Internal server error'
      res.status(400).json({ success: false, error: message })
    }
  }

  /**
   * Verify payment status by session ID (called when user returns from checkout)
   * POST /marketplace/v1/payment/verify
   */
  verifyPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' })
        return
      }

      const { sessionId } = req.body

      if (!sessionId || typeof sessionId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Session ID is required',
        })
        return
      }

      const result = await this.paymentService.verifyPayment(sessionId)

      res.json({
        success: result.success,
        data: {
          transactionId: result.transactionId,
          tokensAdded: result.tokensAdded,
        },
      })
    } catch (error) {
      console.error('Error verifying payment:', error)
      const message = error instanceof Error ? error.message : 'Internal server error'
      res.status(400).json({ success: false, error: message })
    }
  }

  /**
   * Get payment transaction history for the authenticated user
   * GET /marketplace/v1/payment/transactions
   */
  getTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' })
        return
      }

      const transactions = await this.paymentService.getUserTransactions(req.user.id)

      res.json({
        success: true,
        data: {
          transactions,
        },
      })
    } catch (error) {
      console.error('Error getting transactions:', error)
      const message = error instanceof Error ? error.message : 'Internal server error'
      res.status(500).json({ success: false, error: message })
    }
  }

  /**
   * Get saved payment methods for the authenticated user
   * GET /marketplace/v1/payment/payment-methods
   */
  getPaymentMethods = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' })
        return
      }

      const paymentMethods = await this.paymentService.getUserPaymentMethods(req.user.id)

      res.json({
        success: true,
        data: {
          paymentMethods,
        },
      })
    } catch (error) {
      console.error('Error getting payment methods:', error)
      const message = error instanceof Error ? error.message : 'Internal server error'
      res.status(400).json({ success: false, error: message })
    }
  }

  /**
   * Delete a payment method
   * DELETE /marketplace/v1/payment/payment-methods/:paymentMethodId
   */
  deletePaymentMethod = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' })
        return
      }

      const { paymentMethodId } = req.params

      if (!paymentMethodId) {
        res.status(400).json({
          success: false,
          error: 'Payment method ID is required',
        })
        return
      }

      await this.paymentService.deletePaymentMethod(req.user.id, paymentMethodId)

      res.json({
        success: true,
        data: {
          message: 'Payment method deleted successfully',
        },
      })
    } catch (error) {
      console.error('Error deleting payment method:', error)
      const message = error instanceof Error ? error.message : 'Internal server error'
      res.status(400).json({ success: false, error: message })
    }
  }

  /**
   * Handle Stripe webhook
   * POST /marketplace/v1/payment/webhook
   */
  handleWebhook = async (req: Request, res: Response): Promise<void> => {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!stripeSecretKey || !stripeWebhookSecret) {
      res.status(500).json({ success: false, error: 'Stripe not configured' })
      return
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
    })

    const sig = req.headers['stripe-signature']

    if (!sig) {
      res.status(400).json({ success: false, error: 'Missing stripe-signature header' })
      return
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      res.status(400).json({ success: false, error: 'Invalid signature' })
      return
    }

    try {
      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session
          if (session.payment_status === 'paid') {
            await this.paymentService.handlePaymentSuccess(session.id)
          }
          break
        }

        case 'checkout.session.async_payment_failed':
        case 'checkout.session.async_payment_succeeded': {
          const session = event.data.object as Stripe.Checkout.Session
          if (session.payment_status === 'paid') {
            await this.paymentService.handlePaymentSuccess(session.id)
          } else {
            await this.paymentService.handlePaymentFailure(session.id)
          }
          break
        }

        default:
          console.log(`Unhandled event type: ${event.type}`)
      }

      res.json({ success: true, received: true })
    } catch (error) {
      console.error('Error processing webhook:', error)
      res.status(500).json({ success: false, error: 'Webhook processing failed' })
    }
  }
}

