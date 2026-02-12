function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashStringToSeed(s: string): number {
  // simple 32-bit hash (FNV-1a-ish)
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export type MockEmbeddingsResponse = {
  model: string
  object: 'list'
  data: Array<{
    object: 'embedding'
    index: number
    embedding: number[]
  }>
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
  mock: true
}

export async function mockEmbeddings(args: {
  model: string
  input: string[]
  dimensions: number
  latencyMs?: number
}): Promise<MockEmbeddingsResponse> {
  const latencyMs = Math.max(0, args.latencyMs ?? 350)
  if (latencyMs) await new Promise((r) => window.setTimeout(r, latencyMs))

  const dims = Math.max(8, Math.min(2048, Math.floor(args.dimensions || 1024)))

  const data = args.input.map((text, index) => {
    const rng = mulberry32(hashStringToSeed(`${args.model}::${index}::${text}`))
    const embedding = Array.from({ length: dims }, () => {
      // [-1, 1] with 6dp
      const v = rng() * 2 - 1
      return Math.round(v * 1e6) / 1e6
    })
    return { object: 'embedding' as const, index, embedding }
  })

  // very rough token estimate for mock display
  const promptTokens = args.input.reduce((sum, s) => sum + Math.max(1, Math.ceil(s.length / 4)), 0)

  return {
    model: args.model,
    object: 'list',
    data,
    usage: { prompt_tokens: promptTokens, total_tokens: promptTokens },
    mock: true,
  }
}



