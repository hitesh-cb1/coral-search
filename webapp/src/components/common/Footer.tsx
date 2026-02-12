import { Link } from 'react-router-dom'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="bg-white border-t border-zinc-200">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-2">
            <Logo />
          </div>

          <nav className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
            <Link to="/api-keys" className="text-zinc-600 hover:text-zinc-900 transition-colors">
              Dashboard
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
            <Link to="/contact" className="text-zinc-600 hover:text-zinc-900 transition-colors">
              Contact
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
  )
}
