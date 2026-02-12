import { Link } from 'react-router-dom'
import { Logo } from '../components/common/Logo'

export function PrivacyPolicyPage() {
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
          <h1 className="text-4xl font-bold text-zinc-900 mb-2">Privacy Policy</h1>
          <p className="text-zinc-500">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-8 shadow-sm space-y-8">
          <section>
            <p className="text-zinc-600 leading-relaxed">
              Coral Bricks AI, LLC (“Coral Bricks,” “we,” “us,” or “our”) values your privacy. This Privacy Policy
              explains how we collect, use, disclose, and protect information when you visit our website or use our
              products and services.
            </p>
            <p className="text-zinc-600 leading-relaxed mt-4">
              This policy applies to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-600 ml-4 mt-2">
              <li>Our website, documentation, dashboards, and related pages (the “Site”)</li>
              <li>Our APIs, models, and related services (the “Services”)</li>
            </ul>
            <p className="text-zinc-600 leading-relaxed mt-4">
              By accessing or using the Site or Services, you agree to this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">1. Roles and Scope</h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              Coral Bricks processes data in two primary roles:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">a) Website & Account Data — Data Controller</h3>
                <p className="text-zinc-600 leading-relaxed">
                  For visitors and users of our Site and dashboards, Coral Bricks acts as a data controller, determining
                  how and why personal data is processed.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">b) API & Service Data — Data Processor</h3>
                <p className="text-zinc-600 leading-relaxed">
                  For data submitted by customers through the Services (“Customer Content”), Coral Bricks acts as a data
                  processor on behalf of the customer, who remains the data controller.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">2. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">a) Information You Provide</h3>
                <ul className="list-disc list-inside space-y-1 text-zinc-600 ml-4">
                  <li>Name, email address, company name</li>
                  <li>Account credentials</li>
                  <li>Billing and payment information (processed by third-party providers)</li>
                  <li>Communications with us (support requests, feedback, emails)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">b) Automatically Collected Information</h3>
                <ul className="list-disc list-inside space-y-1 text-zinc-600 ml-4">
                  <li>IP address, browser type, device information</li>
                  <li>Usage data, timestamps, logs</li>
                  <li>Pages visited and interactions with the Site</li>
                  <li>Cookies and similar technologies</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">c) Customer Content Submitted via the Services</h3>
                <ul className="list-disc list-inside space-y-1 text-zinc-600 ml-4">
                  <li>Text, structured data, or metadata submitted to the API</li>
                  <li>Model inputs and outputs</li>
                  <li>Usage metrics such as token counts, latency, and error rates</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">3. How We Use Information</h2>
            <p className="text-zinc-600 leading-relaxed mb-2">We use information to:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-600 ml-4">
              <li>Provide, operate, and maintain the Services</li>
              <li>Authenticate users and manage accounts</li>
              <li>Process payments and manage billing</li>
              <li>Monitor performance, reliability, and security</li>
              <li>Improve and develop our products and services</li>
              <li>Respond to inquiries and provide customer support</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">4. Use of Customer Content for Model Improvement</h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              By default, Coral Bricks may use Customer Content, including inputs and outputs, to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-600 ml-4 mb-4">
              <li>Improve, evaluate, and develop our models and Services</li>
              <li>Enhance reliability, safety, and performance</li>
            </ul>
            <p className="text-zinc-600 leading-relaxed mb-4">
              Such use may include aggregation, analysis, and de-identification where appropriate.
            </p>
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Opt-Out</h3>
            <p className="text-zinc-600 leading-relaxed mb-2">
              Customers may opt out of the use of Customer Content for model improvement at any time through account
              settings or by contacting us. Opting out:
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-600 ml-4">
              <li>Does not affect service availability or functionality</li>
              <li>Does not change pricing</li>
              <li>Applies prospectively from the time of opt-out</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-zinc-600 leading-relaxed mb-2">We may share information with:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-600 ml-4 mb-4">
              <li>Service providers and subprocessors (e.g., cloud hosting, monitoring, billing)</li>
              <li>Payment processors (we do not store full payment credentials)</li>
              <li>Legal or regulatory authorities when required by law</li>
            </ul>
            <p className="text-zinc-600 leading-relaxed">
              All subprocessors are bound by confidentiality and data protection obligations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">6. Data Retention</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">Website and Account Data</h3>
                <p className="text-zinc-600 leading-relaxed">
                  Personal information associated with website visits, accounts, and billing is retained for as long as
                  necessary to provide the Services, comply with legal obligations, resolve disputes, and enforce our
                  agreements.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">Customer Content (API and Services)</h3>
                <p className="text-zinc-600 leading-relaxed">
                  By default, Customer Content (including API inputs and outputs) is retained for up to 30 days to
                  operate, secure, and improve the Services, including for abuse detection, debugging, and reliability
                  analysis.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">Operational Logs</h3>
                <p className="text-zinc-600 leading-relaxed">
                  Certain metadata and system logs (such as request timestamps, token counts, and error information) may
                  be retained for up to 45 days for operational, security, and performance monitoring purposes.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">Opt-Out and Enterprise Arrangements</h3>
                <p className="text-zinc-600 leading-relaxed">
                  Customers who opt out of the use of Customer Content for model improvement, or who enter into an
                  enterprise agreement, may be subject to shorter retention periods or no retention, as contractually
                  agreed.
                </p>
              </div>
            </div>
            <p className="text-zinc-600 leading-relaxed mt-4">
              All data is deleted or de-identified after the applicable retention period expires, unless longer
              retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">7. Security</h2>
            <p className="text-zinc-600 leading-relaxed mb-2">
              We implement reasonable administrative, technical, and organizational measures designed to protect
              information, including:
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-600 ml-4 mb-4">
              <li>Access controls</li>
              <li>Encryption in transit</li>
              <li>Infrastructure monitoring and logging</li>
            </ul>
            <p className="text-zinc-600 leading-relaxed">
              No system is completely secure, but we take security seriously.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">8. Cookies and Tracking Technologies</h2>
            <p className="text-zinc-600 leading-relaxed mb-2">We use cookies and similar technologies to:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-600 ml-4 mb-4">
              <li>Operate and improve the Site</li>
              <li>Analyze usage and performance</li>
              <li>Enhance user experience</li>
            </ul>
            <p className="text-zinc-600 leading-relaxed">
              You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">9. Your Rights</h2>
            <p className="text-zinc-600 leading-relaxed mb-2">
              Depending on your jurisdiction, you may have rights to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-600 ml-4 mb-4">
              <li>Access, correct, or delete personal data</li>
              <li>Object to or restrict certain processing</li>
              <li>Request data portability</li>
            </ul>
            <p className="text-zinc-600 leading-relaxed">
              Requests can be submitted to{' '}
              <a href="mailto:privacy@coralbricks.ai" className="text-[#c23d3d] hover:text-[#a83232] underline">
                privacy@coralbricks.ai
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">10. International Data Transfers</h2>
            <p className="text-zinc-600 leading-relaxed">
              We may process information in the United States and other jurisdictions where our service providers
              operate, subject to appropriate safeguards.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">11. Children’s Privacy</h2>
            <p className="text-zinc-600 leading-relaxed">
              Our Site and Services are not directed to individuals under the age of 13, and we do not knowingly collect
              personal data from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">12. Changes to This Policy</h2>
            <p className="text-zinc-600 leading-relaxed">
              We may update this Privacy Policy from time to time. Updates will be posted on this page with a revised
              effective date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">13. Contact Us</h2>
            <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
              <p className="text-zinc-900 font-semibold mb-1">Coral Bricks AI, LLC</p>
              <p className="text-zinc-600 mb-1">
                Email:{' '}
                <a href="mailto:privacy@coralbricks.ai" className="text-[#c23d3d] hover:text-[#a83232] underline">
                  privacy@coralbricks.ai
                </a>
              </p>
              <p className="text-zinc-600">
                Website:{' '}
                <a
                  href="https://coralbricks.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#c23d3d] hover:text-[#a83232] underline"
                >
                  https://coralbricks.ai
                </a>
              </p>
            </div>
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
              <Link to="/" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                Playground
              </Link>
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
