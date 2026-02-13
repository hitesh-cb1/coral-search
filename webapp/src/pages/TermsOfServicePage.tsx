import { Link } from 'react-router-dom'
import { Logo } from '../components/common/Logo'

export function TermsOfServicePage() {
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

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-zinc-900 mb-2">Terms of Service</h1>
          <p className="text-zinc-500">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-8 shadow-sm space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-zinc-600 leading-relaxed">
              Welcome to Coral Bricks AI. These Terms of Service ("Terms") govern your access to and use of the websites, APIs, software, documentation, and related services (collectively, the "Services") provided by Coral Bricks AI, LLC, doing business as Coral Bricks AI ("Coral Bricks AI," "we," "us," or "our").
            </p>
            <p className="text-zinc-600 leading-relaxed mt-4">
              By accessing or using the Services, you agree to be bound by these Terms. If you do not agree, do not use the Services.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">1. Eligibility and Authority</h2>
            <p className="text-zinc-600 leading-relaxed">
              You must be at least 18 years old and have the legal authority to enter into these Terms. If you are using the Services on behalf of an organization, you represent and warrant that you have authority to bind that organization, and these Terms apply to that organization.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">2. Accounts and API Keys</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">2.1 Account Registration</h3>
                <p className="text-zinc-600 leading-relaxed">
                  You may need to create an account to access certain Services. You agree to provide accurate and complete information and keep it up to date.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">2.2 API Keys</h3>
                <p className="text-zinc-600 leading-relaxed">
                  API keys are confidential credentials. You are responsible for maintaining their security and for all activity that occurs using your keys. You must not share API keys publicly or with unauthorized parties.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">2.3 Account Suspension</h3>
                <p className="text-zinc-600 leading-relaxed">
                  We may suspend or terminate your account or API access if we reasonably believe:
                </p>
                <ul className="list-disc list-inside space-y-1 text-zinc-600 ml-4 mt-2">
                  <li>Your use violates these Terms or applicable law</li>
                  <li>Your use poses a security risk or operational burden</li>
                  <li>Your account is inactive for an extended period</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">3. Use of the Services</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">3.1 Permitted Use</h3>
                <p className="text-zinc-600 leading-relaxed">
                  You may use the Services solely in accordance with these Terms, our documentation, and applicable laws. The Services are intended for building, testing, and operating search, retrieval, recommendation, and AI-powered applications.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">3.2 Prohibited Use</h3>
                <p className="text-zinc-600 leading-relaxed mb-2">You may not:</p>
                <ul className="list-disc list-inside space-y-1 text-zinc-600 ml-4">
                  <li>Reverse engineer, decompile, or attempt to extract source code or model weights</li>
                  <li>Use the Services to violate laws or infringe intellectual property rights</li>
                  <li>Interfere with or disrupt the Services or bypass rate limits</li>
                  <li>Use the Services to build or train competing embedding, retrieval, or foundation models without our prior written consent</li>
                  <li>Misrepresent the output of the Services as human-generated when disclosure is required by law</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">4. Customer Data and Content</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">4.1 Customer Content</h3>
                <p className="text-zinc-600 leading-relaxed">
                  You retain ownership of any data, text, product records, queries, or other content you submit to the Services ("Customer Content").
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">4.2 License to Process</h3>
                <p className="text-zinc-600 leading-relaxed">
                  You grant Coral Bricks AI a limited, non-exclusive license to process Customer Content solely to provide, maintain, and improve the Services.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">4.3 Data Usage for Improvement</h3>
                <p className="text-zinc-600 leading-relaxed">
                  Unless you opt out in writing, we may use anonymized and aggregated usage data (not including raw Customer Content) to improve our models, infrastructure, and Services.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">4.4 Data Security</h3>
                <p className="text-zinc-600 leading-relaxed">
                  We implement reasonable administrative, technical, and organizational safeguards to protect Customer Content. However, no system is completely secure, and we do not guarantee absolute security.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">5. Fees and Payment</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">5.1 Pricing</h3>
                <p className="text-zinc-600 leading-relaxed">
                  Fees are based on published pricing or a separate written agreement. Usage-based fees may be calculated by queries, records, tokens, or other metrics as described in our documentation.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">5.2 Payment Obligations</h3>
                <p className="text-zinc-600 leading-relaxed">
                  You agree to pay all applicable fees and taxes. Payments are non-refundable except as required by law or explicitly stated otherwise.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">5.3 Free and Trial Tiers</h3>
                <p className="text-zinc-600 leading-relaxed">
                  Free or trial tiers may be subject to lower rate limits, usage caps, or additional restrictions and may be modified or discontinued at any time.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">6. Intellectual Property</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">6.1 Our IP</h3>
                <p className="text-zinc-600 leading-relaxed">
                  The Services, including software, models, embeddings, APIs, documentation, and all related intellectual property, are owned by Coral Bricks AI or its licensors.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">6.2 Feedback</h3>
                <p className="text-zinc-600 leading-relaxed">
                  If you provide feedback or suggestions, you grant us a perpetual, irrevocable, royalty-free license to use them without restriction or compensation.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">7. Service Availability and Changes</h2>
            <p className="text-zinc-600 leading-relaxed">
              We strive to provide reliable Services but do not guarantee uninterrupted or error-free operation. We may modify, suspend, or discontinue any part of the Services at any time.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">8. Confidentiality</h2>
            <p className="text-zinc-600 leading-relaxed">
              Each party agrees to protect the other party's confidential information using reasonable care and not to disclose it except as permitted under these Terms or required by law.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">9. Disclaimers</h2>
            <p className="text-zinc-600 leading-relaxed font-medium">
              THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE." TO THE MAXIMUM EXTENT PERMITTED BY LAW, CORAL BRICKS AI DISCLAIMS ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">10. Limitation of Liability</h2>
            <p className="text-zinc-600 leading-relaxed font-medium mb-2">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-600 ml-4">
              <li>CORAL BRICKS AI WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES</li>
              <li>OUR TOTAL LIABILITY ARISING OUT OF OR RELATED TO THE SERVICES WILL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM</li>
            </ul>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">11. Indemnification</h2>
            <p className="text-zinc-600 leading-relaxed">
              You agree to indemnify and hold harmless Coral Bricks AI from any claims, damages, losses, and expenses arising from your use of the Services or violation of these Terms.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">12. Termination</h2>
            <p className="text-zinc-600 leading-relaxed">
              You may stop using the Services at any time. We may terminate or suspend access as described in Section 2. Upon termination, your right to use the Services ceases immediately.
            </p>
          </section>

          {/* Section 13 */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">13. Governing Law and Venue</h2>
            <p className="text-zinc-600 leading-relaxed">
              These Terms are governed by the laws of the State of Washington, without regard to conflict of laws principles. Any disputes arising out of or relating to these Terms or the Services will be resolved exclusively in the state or federal courts located in the State of Washington, and the parties consent to personal jurisdiction and venue in those courts.
            </p>
          </section>

          {/* Section 14 */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">14. Changes to These Terms</h2>
            <p className="text-zinc-600 leading-relaxed">
              We may update these Terms from time to time. If we make material changes, we will provide reasonable notice. Continued use of the Services after changes become effective constitutes acceptance.
            </p>
          </section>

          {/* Section 15 */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">15. Contact Information</h2>
            <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
              <p className="text-zinc-900 font-semibold mb-1">Coral Bricks AI, LLC</p>
              <p className="text-zinc-600 mb-1">Doing business as Coral Bricks AI</p>
              <p className="text-zinc-600">
                Email: <a href="mailto:hello@coralbricks.ai" className="text-[#c23d3d] hover:text-[#a83232] underline">hello@coralbricks.ai</a>
              </p>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="pt-6 border-t border-zinc-200">
            <p className="text-sm text-zinc-500 italic">
              This Terms of Service is provided for general informational purposes and does not constitute legal advice.
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200 mt-20">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <Logo />
              <p className="mt-4 text-sm text-zinc-600 max-w-md">
                Building retrieval foundations for the AI era.
              </p>
            </div>

            <nav className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
              <Link to="/compare" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                Compare
              </Link>
              <Link to="/docs" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                Documentation
              </Link>
              <Link to="/pricing" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                Pricing
              </Link>
              <Link to="/about" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                About
              </Link>
            </nav>
          </div>

          <div className="mt-8 border-t border-zinc-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-zinc-500">
              © {new Date().getFullYear()} CoralBricks. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link to="/terms" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
