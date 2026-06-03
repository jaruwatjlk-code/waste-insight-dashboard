import { useMemo, useState, useCallback } from 'react'
import type { WasteRow } from '../types'

// ─── Selection state ──────────────────────────────────────────
export interface Selection {
  years:    number[]
  months:   number[]   // 1–12
  depts:    string[]
  causes:   string[]
  machines: string[]
  jobs:     string[]   // JO numbers
}

export interface UseFiltersResult {
  sel:            Selection
  setYears:       (v: number[]) => void
  setMonths:      (v: number[]) => void
  setDepts:       (v: string[]) => void
  // chart click helpers (additive shift, deselect on re-click)
  toggleMonth:    (v: number,  shift: boolean) => void
  toggleDept:     (v: string,  shift: boolean) => void
  toggleCause:    (v: string,  shift: boolean) => void
  toggleMachine:  (v: string,  shift: boolean) => void
  toggleJob:      (v: string,  shift: boolean) => void
  clearDim:       () => void   // clear chart-click selections
  availableYears:  number[]
  availableMonths: number[]
  availableDepts:  string[]
  filterRows:     (rows: WasteRow[]) => WasteRow[]
  isActive:       boolean  // any filter active?
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun',
                     'Jul','Aug','Sep','Oct','Nov','Dec']

function toggle<T>(arr: T[], v: T, shift: boolean): T[] {
  const has = arr.includes(v)
  if (has) return arr.filter(x => x !== v)          // deselect
  if (shift) return [...arr, v]                      // additive
  return [v]                                          // replace
}

export function useFilters(allRows: WasteRow[]): UseFiltersResult {
  const [years,    setYears]    = useState<number[]>([])
  const [months,   setMonths]   = useState<number[]>([])
  const [depts,    setDepts]    = useState<string[]>([])
  const [causes,   setCauses]   = useState<string[]>([])
  const [machines, setMachines] = useState<string[]>([])
  const [jobs,     setJobs]     = useState<string[]>([])

  const toggleMonth   = useCallback((v: number, s: boolean) => setMonths(a => toggle(a, v, s)),   [])
  const toggleDept    = useCallback((v: string, s: boolean) => setDepts(a => toggle(a, v, s)),    [])
  const toggleCause   = useCallback((v: string, s: boolean) => setCauses(a => toggle(a, v, s)),   [])
  const toggleMachine = useCallback((v: string, s: boolean) => setMachines(a => toggle(a, v, s)), [])
  const toggleJob     = useCallback((v: string, s: boolean) => setJobs(a => toggle(a, v, s)),     [])
  const clearDim      = useCallback(() => { setCauses([]); setMachines([]); setJobs([]) }, [])

  const availableYears = useMemo(() => {
    const s = new Set<number>()
    allRows.forEach(r => { if (r.CalendarYear) s.add(r.CalendarYear) })
    return Array.from(s).sort((a, b) => a - b)
  }, [allRows])

  const availableMonths = useMemo(() => {
    const s = new Set<number>()
    allRows.forEach(r => { if (r.MonthNo) s.add(r.MonthNo) })
    return Array.from(s).sort((a, b) => a - b)
  }, [allRows])

  const availableDepts = useMemo(() => {
    const s = new Set<string>()
    allRows.forEach(r => { if (r.Dept) s.add(r.Dept) })
    return Array.from(s).sort()
  }, [allRows])

  const filterRows = useMemo(() => (rows: WasteRow[]) =>
    rows.filter(r => {
      if (years.length    && !years.includes(r.CalendarYear))   return false
      if (months.length   && !months.includes(r.MonthNo))       return false
      if (depts.length    && r.Dept && !depts.includes(r.Dept)) return false
      if (causes.length   && r.Cause && !causes.includes(r.Cause))     return false
      if (machines.length && r.Machine && !machines.includes(r.Machine)) return false
      if (jobs.length     && r.JO && !jobs.includes(r.JO))     return false
      return true
    })
  , [years, months, depts, causes, machines, jobs])

  const isActive = !!(years.length || months.length || depts.length ||
                      causes.length || machines.length || jobs.length)

  const sel: Selection = { years, months, depts, causes, machines, jobs }

  return {
    sel,
    setYears, setMonths, setDepts,
    toggleMonth, toggleDept, toggleCause, toggleMachine, toggleJob,
    clearDim,
    availableYears, availableMonths, availableDepts,
    filterRows,
    isActive,
  }
}

export { MONTH_NAMES }
