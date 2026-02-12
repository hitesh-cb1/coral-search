import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiPost } from '../../lib/apiClient'
import { endpoints } from '../../config/endpoints'
import { storeAdminJwtToken, hasAdminJwtToken } from '../../lib/tokenStorage'
import { Logo } from '../../components/common/Logo'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Redirect if already logged in as admin
    if (hasAdminJwtToken()) {
      navigate('/admin/dashboard', { replace: true })
      return
    }
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await adminApiPost(endpoints.admin.login(), {
        email: email.trim(),
        password: password,
      })

      if (response.error) {
        setError(response.error || 'Login failed. Please check your credentials.')
        setIsLoading(false)
      } else {
        // Store admin JWT token from response
        const token = response.data?.token || response.data?.data?.token
        if (token) {
          storeAdminJwtToken(token)
        }
        
        // Redirect to admin dashboard
        navigate('/admin/dashboard')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during login')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center">
            <Logo />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-zinc-900">Admin Login</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Sign in to access the admin dashboard
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-900 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d]"
                placeholder="admin@example.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-900 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d]"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] px-4 py-3 text-sm font-medium text-white hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

