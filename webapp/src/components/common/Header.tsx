import { Link } from 'react-router-dom'
import { ProfileIcon } from './ProfileIcon'
import { Logo } from './Logo'

interface HeaderProps {
  isLoggedIn: boolean
  showProfileModal: boolean
  profileLoading: boolean
  profileError: string
  profileData: any
  onProfileClick: () => void
  onLogout: () => void
}

export function Header({
  isLoggedIn,
  showProfileModal,
  profileLoading,
  profileError,
  profileData,
  onProfileClick,
  onLogout,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Logo />

          {/* Auth / Profile - right side */}
          <div className="flex items-center gap-6 ml-auto">
            {/* Auth Section */}
            {!isLoggedIn ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] rounded-lg hover:shadow-lg transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 relative profile-dropdown-container">
                <div 
                  onClick={onProfileClick}
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
                          >
                            Dashboard
                          </Link>
                          <button
                            onClick={onLogout}
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
      </div>
    </header>
  )
}

