import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/common/Logo'
import { Footer } from '../components/common/Footer'
import { apiPost } from '../lib/apiClient'
import { endpoints } from '../config/endpoints'

export function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [topic, setTopic] = useState('')
  const [role, setRole] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSending(true)
    try {
      const response = await apiPost(endpoints.contact.submit(), {
        name,
        email,
        company,
        topic,
        role,
        message,
      })
      if (response.error) {
        setError(response.error)
      } else {
        setSuccess(true)
        setName('')
        setEmail('')
        setCompany('')
        setTopic('')
        setRole('')
        setMessage('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const topicOptions = [
    'Evaluating Coral Bricks for search or AI assistants',
    'Production usage & scaling',
    'Enterprise deployments or private infrastructure',
    'Model adaptation, fine-tuning, or schema optimization',
    'Benchmarks, latency, or relevance questions',
    'Partnership or research collaboration',
    'Other',
  ]

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/">
              <Logo />
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/" className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors">
                Playground
              </Link>
              <Link to="/docs" className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors">
                Documentation
              </Link>
              <Link to="/pricing" className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors">
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-zinc-900 mb-2">Talk to Coral Bricks</h1>
          <p className="text-zinc-600 text-lg">
            Questions about evaluation, production usage, or enterprise deployments? Send us a note.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8">
          {success && (
            <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              Thank you. We've received your message and will get back to you soon.
            </div>
          )}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-900 mb-2">
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-500 focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d]"
                placeholder="Your name"
                disabled={sending}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-900 mb-2">
                Work email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-500 focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d]"
                placeholder="you@company.com"
                disabled={sending}
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-zinc-900 mb-2">
                Company
              </label>
              <input
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-500 focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d]"
                placeholder="Your company"
                disabled={sending}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-3">
                Topic
              </label>
              <div className="space-y-2">
                {topicOptions.map((option) => (
                  <label
                    key={option}
                    className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="topic"
                      value={option}
                      checked={topic === option}
                      onChange={(e) => setTopic(e.target.value)}
                      className="mt-0.5 h-4 w-4 text-[#c23d3d] focus:ring-[#c23d3d] border-zinc-300"
                      disabled={sending}
                    />
                    <span className="text-sm text-zinc-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-zinc-900 mb-2">
                Role <span className="text-zinc-500 font-normal">(optional)</span>
              </label>
              <input
                id="role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-500 focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d]"
                placeholder="Your role"
                disabled={sending}
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-zinc-900 mb-2">
                Message
              </label>
              <textarea
                id="message"
                required
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-500 focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d] resize-y min-h-[120px]"
                placeholder="Tell us a bit about your use case, scale (catalog size / QPS), and what you'd like to evaluate."
                disabled={sending}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-xl bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] px-6 py-4 text-base font-semibold text-white shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending...' : '👉 Send message'}
              </button>
              <p className="mt-3 text-center text-sm text-zinc-500">
                We usually respond within 1 business day.
              </p>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-zinc-200">
            <p className="text-center text-sm text-zinc-600 mb-4">
              Want to talk sooner?{' '}
              <a
                href="#"
                className="text-[#c23d3d] hover:text-[#e15a3a] font-medium underline"
                onClick={(e) => {
                  e.preventDefault()
                  // TODO: Add calendar scheduling link
                }}
              >
                Schedule a conversation
              </a>
            </p>
          </div>
        </div>

        {/* Trust signal box */}
        <div className="mt-8 rounded-xl border-2 border-orange-200 bg-orange-50 p-6">
          <p className="text-sm font-medium text-orange-900 text-center">
            Built for high-recall product retrieval with sub-50 ms tail latency at production scale.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
