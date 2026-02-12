import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { DOCS_MARKDOWN_PATH } from '../config/docs.config'
import { OrganizationLayout } from '../components/common/OrganizationLayout'
import { Logo } from '../components/common/Logo'
import { Link, useNavigate } from 'react-router-dom'
import { hasJwtToken, clearAllTokens } from '../lib/tokenStorage'
import { apiGet } from '../lib/apiClient'
import { endpoints } from '../config/endpoints'

export function DocumentationPage() {
  const [markdownContent, setMarkdownContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string>('')
  const navigate = useNavigate()

  // Check if user is logged in
  useEffect(() => {
    setIsLoggedIn(hasJwtToken())
  }, [])

  // Load markdown content
  useEffect(() => {
    const loadMarkdown = async () => {
      try {
        setLoading(true)
        setError('')
        
        const response = await fetch(DOCS_MARKDOWN_PATH)
        if (!response.ok) {
          throw new Error(`Failed to load documentation: ${response.statusText}`)
        }
        
        const text = await response.text()
        setMarkdownContent(text)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load documentation')
        console.error('Error loading markdown:', err)
      } finally {
        setLoading(false)
      }
    }

    loadMarkdown()
  }, [])

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

  if (isLoggedIn) {
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
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#c23d3d] border-r-transparent"></div>
              <p className="mt-4 text-sm text-zinc-600">Loading documentation...</p>
            </div>
          ) : error ? (
            <div className="p-12">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h3 className="text-sm font-semibold text-red-800 mb-2">Error Loading Documentation</h3>
                <p className="text-sm text-red-700">{error}</p>
                <p className="mt-2 text-xs text-red-600">
                  Make sure the markdown file exists at: <code className="bg-red-100 px-1 rounded">{DOCS_MARKDOWN_PATH}</code>
                </p>
              </div>
            </div>
          ) : (
            <div className="prose prose-zinc max-w-none p-8 md:p-12">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => (
                    <h1 className="text-4xl font-bold text-zinc-900 mb-6 mt-8 first:mt-0" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-3xl font-bold text-zinc-900 mb-4 mt-8" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-2xl font-semibold text-zinc-900 mb-3 mt-6" {...props} />
                  ),
                  h4: ({ node, ...props }) => (
                    <h4 className="text-xl font-semibold text-zinc-900 mb-2 mt-4" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="text-zinc-700 mb-4 leading-relaxed" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc list-inside mb-4 space-y-2 text-zinc-700" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal list-inside mb-4 space-y-2 text-zinc-700" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="ml-4" {...props} />
                  ),
                  code: ({ node, inline, ...props }: any) => {
                    if (inline) {
                      return (
                        <code className="bg-zinc-100 text-[#c23d3d] px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                      )
                    }
                    return (
                      <code className="block bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto mb-4 text-sm font-mono" {...props} />
                    )
                  },
                  pre: ({ node, ...props }) => (
                    <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto mb-4" {...props} />
                  ),
                  a: ({ node, ...props }) => (
                    <a className="text-[#c23d3d] hover:text-[#e15a3a] underline" {...props} />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-[#c23d3d] pl-4 italic text-zinc-600 my-4" {...props} />
                  ),
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border border-zinc-200" {...props} />
                    </div>
                  ),
                  th: ({ node, ...props }) => (
                    <th className="border border-zinc-200 bg-zinc-50 px-4 py-2 text-left font-semibold text-zinc-900" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="border border-zinc-200 px-4 py-2 text-zinc-700" {...props} />
                  ),
                  hr: ({ node, ...props }) => (
                    <hr className="border-zinc-200 my-8" {...props} />
                  ),
                }}
              >
                {markdownContent}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </OrganizationLayout>
    )
  }

  // Public documentation view (for non-logged-in users)
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="bg-white border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <nav className="flex items-center justify-between">
            <Logo />
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
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#c23d3d] border-r-transparent"></div>
              <p className="mt-4 text-sm text-zinc-600">Loading documentation...</p>
            </div>
          ) : error ? (
            <div className="p-12">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h3 className="text-sm font-semibold text-red-800 mb-2">Error Loading Documentation</h3>
                <p className="text-sm text-red-700">{error}</p>
                <p className="mt-2 text-xs text-red-600">
                  Make sure the markdown file exists at: <code className="bg-red-100 px-1 rounded">{DOCS_MARKDOWN_PATH}</code>
                </p>
              </div>
            </div>
          ) : (
            <div className="prose prose-zinc max-w-none p-8 md:p-12">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => (
                    <h1 className="text-4xl font-bold text-zinc-900 mb-6 mt-8 first:mt-0" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-3xl font-bold text-zinc-900 mb-4 mt-8" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-2xl font-semibold text-zinc-900 mb-3 mt-6" {...props} />
                  ),
                  h4: ({ node, ...props }) => (
                    <h4 className="text-xl font-semibold text-zinc-900 mb-2 mt-4" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="text-zinc-700 mb-4 leading-relaxed" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc list-inside mb-4 space-y-2 text-zinc-700" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal list-inside mb-4 space-y-2 text-zinc-700" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="ml-4" {...props} />
                  ),
                  code: ({ node, inline, ...props }: any) => {
                    if (inline) {
                      return (
                        <code className="bg-zinc-100 text-[#c23d3d] px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                      )
                    }
                    return (
                      <code className="block bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto mb-4 text-sm font-mono" {...props} />
                    )
                  },
                  pre: ({ node, ...props }) => (
                    <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto mb-4" {...props} />
                  ),
                  a: ({ node, ...props }) => (
                    <a className="text-[#c23d3d] hover:text-[#e15a3a] underline" {...props} />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-[#c23d3d] pl-4 italic text-zinc-600 my-4" {...props} />
                  ),
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border border-zinc-200" {...props} />
                    </div>
                  ),
                  th: ({ node, ...props }) => (
                    <th className="border border-zinc-200 bg-zinc-50 px-4 py-2 text-left font-semibold text-zinc-900" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="border border-zinc-200 px-4 py-2 text-zinc-700" {...props} />
                  ),
                  hr: ({ node, ...props }) => (
                    <hr className="border-zinc-200 my-8" {...props} />
                  ),
                }}
              >
                {markdownContent}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

