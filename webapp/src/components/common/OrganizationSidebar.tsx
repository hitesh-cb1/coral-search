import { Link, useLocation } from 'react-router-dom'

export function OrganizationSidebar() {
  const location = useLocation()

  const navigationItems = [
    { 
      id: 'api-keys', 
      label: 'API Keys', 
      path: '/api-keys', 
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243C11.978 9.5 12.5 9 13 9a6 6 0 016-2z" />
        </svg>
      )
    },
    { 
      id: 'usage', 
      label: 'Usage', 
      path: '/organization/usage', 
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      id: 'billing', 
      label: 'Billing', 
      path: '/organization/billing', 
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    { 
      id: 'general', 
      label: 'Account', 
      path: '/organization', 
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
  ]

  return (
    <aside className="w-64 border-r border-zinc-200 bg-white min-h-[calc(100vh-73px)]">
      <div className="p-6">
        {/* Navigation */}
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] text-white shadow-sm'
                    : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-zinc-500'}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Documentation Link */}
        <div className="mt-8 pt-6 border-t border-zinc-200">
          <Link
            to="/docs"
            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              location.pathname === '/docs' || location.pathname === '/documentation'
                ? 'bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] text-white shadow-sm'
                : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            <svg className={`h-5 w-5 ${location.pathname === '/docs' || location.pathname === '/documentation' ? 'text-white' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Documentation
          </Link>
        </div>
      </div>
    </aside>
  )
}

