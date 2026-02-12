import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiGet, adminApiPut } from '../../lib/apiClient'
import { endpoints } from '../../config/endpoints'
import { hasAdminJwtToken, clearAdminTokens } from '../../lib/tokenStorage'
import { Logo } from '../../components/common/Logo'

interface User {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  emailVerified: boolean
  isActive: boolean
  tokenBalance: string
  stripeCustomerId: string | null
  googleId: string | null
  awsId: string | null
  apiKeyCount: number
  totalSpent: string
  transactionCount: number
  lastTransaction: string | null
  apiCalls: number
  tokenUsage: number
  createdAt: string
  updatedAt: string
  rateLimits?: {
    requestsPerSecond: number
    tokensPerMonth: string
  }
}

export function AdminDashboard() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hideGuestUsers, setHideGuestUsers] = useState(true) // Default to hiding guest users
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ requestsPerSecond: '', tokensPerMonth: '' })
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 100,
    offset: 0,
    hasMore: false,
  })

  useEffect(() => {
    // Check if admin is logged in
    if (!hasAdminJwtToken()) {
      navigate('/admin', { replace: true })
      return
    }

    fetchUsers()
  }, [navigate])

  const fetchUsers = async (offset = 0) => {
    setLoading(true)
    setError('')

    try {
      const response = await adminApiGet(
        `${endpoints.admin.users()}?limit=${pagination.limit}&offset=${offset}`
      )

      if (response.error) {
        if (response.status === 403 || response.status === 401) {
          // Not admin or session expired - redirect to login
          clearAdminTokens()
          navigate('/admin', { replace: true })
          return
        }
        setError(response.error || 'Failed to fetch users')
        setLoading(false)
        return
      }

      const data = response.data?.data
      if (data) {
        const usersList = data.users || []
        // Fetch rate limits for each user
        const usersWithRateLimits = await Promise.all(
          usersList.map(async (user: User) => {
            if (user.apiKeyCount > 0) {
              try {
                const rateLimitResponse = await adminApiGet(endpoints.admin.getUserApiKeys(user.id.toString()))
                if (rateLimitResponse.data?.data?.rateLimits) {
                  return { ...user, rateLimits: rateLimitResponse.data.data.rateLimits }
                }
              } catch (err) {
                console.error(`Failed to fetch rate limits for user ${user.id}:`, err)
              }
            }
            return user
          })
        )
        setUsers(usersWithRateLimits)
        setPagination(data.pagination || pagination)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    clearAdminTokens()
    navigate('/admin')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatTokenBalance = (balance: string) => {
    const num = BigInt(balance)
    if (num >= BigInt(1000000000)) {
      return `${(Number(num) / 1000000000).toFixed(2)}B`
    }
    if (num >= BigInt(1000000)) {
      return `${(Number(num) / 1000000).toFixed(2)}M`
    }
    if (num >= BigInt(1000)) {
      return `${(Number(num) / 1000).toFixed(2)}K`
    }
    return num.toString()
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(2)}B`
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`
    }
    return num.toLocaleString()
  }

  // Check if user is a guest user (created via Try API)
  const isGuestUser = (email: string): boolean => {
    return email.includes('@anonymous.coralbricks.com') || email.startsWith('guest_')
  }

  // Filter users based on hideGuestUsers setting
  const filteredUsers = hideGuestUsers 
    ? users.filter(user => !isGuestUser(user.email))
    : users

  const handleEditRateLimits = (user: User) => {
    setEditingUserId(user.id)
    setEditForm({
      requestsPerSecond: user.rateLimits?.requestsPerSecond.toString() || '0',
      tokensPerMonth: user.rateLimits?.tokensPerMonth || '0',
    })
    setEditError('')
  }

  const handleCancelEdit = () => {
    setEditingUserId(null)
    setEditForm({ requestsPerSecond: '', tokensPerMonth: '' })
    setEditError('')
  }

  const handleSaveRateLimits = async () => {
    if (!editingUserId) return

    setEditLoading(true)
    setEditError('')

    try {
      const requestsPerSecond = parseInt(editForm.requestsPerSecond, 10)
      const tokensPerMonth = editForm.tokensPerMonth

      if (isNaN(requestsPerSecond) || requestsPerSecond < 0) {
        setEditError('Requests per second must be a non-negative integer')
        setEditLoading(false)
        return
      }

      if (!tokensPerMonth || isNaN(parseInt(tokensPerMonth, 10))) {
        setEditError('Tokens per month must be a valid number')
        setEditLoading(false)
        return
      }

      const response = await adminApiPut(
        endpoints.admin.updateUserRateLimits(editingUserId.toString()),
        {
          requestsPerSecond,
          tokensPerMonth,
        }
      )

      if (response.error) {
        setEditError(response.error || 'Failed to update rate limits')
        setEditLoading(false)
        return
      }

      // Update the user in the list
      setUsers(users.map(user => 
        user.id === editingUserId
          ? { ...user, rateLimits: { requestsPerSecond, tokensPerMonth } }
          : user
      ))

      handleCancelEdit()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update rate limits')
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-600">Admin Dashboard</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Users Management</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Total users: {pagination.total} {hideGuestUsers && `(${filteredUsers.length} shown)`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hideGuestUsers}
                onChange={(e) => setHideGuestUsers(e.target.checked)}
                className="w-4 h-4 text-[#c23d3d] border-zinc-300 rounded focus:ring-[#c23d3d] focus:ring-2"
              />
              <span className="text-sm text-zinc-700 font-medium">Hide guest users</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#c23d3d]"></div>
            <p className="mt-4 text-sm text-zinc-600">Loading users...</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 uppercase tracking-wider">
                        Token Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 uppercase tracking-wider">
                        Total Spent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 uppercase tracking-wider">
                        Transactions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 uppercase tracking-wider">
                        Stripe Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 uppercase tracking-wider">
                        API Keys
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 uppercase tracking-wider">
                        API Calls
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 uppercase tracking-wider">
                        Token Usage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 uppercase tracking-wider">
                        OAuth
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 uppercase tracking-wider">
                        Rate Limits
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-zinc-200">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={15} className="px-6 py-12 text-center text-sm text-zinc-500">
                          {users.length === 0 ? 'No users found' : 'No users match the current filter'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-zinc-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                            {user.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                            {user.email}
                            {user.emailVerified && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Verified
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                            {user.firstName || user.lastName
                              ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.isActive ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                            {formatTokenBalance(user.tokenBalance)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 font-medium">
                            {parseFloat(user.totalSpent) > 0 ? (
                              <span className="text-green-600">${user.totalSpent}</span>
                            ) : (
                              <span className="text-zinc-400">$0.00</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                            {user.transactionCount > 0 ? (
                              <span className="font-medium">{user.transactionCount}</span>
                            ) : (
                              <span className="text-zinc-400">0</span>
                            )}
                            {user.lastTransaction && (
                              <div className="text-xs text-zinc-500 mt-1">
                                Last: {formatDate(user.lastTransaction)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                            {user.stripeCustomerId ? (
                              <span className="font-mono text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                {user.stripeCustomerId.substring(0, 12)}...
                              </span>
                            ) : (
                              <span className="text-zinc-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                            {user.apiKeyCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                            {user.apiCalls > 0 ? (
                              <span className="font-medium">{formatNumber(user.apiCalls)}</span>
                            ) : (
                              <span className="text-zinc-400">0</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                            {user.tokenUsage > 0 ? (
                              <span className="font-medium">{formatNumber(user.tokenUsage)}</span>
                            ) : (
                              <span className="text-zinc-400">0</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                            {user.googleId && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-1">
                                Google
                              </span>
                            )}
                            {user.awsId && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                AWS
                              </span>
                            )}
                            {!user.googleId && !user.awsId && '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                            {user.rateLimits ? (
                              <div>
                                <div className="font-medium">{user.rateLimits.requestsPerSecond} RPS</div>
                                <div className="text-xs text-zinc-500">{formatNumber(parseInt(user.rateLimits.tokensPerMonth, 10))} tokens/mo</div>
                              </div>
                            ) : user.apiKeyCount > 0 ? (
                              <span className="text-zinc-400">Loading...</span>
                            ) : (
                              <span className="text-zinc-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {user.apiKeyCount > 0 && (
                              <button
                                onClick={() => handleEditRateLimits(user)}
                                className="px-3 py-1 text-xs font-medium text-[#c23d3d] bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                              >
                                Edit Limits
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.hasMore && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => fetchUsers(pagination.offset + pagination.limit)}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}

        {/* Edit Rate Limits Modal */}
        {editingUserId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-zinc-200">
                <h2 className="text-xl font-semibold text-zinc-900">Edit Rate Limits</h2>
                <p className="text-sm text-zinc-600 mt-1">User ID: {editingUserId}</p>
              </div>
              <div className="px-6 py-4">
                {editError && (
                  <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    {editError}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                      Requests Per Second
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.requestsPerSecond}
                      onChange={(e) => setEditForm({ ...editForm, requestsPerSecond: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#c23d3d] focus:border-transparent"
                      placeholder="e.g., 5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                      Tokens Per Month
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.tokensPerMonth}
                      onChange={(e) => setEditForm({ ...editForm, tokensPerMonth: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#c23d3d] focus:border-transparent"
                      placeholder="e.g., 1000000"
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-zinc-200 flex justify-end gap-3">
                <button
                  onClick={handleCancelEdit}
                  disabled={editLoading}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRateLimits}
                  disabled={editLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#c23d3d] rounded-lg hover:bg-[#a83232] transition-colors disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

