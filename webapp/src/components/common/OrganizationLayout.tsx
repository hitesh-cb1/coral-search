import type { ReactNode } from 'react'
import { Header } from './Header'
import { OrganizationSidebar } from './OrganizationSidebar'

interface OrganizationLayoutProps {
  children: ReactNode
  isLoggedIn: boolean
  showProfileModal: boolean
  profileLoading: boolean
  profileError: string
  profileData: any
  onProfileClick: () => void
  onLogout: () => void
}

export function OrganizationLayout({
  children,
  isLoggedIn,
  showProfileModal,
  profileLoading,
  profileError,
  profileData,
  onProfileClick,
  onLogout,
}: OrganizationLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top nav */}
      <Header
        isLoggedIn={isLoggedIn}
        showProfileModal={showProfileModal}
        profileLoading={profileLoading}
        profileError={profileError}
        profileData={profileData}
        onProfileClick={onProfileClick}
        onLogout={onLogout}
      />

      <div className="flex">
        {/* Left Sidebar */}
        <OrganizationSidebar />

        {/* Main Content */}
        <main className="flex-1 p-8 bg-zinc-50 min-h-[calc(100vh-73px)]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

