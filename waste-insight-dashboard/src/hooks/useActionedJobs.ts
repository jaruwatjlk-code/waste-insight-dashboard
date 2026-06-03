import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL as string

export interface ActionedJob {
  jo:         string
  actionedAt: string
  actionedBy: string
}

export interface UseActionedJobsResult {
  actionedJos: Set<string>
  loading:     boolean
  toggle:      (jo: string) => void
  toggleMany:  (jos: string[]) => void
  refetch:     () => void
}

// Cache-bust: เพิ่ม ?t=timestamp ป้องกัน browser cache GET response
function bust(url: string) {
  return `${url}&t=${Date.now()}`
}

export function useActionedJobs(): UseActionedJobsResult {
  const [list, setList]       = useState<ActionedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [rev, setRev]         = useState(0)

  useEffect(() => {
    if (!API_URL) { setLoading(false); return }
    setLoading(true)
    fetch(bust(`${API_URL}?sheet=actioned`))
      .then(r => r.json())
      .then(d => { setList(d.data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [rev])

  const toggle = useCallback((jo: string) => {
    // Optimistic update
    setList(l => {
      const has = l.some(x => x.jo === jo)
      return has
        ? l.filter(x => x.jo !== jo)
        : [...l, { jo, actionedAt: new Date().toISOString(), actionedBy: '' }]
    })
    // Write to GAS (cache-bust so browser doesn't replay cached request)
    fetch(bust(`${API_URL}?action=toggle&jo=${encodeURIComponent(jo)}`)).catch(() => {})
    // Delayed sync to confirm GAS committed
    setTimeout(() => setRev(v => v + 1), 8000)
    setTimeout(() => setRev(v => v + 1), 15000)
  }, [])

  // Mark multiple JOs as actioned at once (only adds, not removes)
  const toggleMany = useCallback((jos: string[]) => {
    setList(l => {
      const current = new Set(l.map(x => x.jo))
      const toAdd   = jos.filter(jo => !current.has(jo))
      if (!toAdd.length) return l
      const newItems = toAdd.map(jo => ({ jo, actionedAt: new Date().toISOString(), actionedBy: '' }))
      return [...l, ...newItems]
    })
    // Write each one to GAS sequentially
    jos.forEach((jo, i) => {
      setTimeout(() => {
        fetch(bust(`${API_URL}?action=toggle&jo=${encodeURIComponent(jo)}`)).catch(() => {})
      }, i * 300) // stagger 300ms each to avoid lock contention
    })
    setTimeout(() => setRev(v => v + 1), 8000 + jos.length * 300)
  }, [])

  const refetch = useCallback(() => setRev(v => v + 1), [])

  const actionedJos = new Set(list.map(x => x.jo))
  return { actionedJos, loading, toggle, toggleMany, refetch }
}
