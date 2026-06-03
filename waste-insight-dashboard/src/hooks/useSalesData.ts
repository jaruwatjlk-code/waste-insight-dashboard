import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL as string

// key: "YYYY-MM" → sales value
export type SalesMap = Map<string, { replan: number; addpaper: number }>

export function useSalesData(): SalesMap {
  const [map, setMap] = useState<SalesMap>(new Map())

  useEffect(() => {
    if (!API_URL) return
    fetch(`${API_URL}?sheet=Sales&t=${Date.now()}`)
      .then(r => r.json())
      .then(d => {
        const m: SalesMap = new Map()
        ;(d.data ?? []).forEach((row: Record<string, unknown>) => {
          const yr  = Number(row['calendaryear'] ?? 0)
          const mo  = Number(row['monthno']      ?? 0)
          if (!yr || !mo) return
          const key = `${yr}-${String(mo).padStart(2,'0')}`
          m.set(key, {
            replan:    Number(row['sales_replan']    ?? 0),
            addpaper:  Number(row['sales_addpaper']  ?? 0),
          })
        })
        setMap(m)
      })
      .catch(() => {})
  }, [])

  return map
}
