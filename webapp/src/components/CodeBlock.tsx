import { useCallback, useMemo, useState, useEffect } from 'react'

type Props = {
  title?: string
  code: string
  className?: string
  codeClassName?: string
  language?: string
  maxHeight?: string
  hideHeader?: boolean
  onCopyRef?: (copyFn: () => void) => void
}

export function CodeBlock({ title, code, className, codeClassName, language, maxHeight, hideHeader = false, onCopyRef }: Props) {
  const [copied, setCopied] = useState(false)

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      // ignore (e.g. clipboard permissions)
    }
  }, [code])

  // Expose copy function via ref if provided
  const copyLabel = useMemo(() => (copied ? 'Copied' : 'Copy'), [copied])

  // Expose copy function to parent component
  useEffect(() => {
    if (onCopyRef) {
      onCopyRef(onCopy)
    }
  }, [onCopy, onCopyRef])

  const displayTitle = title ?? 'Code'
  const showTitle = displayTitle !== '' && !hideHeader

  return (
    <div className={['rounded-xl border border-zinc-800 bg-zinc-900', className].filter(Boolean).join(' ')}>
      {!hideHeader && (
        <div className={`flex items-center ${showTitle ? 'justify-between' : 'justify-end'} gap-3 border-b border-zinc-700 px-3 py-2`}>
          {showTitle && (
            <div className="text-xs font-medium text-zinc-300">{displayTitle}</div>
          )}
          <button
            type="button"
            onClick={onCopy}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700"
          >
            {copyLabel}
          </button>
        </div>
      )}
      <pre
        style={{ maxHeight: maxHeight }}
        className={['overflow-auto p-3 text-xs leading-relaxed', !maxHeight && 'max-h-[420px]', codeClassName ?? 'text-zinc-100'].filter(Boolean).join(' ')}
      >
        <code className={`whitespace-pre language-${language || 'text'}`}>{code}</code>
      </pre>
    </div>
  )
}


