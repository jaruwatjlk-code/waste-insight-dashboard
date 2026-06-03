import type { ApiResponse, Dataset, RecordType } from '../types'

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL as string
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// ─────────────────────────────────────────────────────────────
// In-memory cache (browser session)
// ─────────────────────────────────────────────────────────────

interface CacheEntry {
  data:      ApiResponse
  expiresAt: number
}

const memCache = new Map<string, CacheEntry>()

function cacheKey(dataset: Dataset, type?: RecordType): string {
  return `${dataset}_${type ?? 'ALL'}`
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

export async function fetchWasteData(
  dataset: Dataset,
  type?: RecordType,
): Promise<ApiResponse> {
  const key = cacheKey(dataset, type)

  // Return from in-memory cache if still fresh
  const cached = memCache.get(key)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data
  }

  if (!API_URL) {
    throw new Error('VITE_API_URL is not set. Add it to .env or GitHub Secrets.')
  }

  const params = new URLSearchParams({ sheet: dataset })
  if (type) params.set('type', type)

  const res = await fetch(`${API_URL}?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }

  const json = await res.json()

  if ('error' in json) {
    throw new Error(`API ${json.error.code}: ${json.error.message}`)
  }

  const data = json as ApiResponse

  memCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS })
  return data
}

/** Force-invalidate cache so next fetch goes to GAS */
export function invalidateCache(dataset?: Dataset, type?: RecordType): void {
  if (!dataset) {
    memCache.clear()
    return
  }
  memCache.delete(cacheKey(dataset, type))
}
