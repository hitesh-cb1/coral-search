import { Link } from 'react-router-dom'
import { Logo } from '../components/common/Logo'
import { Footer } from '../components/common/Footer'

export function PricingPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <nav className="flex items-center justify-between">
            <Logo />
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-white via-zinc-50 to-zinc-100">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] bg-clip-text text-transparent sm:text-6xl pb-2">
              Simple pricing for fast, relevant retrieval
            </h1>
            <p className="mt-6 text-xl leading-8 text-zinc-600 max-w-2xl mx-auto">
              Evaluate freely, deploy low-latency retrieval, or work with us on a custom setup.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-center text-zinc-600 mb-10">
          Compare Coral Bricks to generic embedding models —{' '}
          <Link to="/compare" className="text-[#c23d3d] hover:text-[#e15a3a] font-medium underline">
            View benchmarks
          </Link>
        </p>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Best Effort */}
          <div className="rounded-2xl border-2 border-[#c23d3d] bg-gradient-to-br from-white to-zinc-50 p-8 shadow-lg flex flex-col">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-zinc-900 mb-2">Best Effort</h3>
              <p className="text-sm text-zinc-600 mb-4">
                Designed for evaluation, indexing and prototyping on shared infrastructure.
              </p>
              <div className="mb-4">
                <span className="text-4xl font-bold text-zinc-900">$0.15</span>
                <span className="text-zinc-600 ml-2">/ 1M tokens</span>
              </div>
            </div>
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-zinc-900 mb-3">Includes</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-[#c23d3d] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-zinc-700">Full Embed API access (query + product)</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-[#c23d3d] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-zinc-700">Shared, best-effort infrastructure</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-[#c23d3d] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-zinc-700">100M free tokens included</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-[#c23d3d] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-zinc-700">No credit card required</span>
                </li>
              </ul>
            </div>
            <div className="mt-auto">
              <Link
                to="/api-keys"
                className="block w-full rounded-lg bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] px-6 py-3 text-center text-sm font-semibold text-white hover:shadow-lg transition-all duration-200"
              >
                Get API key
              </Link>
            </div>
          </div>

          {/* Production */}
          <div className="rounded-2xl border-2 border-blue-500 bg-white p-8 shadow-lg flex flex-col">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-zinc-900 mb-2">Production</h3>
              <p className="text-sm text-zinc-600 mb-4">
                Optimized for sub-50 ms, use for real-time experiences such as typeahead and AI assistants.
              </p>
              <div className="mb-4">
                <span className="text-4xl font-bold text-zinc-900">$0.37</span>
                <span className="text-zinc-600 ml-2">/ 1M tokens</span>
              </div>
            </div>
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-zinc-900 mb-3">Includes</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-zinc-700">Query Embed API access</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-zinc-700">Low-latency, prioritized deployment</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-zinc-700">Optimized for real-time query traffic</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-zinc-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-zinc-500 text-sm">Product indexing continues to use Best Effort</span>
                </li>
              </ul>
            </div>
            <div className="mt-auto">
              <Link
                to="/api-keys"
                className="block w-full rounded-lg border-2 border-blue-500 bg-white px-6 py-3 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
              >
                Create API key
              </Link>
            </div>
          </div>

          {/* Enterprise */}
          <div className="rounded-2xl border-2 border-slate-500 bg-gradient-to-br from-zinc-50 to-white p-8 shadow-sm flex flex-col">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-zinc-900 mb-2">Enterprise</h3>
              <p className="text-sm text-zinc-600 mb-4">
                For organizations needing customization, adaptation and dedicated deployments.
              </p>
              <div className="mb-4">
                <div className="text-3xl font-bold text-zinc-900">Custom Price</div>
              </div>
            </div>
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-zinc-900 mb-3">Includes</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-zinc-700 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-zinc-700">Dedicated or private deployments</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-zinc-700 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-zinc-700">Model and retrieval pipeline tuning on your knowledge base</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-zinc-700 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-zinc-700">Advanced evaluation and relevance analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-zinc-700 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-zinc-700">Direct access to Coral Bricks engineers</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-zinc-700 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-zinc-700">Focused on improving relevance, latency, and integration risk</span>
                </li>
              </ul>
            </div>
            <div className="mt-auto">
              <Link
                to="/contact"
                className="block w-full rounded-lg border-2 border-slate-500 bg-white px-6 py-3 text-center text-sm font-semibold text-zinc-900 hover:bg-slate-50 transition-colors"
              >
                Talk to us
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-zinc-900 mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">What can I do with the 100M free tokens?</h3>
              <p className="text-zinc-600">
                Every new account receives 100 million tokens completely free. Use them to test our API, build your application, or run small projects. No credit card required.
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">Can I mix tiers?</h3>
              <p className="text-zinc-600">
                Yes! You can use Production tier for embedding queries in real time while using Best Effort tier for indexing, evaluation and experimentation. This hybrid approach optimizes both cost and performance.
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">How do I estimate my costs?</h3>
              <p className="text-zinc-600">
                Costs are based on the total tokens embedded across your workload, not just catalog size. Teams often embed multiple fields, re-index over time, or run evaluation and experimentation pipelines, while query usage scales with traffic and latency needs. Simple evaluation and production workloads fit well in Best Effort or Production, while more complex or continuous pipelines may be better supported via Enterprise.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="rounded-2xl bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] p-12 text-white">
            <h2 className="text-3xl font-bold mb-8">Need help choosing the right setup?</h2>
            <Link
              to="/contact"
              className="inline-flex rounded-lg bg-white px-8 py-3 text-sm font-semibold text-[#c23d3d] hover:bg-zinc-100 transition-colors"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
