import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import type { CredentialResponse } from '@react-oauth/google'
import { apiPost } from '../../../lib/apiClient'
import { endpoints } from '../../../config/endpoints'
import { storeJwtToken, hasJwtToken, removeApiKey } from '../../../lib/tokenStorage'
import { EmailLoginForm } from './EmailLoginForm'
import { Logo } from '../../../components/common/Logo'

export function RegisterPage() {
  const navigate = useNavigate()
  // Get guest API key from local storage if exists
  const guestApiKey = localStorage.getItem('guest_api_key')

  const [isConsentChecked, setIsConsentChecked] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)

  const [googleMessage, setGoogleMessage] = useState('')

  useEffect(() => {
    // Redirect if already logged in
    if (hasJwtToken()) {
      navigate('/organization', { replace: true })
      return
    }
    // Don't auto-open email form, let user choose
    setIsConsentChecked(false)
  }, [navigate])

  const handleEmailButtonClick = () => {
    if (isConsentChecked) {
      setShowEmailForm(true)
    } else {
      setGoogleMessage('Please agree to the terms before continuing.')
    }
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!isConsentChecked) {
      setGoogleMessage('Please agree to the terms before using Google sign-in.')
      return
    }

    const idToken = credentialResponse.credential
    if (!idToken) {
      setGoogleMessage('Could not get Google ID token. Please try again.')
      return
    }

    setGoogleMessage('')
    try {
      const response = await apiPost(endpoints.auth.google(), {
        idToken,
        guestApiKey: guestApiKey || undefined
      })
      if (response.error) {
        setGoogleMessage(response.error || 'Google sign-in failed. Please try again.')
        return
      }

      const token = response.data?.token || response.data?.data?.token
      if (token) {
        storeJwtToken(token)
        // Clear guest API key when user logs in - they should use their own API keys
        removeApiKey()
      }
      window.location.href = '/'
    } catch (error) {
      setGoogleMessage(error instanceof Error ? error.message : 'Google sign-in failed. Please try again.')
    }
  }

  const handleGoogleError = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      setGoogleMessage('Google Client ID is missing. Please check your .env file.')
    } else {
      setGoogleMessage('Google sign-in failed. If you see "origin_mismatch" error, add your origin (http://localhost:5173) to Google Cloud Console.')
    }
  }

  const handleBackClick = () => {
    setShowEmailForm(false)
  }

  if (showEmailForm) {
    return <EmailLoginForm onBack={handleBackClick} initialMode="register" guestApiKey={guestApiKey || undefined} />
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-8">
            <Logo showText={true} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Create your account</h2>
          <p className="mt-4 text-lg text-zinc-600">
            Get started with AI embeddings and manage your API keys
          </p>
        </div>

        {/* Register Form */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-6">
          {/* Terms and Conditions - moved to top */}
          <label className="mb-6 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 text-[#c23d3d] focus:ring-[#c23d3d] border-zinc-300 rounded"
              checked={isConsentChecked}
              onChange={(e) => setIsConsentChecked(e.target.checked)}
            />
            <span className="text-sm text-zinc-600">
              By continuing, you agree to the{' '}
              <Link to="/terms" className="text-[#c23d3d] hover:text-[#e15a3a] underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-[#c23d3d] hover:text-[#e15a3a] underline">
                Privacy Policy
              </Link>
            </span>
          </label>

          <div className="space-y-4">
            <div className={`w-full ${!isConsentChecked ? 'pointer-events-none opacity-50' : ''}`}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                theme="outline"
                size="large"
                text="continue_with"
                width="448"
                ux_mode="popup"
                use_fedcm_for_button={false}
              />
            </div>

            <button
              type="button"
              disabled={!isConsentChecked}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              onClick={handleEmailButtonClick}
            >
              <EmailIcon className="h-5 w-5" />
              Continue with Email
            </button>
          </div>

          {googleMessage && (
            <div className="mt-6 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
              {googleMessage}
            </div>
          )}
        </div>

        {/* Login link */}
        <div className="text-center">
          <p className="text-sm text-zinc-600">
            Already have an account?{' '}
            <Link to="/login" className="text-[#c23d3d] hover:text-[#e15a3a] font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4.5 6.5h15A2.5 2.5 0 0 1 22 9v6a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 15V9a2.5 2.5 0 0 1 2.5-2.5Zm0 2.1V9l7.2 4.6c.2.1.4.1.6 0L19.5 9v-.4l-7.5 4.8L4.5 8.6Z"
      />
    </svg>
  )
}

