import crypto from 'crypto'

/**
 * Encryption utility for API keys
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 16 bytes for AES
const SALT_LENGTH = 64 // 64 bytes for key derivation
const TAG_LENGTH = 16 // 16 bytes for GCM auth tag
const KEY_LENGTH = 32 // 32 bytes for AES-256

/**
 * Get encryption key from environment variable
 * Falls back to a default in development (should be set in production)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.API_KEY_ENCRYPTION_KEY
  
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('API_KEY_ENCRYPTION_KEY environment variable is required in production')
    }
    // Development fallback - warn but allow
    console.warn('⚠️  API_KEY_ENCRYPTION_KEY not set, using development default. Set this in production!')
    return crypto.scryptSync('development-key-change-in-production', 'salt', KEY_LENGTH)
  }
  
  // If key is provided as hex string, convert it
  if (key.length === 64) {
    return Buffer.from(key, 'hex')
  }
  
  // Otherwise derive key from string using scrypt
  return crypto.scryptSync(key, 'coralbricks-api-key-salt', KEY_LENGTH)
}

/**
 * Encrypt an API key
 * Returns a hex-encoded string containing: salt + iv + tag + encryptedData
 */
export function encryptApiKey(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty string')
  }
  
  const masterKey = getEncryptionKey()
  
  // Generate random salt for key derivation
  const salt = crypto.randomBytes(SALT_LENGTH)
  
  // Derive key from master key and salt
  const key = crypto.scryptSync(masterKey, salt, KEY_LENGTH)
  
  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH)
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  // Encrypt
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  // Get auth tag
  const tag = cipher.getAuthTag()
  
  // Combine: salt (64 bytes) + iv (16 bytes) + tag (16 bytes) + encrypted data
  const combined = Buffer.concat([
    salt,
    iv,
    tag,
    Buffer.from(encrypted, 'hex')
  ])
  
  return combined.toString('hex')
}

/**
 * Decrypt an API key
 * Expects hex-encoded string from encryptApiKey
 */
export function decryptApiKey(encryptedHex: string): string {
  if (!encryptedHex) {
    throw new Error('Cannot decrypt empty string')
  }
  
  const masterKey = getEncryptionKey()
  
  // Parse the combined buffer
  const combined = Buffer.from(encryptedHex, 'hex')
  
  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH)
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
  const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
  
  // Derive key from master key and salt
  const key = crypto.scryptSync(masterKey, salt, KEY_LENGTH)
  
  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  
  // Decrypt
  let decrypted = decipher.update(encrypted, undefined, 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Generate a secure encryption key (for setting up environment variable)
 * Run this once to generate a key, then set it in your .env file
 */
export function generateEncryptionKey(): string {
  const key = crypto.randomBytes(KEY_LENGTH)
  return key.toString('hex')
}
