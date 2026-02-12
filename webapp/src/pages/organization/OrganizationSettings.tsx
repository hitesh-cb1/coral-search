import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { hasJwtToken, clearAllTokens } from '../../lib/tokenStorage'
import { apiGet, apiPut, apiPost } from '../../lib/apiClient'
import { endpoints } from '../../config/endpoints'
import { OrganizationLayout } from '../../components/common/OrganizationLayout'

export function OrganizationSettings() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [isResending, setIsResending] = useState(false)

  // User form data
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    emailVerified: false,
    isActive: true,
    createdAt: '',
    tokenBalance: 0,
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
  }, [])

  // Load user data on mount
  useEffect(() => {
    if (hasJwtToken()) {
      loadUserData()
    }
  }, [])

  const loadUserData = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await apiGet(endpoints.user.profile())
      if (response.error) {
        setError(response.error || 'Failed to load user data')
      } else {
        const user = response.data?.data?.user || response.data?.user || response.data?.data || response.data
        setUserData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          emailVerified: user.emailVerified || false,
          isActive: user.isActive || true,
          createdAt: user.createdAt || '',
          tokenBalance: user.tokenBalance || 0,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await apiPut(endpoints.user.update(), {
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
      })

      if (response.error) {
        setError(response.error)
      } else {
        setSuccess('Profile updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsSaving(false)
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

  const handleResendVerification = async () => {
    setIsResending(true)
    setError('')
    setSuccess('')
    try {
      const response = await apiPost(endpoints.marketplace.requestVerification(), {
        email: userData.email
      })
      if (response.error) {
        setError(response.error || 'Failed to resend verification email')
      } else {
        // Check if user was auto-verified (has password already)
        if (response.data?.data?.verified) {
          setSuccess('Your email has been verified successfully!')
          // Update local state to reflect verification
          setUserData(prev => ({ ...prev, emailVerified: true }))
        } else {
          setSuccess('Verification email sent! Please check your inbox.')
        }
        setTimeout(() => setSuccess(''), 5000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification email')
    } finally {
      setIsResending(false)
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

  const handleLogout = () => {
    clearAllTokens()
    setIsLoggedIn(false)
    navigate('/')
    setShowProfileModal(false)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
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
      <div className="mx-auto max-w-4xl space-y-8">
        <h1 className="text-3xl font-bold text-zinc-900">Account Settings</h1>

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

        {isLoading ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-sm">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#c23d3d] border-r-transparent"></div>
            <div className="mt-4 text-zinc-600">Loading account information...</div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Profile Information */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold text-zinc-900">Profile Information</h2>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-900">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={userData.firstName}
                      onChange={(e) => setUserData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d]"
                      placeholder="Enter your first name"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-900">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={userData.lastName}
                      onChange={(e) => setUserData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d]"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-900">
                    Email Address
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="email"
                      value={userData.email}
                      readOnly
                      className="flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 cursor-not-allowed"
                    />
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${userData.emailVerified
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                      }`}>
                      {userData.emailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">
                    Email address cannot be changed. Contact support if you need to update it.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-lg bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] px-6 py-3 text-sm font-medium text-white hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Account Information */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold text-zinc-900">Account Information</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-zinc-200">
                  <div>
                    <div className="text-sm font-medium text-zinc-900">Account Status</div>
                    <div className="text-sm text-zinc-500">Current status of your account</div>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${userData.isActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {userData.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-zinc-200">
                  <div>
                    <div className="text-sm font-medium text-zinc-900">Member Since</div>
                    <div className="text-sm text-zinc-500">When you joined CoralBricks</div>
                  </div>
                  <div className="text-sm text-zinc-900">
                    {userData.createdAt ? formatDate(userData.createdAt) : 'N/A'}
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-zinc-200">
                  <div>
                    <div className="text-sm font-medium text-zinc-900">Email Verification</div>
                    <div className="text-sm text-zinc-500">Verification status of your email</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${userData.emailVerified
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                      }`}>
                      {userData.emailVerified ? 'Verified' : 'Pending'}
                    </span>
                    {!userData.emailVerified && (
                      <button
                        onClick={handleResendVerification}
                        disabled={isResending}
                        className="text-sm text-[#c23d3d] hover:text-[#e15a3a] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isResending ? 'Sending...' : 'Resend Email'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium text-zinc-900">Token Balance</div>
                    <div className="text-sm text-zinc-500">Available tokens in your account</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-zinc-900">
                      {userData.tokenBalance.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </OrganizationLayout>
  )
}

