/**
 * Rate Limit Configuration
 * 
 * Defines rate limits and token allocations for different user tiers
 */

export interface RateLimitTier {
    requestsPerSecond: number
    tokensPerMinute: number
    tokensPerMonth: number
    description: string
}

export const rateLimitConfig = {
    /**
     * Unverified users (email-only signup via Try API)
     */
    unverified: {
        requestsPerSecond: 5, // 5 requests per second
        tokensPerMinute: 10_000,
        tokensPerMonth: 1_000_000,
        description: 'Email-only signup - Try API flow',
    } as RateLimitTier,

    /**
     * Verified users (completed email verification)
     * Note: Verified users also receive a one-time 100M token grant
     */
    verified: {
        requestsPerSecond: 10, // 10 requests per second
        tokensPerMinute: 75_000,
        tokensPerMonth: 10_000_000,
        description: 'Email verified - includes 100M one-time token grant',
    } as RateLimitTier,

    /**
     * Paid users (history of at least one payment)
     */
    paid: {
        requestsPerSecond: 50, // 50 requests per second
        tokensPerMinute: 250_000,
        tokensPerMonth: 100_000_000,
        description: 'Paid user - High performance tier',
    } as RateLimitTier,
} as const

/**
 * One-time token grants for specific events
 */
export const tokenGrants = {
    /**
     * Tokens granted when user verifies their email
     */
    emailVerification: 100_000_000, // 100M tokens
} as const

/**
 * Get rate limits for a specific tier
 */
export function getRateLimits(tier: keyof typeof rateLimitConfig): RateLimitTier {
    return rateLimitConfig[tier]
}

/**
 * Get rate limits based on user verification status
 */
export function getRateLimitsForUser(isVerified: boolean, hasPaid: boolean = false): RateLimitTier {
    if (hasPaid) return rateLimitConfig.paid
    return isVerified ? rateLimitConfig.verified : rateLimitConfig.unverified
}
