export const loginStyles = {
  page: 'min-h-screen bg-zinc-950 text-zinc-100',
  center: 'mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10',

  // Modal look
  card:
    'w-full max-w-[420px] rounded-2xl border border-zinc-800 bg-[#212626] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur',

  brandRow: 'mb-5 flex items-center justify-between',
  brand: 'text-sm font-semibold tracking-tight text-white',
  closeLink: 'text-xs text-zinc-500 hover:text-zinc-300',

  title: 'text-2xl font-semibold tracking-tight text-white',
  subtitle: 'mt-2 text-sm leading-relaxed text-zinc-400',

  actions: 'mt-6 space-y-3',
  button:
    'flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-100 hover:bg-zinc-900/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed',
  buttonIcon: 'h-5 w-5',

  dividerRow: 'my-5 flex items-center gap-3',
  dividerLine: 'h-px flex-1 bg-zinc-800',
  dividerText: 'text-[11px] uppercase tracking-wider text-zinc-500',

  consentRow: 'mt-4 flex cursor-pointer items-start gap-3',
  checkbox:
    'mt-0.5 h-4 w-4 cursor-pointer rounded border-zinc-700 bg-zinc-950 accent-emerald-400 focus:ring-2 focus:ring-emerald-500/40',
  consentText: 'text-sm leading-relaxed text-white/90 hover:text-white',
  consentLink: 'cursor-pointer text-white underline decoration-white/40 underline-offset-2 hover:text-white hover:decoration-white',

  // Email form styles
  headerRow: 'mb-5 flex items-center gap-3',
  backButton:
    'flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/40 p-2 text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40',
  backIcon: 'h-5 w-5',
  emailTitle: 'text-2xl font-semibold tracking-tight text-white flex-1',

  emailForm: 'mt-6 space-y-4',
  inputGroup: 'space-y-2',
  inputLabel: 'block text-sm font-medium text-zinc-300',
  input:
    'w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40',
  passwordWrapper: 'relative',
  passwordToggle:
    'absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 rounded p-1',
  eyeIcon: 'h-5 w-5',

  forgotPasswordRow: 'flex justify-start',
  forgotPasswordLink:
    'text-sm text-emerald-400 hover:text-emerald-300 underline decoration-emerald-400/40 underline-offset-2 hover:decoration-emerald-300',

  emailActions: 'mt-6 space-y-3',
  loginButton:
    'w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm font-medium text-zinc-100 hover:bg-zinc-900/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed',
  registerButton:
    'w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm font-medium text-zinc-100 hover:bg-zinc-900/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed',
  inputError: 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/40',
  fieldError: 'text-xs text-red-400 mt-1',
  errorMessage: 'mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200',
  successMessage: 'mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200',
} as const


