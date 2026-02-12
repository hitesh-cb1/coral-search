import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, AlertCircle, Loader2 } from 'lucide-react'
import { Logo } from '../components/common/Logo'
import { endpoints } from '../config/endpoints'

export function VerifyEmailPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const token = searchParams.get('token')

    const [step, setStep] = useState<'verifying' | 'success' | 'error'>('verifying')
    const [error, setError] = useState('')

    // Verify email on mount
    useEffect(() => {
        if (!token) {
            setStep('error')
            setError('Invalid verification link. Please request a new verification email.')
            return
        }

        // Verify email immediately
        const verifyEmail = async () => {
            try {
                const response = await fetch(endpoints.marketplace.verifyEmail(), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token }),
                })

                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || 'Verification failed')
                }

                // Store JWT token if provided
                if (data.data.token) {
                    localStorage.setItem('jwtToken', data.data.token)
                }

                setStep('success')

                // Redirect to dashboard after 3 seconds
                setTimeout(() => {
                    navigate('/api-keys')
                }, 3000)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Verification failed')
                setStep('error')
            }
        }

        verifyEmail()
    }, [token, navigate])


    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Logo />
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {step === 'verifying' && (
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                            </div>
                            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Verifying Email</h1>
                            <p className="text-zinc-600">Please wait while we verify your email...</p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                                <Check className="h-8 w-8 text-green-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Email Verified!</h1>
                            <p className="text-zinc-600 mb-4">
                                Your email has been verified successfully!
                            </p>
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                                <p className="text-sm text-green-700 mb-2">
                                    <strong>🎉 Rate limits increased!</strong>
                                </p>
                                <p className="text-sm text-green-700">
                                    You already have your 100M free tokens. Your rate limits have been increased and will continue to grow as your spending increases.
                                </p>
                            </div>
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-700">
                                    Redirecting to dashboard...
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                                <AlertCircle className="h-8 w-8 text-red-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Verification Failed</h1>
                            <p className="text-zinc-600 mb-4">{error}</p>
                            <button
                                onClick={() => navigate('/')}
                                className="px-6 py-3 bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
                            >
                                Go to Homepage
                            </button>
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
