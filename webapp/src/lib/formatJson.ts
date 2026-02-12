type Json = null | boolean | number | string | Json[] | { [k: string]: Json }

function truncateArray(arr: Json[], maxItems: number): Json[] {
  if (arr.length <= maxItems) return arr
  return [...arr.slice(0, maxItems), `… (${arr.length - maxItems} more items)`]
}

function deepTruncate(value: Json, opts: { maxArrayItems: number; maxStringLen: number }): Json {
  if (Array.isArray(value)) {
    const truncated = truncateArray(value, opts.maxArrayItems).map((v) => deepTruncate(v as Json, opts))
    return truncated
  }
  if (value && typeof value === 'object') {
    const out: Record<string, Json> = {}
    for (const [k, v] of Object.entries(value)) out[k] = deepTruncate(v as Json, opts)
    return out
  }
  if (typeof value === 'string' && value.length > opts.maxStringLen) {
    return `${value.slice(0, opts.maxStringLen)}… (${value.length - opts.maxStringLen} more chars)`
  }
  return value
}

export function formatJsonForDisplay(text: string, opts?: { maxArrayItems?: number; maxStringLen?: number }): string {
  try {
    const parsed = JSON.parse(text) as Json
    const truncated = deepTruncate(parsed, {
      maxArrayItems: opts?.maxArrayItems ?? 16,
      maxStringLen: opts?.maxStringLen ?? 2000,
    })
    return JSON.stringify(truncated, null, 2)
  } catch {
    return text
  }
}



