import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-white">404</h1>
        <p className="text-sm text-zinc-400">That page doesn’t exist.</p>
        <div className="flex items-center gap-3">
          <Link className="text-sm text-emerald-300 hover:text-emerald-200" to="/">
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}


