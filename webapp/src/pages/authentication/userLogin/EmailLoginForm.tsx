import { Link } from 'react-router-dom'
import { useLoginForm } from './LoginFormLogic'
import { Logo } from '../../../components/common/Logo'

interface EmailLoginFormProps {
  onBack: () => void
  initialMode?: 'login' | 'register'
  guestApiKey?: string
}

export function EmailLoginForm({ onBack, initialMode = 'login', guestApiKey }: EmailLoginFormProps) {
  const {
    formData,
    errors,
    showPassword,
    loginMessage,
    registerMessage,
    isLoading,
    isSendingVerification,
    isRegistrationSuccess,
    passwordNotSetEmail,
    verificationEmailSent,
    setShowPassword,
    handleFirstNameChange,
    handleLastNameChange,
    handleEmailChange,
    handlePasswordChange,
    handleBlur,
    handleLogin,
    handleRegister,
    handleSendVerificationEmail,
    isFormValid,
  } = useLoginForm(guestApiKey)

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-8">
            <Logo showText={true} />
          </div>
          <div className="flex items-center justify-center gap-3 mb-6">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center rounded-lg border border-zinc-300 bg-white p-2 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 transition-colors"
              aria-label="Go back"
            >
              <BackArrowIcon className="h-5 w-5" />
            </button>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
              {initialMode === 'register' ? 'Sign up with Email' : 'Sign in with Email'}
            </h2>
          </div>
          <p className="text-lg text-zinc-600">
            Manage multiple API keys and track usage—all in one account.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-6">
          {loginMessage && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {loginMessage}
            </div>
          )}

          {/* Password not set state - for users who used Try API but didn't verify */}
          {passwordNotSetEmail && (
            <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
              {verificationEmailSent ? (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-emerald-700">Verification Email Sent!</span>
                  </div>
                  <p className="text-sm text-emerald-700">
                    Check your inbox for the verification link to set up your password.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-medium text-amber-800">No Password Set</span>
                  </div>
                  <p className="text-sm text-amber-700 mb-3">
                    This account was created via Try API. Click below to set up your password.
                  </p>
                  <button
                    type="button"
                    onClick={handleSendVerificationEmail}
                    disabled={isSendingVerification}
                    className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-medium text-white hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingVerification ? 'Sending...' : 'Send Setup Email'}
                  </button>
                </>
              )}
            </div>
          )}

          {registerMessage && (
            <div className={`mb-6 p-4 rounded-lg text-sm ${registerMessage.includes('successfully')
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
              {registerMessage.includes('successfully') && (
                <div className="flex items-center gap-2 mb-2">
                  <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Account Created!</span>
                </div>
              )}
              {registerMessage}
            </div>
          )}

          {/* Show different form based on registration state */}
          {initialMode === 'register' && isRegistrationSuccess ? (
            // Login form after successful registration
            <div className="space-y-6">
              <div className="text-center py-4">
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">Ready to get started?</h3>
                <p className="text-sm text-zinc-600">Enter your password below to sign in to your new account.</p>
              </div>

              <form className="space-y-6" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-zinc-900">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    readOnly
                    className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-700"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-zinc-900">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handlePasswordChange}
                      onBlur={() => handleBlur('password')}
                      className={`w-full rounded-lg border px-4 py-3 pr-12 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-1 transition-colors ${errors.password
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-zinc-300 focus:border-[#c23d3d] focus:ring-[#c23d3d]'
                        }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#c23d3d] rounded p-1 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <div className="text-xs text-red-600">{errors.password}</div>}
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] px-4 py-3 text-sm font-medium text-white hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isFormValid('login') || isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign in to your account'}
                </button>
              </form>
            </div>
          ) : (
            // Regular registration or login form

            <form className="space-y-6" onSubmit={initialMode === 'register' && !isRegistrationSuccess ? handleRegister : handleLogin}>
              {initialMode === 'register' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="block text-sm font-medium text-zinc-900">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleFirstNameChange}
                      onBlur={() => handleBlur('firstName')}
                      className={`w-full rounded-lg border px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-1 transition-colors ${errors.firstName
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-zinc-300 focus:border-[#c23d3d] focus:ring-[#c23d3d]'
                        }`}
                      placeholder="Enter your first name"
                    />
                    {errors.firstName && <div className="text-xs text-red-600">{errors.firstName}</div>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="lastName" className="block text-sm font-medium text-zinc-900">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleLastNameChange}
                      onBlur={() => handleBlur('lastName')}
                      className={`w-full rounded-lg border px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-1 transition-colors ${errors.lastName
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-zinc-300 focus:border-[#c23d3d] focus:ring-[#c23d3d]'
                        }`}
                      placeholder="Enter your last name"
                    />
                    {errors.lastName && <div className="text-xs text-red-600">{errors.lastName}</div>}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-zinc-900">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleEmailChange}
                  onBlur={() => handleBlur('email')}
                  className={`w-full rounded-lg border px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-1 transition-colors ${errors.email
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-zinc-300 focus:border-[#c23d3d] focus:ring-[#c23d3d]'
                    }`}
                  placeholder="Enter your email"
                />
                {errors.email && <div className="text-xs text-red-600">{errors.email}</div>}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-zinc-900">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handlePasswordChange}
                    onBlur={() => handleBlur('password')}
                    className={`w-full rounded-lg border px-4 py-3 pr-12 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-1 transition-colors ${errors.password
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-zinc-300 focus:border-[#c23d3d] focus:ring-[#c23d3d]'
                      }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#c23d3d] rounded p-1 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <div className="text-xs text-red-600">{errors.password}</div>}
              </div>

              {initialMode === 'login' && (
                <div className="flex justify-start">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-[#c23d3d] hover:text-[#e15a3a] font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              <div className="space-y-3">
                {initialMode === 'register' ? (
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] px-4 py-3 text-sm font-medium text-white hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isFormValid('register') || isLoading}
                  >
                    {isLoading ? 'Creating account...' : 'Create account'}
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] px-4 py-3 text-sm font-medium text-white hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isFormValid('login') || isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Toggle between login and register */}
        <div className="text-center">
          {initialMode === 'register' ? (
            <p className="text-sm text-zinc-600">
              Already have an account?{' '}
              <Link to="/login" className="text-[#c23d3d] hover:text-[#e15a3a] font-medium">
                Sign in
              </Link>
            </p>
          ) : (
            <p className="text-sm text-zinc-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#c23d3d] hover:text-[#e15a3a] font-medium">
                Sign up
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function BackArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  )
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}


