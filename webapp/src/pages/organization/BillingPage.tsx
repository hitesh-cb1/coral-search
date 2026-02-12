import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { hasJwtToken, clearAllTokens } from '../../lib/tokenStorage'
import { apiGet, apiPost, apiDelete } from '../../lib/apiClient'
import { endpoints } from '../../config/endpoints'
import { OrganizationLayout } from '../../components/common/OrganizationLayout'

export function BillingPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('overview')
  const [tokenBalance, setTokenBalance] = useState<number>(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string>('')
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string>('')

  // Transactions state
  const [transactions, setTransactions] = useState<any[]>([])
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [transactionsError, setTransactionsError] = useState<string>('')

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false)
  const [paymentMethodsError, setPaymentMethodsError] = useState<string>('')

  // Check if user is logged in and fetch profile
  useEffect(() => {
    setIsLoggedIn(hasJwtToken())
    
    const handleStorageChange = () => {
      setIsLoggedIn(hasJwtToken())
    }
    window.addEventListener('storage', handleStorageChange)
    
    const handleFocus = () => {
      setIsLoggedIn(hasJwtToken())
    }
    window.addEventListener('focus', handleFocus)
    
    // Fetch user profile to get token balance
    if (hasJwtToken()) {
      loadUserProfile()
      loadTransactions()
      loadPaymentMethods()
    }
    
    // Handle payment success/failure from URL params
    const paymentStatus = searchParams.get('payment')
    const sessionId = searchParams.get('session_id')
    
    if (paymentStatus === 'success' && sessionId) {
      // Verify and process the payment
      verifyPayment(sessionId)
      // Remove payment params from URL
      searchParams.delete('payment')
      searchParams.delete('session_id')
      setSearchParams(searchParams, { replace: true })
    } else if (paymentStatus === 'cancelled') {
      setPaymentError('Payment was cancelled')
      searchParams.delete('payment')
      searchParams.delete('session_id')
      setSearchParams(searchParams, { replace: true })
    }
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Load payment methods when switching to payment-methods tab
  useEffect(() => {
    if (isLoggedIn && activeTab === 'payment-methods' && !paymentMethodsLoading) {
      loadPaymentMethods()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isLoggedIn])

  const loadUserProfile = async () => {
    try {
      const response = await apiGet(endpoints.user.profile())
      if (response.data) {
        const data = response.data?.data?.user || response.data?.user || response.data?.data || response.data
        setProfileData(data)
        if (data.tokenBalance !== undefined) {
          setTokenBalance(data.tokenBalance)
        }
      }
    } catch (error) {
      console.error('Failed to load user profile:', error)
    }
  }

  const verifyPayment = async (sessionId: string) => {
    try {
      setPaymentLoading(true)
      setPaymentError('')
      
      const response = await apiPost(endpoints.payment.verifyPayment(), {
        sessionId,
      })
      
      if (response.error) {
        setPaymentError(response.error || 'Failed to verify payment')
      } else if (response.data?.success) {
        // Payment verified and processed, reload profile to get updated token balance
        await loadUserProfile()
        await loadTransactions() // Reload transactions to show new purchase
        await loadPaymentMethods() // Reload payment methods in case a new one was saved
        setPaymentError('')
      } else {
        setPaymentError('Payment verification failed')
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
      setPaymentError(error instanceof Error ? error.message : 'Failed to verify payment')
    } finally {
      setPaymentLoading(false)
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

  const handleLogout = () => {
    clearAllTokens()
    setIsLoggedIn(false)
    navigate('/')
    setShowProfileModal(false)
  }

  // Payment amounts ($0.01 = 1M tokens, $1 = 100M tokens)
  // Minimum purchase is $5.00 = 500M tokens
  const paymentAmounts = [
    { dollars: 5, cents: 500, tokens: 500000000 }, // $5 = 500M tokens
    { dollars: 10, cents: 1000, tokens: 1000000000 }, // $10 = 1B tokens
    { dollars: 25, cents: 2500, tokens: 2500000000 }, // $25 = 2.5B tokens
    { dollars: 50, cents: 5000, tokens: 5000000000 }, // $50 = 5B tokens
    { dollars: 100, cents: 10000, tokens: 10000000000 }, // $100 = 10B tokens
    { dollars: 250, cents: 25000, tokens: 25000000000 }, // $250 = 25B tokens
  ]

  const loadTransactions = async () => {
    try {
      setTransactionsLoading(true)
      setTransactionsError('')
      const response = await apiGet(endpoints.payment.getTransactions())
      if (response.error) {
        setTransactionsError(response.error || 'Failed to load transactions')
        setTransactions([])
      } else {
        const data = response.data?.data?.transactions || response.data?.transactions || []
        // Sort by date, newest first
        const sorted = data.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt).getTime()
          const dateB = new Date(b.createdAt).getTime()
          return dateB - dateA
        })
        setTransactions(sorted)
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
      setTransactionsError(error instanceof Error ? error.message : 'Failed to load transactions')
      setTransactions([])
    } finally {
      setTransactionsLoading(false)
    }
  }

  const loadPaymentMethods = async () => {
    try {
      setPaymentMethodsLoading(true)
      setPaymentMethodsError('')
      const response = await apiGet(endpoints.payment.getPaymentMethods())
      console.log('Payment methods response:', response)
      if (response.error) {
        console.error('Error in payment methods response:', response.error)
        setPaymentMethodsError(response.error || 'Failed to load payment methods')
        setPaymentMethods([])
      } else {
        const data = response.data?.data?.paymentMethods || response.data?.paymentMethods || []
        console.log('Loaded payment methods:', data)
        setPaymentMethods(data)
        if (data.length === 0) {
          console.log('No payment methods found. User may need to make a purchase and check "save my info for faster checkout"')
        }
      }
    } catch (error) {
      console.error('Error loading payment methods:', error)
      setPaymentMethodsError(error instanceof Error ? error.message : 'Failed to load payment methods')
      setPaymentMethods([])
    } finally {
      setPaymentMethodsLoading(false)
    }
  }

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return
    }

    try {
      setPaymentMethodsLoading(true)
      const response = await apiDelete(endpoints.payment.deletePaymentMethod(paymentMethodId))
      if (response.error) {
        alert(response.error || 'Failed to delete payment method')
      } else {
        // Reload payment methods
        await loadPaymentMethods()
      }
    } catch (error) {
      console.error('Error deleting payment method:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete payment method')
    } finally {
      setPaymentMethodsLoading(false)
    }
  }

  const formatCardBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'Purchase'
      case 'free_tier':
        return 'Free Tier'
      case 'refund':
        return 'Refund'
      default:
        return type
    }
  }

  const getPaymentStatusBadge = (status: string | null) => {
    if (!status) return null
    
    const statusConfig: Record<string, { label: string; className: string }> = {
      completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' },
      pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-700' },
      refunded: { label: 'Refunded', className: 'bg-zinc-100 text-zinc-700' },
    }
    
    const config = statusConfig[status] || { label: status, className: 'bg-zinc-100 text-zinc-700' }
    
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const handleAddCredits = async (amountCents: number) => {
    setPaymentLoading(true)
    setPaymentError('')
    
    try {
      const response = await apiPost(endpoints.payment.createCheckoutSession(), {
        amountCents,
      })
      
      if (response.error) {
        setPaymentError(response.error || 'Failed to create payment session')
        setPaymentLoading(false)
        return
      }
      
      // Redirect to Stripe checkout
      const checkoutUrl = response.data?.data?.url
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        setPaymentError('Invalid checkout URL received')
        setPaymentLoading(false)
      }
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Failed to process payment')
      setPaymentLoading(false)
    }
  }

  const billingTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'payment-methods', label: 'Payment methods' },
    { id: 'billing-history', label: 'Billing history' },
  ]

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
      <div className="mx-auto max-w-4xl">
            <h1 className="mb-6 text-2xl font-semibold text-[rgb(55,65,81)]">Billing</h1>

            {/* Billing Tabs */}
            <div className="mb-8 flex space-x-1 border-b border-zinc-300">
              {billingTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-[rgb(55,65,81)] text-[rgb(55,65,81)]'
                      : 'text-[rgb(75,85,99)] hover:text-[rgb(55,65,81)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Overview Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Pay as you go Section */}
                <section className="rounded-lg border border-zinc-300 bg-white p-6">
                  <h2 className="mb-4 text-xl font-semibold text-[rgb(55,65,81)]">Pay as you go</h2>
                  
                  {/* Token Balance */}
                  <div className="mb-6">
                    <div className="mb-2 flex items-center gap-2">
                      <label className="text-sm font-medium text-[rgb(55,65,81)]">Token balance</label>
                      <svg className="h-4 w-4 text-[rgb(75,85,99)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-4xl font-bold text-[rgb(55,65,81)]">
                      {tokenBalance.toLocaleString()} tokens
                    </div>
                    <div className="mt-1 text-sm text-[rgb(75,85,99)]">
                      ${((tokenBalance / 100000000)).toFixed(2)} credit value
                    </div>
                  </div>

                  {/* Payment Error */}
                  {paymentError && (
                    <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                      {paymentError}
                    </div>
                  )}

                  {/* Payment Options */}
                  <div className="mb-4">
                    <h3 className="mb-3 text-sm font-medium text-[rgb(55,65,81)]">Add tokens (minimum $5.00)</h3>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {paymentAmounts.map((option) => (
                        <button
                          key={option.cents}
                          onClick={() => handleAddCredits(option.cents)}
                          disabled={paymentLoading}
                          className="flex flex-col items-center rounded-lg border border-zinc-300 bg-white p-4 transition-colors hover:border-[rgb(55,65,81)] hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="text-lg font-semibold text-[rgb(55,65,81)]">${option.dollars}</div>
                          <div className="mt-1 text-xs text-[rgb(75,85,99)]">
                            {option.tokens.toLocaleString()} tokens
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentLoading && (
                    <div className="text-sm text-[rgb(75,85,99)]">
                      Redirecting to payment...
                    </div>
                  )}
                </section>

              </div>
            )}

            {/* Payment Methods Tab */}
            {activeTab === 'payment-methods' && (
              <div className="space-y-6">
                <section className="rounded-lg border border-zinc-300 bg-white p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-[rgb(55,65,81)]">Saved Payment Methods</h2>
                    <button
                      onClick={() => setActiveTab('overview')}
                      className="inline-flex items-center rounded-lg bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] px-4 py-2 text-sm font-medium text-white hover:shadow-lg transition-all duration-200"
                    >
                      Add Payment Method
                    </button>
                  </div>

                  {paymentMethodsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#c23d3d] border-r-transparent"></div>
                        <p className="mt-4 text-sm text-[rgb(75,85,99)]">Loading payment methods...</p>
                      </div>
                    </div>
                  ) : paymentMethodsError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-sm text-red-700">{paymentMethodsError}</p>
                    </div>
                  ) : paymentMethods.length === 0 ? (
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center">
                      <svg className="mx-auto h-12 w-12 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <p className="mt-4 text-sm font-medium text-[rgb(55,65,81)]">No saved payment methods</p>
                      <p className="mt-2 text-sm text-[rgb(75,85,99)]">
                        When you make a purchase and check "Save my info for faster checkout", your payment method will appear here.
                      </p>
                      <button
                        onClick={() => setActiveTab('overview')}
                        className="mt-4 inline-flex items-center rounded-lg bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] px-6 py-2.5 text-sm font-medium text-white hover:shadow-lg transition-all duration-200"
                      >
                        Make a Purchase
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {paymentMethods.map((pm) => (
                        <div
                          key={pm.id}
                          className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-300 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100">
                              <svg className="h-6 w-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-[rgb(55,65,81)]">
                                {pm.card ? `${formatCardBrand(pm.card.brand)} •••• ${pm.card.last4}` : 'Card'}
                              </div>
                              {pm.card && (
                                <div className="mt-1 text-xs text-[rgb(75,85,99)]">
                                  Expires {String(pm.card.exp_month).padStart(2, '0')}/{pm.card.exp_year}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeletePaymentMethod(pm.id)}
                            disabled={paymentMethodsLoading}
                            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-2 text-sm font-semibold text-[rgb(55,65,81)]">About Saved Payment Methods</h3>
                      <p className="mb-2 text-sm text-[rgb(75,85,99)]">
                        Payment methods are securely stored by Stripe. When you check "Save my info for faster checkout" during a purchase, your payment method is automatically saved for future use.
                      </p>
                      <div className="space-y-1 text-xs text-[rgb(75,85,99)]">
                        <p>• Payment methods are encrypted and stored securely by Stripe</p>
                        <p>• You can remove saved payment methods at any time</p>
                        <p>• Saved payment methods will appear during checkout for faster payments</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Billing History Tab */}
            {activeTab === 'billing-history' && (
              <div className="space-y-6">
                <section className="rounded-lg border border-zinc-300 bg-white p-6">
                  <h2 className="mb-4 text-xl font-semibold text-[rgb(55,65,81)]">Transaction History</h2>
                  
                  {transactionsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#c23d3d] border-r-transparent"></div>
                        <p className="mt-4 text-sm text-[rgb(75,85,99)]">Loading transactions...</p>
                      </div>
                    </div>
                  ) : transactionsError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-sm text-red-700">{transactionsError}</p>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center">
                      <svg className="mx-auto h-12 w-12 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="mt-4 text-sm font-medium text-[rgb(55,65,81)]">No transactions yet</p>
                      <p className="mt-2 text-sm text-[rgb(75,85,99)]">
                        Your transaction history will appear here once you make a purchase.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-zinc-200">
                        <thead className="bg-zinc-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[rgb(75,85,99)]">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[rgb(75,85,99)]">
                              Type
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[rgb(75,85,99)]">
                              Tokens
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[rgb(75,85,99)]">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[rgb(75,85,99)]">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 bg-white">
                          {transactions.map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-zinc-50">
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-[rgb(55,65,81)]">
                                {formatDate(transaction.createdAt)}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-[rgb(55,65,81)]">
                                {getTransactionTypeLabel(transaction.type)}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-[rgb(55,65,81)]">
                                {transaction.amount?.toLocaleString() || '0'}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-[rgb(55,65,81)]">
                                {transaction.cost !== null && transaction.cost !== undefined
                                  ? `$${Number(transaction.cost).toFixed(2)}`
                                  : 'Free'}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-[rgb(55,65,81)]">
                                {getPaymentStatusBadge(transaction.paymentStatus)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
    </OrganizationLayout>
  )
}

