import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { endpoints } from '../../config/endpoints'
import { apiGet, apiPost } from '../../lib/apiClient'
import { storeApiKey } from '../../lib/tokenStorage'
import { hasJwtToken, clearAllTokens } from '../../lib/tokenStorage'
import { OrganizationLayout } from '../../components/common/OrganizationLayout'

interface ApiKey {
  id: number | string
  name: string
  key?: string // Only present when first created
  keyPrefix?: string // Partial key shown in list
  usageCount: number
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

interface AccountBalance {
  tokenBalance: number
}

interface RateLimits {
  requestsPerSecond: number
  tokensPerMonth: string
}

export function ApiKeyManagement() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string>('')
  
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [accountBalance, setAccountBalance] = useState<AccountBalance | null>(null)
  const [rateLimits, setRateLimits] = useState<RateLimits | null>(null)
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [newKeyName, setNewKeyName] = useState('')
  const [showNewKey, setShowNewKey] = useState(false)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string>('')
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({})
  const [loadingRevealId, setLoadingRevealId] = useState<string | null>(null)
  const apiKeyNameInputRef = useRef<HTMLInputElement>(null)

  // Scroll to API key name input when create form is opened
  useEffect(() => {
    if (showNewKey && apiKeyNameInputRef.current) {
      const timer = setTimeout(() => {
        apiKeyNameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [showNewKey])

  // Check if user is authenticated
  useEffect(() => {
    setIsLoggedIn(hasJwtToken())
    if (!hasJwtToken()) {
      navigate('/login')
    }
  }, [navigate])

  // Fetch API keys and account balance on component mount
  useEffect(() => {
    if (hasJwtToken()) {
      fetchApiKeys()
      fetchAccountBalance()
    }
  }, [])

  const fetchApiKeys = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await apiGet(endpoints.apiKeys.list())
      if (response.error) {
        setError(response.error)
      } else {
        // Response format: { success: true, data: { apiKeys: [...] } }
        // or { success: true, data: [...] }
        const responseData = response.data
        let keys: ApiKey[] = []
        
        if (responseData?.data?.apiKeys) {
          // Nested structure: response.data.data.apiKeys
          keys = responseData.data.apiKeys
        } else if (responseData?.apiKeys) {
          // Direct structure: response.data.apiKeys
          keys = responseData.apiKeys
        } else if (Array.isArray(responseData?.data)) {
          // Array directly in data: response.data.data
          keys = responseData.data
        } else if (Array.isArray(responseData)) {
          // Array directly: response.data
          keys = responseData
        }
        
        setApiKeys(keys)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch API keys')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim()) {
      setError('Please enter a name for the API key')
      return
    }

    setIsCreating(true)
    setError('')
    setSuccess('')
    setNewlyCreatedKey('')

    try {
      const response = await apiPost(endpoints.apiKeys.create(), {
        name: newKeyName.trim(),
      })

      if (response.error) {
        setError(response.error)
      } else {
        // Response format: { success: true, data: { apiKey: { secretKey, ... } } }
        const responseData = response.data
        // Extract the apiKey object from nested structure: data.data.apiKey or data.apiKey
        const apiKeyData = responseData?.data?.apiKey || responseData?.apiKey || responseData
        
        // Backend returns 'secretKey' property, not 'key'
        if (apiKeyData?.secretKey) {
          setNewlyCreatedKey(apiKeyData.secretKey)
          setSuccess('API key created successfully! Copy it now - you won\'t be able to see it again.')
          // Store the first API key automatically for playground use
          if (apiKeys.length === 0) {
            storeApiKey(apiKeyData.secretKey)
          }
        } else if (apiKeyData) {
          // If key is not returned (already created), just show success
          setSuccess('API key created successfully!')
        }
        
        setNewKeyName('')
        setShowNewKey(false)
        // Refresh the list and balance
        await fetchApiKeys()
        await fetchAccountBalance()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key')
    } finally {
      setIsCreating(false)
    }
  }

  const handleShowKey = async (keyId: string | number) => {
    const id = keyId.toString()
    if (revealedKeys[id]) {
      setRevealedKeys((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      return
    }
    setLoadingRevealId(id)
    setError('')
    try {
      const response = await apiGet(endpoints.apiKeys.reveal(id))
      if (response.error) {
        setError(response.error)
      } else {
        const responseData = response.data
        const revealedApiKey = responseData?.data?.apiKey || responseData?.apiKey || responseData
        if (revealedApiKey?.secretKey) {
          setRevealedKeys((prev) => ({ ...prev, [id]: revealedApiKey.secretKey }))
        } else {
          setError('Could not retrieve API key.')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reveal API key')
    } finally {
      setLoadingRevealId(null)
    }
  }

  const handleCopyKey = async (keyId: string | number, keyValue?: string) => {
    const id = keyId.toString()
    const existing = keyValue ?? revealedKeys[id]
    if (existing) {
      copyToClipboard(existing)
      return
    }
    setLoadingRevealId(id)
    setError('')
    try {
      const response = await apiGet(endpoints.apiKeys.reveal(id))
      if (!response.error) {
        const data = response.data?.data?.apiKey || response.data?.apiKey || response.data
        if (data?.secretKey) {
          copyToClipboard(data.secretKey)
          // Do not reveal the key in the UI when only copying
        } else {
          setError('Could not retrieve API key.')
        }
      } else {
        setError(response.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to copy key')
    } finally {
      setLoadingRevealId(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess('Copied to clipboard!')
    setTimeout(() => setSuccess(''), 2000)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const fetchAccountBalance = async () => {
    try {
      const response = await apiGet(endpoints.user.profile())
      if (!response.error && response.data) {
        const data = response.data?.data || response.data
        const user = data?.user || response.data?.user || response.data
        if (user?.tokenBalance !== undefined) {
          setAccountBalance({
            tokenBalance: user.tokenBalance || 0,
          })
        }
        if (user?.isVerified !== undefined || user?.emailVerified !== undefined) {
          setIsVerified(Boolean(user?.isVerified || user?.emailVerified))
        }
        if (data?.rateLimits) {
          setRateLimits({
            requestsPerSecond: data.rateLimits.requestsPerSecond ?? 0,
            tokensPerMonth: String(data.rateLimits.tokensPerMonth ?? '0'),
          })
        }
      }
    } catch (err) {
      // Silently fail - balance will just not be shown
      console.error('Failed to fetch account balance:', err)
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

  const handleLogout = () => {
    clearAllTokens()
    setIsLoggedIn(false)
    navigate('/')
    setShowProfileModal(false)
  }

  return (
    <OrganizationLayout
      isLoggedIn={isLoggedIn}
      showProfileModal={showProfileModal}
      profileLoading={profileLoading}
      profileError={profileError}
      profileData={profileData}
      onProfileClick={handleProfileClick}
      onLogout={handleLogout}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">API Keys</h1>
            <p className="mt-2 text-zinc-600">
              Manage your API keys for embedding requests. Token limits are now account-level.
            </p>
          </div>
          <button
            onClick={() => {
              setShowNewKey(!showNewKey)
              if (showNewKey) setNewlyCreatedKey('')
            }}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] px-4 py-2 text-sm font-medium text-white hover:shadow-lg transition-all duration-200"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {showNewKey ? 'Cancel' : 'Create API Key'}
          </button>
        </div>

        {/* Account Balance Card */}
        {accountBalance !== null && (
          <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-6 shadow-sm">
            <div>
              <div className="text-sm font-medium text-zinc-600 mb-1">Account Token Balance</div>
              <div className="text-3xl font-bold text-zinc-900">
                {accountBalance.tokenBalance.toLocaleString()}
              </div>
              <div className="mt-1 text-sm text-zinc-500">
                tokens available
              </div>
            </div>
            {accountBalance.tokenBalance === 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                ⚠️ Your token balance is exhausted. Purchase credits to continue using the API.
              </div>
            )}
          </div>
        )}

        {/* Rate Limits Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Rate limits</h2>
          {rateLimits !== null ? (
            <>
              <div className="flex flex-wrap gap-6 mb-4">
                <div>
                  <div className="text-sm text-zinc-500">Requests per second</div>
                  <div className="text-xl font-bold text-zinc-900">{rateLimits.requestsPerSecond}</div>
                </div>
                <div>
                  <div className="text-sm text-zinc-500">Tokens per month</div>
                  <div className="text-xl font-bold text-zinc-900">
                    {Number(rateLimits.tokensPerMonth).toLocaleString()}
                  </div>
                </div>
              </div>
              {isVerified === false && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-medium mb-1">Verify your email to increase rate limits</p>
                  <p className="text-amber-700 mb-3">
                    Rate limits also increase with spend. Verify now to unlock higher defaults.
                  </p>
                  <Link
                    to="/organization"
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
                  >
                    Verify email
                  </Link>
                </div>
              )}
              <p className="mt-4 text-sm text-zinc-600">
                Need higher limits?{' '}
                <Link to="/contact" className="font-medium text-[#c23d3d] hover:text-[#e15a3a] underline">
                  Talk to us
                </Link>
              </p>
            </>
          ) : (
            <div className="text-sm text-zinc-500">Loading rate limits...</div>
          )}
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Create API Key Form */}
        {showNewKey && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Create New API Key</h2>
            <form onSubmit={handleCreateApiKey} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  API Key Name
                </label>
                <input
                  ref={apiKeyNameInputRef}
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., My Frontend App Key"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d]"
                  disabled={isCreating}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-lg bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] px-4 py-2 text-sm font-medium text-white hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create API Key'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewKey(false)
                    setNewKeyName('')
                    setError('')
                  }}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Newly created key - inline one line (no box) */}
        {newlyCreatedKey && (
          <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
            <span className="text-sm text-zinc-600">Your new key:</span>
            <code className="flex-1 min-w-0 truncate text-sm font-mono text-zinc-900">{newlyCreatedKey}</code>
            <button
              onClick={() => copyToClipboard(newlyCreatedKey)}
              className="rounded-full bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              Copy key
            </button>
          </div>
        )}

        {/* API Keys List */}
        {isLoading ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-sm">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#c23d3d] border-r-transparent"></div>
            <div className="mt-4 text-zinc-600">Loading API keys...</div>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-sm">
            <svg className="mx-auto h-12 w-12 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243C11.978 9.5 12.5 9 13 9a6 6 0 016-2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-zinc-900">No API keys yet</h3>
            <p className="mt-2 text-zinc-600">Create your first API key to start using the embedding API.</p>
            <button
              onClick={() => setShowNewKey(true)}
              className="mt-4 rounded-lg bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] px-4 py-2 text-sm font-medium text-white hover:shadow-lg transition-all duration-200"
            >
              Create API Key
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-zinc-200 bg-zinc-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Name & Key</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">API Calls</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Created</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {apiKeys?.length > 0 && apiKeys?.map((key) => {
                    const id = key.id.toString()
                    const fullKey = revealedKeys[id]
                    const isLoading = loadingRevealId === id
                    return (
                      <tr key={key.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-zinc-900">{key.name}</div>
                            {fullKey ? (
                              <code className="mt-1 block break-all text-sm font-mono text-zinc-700">{fullKey}</code>
                            ) : key.keyPrefix ? (
                              <div className="text-sm text-zinc-500 font-mono mt-1">{key.keyPrefix}...</div>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-900">
                          {key.usageCount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                              key.isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-zinc-100 text-zinc-800'
                            }`}
                          >
                            {key.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-500">
                          {formatDate(key.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyKey(key.id, fullKey)}
                              disabled={isLoading}
                              className="rounded-full bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Copy key
                            </button>
                            <button
                              onClick={() => handleShowKey(key.id)}
                              disabled={isLoading}
                              className="rounded-full border-2 border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:border-[#c23d3d] hover:text-[#c23d3d] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isLoading ? 'Loading...' : fullKey ? 'Hide key' : 'Show key'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </OrganizationLayout>
  )
}

