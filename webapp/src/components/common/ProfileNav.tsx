import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiGet } from '../../lib/apiClient'
import { endpoints } from '../../config/endpoints'
import { clearAllTokens } from '../../lib/tokenStorage'

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export interface ProfileNavProps {
  /** Called after sign out (e.g. to update parent isLoggedIn state). */
  onSignOut?: () => void
}

export function ProfileNav({ onSignOut }: ProfileNavProps) {
  const navigate = useNavigate()
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileData, setProfileData] = useState<{
    firstName?: string
    lastName?: string
    email?: string
  } | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')

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

  const handleSignOut = () => {
    clearAllTokens()
    onSignOut?.()
    setShowProfileModal(false)
    navigate('/')
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
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showProfileModal])

  return (
    <div className="flex items-center gap-3 relative profile-dropdown-container">
      <div
        onClick={handleProfileClick}
        className="h-9 w-9 rounded-full bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] flex items-center justify-center cursor-pointer hover:shadow-lg transition-all duration-200"
      >
        <ProfileIcon className="h-5 w-5 text-white" />
      </div>

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
                  onClick={handleSignOut}
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
  )
}
