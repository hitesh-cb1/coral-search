import { Link } from 'react-router-dom'
import { Logo } from '../components/common/Logo'
import { Footer } from '../components/common/Footer'

export function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/">
              <Logo />
            </Link>
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors"
              >
                Playground
              </Link>
              <Link
                to="/docs"
                className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors"
              >
                Documentation
              </Link>
              <Link
                to="/pricing"
                className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors"
              >
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-white via-zinc-50 to-zinc-100 border-b border-zinc-200">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] bg-clip-text text-transparent sm:text-6xl mb-4">
              About CoralBricks
            </h1>
            <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
              Building retrieval foundations for the AI era
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Our Mission */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] rounded-full"></div>
            <h2 className="text-3xl font-bold text-zinc-900">Our Mission</h2>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-8 shadow-sm">
            <p className="text-xl text-zinc-900 font-semibold mb-4">
              We build retrieval foundations for the AI era.
            </p>
            <p className="text-zinc-600 mb-4 leading-relaxed">
              The world is producing knowledge at a scale no human—or AI—can navigate alone. Petabytes of documents, structured records, images, logs, and conversations are rapidly becoming exabytes of fragmented information that is technically searchable, but not truly usable.
            </p>
            <p className="text-zinc-600 leading-relaxed">
              CoralBricks exists to make high-recall, grounded retrieval possible at planetary scale—so humans and AI agents can reliably find, reason over, and act on information far larger than any system built before.
            </p>
          </div>
        </section>

        {/* Why Retrieval Breaks Today */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] rounded-full"></div>
            <h2 className="text-3xl font-bold text-zinc-900">Why Retrieval Breaks Today</h2>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-8 shadow-sm">
            <p className="text-zinc-600 mb-4 leading-relaxed">
              Legacy keyword search is obsolete—and most hybrid systems merely patch over its limits.
            </p>
            <p className="text-zinc-600 mb-4 leading-relaxed">
              They treat retrieval as an afterthought: brittle chunking, generic embeddings, and models that ignore domain structure, modality, and intent. As data grows larger and more complex, these systems become inaccurate and slow—relying on layered heuristics and costly re-ranking to approximate relevance.
            </p>
            <p className="text-zinc-600 leading-relaxed">
              This is why AI systems hallucinate, recommendations drift, and enterprise search breaks under real-world complexity.
            </p>
          </div>
        </section>

        {/* Our Belief */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] rounded-full"></div>
            <h2 className="text-3xl font-bold text-zinc-900">Our Belief</h2>
          </div>
          <div className="bg-gradient-to-br from-[#c23d3d]/5 to-[#e15a3a]/5 rounded-xl border border-[#c23d3d]/20 p-8">
            <p className="text-xl text-zinc-900 font-semibold mb-4">
              We believe retrieval is not a feature—it is a foundation.
            </p>
            <p className="text-zinc-600 mb-4 leading-relaxed">
              Retrieval is the missing layer between raw data and intelligence.
            </p>
            <p className="text-zinc-600 leading-relaxed">
              If AI systems are to reason over massive corpora, they must be grounded in models that understand data natively: its structure, semantics, constraints, and context—across text, structured data, and multimodal content.
            </p>
          </div>
        </section>

        {/* Our Approach */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] rounded-full"></div>
            <h2 className="text-3xl font-bold text-zinc-900">Our Approach</h2>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-8 shadow-sm">
            <p className="text-zinc-600 mb-4 leading-relaxed">
              CoralBricks builds foundation retrieval models from first principles.
            </p>
            <p className="text-zinc-600 mb-4 leading-relaxed">
              We combine domain-aware data enrichment, multimodal and long-context reasoning, purpose-built training pipelines spanning pre-training and adaptation, and custom inference architectures optimized for retrieval speed, cost, and grounding.
            </p>
            <p className="text-zinc-600 leading-relaxed">
              Fast embeddings are one step in this direction—but the goal is larger: enabling AI systems to stay precise, reliable, and grounded as data scales by orders of magnitude.
            </p>
          </div>
        </section>

        {/* What This Enables */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] rounded-full"></div>
            <h2 className="text-3xl font-bold text-zinc-900">What This Enables</h2>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-8 shadow-sm">
            <p className="text-zinc-600 mb-6 leading-relaxed">
              Our retrieval platform delivers:
            </p>
            <ul className="space-y-4 mb-6">
              <li className="flex items-start gap-3">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] flex-shrink-0"></div>
                <span className="text-zinc-600 leading-relaxed">Deep, reliable retrieval across text, structured data, and multimodal content—grounded in organizational structure and terminology</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] flex-shrink-0"></div>
                <span className="text-zinc-600 leading-relaxed">Low-latency, cost-efficient inference that scales to real-world, enterprise workloads</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] flex-shrink-0"></div>
                <span className="text-zinc-600 leading-relaxed">An extensible foundation that adapts to new domains, data, and use cases through fine-tuning, adaptation, and custom retrieval logic</span>
              </li>
            </ul>
            <p className="text-zinc-600 leading-relaxed">
              Finally—retrieval built as a foundation, not a workaround, for how people and AI discover information today.
            </p>
          </div>
        </section>

        {/* Founder */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] rounded-full"></div>
            <h2 className="text-3xl font-bold text-zinc-900">Founder</h2>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-8 shadow-sm">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-r from-[#c23d3d] to-[#e15a3a]">
                  <img 
                    src="/hitesh-profile.jpeg" 
                    alt="Hitesh Jain" 
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-2xl font-bold text-zinc-900">Hitesh Jain</h3>
                  <a
                    href="https://www.linkedin.com/in/hiteshjain"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#0077b5] hover:bg-[#005885] text-white transition-colors"
                    aria-label="Hitesh Jain LinkedIn"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                </div>
                <p className="text-zinc-600 mb-4 leading-relaxed">
                  Hitesh Jain spent 13 years at Meta working across retrieval systems, LLM fine-tuning, Messenger, and Ads infrastructure—building and operating systems that retrieve and reason over information at massive scale.
                </p>
                <p className="text-zinc-600 mb-4 leading-relaxed">
                  That experience shaped a core belief: retrieval is the missing layer between raw data and intelligence.
                </p>
                <p className="text-zinc-600 leading-relaxed">
                  After leaving Meta, he saw how outdated site search felt compared to the rapid adoption of AI chatbots. He started CoralBricks to bring modern retrieval—context-aware, long-form, adaptive, and evaluation-driven—beyond big tech, enabling both humans and AI agents to navigate knowledge at truly large scale.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}
