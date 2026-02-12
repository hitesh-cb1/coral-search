import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Check, AlertCircle, Loader2, Lock, Eye, EyeOff } from 'lucide-react'
import { Logo } from '../components/common/Logo'
import { endpoints } from '../config/endpoints'
import { apiPost, apiGet } from '../lib/apiClient'

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const token = searchParams.get('token')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isValidating, setIsValidating] = useState(true)
    const [error, setError] = useState('')
    const [validationError, setValidationError] = useState('')
    const [success, setSuccess] = useState(false)

    // Validate token on mount
    useEffect(() => {
        if (!token) {
            setValidationError('Invalid reset link. Please request a new password reset.')
            setIsValidating(false)
            return
        }

        // Validate token before showing the form
        const validateToken = async () => {
            try {
                const response = await apiGet(endpoints.auth.validateResetToken(token))

                if (response.error) {
                    setValidationError(response.error || 'Invalid or expired reset link. Please request a new password reset.')
                }
                // Token is valid, show the form
            } catch (err) {
                setValidationError(err instanceof Error ? err.message : 'Invalid or expired reset link. Please request a new password reset.')
            } finally {
                setIsValidating(false)
            }
        }

        validateToken()
    }, [token])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!password) {
            setError('Password is required')
            return
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        if (!/[A-Z]/.test(password)) {
            setError('Password must contain at least one uppercase letter')
            return
        }

        if (!/[a-z]/.test(password)) {
            setError('Password must contain at least one lowercase letter')
            return
        }

        if (!/[0-9]/.test(password)) {
            setError('Password must contain at least one number')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (!token) {
            setError('Invalid reset token')
            return
        }

        setIsLoading(true)

        try {
            const response = await apiPost(endpoints.auth.resetPassword(), {
                token,
                password,
            })

            if (response.error) {
                setError(response.error)
            } else {
                setSuccess(true)
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login')
                }, 3000)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset password')
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <Logo />
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                            <Check className="h-8 w-8 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Password Reset Successful!</h1>
                        <p className="text-zinc-600 mb-4">
                            Your password has been reset successfully. You can now log in with your new password.
                        </p>
                        <p className="text-sm text-zinc-500 mb-6">Redirecting to login page...</p>
                        <Link
                            to="/login"
                            className="inline-block px-6 py-3 bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
                        >
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    if (isValidating) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <Logo />
                    </div>
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                        </div>
                        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Validating Reset Link</h1>
                        <p className="text-zinc-600">Please wait...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Logo />
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {validationError ? (
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                                <AlertCircle className="h-8 w-8 text-red-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Invalid Reset Link</h1>
                            <p className="text-zinc-600 mb-4">{validationError}</p>
                            <Link
                                to="/forgot-password"
                                className="inline-block px-6 py-3 bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
                            >
                                Request New Reset Link
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                                    <Lock className="h-8 w-8 text-blue-600" />
                                </div>
                                <h1 className="text-2xl font-bold text-zinc-900 mb-2">Reset Your Password</h1>
                                <p className="text-zinc-600">Enter your new password below.</p>
                            </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-2">
                                New Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="w-full px-4 py-3 pr-12 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#c23d3d] focus:border-transparent outline-none transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#c23d3d] rounded p-1 transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700 mb-2">
                                Confirm Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="w-full px-4 py-3 pr-12 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#c23d3d] focus:border-transparent outline-none transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#c23d3d] rounded p-1 transition-colors"
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="text-xs text-zinc-500">
                            Password must be at least 8 characters and contain uppercase, lowercase, and a number.
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || !token}
                            className="w-full py-3 px-6 bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Resetting...
                                </span>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="text-sm text-[#c23d3d] hover:text-[#e15a3a] font-medium"
                        >
                            Back to Login
                        </Link>
                    </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-zinc-500 mt-6">
                    © {new Date().getFullYear()} CoralBricks. All rights reserved.
                </p>
            </div>
        </div>
    )
}
