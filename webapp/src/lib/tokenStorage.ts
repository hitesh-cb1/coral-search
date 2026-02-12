/**
 * Token Storage Utility
 * Handles JWT token storage and retrieval from localStorage
 */

const JWT_TOKEN_KEY = 'coralbricks_jwt_token'
const ADMIN_JWT_TOKEN_KEY = 'coralbricks_admin_jwt_token'
const API_KEY_KEY = 'coralbricks_api_key'
const API_KEYS_COLLECTION_KEY = 'coralbricks_api_keys_collection'
const TOKEN_COUNT_KEY = 'coralbricks_token_count'
const TOKEN_COUNT_TIMESTAMP_KEY = 'coralbricks_token_count_timestamp'

/**
 * Store JWT token in localStorage
 */
export function storeJwtToken(token: string): void {
  try {
    localStorage.setItem(JWT_TOKEN_KEY, token)
  } catch (error) {
    console.error('Failed to store JWT token:', error)
  }
}

/**
 * Retrieve JWT token from localStorage
 */
export function getJwtToken(): string | null {
  try {
    return localStorage.getItem(JWT_TOKEN_KEY)
  } catch (error) {
    console.error('Failed to retrieve JWT token:', error)
    return null
  }
}

/**
 * Remove JWT token from localStorage
 */
export function removeJwtToken(): void {
  try {
    localStorage.removeItem(JWT_TOKEN_KEY)
  } catch (error) {
    console.error('Failed to remove JWT token:', error)
  }
}

/**
 * Check if JWT token exists
 */
export function hasJwtToken(): boolean {
  return getJwtToken() !== null
}

/**
 * Store API key in localStorage
 */
export function storeApiKey(apiKey: string): void {
  try {
    localStorage.setItem(API_KEY_KEY, apiKey)
  } catch (error) {
    console.error('Failed to store API key:', error)
  }
}

/**
 * Retrieve API key from localStorage
 */
export function getApiKey(): string | null {
  try {
    return localStorage.getItem(API_KEY_KEY)
  } catch (error) {
    console.error('Failed to retrieve API key:', error)
    return null
  }
}

/**
 * Remove API key from localStorage
 */
export function removeApiKey(): void {
  try {
    localStorage.removeItem(API_KEY_KEY)
  } catch (error) {
    console.error('Failed to remove API key:', error)
  }
}

/**
 * Store token count in localStorage
 */
export function storeTokenCount(tokenCount: number): void {
  try {
    localStorage.setItem(TOKEN_COUNT_KEY, tokenCount.toString())
    localStorage.setItem(TOKEN_COUNT_TIMESTAMP_KEY, new Date().toISOString())
  } catch (error) {
    console.error('Failed to store token count:', error)
  }
}

/**
 * Retrieve token count from localStorage
 */
export function getTokenCount(): number | null {
  try {
    const count = localStorage.getItem(TOKEN_COUNT_KEY)
    return count ? parseInt(count, 10) : null
  } catch (error) {
    console.error('Failed to retrieve token count:', error)
    return null
  }
}

/**
 * Get token count timestamp
 */
export function getTokenCountTimestamp(): string | null {
  try {
    return localStorage.getItem(TOKEN_COUNT_TIMESTAMP_KEY)
  } catch (error) {
    console.error('Failed to retrieve token count timestamp:', error)
    return null
  }
}

/**
 * Store admin JWT token in localStorage (separate from user token)
 */
export function storeAdminJwtToken(token: string): void {
  try {
    localStorage.setItem(ADMIN_JWT_TOKEN_KEY, token)
  } catch (error) {
    console.error('Failed to store admin JWT token:', error)
  }
}

/**
 * Retrieve admin JWT token from localStorage
 */
export function getAdminJwtToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_JWT_TOKEN_KEY)
  } catch (error) {
    console.error('Failed to retrieve admin JWT token:', error)
    return null
  }
}

/**
 * Remove admin JWT token from localStorage
 */
export function removeAdminJwtToken(): void {
  try {
    localStorage.removeItem(ADMIN_JWT_TOKEN_KEY)
  } catch (error) {
    console.error('Failed to remove admin JWT token:', error)
  }
}

/**
 * Check if admin JWT token exists
 */
export function hasAdminJwtToken(): boolean {
  return getAdminJwtToken() !== null
}

/**
 * Clear all stored tokens (logout) - both user and admin
 */
export function clearAllTokens(): void {
  removeJwtToken()
  removeAdminJwtToken()
  removeApiKey()
  try {
    localStorage.removeItem(TOKEN_COUNT_KEY)
    localStorage.removeItem(TOKEN_COUNT_TIMESTAMP_KEY)
    localStorage.removeItem(API_KEYS_COLLECTION_KEY)
  } catch (error) {
    console.error('Failed to clear token count:', error)
  }
}

/**
 * Clear only admin tokens (admin logout)
 */
export function clearAdminTokens(): void {
  removeAdminJwtToken()
}

/**
 * Store a full API key in the collection (for later copying)
 */
export function storeFullApiKey(keyId: string | number, fullKey: string, name: string): void {
  try {
    const existing = getStoredApiKeys()
    existing[keyId.toString()] = { fullKey, name, storedAt: new Date().toISOString() }
    localStorage.setItem(API_KEYS_COLLECTION_KEY, JSON.stringify(existing))
  } catch (error) {
    console.error('Failed to store full API key:', error)
  }
}

/**
 * Get a full API key from the collection
 */
export function getFullApiKey(keyId: string | number): string | null {
  try {
    const stored = getStoredApiKeys()
    return stored[keyId.toString()]?.fullKey || null
  } catch (error) {
    console.error('Failed to retrieve full API key:', error)
    return null
  }
}

/**
 * Get all stored API keys
 */
export function getStoredApiKeys(): Record<string, { fullKey: string; name: string; storedAt: string }> {
  try {
    const stored = localStorage.getItem(API_KEYS_COLLECTION_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Failed to retrieve stored API keys:', error)
    return {}
  }
}

/**
 * Remove a full API key from the collection
 */
export function removeFullApiKey(keyId: string | number): void {
  try {
    const existing = getStoredApiKeys()
    delete existing[keyId.toString()]
    localStorage.setItem(API_KEYS_COLLECTION_KEY, JSON.stringify(existing))
  } catch (error) {
    console.error('Failed to remove full API key:', error)
  }
}

