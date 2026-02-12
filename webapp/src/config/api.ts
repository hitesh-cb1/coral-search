/**
 * API Configuration
 * Base URL for API requests
 */

// Use local backend for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export { API_BASE_URL }

/**
 * Get the full API URL by appending an endpoint
 * @param endpoint - The API endpoint path (e.g., '/users', '/auth/login')
 * @returns Full URL string
 */
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  // Ensure base URL doesn't end with a slash
  const cleanBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
  return `${cleanBaseUrl}/${cleanEndpoint}`
}

