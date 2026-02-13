import { useState, useEffect, useRef, useMemo } from 'react'
import { CodeBlock } from './components/CodeBlock'

import { endpoints } from './config/endpoints'
import { apiGet, apiPost } from './lib/apiClient'
import { Link, useNavigate } from 'react-router-dom'
import { getApiKey, storeApiKey, removeApiKey, storeTokenCount, hasJwtToken, clearAllTokens } from './lib/tokenStorage'
import { Logo } from './components/common/Logo'
import { Footer } from './components/common/Footer'

// Types
export type DownstreamTask = 'query' | 'product'

export type ProductOffering = {
  title?: string
  description?: string
  category?: string
  brand?: string
  color?: string
  bullets?: string
  attributes?: string // JSON string
}

export type PlaygroundState = {
  apiKey: string
  task: DownstreamTask
  text: string
  product: ProductOffering
}

// Helper functions
function validateJson(jsonString: string): { valid: boolean; error?: string } {
  if (!jsonString.trim()) {
    return { valid: true } // Empty is valid (optional field)
  }
  try {
    JSON.parse(jsonString)
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON format'
    }
  }
}

function buildEmbeddingsPayload(state: PlaygroundState): Record<string, unknown> {
  if (state.task === 'product') {
    const product_offering: Record<string, unknown> = {}
    if (state.product.title) product_offering.title = state.product.title
    if (state.product.description) product_offering.description = state.product.description
    if (state.product.category) product_offering.category = state.product.category
    if (state.product.brand) product_offering.brand = state.product.brand
    if (state.product.color) product_offering.color = state.product.color
    if (state.product.bullets) product_offering.bullets = state.product.bullets
    if (state.product.attributes) {
      try {
        product_offering.attributes = JSON.parse(state.product.attributes)
      } catch {
        // skip invalid JSON
      }
    }
    return {
      input: [product_offering],
      model: 'coral_embed',
      task: state.task,
    }
  }
  return {
    input: [state.text.trim()],
    model: 'coral_embed',
    task: state.task,
  }
}

function parseLatencyFromResponse(res: Response): number | null {
  const debugInfo = res.headers.get('X-Debug-Info') || res.headers.get('x-debug-info')
  if (debugInfo) {
    try {
      const parsed = JSON.parse(debugInfo)
      if (typeof parsed.latency_ms === 'number') return parsed.latency_ms
    } catch {
      // ignore
    }
  }
  const ms = res.headers.get('X-latency-ms') || res.headers.get('x-latency-ms')
  if (ms) {
    const n = parseInt(ms, 10)
    if (!isNaN(n)) return n
  }
  return null
}

