import { getJwtToken, getAdminJwtToken, clearAllTokens, clearAdminTokens } from './tokenStorage'

/**
 * API Client Utility
 * Helper functions for making API requests
 */

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  status: number
  code?: string
  email?: string
}

/**
 * Make a GET request
 */
export async function apiGet<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    // Automatically include JWT token if available
    const token = getJwtToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers && typeof options.headers === 'object' && !(options.headers instanceof Headers)
        ? Object.fromEntries(
          Object.entries(options.headers).map(([k, v]) => [k, String(v)])
        )
        : {}),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    } else {
      // If no JWT, check for Guest API Key
      const apiKey = localStorage.getItem('coralbricks_api_key')
      if (apiKey) {
        headers['x-api-key'] = apiKey
      }
    }

    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
      ...options,
    })

    const data = await response.json().catch(() => ({}))

    // Handle unauthorized (401) for profile endpoint - auto logout
    if (response.status === 401 && endpoint.includes('/user/profile')) {
      clearAllTokens()
      // Redirect to login page if not already there
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login'
      }
      return {
        error: 'Session expired. Please log in again.',
        status: 401,
      }
    }

    return {
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : data.message || data.error || 'Request failed',
      message: data.message,
      status: response.status,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    }
  }
}

/**
 * Make a POST request
 */
export async function apiPost<T = any>(
  endpoint: string,
  body?: any,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    // Automatically include JWT token if available
    const token = getJwtToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers && typeof options.headers === 'object' && !(options.headers instanceof Headers)
        ? Object.fromEntries(
          Object.entries(options.headers).map(([k, v]) => [k, String(v)])
        )
        : {}),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })

    const data = await response.json().catch(() => ({}))

    return {
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : data.message || data.error || 'Request failed',
      message: data.message,
      status: response.status,
      code: data.code,
      email: data.email,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    }
  }
}

/**
 * Make a PUT request
 */
export async function apiPut<T = any>(
  endpoint: string,
  body?: any,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    // Automatically include JWT token if available
    const token = getJwtToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers && typeof options.headers === 'object' && !(options.headers instanceof Headers)
        ? Object.fromEntries(
          Object.entries(options.headers).map(([k, v]) => [k, String(v)])
        )
        : {}),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })

    const data = await response.json().catch(() => ({}))

    return {
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : data.message || data.error || 'Request failed',
      message: data.message,
      status: response.status,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    }
  }
}

/**
 * Make a DELETE request
 */
export async function apiDelete<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    // Automatically include JWT token if available
    const token = getJwtToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers && typeof options.headers === 'object' && !(options.headers instanceof Headers)
        ? Object.fromEntries(
          Object.entries(options.headers).map(([k, v]) => [k, String(v)])
        )
        : {}),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers,
      ...options,
    })

    const data = await response.json().catch(() => ({}))

    return {
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : data.message || data.error || 'Request failed',
      message: data.message,
      status: response.status,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    }
  }
}

/**
 * Add authorization token to headers
 */
export function getAuthHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

/**
 * Make a GET request with admin token
 */
export async function adminApiGet<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const token = getAdminJwtToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers && typeof options.headers === 'object' && !(options.headers instanceof Headers)
        ? Object.fromEntries(
          Object.entries(options.headers).map(([k, v]) => [k, String(v)])
        )
        : {}),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
      ...options,
    })

    const data = await response.json().catch(() => ({}))

    // Handle unauthorized (401/403) for admin endpoints - auto logout
    if (response.status === 401 || response.status === 403) {
      clearAdminTokens()
      if (window.location.pathname !== '/admin') {
        window.location.href = '/admin'
      }
      return {
        error: 'Admin session expired. Please log in again.',
        status: response.status,
      }
    }

    return {
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : data.message || data.error || 'Request failed',
      message: data.message,
      status: response.status,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    }
  }
}

/**
 * Make a POST request with admin token
 */
export async function adminApiPost<T = any>(
  endpoint: string,
  body?: any,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const token = getAdminJwtToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers && typeof options.headers === 'object' && !(options.headers instanceof Headers)
        ? Object.fromEntries(
          Object.entries(options.headers).map(([k, v]) => [k, String(v)])
        )
        : {}),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })

    const data = await response.json().catch(() => ({}))

    return {
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : data.message || data.error || 'Request failed',
      message: data.message,
      status: response.status,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    }
  }
}

/**
 * Make a PUT request with admin token
 */
export async function adminApiPut<T = any>(
  endpoint: string,
  body?: any,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const token = getAdminJwtToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers && typeof options.headers === 'object' && !(options.headers instanceof Headers)
        ? Object.fromEntries(
          Object.entries(options.headers).map(([k, v]) => [k, String(v)])
        )
        : {}),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })

    const data = await response.json().catch(() => ({}))

    // Handle unauthorized (401/403) for admin endpoints - auto logout
    if (response.status === 401 || response.status === 403) {
      clearAdminTokens()
      if (window.location.pathname !== '/admin') {
        window.location.href = '/admin'
      }
      return {
        error: 'Admin session expired. Please log in again.',
        status: response.status,
      }
    }

    return {
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : data.message || data.error || 'Request failed',
      message: data.message,
      status: response.status,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    }
  }
}
