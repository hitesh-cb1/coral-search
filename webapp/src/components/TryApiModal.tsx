import { useState } from 'react'
import { X, Copy, Check, Mail, Zap } from 'lucide-react'

// Get API URL from environment variable or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

interface TryApiModalProps {
    isOpen: boolean
    onClose: () => void
}

export function TryApiModal({ isOpen, onClose }: TryApiModalProps) {
    const [email, setEmail] = useState('')
    const [apiKey, setApiKey] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)
    const [verificationSent, setVerificationSent] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [rateLimit, setRateLimit] = useState<{
        requestsPerSecond: number
        tokensPerMonth: number
    } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const response = await fetch(`${API_BASE_URL}/marketplace/v1/try-api`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate API key')
            }

            // Check if user already has an API key (no apiKey in response)
            if (!data.data.apiKey) {
                setError(data.data.message || 'You already have an API key. Check your email for the key.')
                setIsLoading(false)
                return
            }

            setApiKey(data.data.apiKey)
            setRateLimit(data.data.rateLimit)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setIsLoading(false)
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(apiKey)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleRequestVerification = async () => {
        setIsVerifying(true)
        setError('')

        try {
            const response = await fetch(`${API_BASE_URL}/marketplace/v1/request-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send verification email')
            }

            setVerificationSent(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send verification email')
        } finally {
            setIsVerifying(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="p-8">
                    {!apiKey ? (
                        <>
                            {/* Header */}
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] mb-4">
                                    <Zap className="h-8 w-8 text-white" />
                                </div>
                                <h2 className="text-3xl font-bold text-zinc-900">Try Our API</h2>
                                <p className="mt-2 text-zinc-600">
                                    Get instant access with just your email
                                </p>
                            </div>

                            {/* Form */}
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
                                        placeholder="you@example.com"
                                        required
                                        className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#c23d3d] focus:border-transparent outline-none transition-all"
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 px-6 bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Generating...' : 'Get API Key'}
                                </button>
                            </form>

                            {/* Info */}
                            <div className="mt-6 p-4 bg-zinc-50 rounded-lg">
                                <p className="text-sm text-zinc-600">
                                    <strong>What you'll get:</strong>
                                </p>
                                <ul className="mt-2 space-y-1 text-sm text-zinc-600">
                                    <li>• Instant API key</li>
                                    <li>• 100M free tokens at signup</li>
                                    <li>• Up to 5 requests/second (increases after verification)</li>
                                    <li>• Verify email to increase rate limits</li>
                                </ul>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Success State */}
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                                    <Check className="h-8 w-8 text-green-600" />
                                </div>
                                <h2 className="text-3xl font-bold text-zinc-900">Your API Key</h2>
                                <p className="mt-2 text-zinc-600">
                                    Also sent to <strong>{email}</strong>
                                </p>
                            </div>

                            {/* API Key Display */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-zinc-700 mb-2">
                                    API Key
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={apiKey}
                                        readOnly
                                        className="w-full px-4 py-3 pr-12 border border-zinc-300 rounded-lg bg-zinc-50 font-mono text-sm"
                                    />
                                    <button
                                        onClick={handleCopy}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-600 hover:text-zinc-900 transition-colors"
                                    >
                                        {copied ? (
                                            <Check className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <Copy className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Rate Limits */}
                            {rateLimit && (
                                <div className="mb-6 p-4 bg-zinc-50 rounded-lg">
                                    <p className="text-sm font-medium text-zinc-700 mb-3">Current Limits:</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 bg-white rounded-lg border border-zinc-200">
                                            <p className="text-xs text-zinc-500 mb-1">Requests/sec</p>
                                            <p className="text-lg font-bold text-zinc-900">{rateLimit.requestsPerSecond}</p>
                                        </div>
                                        <div className="text-center p-3 bg-white rounded-lg border border-zinc-200">
                                            <p className="text-xs text-zinc-500 mb-1">Tokens/month</p>
                                            <p className="text-lg font-bold text-zinc-900">{Number(rateLimit.tokensPerMonth).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Verification CTA */}
                            <div className={`p-4 rounded-lg mb-4 ${verificationSent ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200'}`}>
                                <div className="flex items-start gap-3">
                                    {verificationSent ? (
                                        <Check className="h-5 w-5 text-green-600 mt-0.5" />
                                    ) : (
                                        <Mail className="h-5 w-5 text-emerald-600 mt-0.5" />
                                    )}
                                    <div className="flex-1">
                                        {verificationSent ? (
                                            <>
                                                <p className="text-sm font-semibold text-green-900">
                                                    Verification Email Sent!
                                                </p>
                                                <p className="text-sm text-green-700 mt-1">
                                                    Check your inbox for the verification link. It expires in 24 hours.
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-sm font-semibold text-emerald-900">
                                                    Increase your rate limits
                                                </p>
                                                <p className="text-sm text-emerald-700 mt-1">
                                                    You already have 100M free tokens! Verify your email or sign in with Google to unlock higher rate limits. Limits will continue to increase as your spending grows.
                                                </p>
                                                <button
                                                    onClick={handleRequestVerification}
                                                    disabled={isVerifying}
                                                    className="mt-3 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isVerifying ? 'Sending...' : 'Send Verification Email'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-3 px-6 border-2 border-zinc-300 text-zinc-700 font-semibold rounded-lg hover:bg-zinc-50 transition-colors"
                            >
                                Close
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
