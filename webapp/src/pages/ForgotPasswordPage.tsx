import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, AlertCircle, Check, Loader2 } from 'lucide-react'
import { Logo } from '../components/common/Logo'
import { endpoints } from '../config/endpoints'
import { apiPost } from '../lib/apiClient'

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess(false)

        if (!email) {
            setError('Email is required')
            return
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address')
            return
        }

        setIsLoading(true)

        try {
            const response = await apiPost(endpoints.auth.forgotPassword(), { email })

            if (response.error) {
                setError(response.error)
            } else {
                setSuccess(true)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send reset email')
        } finally {
            setIsLoading(false)
        }
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
                    {!success ? (
                        <>
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                                    <Mail className="h-8 w-8 text-blue-600" />
                                </div>
                                <h1 className="text-2xl font-bold text-zinc-900 mb-2">Forgot Password?</h1>
                                <p className="text-zinc-600">
                                    Enter your email address and we'll send you a link to reset your password.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#c23d3d] focus:border-transparent outline-none transition-all"
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 px-6 bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Sending...
                                        </span>
                                    ) : (
                                        'Send Reset Link'
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
                    ) : (
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                                <Check className="h-8 w-8 text-green-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Check Your Email</h1>
                            <p className="text-zinc-600 mb-6">
                                If an account with that email exists, we've sent a password reset link to{' '}
                                <strong>{email}</strong>.
                            </p>
                            <p className="text-sm text-zinc-500 mb-6">
                                The link will expire in 1 hour. If you don't see the email, check your spam folder.
                            </p>
                            <Link
                                to="/login"
                                className="inline-block px-6 py-3 bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
                            >
                                Back to Login
                            </Link>
                        </div>
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