function buildCurlCommand(args: {
  endpoint: string
  apiKey: string | undefined
  payload: Record<string, unknown>
}): string {
  const apiKey = args.apiKey?.trim() ? args.apiKey.trim() : '<YOUR_API_KEY>'
  const bodySingleLine = JSON.stringify(args.payload).replace(/'/g, "'\\''")

  return [
    `curl -i -X POST ${args.endpoint} \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -H "Authorization: Bearer ${apiKey}" \\`,
    `  -H "X-Debug: true" \\`,
    `  -d '${bodySingleLine}'`,
  ].join('\n')
}

// Playground always calls production embeddings API
const FETCH_ENDPOINT_EMBED = 'https://api.coralbricks.ai/v1/embeddings'

const TASKS: Array<{ value: DownstreamTask; label: string }> = [
  { value: 'query', label: 'Query' },
  { value: 'product', label: 'Product' },
]

function cn(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(' ')
}

function App() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'curl' | 'json'>('curl')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [responseText, setResponseText] = useState<string>('')

  const [availableApiKeys, setAvailableApiKeys] = useState<Array<{ id: string | number; name: string; secretKey?: string; keyPrefix?: string }>>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string>('')
  const [latency, setLatency] = useState<number | null>(null)
  const [attributesError, setAttributesError] = useState<string>('')
  const responseCopyRef = useRef<(() => void) | null>(null)
  const [responseCopied, setResponseCopied] = useState(false)
  const [showLimitBanner, setShowLimitBanner] = useState(false)


  const [state, setState] = useState<PlaygroundState>(() => {
    // Load API key from localStorage if available
    const storedApiKey = getApiKey()
    return {
      apiKey: storedApiKey || '',
      task: 'query',
      text: 'running shoes',
      product: {
        title: '',
        description: '',
        category: '',
        brand: '',
        color: '',
        bullets: '',
        attributes: '',
      },
    }
  })

  // Check if user is logged in
  useEffect(() => {
    setIsLoggedIn(hasJwtToken())

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = () => {
      setIsLoggedIn(hasJwtToken())
    }
    window.addEventListener('storage', handleStorageChange)

    // Also check on focus (when user comes back to tab after login)
    const handleFocus = () => {
      setIsLoggedIn(hasJwtToken())
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, []) // Check on mount and when storage changes

  const generatingGuestKey = useRef(false)

  // Load available API keys on mount and when login status changes
  useEffect(() => {
    const loadApiKeys = async () => {
      // Use hasJwtToken() directly to avoid race conditions with state
      const userIsLoggedIn = hasJwtToken()
      
      // If not logged in and we have a stored key, use it immediately
      if (!userIsLoggedIn) {
        const storedKey = getApiKey()
        if (storedKey) {
          setState(prev => ({ ...prev, apiKey: storedKey }))
        }
      }
      
      try {
        if (userIsLoggedIn) {
          // User is logged in - clear any guest API key and load their real API keys
          const storedKey = getApiKey()
          // If there's a stored key, check if it's a guest key (starts with ak_)
          // Guest keys should be cleared when user logs in
          if (storedKey) {
            // Clear guest key - user should use their own API keys
            removeApiKey()
            setState(prev => ({ ...prev, apiKey: '' }))
          }

          // Load user's API keys (without secrets first for performance)
          const response = await apiGet(endpoints.apiKeys.list())
          if (!response.error && response.data) {
            const responseData = response.data
            const keys = responseData?.data?.apiKeys || responseData?.apiKeys || []
            const keysMetadata = keys.map((k: any) => ({ 
              id: k.id, 
              name: k.name, 
              keyPrefix: k.keyPrefix
            }))
            setAvailableApiKeys(keysMetadata)
            
            // If user has exactly one key, fetch its secret to auto-populate
            if (keysMetadata.length === 1) {
              try {
                const revealResponse = await apiGet(endpoints.apiKeys.reveal(keysMetadata[0].id.toString()))
                if (!revealResponse.error && revealResponse.data?.data?.apiKey?.secretKey) {
                  const secretKey = revealResponse.data.data.apiKey.secretKey
                  storeApiKey(secretKey)
                  setState(prev => ({ ...prev, apiKey: secretKey }))
                  // Update available keys with secret
                  setAvailableApiKeys([{ ...keysMetadata[0], secretKey }])
                }
              } catch (err) {
                // Silently fail - user can manually enter key
                console.warn('Could not auto-load API key secret:', err)
              }
            } else if (keysMetadata.length > 1) {
              // Multiple keys - check if stored key matches any prefix
              const storedKey = getApiKey()
              if (storedKey) {
                const matchingKey = keysMetadata.find((k: { id: string | number; name: string; secretKey?: string; keyPrefix?: string }) => storedKey.startsWith(k.keyPrefix || ''))
                if (matchingKey) {
                  // Verify it's the right key by fetching it
                  try {
                    const revealResponse = await apiGet(endpoints.apiKeys.reveal(matchingKey.id.toString()))
                    if (!revealResponse.error && revealResponse.data?.data?.apiKey?.secretKey === storedKey) {
                      setState(prev => ({ ...prev, apiKey: storedKey }))
                      // Update available keys with secret for this key
                      setAvailableApiKeys(keysMetadata.map((k: { id: string | number; name: string; secretKey?: string; keyPrefix?: string }) => 
                        k.id === matchingKey.id ? { ...k, secretKey: storedKey } : k
                      ))
                    }
                  } catch (err) {
                    // Use stored key anyway
                    setState(prev => ({ ...prev, apiKey: storedKey }))
                  }
                }
              }
            }
          }
        } else {
          // GUEST FLOW: If not logged in and no key, create guest key
          // Only generate if we're sure user is not logged in
          const storedKey = getApiKey()
          if (storedKey) {
            // If there's already a stored key (guest key), use it
            setState(prev => {
              if (prev.apiKey !== storedKey) {
                return { ...prev, apiKey: storedKey }
              }
              return prev
            })
          } else if (!generatingGuestKey.current) {
            generatingGuestKey.current = true
            try {
              console.log('Creating guest API key...')
              const res = await apiPost(endpoints.marketplace.guest(), {})
              console.log('Guest key response:', res)
              if (res.error) {
                console.error('Guest key creation error:', res.error, res)
              } else if (res.data?.data?.apiKey) {
                const newKey = res.data.data.apiKey
                if (newKey && typeof newKey === 'string' && newKey.length > 0) {
                  storeApiKey(newKey)
                  setState(prev => ({ ...prev, apiKey: newKey }))
                  console.log('✅ Generated guest API key:', newKey.substring(0, 12) + '...')
                } else {
                  console.error('Invalid API key received:', newKey)
                }
              } else {
                console.warn('Unexpected response format from guest endpoint. Response:', res)
                console.warn('Expected: res.data.data.apiKey, got:', res.data)
              }
            } catch (guestErr) {
              console.error('Exception during guest key generation:', guestErr)
            } finally {
              generatingGuestKey.current = false
            }
          }
        }
      } catch (err) {
        // Silently fail - user can still enter key manually
      }
    }
    loadApiKeys()
  }, [isLoggedIn]) // Re-run when login status changes

  // Validate JSON fields on initial load and when they change
  useEffect(() => {
    if (state.product.attributes) {
      const validation = validateJson(state.product.attributes)
      setAttributesError(validation.valid ? '' : validation.error || 'Invalid JSON format')
    } else {
      setAttributesError('')
    }
  }, [state.product.attributes])

  const payload = useMemo(() => buildEmbeddingsPayload(state), [state])
  const json = useMemo(() => JSON.stringify(payload, null, 2), [payload])
  const endpoint = useMemo(() => FETCH_ENDPOINT_EMBED, [])
  const curl = useMemo(
    () =>
      buildCurlCommand({
        endpoint,
        apiKey: state.apiKey || '<YOUR_API_KEY>',
        payload,
      }),
    [payload, state.apiKey, endpoint],
  )

  const canSend = useMemo(() => {
    const hasApiKey = state.apiKey.trim().length > 0

    // Check input based on task type
    let hasValidInput = false
    if (state.task === 'query') {
      hasValidInput = state.text.trim().length > 0
    } else {
      // Product task - at least title is required (matching validation in onGetResponse)
      hasValidInput = (state.product.title?.trim().length ?? 0) > 0
      // Also check for JSON errors
      if (attributesError) {
        hasValidInput = false
      }
    }

    return hasValidInput && hasApiKey && !isLoading
  }, [isLoading, state.text, state.apiKey, state.task, state.product.title, attributesError])

  async function onGetResponse() {
    setError('')
    setResponseText('')
    setLatency(null)
    setResponseCopied(false)
    setShowLimitBanner(false)

    // Validate based on task type
    if (state.task === 'query') {
      if (!state.text.trim()) {
        setError('Please enter text to embed.')
        return
      }
    } else {
      // Product task
      if (!state.product.title?.trim()) {
        setError('Product title is required.')
        return
      }

      // Validate JSON fields
      if (state.product.attributes) {
        const validation = validateJson(state.product.attributes)
        if (!validation.valid) {
          setAttributesError(validation.error || 'Invalid JSON format')
          setError('Please fix JSON errors in the form fields.')
          return
        }
      }
    }

    const apiKey = state.apiKey.trim()
    if (!apiKey) {
      setError('Please enter an API key.')
      return
    }

    setIsLoading(true)
    const startTime = Date.now()
    try {
      const res = await fetch(FETCH_ENDPOINT_EMBED, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'X-Debug': 'true',
        },
        body: JSON.stringify(payload),
      })

      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        setError(`Invalid JSON response: ${text}`)
        setIsLoading(false)
        return
      }

      if (!res.ok) {
        const latencyValue = parseLatencyFromResponse(res) ?? (Date.now() - startTime)
        setLatency(latencyValue)
        // Handle CoralBricks-specific error codes
        if (data.error?.includes('Insufficient token balance')) {
          setError('Account token balance insufficient. Please purchase credits to continue.')
        } else if (data.code === 'INVALID_API_KEY' || res.status === 401) {
          setError('Invalid API key or session expired. Please check your API key or log in again.')
        } else {
          setError(data.error || `HTTP ${res.status}: ${text}`)
        }
        // Check if it's a rate limit error (429 or rate limit message)
        const isRateLimit = res.status === 429 || 
          data.error?.toLowerCase().includes('rate limit') ||
          data.error?.toLowerCase().includes('too many requests')
        if (isRateLimit && !isLoggedIn) {
          setShowLimitBanner(true)
        }
        setIsLoading(false)
        return
      }

      if (data.usage?.total_tokens) {
        storeTokenCount(data.usage.total_tokens)
      }
      const latencyValue = parseLatencyFromResponse(res) ?? data.latency_ms ?? (Date.now() - startTime)
      setLatency(latencyValue)
      setResponseText(JSON.stringify(data, null, 2))
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      // Calculate latency even for network errors
      setLatency(Date.now() - startTime)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserProfile = async () => {
    setProfileLoading(true)
    setProfileError('')
    try {
      const response = await apiGet(endpoints.user.profile())
      if (response.error) {
        setProfileError(response.error || 'Failed to fetch profile')
        setProfileData(null)
      } else {
        // Handle nested data structure: response.data.data.user or response.data.user or response.data
        const data = response.data?.data?.user || response.data?.user || response.data?.data || response.data
        setProfileData(data)
        setShowProfileModal(true)
      }
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to fetch profile')
      setProfileData(null)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleProfileClick = () => {
    if (showProfileModal) {
      setShowProfileModal(false)
    } else {
      if (!profileData && !profileLoading) {
        fetchUserProfile()
      } else {
        setShowProfileModal(true)
      }
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProfileModal) {
        const target = event.target as HTMLElement
        if (!target.closest('.profile-dropdown-container')) {
          setShowProfileModal(false)
        }
      }
    }

    if (showProfileModal) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileModal])

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top nav + hero */}
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-6 pt-6">
          <nav className="flex items-center justify-between gap-4 pb-6">
            <Logo />
            <div className="flex items-center gap-4">
              {!isLoggedIn ? (
                <div className="flex items-center gap-3">

                  <Link
                    to="/login"
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
                  >
                    Log in
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-3 relative profile-dropdown-container">
                  <div
                    onClick={handleProfileClick}
                    className="h-9 w-9 rounded-full bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] flex items-center justify-center cursor-pointer hover:shadow-lg transition-all duration-200"
                  >
                    <ProfileIcon className="h-5 w-5 text-white" />
                  </div>

                  {/* Profile Dropdown */}
                  {showProfileModal && (
                    <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-zinc-200 bg-white shadow-xl">
                      {profileLoading ? (
                        <div className="p-4 text-center text-sm text-zinc-500">Loading...</div>
                      ) : profileError ? (
                        <div className="p-4 text-sm text-red-600">{profileError}</div>
                      ) : profileData ? (
                        <div className="p-4">
                          {profileData.firstName && profileData.lastName && (
                            <div className="text-sm font-semibold text-zinc-900 mb-1">
                              {profileData.firstName} {profileData.lastName}
                            </div>
                          )}
                          {profileData.email && (
                            <div className="text-xs text-zinc-500 mb-4">{profileData.email}</div>
                          )}
                          <div className="border-t border-zinc-200 pt-3 space-y-1">
                            <Link
                              to="/organization"
                              className="block w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                              onClick={() => setShowProfileModal(false)}
                            >
                              Dashboard
                            </Link>
                            <button
                              onClick={() => {
                                clearAllTokens()
                                setIsLoggedIn(false)
                                navigate('/')
                                setShowProfileModal(false)
                              }}
                              className="w-full rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                            >
                              Sign Out
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>

          <section className="py-20 md:py-28">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] bg-clip-text text-transparent sm:text-7xl leading-[1.1] pb-1">
                AI Embeddings
              </h1>
              <p className="mt-8 text-xl leading-8 text-zinc-600">
                Retrieve the right products instantly, reduce search abandonment — with sub-50 ms tail latency at scale.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] px-8 py-4 text-base font-semibold text-white hover:shadow-lg transition-all duration-200"
                >
                  View pricing
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center rounded-xl border-2 border-zinc-300 bg-white px-8 py-4 text-base font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Talk to us
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Product Explanation Section */}
      <div className="bg-gradient-to-b from-white via-zinc-50 to-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
            {/* Card 1: Built for real commerce search */}
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm transition-all duration-300 hover:border-[#c23d3d]/30 hover:shadow-xl">
              <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-[#c23d3d]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#c23d3d] to-[#e15a3a] text-white shadow-lg">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 mb-4">
                  Built for real commerce search
                </h3>
                <p className="text-zinc-600 leading-relaxed text-lg">
                  Frontier-level relevance and sub-50 ms tail latency for search, typeahead, and AI shopping assistants.
                </p>
              </div>
            </div>

            {/* Card 2: Value for teams */}
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm transition-all duration-300 hover:border-[#c23d3d]/30 hover:shadow-xl">
              <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-[#c23d3d]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 mb-4">
                  Value for teams
                </h3>
                <p className="text-zinc-600 leading-relaxed text-lg">
                  Embeddings that understand catalog structure and semantics — without building and maintaining a dedicated system.
                </p>
              </div>
            </div>

            {/* Card 3: How teams use Coral */}
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm transition-all duration-300 hover:border-[#c23d3d]/30 hover:shadow-xl">
              <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-[#c23d3d]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                  <span className="text-2xl">🔌</span>
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 mb-4">
                  How teams use Coral
                </h3>
                <p className="text-zinc-600 leading-relaxed text-lg">
                  Drop-in retrieval for existing search stacks, compatible with the OpenAI embeddings API and any vector database.
                </p>
              </div>
            </div>

            {/* Card 4: Designed for predictable cost at scale */}
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm transition-all duration-300 hover:border-[#c23d3d]/30 hover:shadow-xl">
              <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-[#c23d3d]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                  <span className="text-2xl">📈</span>
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 mb-4">
                  Designed for predictable cost at scale
                </h3>
                <p className="text-zinc-600 leading-relaxed text-lg">
                  Pricing grows linearly with traffic, not with long-tail search complexity.
                </p>
              </div>
            </div>
          </div>
          
          {/* Product Explanation CTAs */}
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <button
              onClick={(e) => {
                e.preventDefault()
                const element = document.getElementById('embedding-api')
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' })
                }
              }}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] px-8 py-4 text-base font-semibold text-white hover:shadow-lg transition-all duration-200"
            >
              Run a live request
            </button>
            <Link
              to="/compare"
              className="inline-flex items-center justify-center rounded-xl border-2 border-zinc-300 bg-white px-8 py-4 text-base font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              View benchmarks
            </Link>
          </div>
        </div>
      </div>

      {/* Embedding API playground */}
      <div id="embedding-api" className="bg-zinc-50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <header className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Run a live request</h2>
            <p className="mt-4 text-lg text-zinc-600">
            Send a query or product and see the embedding result in real time.
                        </p>
          </header>

          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left: controls */}
              <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-lg font-semibold text-zinc-900">Configuration</div>
                  <div className="text-xs text-zinc-500 font-mono bg-zinc-100 px-2 py-1 rounded break-all sm:break-normal">
                    {FETCH_ENDPOINT_EMBED.replace('http://localhost:3000', '')}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <label className="block text-sm font-medium text-zinc-900">API Key</label>
                      <Link
                        to="/api-keys"
                        className="text-sm text-[#c23d3d] hover:text-[#e15a3a] font-medium"
                      >
                        Manage Keys →
                      </Link>
                    </div>
                    
                    {/* Show dropdown if user has multiple API keys */}
                    {isLoggedIn && availableApiKeys.length > 1 ? (
                      <div className="space-y-2">
                        <select
                          value={availableApiKeys.find(k => k.secretKey === state.apiKey || (k.keyPrefix && state.apiKey?.startsWith(k.keyPrefix)))?.id || ''}
                          onChange={async (e) => {
                            const selectedKeyId = e.target.value
                            if (!selectedKeyId) {
                              setState(prev => ({ ...prev, apiKey: '' }))
                              removeApiKey()
                              return
                            }
                            
                            const selectedKey = availableApiKeys.find(k => k.id.toString() === selectedKeyId)
                            if (!selectedKey) return
                            
                            // If we already have the secret, use it
                            if (selectedKey.secretKey) {
                              storeApiKey(selectedKey.secretKey)
                              setState(prev => ({ ...prev, apiKey: selectedKey.secretKey! }))
                            } else {
                              // Otherwise, fetch it (lazy loading)
                              try {
                                const revealResponse = await apiGet(endpoints.apiKeys.reveal(selectedKeyId))
                                if (!revealResponse.error && revealResponse.data?.data?.apiKey?.secretKey) {
                                  const secretKey = revealResponse.data.data.apiKey.secretKey
                                  storeApiKey(secretKey)
                                  setState(prev => ({ ...prev, apiKey: secretKey }))
                                  // Update available keys with secret
                                  setAvailableApiKeys(prev => prev.map(k => 
                                    k.id.toString() === selectedKeyId ? { ...k, secretKey } : k
                                  ))
                                }
                              } catch (err) {
                                console.error('Failed to load API key:', err)
                                setError('Failed to load API key. Please try again.')
                              }
                            }
                          }}
                          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d]"
                        >
                          <option value="">Select an API key...</option>
                          {availableApiKeys.map((key) => (
                            <option key={key.id} value={key.id}>
                              {key.name} {key.keyPrefix ? `(${key.keyPrefix}...)` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      /* Show input field for single key, no keys, or guest users */
                      <input
                        value={state.apiKey}
                        onChange={(e) => {
                          setState((s) => ({ ...s, apiKey: e.target.value }))
                          // Store in localStorage when manually entered
                          if (e.target.value.trim()) {
                            storeApiKey(e.target.value.trim())
                          } else {
                            removeApiKey()
                          }
                        }}
                        placeholder="Paste your API key (ak_...)"
                        type="password"
                        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d]"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-900">Task Type</label>
                      <select
                        value={state.task}
                        onChange={(e) => setState((s) => ({ ...s, task: e.target.value as DownstreamTask }))}
                        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d]"
                      >
                        {TASKS.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {state.task === 'query' ? (
                    <div>
                      <label className="mb-3 block text-sm font-medium text-zinc-900">Text Input</label>
                      <textarea
                        value={state.text}
                        onChange={(e) => setState((s) => ({ ...s, text: e.target.value }))}
                        rows={4}
                        className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d]"
                        placeholder="Enter text to embed..."
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <label className="mb-3 block text-sm font-medium text-zinc-900">Product Information</label>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-900">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={state.product.title}
                          onChange={(e) => setState((s) => ({ ...s, product: { ...s.product, title: e.target.value } }))}
                          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d]"
                          placeholder="Product title"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-900">Description</label>
                        <textarea
                          value={state.product.description}
                          onChange={(e) => setState((s) => ({ ...s, product: { ...s.product, description: e.target.value } }))}
                          rows={3}
                          className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d]"
                          placeholder="Product description"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-zinc-900">Brand</label>
                          <input
                            type="text"
                            value={state.product.brand}
                            onChange={(e) => setState((s) => ({ ...s, product: { ...s.product, brand: e.target.value } }))}
                            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d]"
                            placeholder="Brand name"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-zinc-900">Category</label>
                          <input
                            type="text"
                            value={state.product.category}
                            onChange={(e) => setState((s) => ({ ...s, product: { ...s.product, category: e.target.value } }))}
                            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d]"
                            placeholder="Category"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-zinc-900">Color</label>
                          <input
                            type="text"
                            value={state.product.color}
                            onChange={(e) => setState((s) => ({ ...s, product: { ...s.product, color: e.target.value } }))}
                            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d]"
                            placeholder="Color"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-900">Bullets</label>
                        <textarea
                          value={state.product.bullets}
                          onChange={(e) => setState((s) => ({ ...s, product: { ...s.product, bullets: e.target.value } }))}
                          rows={3}
                          className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d]"
                          placeholder="One bullet point per line"
                        />
                        <div className="mt-1 text-xs text-zinc-500">Enter bullet points (newlines will be preserved)</div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-900">Attributes (JSON)</label>
                        <textarea
                          value={state.product.attributes}
                          onChange={(e) => {
                            const value = e.target.value
                            setState((s) => ({ ...s, product: { ...s.product, attributes: value } }))
                            const validation = validateJson(value)
                            setAttributesError(validation.valid ? '' : validation.error || 'Invalid JSON format')
                          }}
                          rows={2}
                          className={`w-full resize-y rounded-lg border bg-white px-4 py-3 text-sm font-mono text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-1 ${attributesError
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : 'border-zinc-300 focus:border-[#c23d3d] focus:ring-[#c23d3d]'
                            }`}
                          placeholder='{"material": "cotton", "size": "large"}'
                        />
                        {attributesError ? (
                          <div className="mt-1 text-xs text-red-600">{attributesError}</div>
                        ) : (
                          <div className="mt-1 text-xs text-zinc-500">Optional JSON object</div>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              </section>

              {/* Right: request + response */}
              <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-lg font-semibold text-zinc-900">Request & Response</div>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex rounded-lg border border-zinc-300 bg-white p-1">
                      <button
                        type="button"
                        onClick={() => setTab('curl')}
                        className={cn(
                          'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                          tab === 'curl' ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:text-zinc-900',
                        )}
                      >
                        cURL
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab('json')}
                        className={cn(
                          'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                          tab === 'json' ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:text-zinc-900',
                        )}
                      >
                        JSON
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={!canSend}
                      onClick={onGetResponse}
                      className={cn(
                        'rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                        canSend
                          ? 'bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] text-white hover:shadow-lg'
                          : 'cursor-not-allowed bg-zinc-300 text-zinc-500',
                      )}
                    >
                      {isLoading ? 'Sending…' : 'Send Request'}
                    </button>
                  </div>
                </div>


                <div className="mb-6">
                  <CodeBlock
                    code={tab === 'curl' ? curl : json}
                    language={tab === 'curl' ? 'bash' : 'json'}
                  />
                </div>

                <div className="rounded-xl bg-zinc-900 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-semibold text-zinc-400">Response</div>
                    <div className="flex items-center gap-2">
                      {latency !== null && responseText && (
                        <div className="rounded-md bg-zinc-800 px-2 py-1 text-xs font-mono text-emerald-400 border border-zinc-700">
                          {latency}ms
                        </div>
                      )}
                      {responseText && responseCopyRef.current && (
                        <button
                          type="button"
                          onClick={() => {
                            if (responseCopyRef.current) {
                              responseCopyRef.current()
                              setResponseCopied(true)
                              setTimeout(() => setResponseCopied(false), 1200)
                            }
                          }}
                          className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700 transition-colors"
                        >
                          {responseCopied ? 'Copied' : 'Copy'}
                        </button>
                      )}
                    </div>
                  </div>
                  {error ? (
                    <div className="text-sm text-red-400 font-mono whitespace-pre-wrap">{error}</div>
                  ) : responseText ? (
                    <CodeBlock
                      code={responseText}
                      language="json"
                      maxHeight="300px"
                      hideHeader={true}
                      onCopyRef={(copyFn) => {
                        responseCopyRef.current = copyFn
                      }}
                    />
                  ) : (
                    <div className="text-sm text-zinc-500 italic">
                      Response will appear here...
                    </div>
                  )}
                </div>

                {/* Banner for higher limits - shown only after rate limit error */}
                {showLimitBanner && !isLoggedIn && (
                  <div className="mt-4 rounded-lg bg-orange-50 border border-orange-100 p-3 flex items-center justify-between">
                    <div className="text-sm text-orange-800">
                      <span className="font-semibold">Need higher limits?</span> Sign up for 100M free tokens.
                    </div>
                    <Link
                      to="/register"
                      className="text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 px-3 py-1.5 rounded-md transition-colors"
                    >
                      Sign Up Free
                    </Link>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Footer */}
      <div className="bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to make your search and AI shopping experiences fast and relevant?
            </h2>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-base font-semibold text-[#c23d3d] hover:bg-zinc-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Create Account
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-xl border-2 border-white bg-transparent px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Talk to us
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}



function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export default App
