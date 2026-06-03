import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchWasteData, invalidateCache } from '../api/gasClient'
import type { ApiResponse, Dataset, RecordType, WasteRow } from '../types'

// ─────────────────────────────────────────────────────────────
// Single record-type fetcher
// ─────────────────────────────────────────────────────────────

interface UseWasteDataResult {
  rows:    WasteRow[]
  loading: boolean
  error:   string | null
  refetch: () => void
}

export function useWasteData(dataset: Dataset, type: RecordType): UseWasteDataResult {
  const [resp, setResp]       = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [rev, setRev]         = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchWasteData(dataset, type)
      .then(r => { if (!cancelled) { setResp(r);  setLoading(false) } })
      .catch(e => { if (!cancelled) { setError(String(e.message ?? e)); setLoading(false) } })

    return () => { cancelled = true }
  }, [dataset, type, rev])

  const refetch = useCallback(() => {
    invalidateCache(dataset, type)
    setRev(v => v + 1)
  }, [dataset, type])

  // Stable reference — new [] only when resp changes, not every render
  const rows = useMemo(() => resp?.data ?? [], [resp])
  return { rows, loading, error, refetch }
}
