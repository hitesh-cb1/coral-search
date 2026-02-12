import { IPaymentRepository } from './payment.repository.interface'
import { IUserRepository } from '../user/user.repository.interface'
import { CreateCheckoutSessionInput, CheckoutSessionResult, CreateCreditTransactionInput, CreditTransaction } from './payment.types'
import { freemiumConfig } from '../../config/freemium.config'
import { rateLimitConfig } from '../../config/rate-limit.config'
import { ValidationError, NotFoundError } from '../../shared/errors/app-error'
import { getApiKeyService } from '../../bootstrap/services'
import Stripe from 'stripe'

export class PaymentService {
  private stripe: Stripe | null = null

  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly userRepository: IUserRepository
  ) {
    // Initialize Stripe if API key is provided
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-12-15.clover',
      })
    } else {
      console.warn('Stripe secret key not configured. Payment functionality will be disabled.')
    }
  }

  /**
   * Create a Stripe checkout session for purchasing tokens
   */
  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSessionResult> {
    if (!this.stripe) {
      throw new ValidationError('Payment processing is not configured')
    }

    // Validate amount is in correct increments (default: 1 cent increments)
    const incrementCents = freemiumConfig.pricing.purchaseIncrementCents
    if (input.amountCents % incrementCents !== 0) {
      throw new ValidationError(`Amount must be in $${(incrementCents / 100).toFixed(2)} increments`)
    }

    // Validate minimum purchase (default: 1 cent minimum)
    if (input.amountCents < freemiumConfig.pricing.minPurchaseCents) {
      throw new ValidationError(`Minimum purchase amount is $${(freemiumConfig.pricing.minPurchaseCents / 100).toFixed(2)}`)
    }

    // Get user to verify they exist
    const user = await this.userRepository.findById(input.userId)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Get or create Stripe Customer for this user
    let stripeCustomerId = user.stripeCustomerId
    if (!stripeCustomerId) {
      // Create a new Stripe Customer
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : undefined,
        metadata: {
          userId: user.id.toString(),
        },
      })
      stripeCustomerId = customer.id
      // Store the customer ID in the database
      await this.userRepository.updateStripeCustomerId(user.id, stripeCustomerId)
    }

    // Calculate tokens (e.g., $0.01 = 1M tokens, $1 = 100M tokens)
    const tokensToAdd = Math.floor((input.amountCents / 100) * freemiumConfig.pricing.tokensPerDollar)
    const amountDollars = input.amountCents / 100

    // Create pending transaction record
    const transaction = await this.paymentRepository.createTransaction({
      userId: input.userId,
      type: 'purchase',
      amount: tokensToAdd,
      cost: amountDollars,
      currency: 'USD',
      paymentProvider: 'stripe',
      paymentStatus: 'pending',
      description: `Purchase ${tokensToAdd.toLocaleString()} tokens for $${amountDollars.toFixed(2)}`,
      metadata: {
        amountCents: input.amountCents,
        tokensToAdd,
      },
    })

    // Create Stripe checkout session with customer to enable saved payment methods
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const session = await this.stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${tokensToAdd.toLocaleString()} Tokens`,
              description: `Add ${tokensToAdd.toLocaleString()} tokens to your account`,
            },
            unit_amount: input.amountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/organization/billing?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/organization/billing?payment=cancelled`,
      client_reference_id: transaction.id.toString(),
      metadata: {
        userId: input.userId.toString(),
        transactionId: transaction.id.toString(),
        tokensToAdd: tokensToAdd.toString(),
      },
      // Enable saving payment methods for future use
      payment_intent_data: {
        setup_future_usage: 'off_session', // Allow saving payment method for future use
      },
    })

    // Update transaction with Stripe session ID
    await this.paymentRepository.updateTransactionStatus(transaction.id, 'pending')

    return {
      sessionId: session.id,
      url: session.url || '',
    }
  }

  /**
   * Handle successful payment webhook from Stripe
   */
  async handlePaymentSuccess(sessionId: string): Promise<void> {
    if (!this.stripe) {
      throw new ValidationError('Payment processing is not configured')
    }

    // Retrieve the checkout session from Stripe
    const session = await this.stripe.checkout.sessions.retrieve(sessionId)

    if (!session.client_reference_id) {
      throw new ValidationError('Invalid checkout session: missing transaction reference')
    }

    const transactionId = parseInt(session.client_reference_id, 10)
    const transaction = await this.paymentRepository.findTransactionById(transactionId)

    if (!transaction) {
      throw new NotFoundError('Transaction not found')
    }

    if (transaction.paymentStatus === 'completed') {
      // Already processed, skip
      return
    }

    // Verify payment was successful
    if (session.payment_status !== 'paid') {
      await this.paymentRepository.updateTransactionStatus(transactionId, 'failed')
      throw new ValidationError('Payment was not successful')
    }

    // Update transaction with Stripe payment ID
    const paymentIntentId = typeof session.payment_intent === 'string' 
      ? session.payment_intent 
      : (session.payment_intent as any)?.id || session.id
    
    await this.paymentRepository.updateTransactionPaymentId(transactionId, paymentIntentId)
    
    // Store Stripe Customer ID if session has one (in case it was created by Stripe)
    if (session.customer && typeof session.customer === 'string') {
      const user = await this.userRepository.findById(transaction.userId)
      if (user && !user.stripeCustomerId) {
        await this.userRepository.updateStripeCustomerId(transaction.userId, session.customer)
      }
    }
    
    // Update transaction status
    await this.paymentRepository.updateTransactionStatus(transactionId, 'completed')

    // Add tokens to user's account
    await this.userRepository.addTokens(transaction.userId, transaction.amount)

    // Update API key rate limits to paid tier (for display purposes)
    // Note: Actual rate limiting uses config-based limits, but we update DB for consistency
    const apiKeyService = getApiKeyService()
    const paidLimits = rateLimitConfig.paid
    await apiKeyService.updateRateLimitsForUser(
      transaction.userId,
      paidLimits.requestsPerSecond,
      BigInt(paidLimits.tokensPerMonth)
    )
  }

  /**
   * Verify and process payment by session ID (called when user returns from checkout)
   */
  async verifyPayment(sessionId: string): Promise<{ success: boolean; transactionId: number; tokensAdded: number }> {
    if (!this.stripe) {
      throw new ValidationError('Payment processing is not configured')
    }

    // Retrieve the checkout session from Stripe
    const session = await this.stripe.checkout.sessions.retrieve(sessionId)

    if (!session.client_reference_id) {
      throw new ValidationError('Invalid checkout session: missing transaction reference')
    }

    const transactionId = parseInt(session.client_reference_id, 10)
    const transaction = await this.paymentRepository.findTransactionById(transactionId)

    if (!transaction) {
      throw new NotFoundError('Transaction not found')
    }

    // If already completed, return success
    if (transaction.paymentStatus === 'completed') {
      return {
        success: true,
        transactionId: transaction.id,
        tokensAdded: transaction.amount,
      }
    }

    // Verify payment was successful
    if (session.payment_status !== 'paid') {
      await this.paymentRepository.updateTransactionStatus(transactionId, 'failed')
      return {
        success: false,
        transactionId: transaction.id,
        tokensAdded: 0,
      }
    }

    // Update transaction with Stripe payment ID
    const paymentIntentId = typeof session.payment_intent === 'string' 
      ? session.payment_intent 
      : (session.payment_intent as any)?.id || session.id
    
    await this.paymentRepository.updateTransactionPaymentId(transactionId, paymentIntentId)
    
    // Store Stripe Customer ID if session has one (in case it was created by Stripe)
    if (session.customer && typeof session.customer === 'string') {
      const user = await this.userRepository.findById(transaction.userId)
      if (user && !user.stripeCustomerId) {
        await this.userRepository.updateStripeCustomerId(transaction.userId, session.customer)
      }
    }
    
    // Update transaction status
    await this.paymentRepository.updateTransactionStatus(transactionId, 'completed')

    // Add tokens to user's account
    await this.userRepository.addTokens(transaction.userId, transaction.amount)

    return {
      success: true,
      transactionId: transaction.id,
      tokensAdded: transaction.amount,
    }
  }

  /**
   * Get transaction history for a user
   * Also syncs pending transactions with Stripe to update their status
   * 
   * Note: Only syncs transactions for the current user, limited to the most recent transactions
   */
  async getUserTransactions(userId: number, limit: number = 50): Promise<CreditTransaction[]> {
    const transactions = await this.paymentRepository.findTransactionsByUser(userId, limit)
    
    // Sync pending transactions with Stripe to check their actual status
    if (this.stripe) {
      const pendingTransactions = transactions.filter(t => 
        t.paymentStatus === 'pending' && 
        t.paymentProvider === 'stripe'
      )
      
      // Only sync if there are pending transactions
      if (pendingTransactions.length > 0) {
        try {
          // Fetch recent Stripe checkout sessions once (more efficient than fetching per transaction)
          // Get enough sessions to cover potential matches (limit * 2 to be safe)
          const sessions = await this.stripe.checkout.sessions.list({
            limit: Math.min(100, limit * 2), // Cap at 100 to avoid too many API calls
          })
          
          // Create a map of transaction ID to session for quick lookup
          const sessionMap = new Map<number, Stripe.Checkout.Session>()
          for (const session of sessions.data) {
            if (session.client_reference_id) {
              const transactionId = parseInt(session.client_reference_id, 10)
              if (!isNaN(transactionId)) {
                sessionMap.set(transactionId, session)
              }
            }
          }
          
          // Check each pending transaction against the session map
          for (const transaction of pendingTransactions) {
            try {
              const matchingSession = sessionMap.get(transaction.id)
              
              if (matchingSession) {
                // Check if payment was successful
                if (matchingSession.payment_status === 'paid') {
                  // Payment was successful, update the transaction
                  await this.handlePaymentSuccess(matchingSession.id)
                  // Update the transaction in our list
                  transaction.paymentStatus = 'completed'
                  console.log(`Synced pending transaction ${transaction.id} to completed`)
                }
                // If payment_status is 'unpaid' or 'open', leave it as pending
              }
            } catch (error) {
              console.error(`Error syncing transaction ${transaction.id} with Stripe:`, error)
              // Continue with other transactions
            }
          }
        } catch (error) {
          console.error('Error fetching Stripe sessions for sync:', error)
          // Continue without syncing if there's an error
        }
      }
    }
    
    return transactions
  }

  /**
   * Get saved payment methods for a user
   */
  async getUserPaymentMethods(userId: number): Promise<Array<{
    id: string
    type: string
    card?: {
      brand: string
      last4: string
      exp_month: number
      exp_year: number
    }
    created: number
  }>> {
    if (!this.stripe) {
      throw new ValidationError('Payment processing is not configured')
    }

    // Get user to find their Stripe Customer ID
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    if (!user.stripeCustomerId) {
      // No Stripe Customer yet, return empty array
      return []
    }

    // Fetch payment methods from Stripe
    // Note: This fetches payment methods that are attached to the customer
    // Payment methods are automatically attached when user checks "save my info" during checkout
    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    })

    console.log(`Found ${paymentMethods.data.length} payment methods for customer ${user.stripeCustomerId}`)

    // Deduplicate payment methods by card details (same card = same last4, brand, exp_month, exp_year)
    // Stripe may create multiple payment method objects for the same card if saved multiple times
    const uniquePaymentMethods = new Map<string, Stripe.PaymentMethod>()
    
    for (const pm of paymentMethods.data) {
      if (pm.card) {
        // Create a unique key based on card details
        const cardKey = `${pm.card.brand}-${pm.card.last4}-${pm.card.exp_month}-${pm.card.exp_year}`
        
        // If we haven't seen this card before, or if this payment method is newer, use it
        const existing = uniquePaymentMethods.get(cardKey)
        if (!existing || pm.created > existing.created) {
          uniquePaymentMethods.set(cardKey, pm)
        }
      } else {
        // For non-card payment methods, use the ID as the key
        uniquePaymentMethods.set(pm.id, pm)
      }
    }

    // Convert map to array and sort by creation date (newest first)
    const deduplicatedMethods = Array.from(uniquePaymentMethods.values())
      .sort((a, b) => b.created - a.created)

    console.log(`Deduplicated to ${deduplicatedMethods.length} unique payment methods`)

    return deduplicatedMethods.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        last4: pm.card.last4,
        exp_month: pm.card.exp_month,
        exp_year: pm.card.exp_year,
      } : undefined,
      created: pm.created,
    }))
  }

  /**
   * Delete a payment method
   * Also removes all duplicate payment methods with the same card details
   */
  async deletePaymentMethod(userId: number, paymentMethodId: string): Promise<void> {
    if (!this.stripe) {
      throw new ValidationError('Payment processing is not configured')
    }

    // Get user to verify they own this payment method
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    if (!user.stripeCustomerId) {
      throw new ValidationError('No payment methods found')
    }

    // Get the payment method to verify it belongs to this customer
    const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId)
    if (paymentMethod.customer !== user.stripeCustomerId) {
      throw new ValidationError('Payment method does not belong to this user')
    }

    // If it's a card, get the card details to find duplicates
    let cardDetails: { brand: string; last4: string; exp_month: number; exp_year: number } | null = null
    if (paymentMethod.card) {
      cardDetails = {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        exp_month: paymentMethod.card.exp_month,
        exp_year: paymentMethod.card.exp_year,
      }
    }

    // Detach the requested payment method
    await this.stripe.paymentMethods.detach(paymentMethodId)

    // If it's a card, find and detach all other payment methods with the same card details
    if (cardDetails) {
      const allPaymentMethods = await this.stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      })

      // Find all payment methods with matching card details
      const duplicates = allPaymentMethods.data.filter(pm => {
        if (!pm.card) return false
        return (
          pm.id !== paymentMethodId && // Don't detach the one we already detached
          pm.card.brand === cardDetails!.brand &&
          pm.card.last4 === cardDetails!.last4 &&
          pm.card.exp_month === cardDetails!.exp_month &&
          pm.card.exp_year === cardDetails!.exp_year
        )
      })

      // Detach all duplicates
      if (duplicates.length > 0) {
        console.log(`Found ${duplicates.length} duplicate payment methods for card ${cardDetails.brand} •••• ${cardDetails.last4}, detaching all`)
        await Promise.all(
          duplicates.map(pm => this.stripe!.paymentMethods.detach(pm.id))
        )
      }
    }
  }

  /**
   * Handle failed payment webhook from Stripe
   */
  async handlePaymentFailure(sessionId: string): Promise<void> {
    if (!this.stripe) {
      return
    }

    const session = await this.stripe.checkout.sessions.retrieve(sessionId)

    if (!session.client_reference_id) {
      return
    }

    const transactionId = parseInt(session.client_reference_id, 10)
    const transaction = await this.paymentRepository.findTransactionById(transactionId)

    if (!transaction || transaction.paymentStatus === 'completed') {
      return
    }

    await this.paymentRepository.updateTransactionStatus(transactionId, 'failed')
  }
}

