import { useState, useRef, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Logo } from '../components/common/Logo'
import { hasJwtToken } from '../lib/tokenStorage'
import { endpoints } from '../config/endpoints'

interface ProductResult {
  product_id: string
  score: number
  product_data: Record<string, any>
}

interface SearchResponse {
  query: string
  results: ProductResult[]
  num_results: number
  search_latency_ms: number
  server_latency_embed_ms: number
  server_latency_embed_and_index_lookup_ms: number
}

interface ComparisonResult {
  success: boolean
  data?: SearchResponse
  error?: string
  clientLatency?: number
}

export function EmbedComparisonPage() {
  const [searchParams] = useSearchParams()
  const debugMode = searchParams.get('debug') === 'true'

  const [inputText, setInputText] = useState('running shoes')
  const [numResults, setNumResults] = useState<string | number>(50)
  const [loading, setLoading] = useState(false)
  const [loadingCoral, setLoadingCoral] = useState(false)
  const [loadingOpenai, setLoadingOpenai] = useState(false)
  const [coralbricksResult, setCoralbricksResult] = useState<ComparisonResult | null>(null)
  const [openaiResult, setOpenaiResult] = useState<ComparisonResult | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsLoggedIn(hasJwtToken())
  }, [])

  const callCoralSearchAPI = async (query: string, k: number): Promise<ComparisonResult> => {
    const startTime = performance.now()
    try {
      const response = await fetch(endpoints.search.coral(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          k,
        }),
      })

      const responseReceivedTime = performance.now()
      const data = await response.json()
      const clientLatency = Math.round(responseReceivedTime - startTime)

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.detail || `HTTP ${response.status}`,
          clientLatency,
        }
      }

      return {
        success: true,
        data: data.data as SearchResponse,
        clientLatency,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        clientLatency: Math.round(performance.now() - startTime),
      }
    }
  }

  const callOpenAISearchAPI = async (query: string, k: number): Promise<ComparisonResult> => {
    const startTime = performance.now()
    try {
      const response = await fetch(endpoints.search.openai(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          k,
        }),
      })

      const responseReceivedTime = performance.now()
      const data = await response.json()
      const clientLatency = Math.round(responseReceivedTime - startTime)

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.detail || `HTTP ${response.status}`,
          clientLatency,
        }
      }

      return {
        success: true,
        data: data.data as SearchResponse,
        clientLatency,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        clientLatency: Math.round(performance.now() - startTime),
      }
    }
  }

  const handleCompare = async () => {
    if (!inputText.trim()) {
      return
    }

    setLoading(true)
    setLoadingCoral(true)
    setLoadingOpenai(true)
    setCoralbricksResult(null)
    setOpenaiResult(null)

    // Validate k value
    let k = typeof numResults === 'string' ? parseInt(numResults, 10) : numResults
    if (isNaN(k) || k < 1) k = 50
    if (k > 100) k = 100

    // Call both APIs in parallel - each updates independently when it completes
    callCoralSearchAPI(inputText, k).then((result) => {
      setCoralbricksResult(result)
      setLoadingCoral(false)
    }).catch((error) => {
      console.error('Coral search error:', error)
      setLoadingCoral(false)
    })

    callOpenAISearchAPI(inputText, k).then((result) => {
      setOpenaiResult(result)
      setLoadingOpenai(false)
    }).catch((error) => {
      console.error('OpenAI search error:', error)
      setLoadingOpenai(false)
    }).finally(() => {
      setLoading(false)
    })
  }

  // Scroll to results when first result arrives
  useEffect(() => {
    if ((coralbricksResult || openaiResult) && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [coralbricksResult, openaiResult])

  const getEmbedLatency = (result: ComparisonResult | null): number => {
    if (!result?.success || !result.data) return 0;
    return result.data.server_latency_embed_ms || 0;
  };

  const InfoIcon = ({ isCoral = false, tooltipType = 'latency' }: { isCoral?: boolean; tooltipType?: 'latency' | 'quality' | 'methodology' }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    
    const getTooltipContent = () => {
      if (tooltipType === 'quality') {
        return {
          title: 'How to compare the results',
          content: (
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Are matches driven by meaning rather than shared words?</li>
              <li>Do results reflect multiple valid interpretations of the query?</li>
              <li>Are top results plausibly correct for the query?</li>
            </ul>
          )
        };
      }
      if (tooltipType === 'methodology') {
        return {
          title: '',
          content: (
            <div className="space-y-2">
              <p>The demo consists of an embedding service and a vector index lookup service running in AWS us-east on a 100K-product catalog.</p>
              <p>Measurements were collected under identical conditions for both systems.</p>
            </div>
          )
        };
      }
      return {
        title: 'Why is Coral Bricks faster?',
        content: (
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>Commerce-specific retrieval models (no generic LLM overhead)</li>
            <li>Optimized batching & queuing for GPU inference</li>
            <li>In-region embedding + search</li>
          </ul>
        )
      };
    };

    const tooltipData = getTooltipContent();
    
    return (
      <div className="relative inline-block">
        <button
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </button>
        {showTooltip && (
          <div className={`absolute z-10 w-64 p-3 text-xs text-white rounded-lg shadow-lg ${isCoral ? 'bg-[#c23d3d]' : 'bg-zinc-800'} bottom-full left-1/2 transform -translate-x-1/2 mb-2`}>
            {tooltipData.title && <div className="font-semibold mb-1">{tooltipData.title}</div>}
            {tooltipData.content}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className={`w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${isCoral ? 'border-t-[#c23d3d]' : 'border-t-zinc-800'}`}></div>
            </div>
          </div>
        )}
      </div>
    );
  };

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
              {!isLoggedIn && (
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Embed API comparison</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Side-by-side embedding comparison: latency and retrieval quality on a shared 100K-product catalog.
          </p>
        </div>

        {/* Input Section - More compact and inline */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Search Query
              </label>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter search query..."
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading && inputText.trim()) {
                    handleCompare()
                  }
                }}
              />
            </div>

            <div className="w-32">
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Results (k)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={numResults}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '') {
                    setNumResults('')
                    return
                  }
                  const value = parseInt(val, 10)
                  if (!isNaN(value)) {
                    setNumResults(value)
                  }
                }}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d]"
              />
            </div>

            <button
              onClick={handleCompare}
              disabled={loading || !inputText.trim()}
              className="px-6 py-2 bg-[#c23d3d] text-white rounded-lg text-sm font-medium hover:bg-[#a83232] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Compare
                </>
              )}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-zinc-500 mr-1">Try example:</span>
            {[
              "find best running shoes for women",
              "funny sarcastic graphic tee for gifting",
              "men's black dress shirt for date night"
            ].map((query) => (
              <button
                key={query}
                onClick={() => setInputText(query)}
                className="text-xs px-2.5 py-1.5 rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 transition-colors border border-zinc-200"
              >
                {query}
              </button>
            ))}
          </div>

          <p className="text-xs text-zinc-500 mt-3 border-t border-zinc-100 pt-2">
            For broad queries, try k=50+ to see more interpretations.
          </p>
        </div>

        {/* Demo Methodology Label */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-zinc-700 font-medium">Demo methodology</span>
          <InfoIcon tooltipType="methodology" isCoral={false} />
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-zinc-50 to-white rounded-xl border border-zinc-200 p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Try this on your own catalog</h2>
            <p className="text-sm text-zinc-600 mt-1">Upload products and queries. See relevance and latency instantly.</p>
          </div>
          <Link
            to="/register"
            className="px-6 py-3 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors whitespace-nowrap shadow-sm"
          >
            Try the API
          </Link>
        </div>

        {/* Results Section */}
        {(loading || coralbricksResult || openaiResult) && (
          <div ref={resultsRef} className="space-y-8">
            {/* Loading States */}
            {(loadingCoral || loadingOpenai) && (
              <div className="flex items-center justify-center gap-8 py-12">
                {loadingCoral && (
                  <div className="flex flex-col items-center">
                    <svg className="animate-spin h-8 w-8 text-[#c23d3d] mb-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm text-zinc-600">Searching with CoralBricks...</p>
                  </div>
                )}
                {loadingOpenai && (
                  <div className="flex flex-col items-center">
                    <svg className="animate-spin h-8 w-8 text-zinc-700 mb-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm text-zinc-600">Searching with OpenAI...</p>
                  </div>
                )}
              </div>
            )}

            {/* Error States */}
            {coralbricksResult && !coralbricksResult.success && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 border border-red-200">
                <span className="font-medium">CoralBricks Error:</span> {coralbricksResult?.error || 'Unknown error'}
              </div>
            )}
            {openaiResult && !openaiResult.success && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 border border-red-200">
                <span className="font-medium">OpenAI Error:</span> {openaiResult?.error || 'Unknown error'}
              </div>
            )}

            {/* Embed Query Request Latency Section */}
            {(coralbricksResult?.success || openaiResult?.success) && (
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
                <h2 className="text-xl font-bold text-zinc-900 mb-2">Embed Query Request Latency</h2>
                <p className="text-sm text-zinc-600 mb-6">
                  Low embedding latency allows semantic search to be used in real-time experiences like typeahead.
                </p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* CoralBricks Latency */}
                  <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900">Embed Latency</span>
                        <InfoIcon tooltipType="latency" isCoral={true} />
                      </div>
                      <span className="text-2xl font-bold text-zinc-900">
                        {coralbricksResult?.success && coralbricksResult.data
                          ? `${getEmbedLatency(coralbricksResult).toFixed(0)}ms`
                          : '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-2 w-2 rounded-full bg-[#c23d3d]"></div>
                      <span className="text-xs text-zinc-600">CoralBricks Embedding</span>
                    </div>
                  </div>

                  {/* OpenAI Latency */}
                  <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900">Embed Latency</span>
                        <InfoIcon tooltipType="latency" isCoral={false} />
                      </div>
                      <span className="text-2xl font-bold text-zinc-900">
                        {openaiResult?.success && openaiResult.data
                          ? `${getEmbedLatency(openaiResult).toFixed(0)}ms`
                          : '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-2 w-2 rounded-full bg-zinc-700"></div>
                      <span className="text-xs text-zinc-600">OpenAI Embedding(text-embedding-3-large)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Embedding Quality Section */}
            {(coralbricksResult?.success || openaiResult?.success) && (
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-bold text-zinc-900">Embedding Quality</h2>
                  <InfoIcon tooltipType="quality" isCoral={false} />
                </div>
                <p className="text-sm text-zinc-600 mb-6">
                  Higher embedding recall reduces zero-result queries by ensuring valid matches are retrieved before ranking.
                </p>
              </div>
            )}

            {/* Top Retrieved Product Titles Section */}
            {(coralbricksResult?.success || openaiResult?.success) && (
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
                <h3 className="text-sm font-medium text-zinc-500 mb-4">Top retrieved product titles</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* CoralBricks Results */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-2 w-2 rounded-full bg-[#c23d3d]"></div>
                      <span className="text-xs font-medium text-zinc-700">CoralBricks Embedding</span>
                    </div>
                    {coralbricksResult?.success && coralbricksResult.data?.results && coralbricksResult.data.results.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {coralbricksResult.data.results.map((result, idx) => (
                          <div key={idx} className="bg-zinc-50 rounded-lg p-3 border border-zinc-200 hover:border-zinc-300 transition-colors">
                            <div className="font-medium text-zinc-900 text-sm">
                              {result.product_data?.cleaned_title || 'Untitled Product'}
                            </div>
                            {debugMode && (
                              <details className="mt-2">
                                <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-700 select-none">
                                  View details
                                </summary>
                                <div className="mt-2 pt-2 border-t border-zinc-200 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-zinc-500">Product ID</span>
                                    <span className="text-xs font-mono text-zinc-600 truncate max-w-[150px]" title={result.product_id}>
                                      {result.product_id}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-zinc-500">Similarity Score</span>
                                    <span className="text-xs font-medium text-zinc-700">
                                      {result.score.toFixed(4)}
                                    </span>
                                  </div>
                                </div>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500">No results available</p>
                    )}
                  </div>

                  {/* OpenAI Results */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-2 w-2 rounded-full bg-zinc-700"></div>
                      <span className="text-xs font-medium text-zinc-700">OpenAI Embedding(text-embedding-3-large)</span>
                    </div>
                    {openaiResult?.success && openaiResult.data?.results && openaiResult.data.results.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {openaiResult.data.results.map((result, idx) => (
                          <div key={idx} className="bg-zinc-50 rounded-lg p-3 border border-zinc-200 hover:border-zinc-300 transition-colors">
                            <div className="font-medium text-zinc-900 text-sm">
                              {result.product_data?.cleaned_title || 'Untitled Product'}
                            </div>
                            {debugMode && (
                              <details className="mt-2">
                                <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-700 select-none">
                                  View details
                                </summary>
                                <div className="mt-2 pt-2 border-t border-zinc-200 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-zinc-500">Product ID</span>
                                    <span className="text-xs font-mono text-zinc-600 truncate max-w-[150px]" title={result.product_id}>
                                      {result.product_id}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-zinc-500">Similarity Score</span>
                                    <span className="text-xs font-medium text-zinc-700">
                                      {result.score.toFixed(4)}
                                    </span>
                                  </div>
                                </div>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500">No results available</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


