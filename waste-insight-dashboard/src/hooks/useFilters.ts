import { useMemo, useState, useCallback } from 'react'
import type { WasteRow } from '../types'

export const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun',
                            'Jul','Aug','Sep','Oct','Nov','Dec']

// ─── Dropdown filters → actual data cut ───────────────────────
export interface DropdownSel {
  years:  number[]   // multi
  month:  number | null  // single (null = all)
  depts:  string[]   // multi
}

// ─── Chart click selections → visual dim only ─────────────────
export interface ChartSel {
  months:   number[]
  depts:    string[]
  problems: string[]
  machines: string[]
  jobs:     string[]
}

export interface UseFiltersResult {
  dd:              DropdownSel
  chartSel:        ChartSel
  setYears:        (v: number[]) => void
  setMonth:        (v: number | null) => void
  setDepts:        (v: string[]) => void
  toggleChartMonth:   (v: number,  shift: boolean) => void
  toggleChartDept:    (v: string,  shift: boolean) => void
  toggleChartProblem: (v: string,  shift: boolean) => void
  toggleChartMachine: (v: string,  shift: boolean) => void
  toggleChartJob:     (v: string,  shift: boolean) => void
  clearChartSel:   () => void
  availableYears:  number[]
  availableMonths: number[]
  availableDepts:  string[]
  filterRows:      (rows: WasteRow[]) => WasteRow[]
}

function toggle<T>(arr: T[], v: T, shift: boolean): T[] {
  const has = arr.includes(v)
  if (has)    return arr.filter(x => x !== v)
  if (shift)  return [...arr, v]
  return [v]
}

export function useFilters(allRows: WasteRow[]): UseFiltersResult {
  const [years,  setYears]  = useState<number[]>([])
  const [month,  setMonth]  = useState<number | null>(null)
  const [depts,  setDepts]  = useState<string[]>([])

  const [cMonths,   setCMonths]   = useState<number[]>([])
  const [cDepts,    setCDepts]    = useState<string[]>([])
  const [cProblems, setCProblems] = useState<string[]>([])
  const [cMachines, setCMachines] = useState<string[]>([])
  const [cJobs,     setCJobs]     = useState<string[]>([])

  const toggleChartMonth   = useCallback((v: number, s: boolean) => setCMonths(a => toggle(a,v,s)),   [])
  const toggleChartDept    = useCallback((v: string, s: boolean) => setCDepts(a => toggle(a,v,s)),    [])
  const toggleChartProblem = useCallback((v: string, s: boolean) => setCProblems(a => toggle(a,v,s)),[])
  const toggleChartMachine = useCallback((v: string, s: boolean) => setCMachines(a => toggle(a,v,s)),[])
  const toggleChartJob     = useCallback((v: string, s: boolean) => setCJobs(a => toggle(a,v,s)),    [])
  const clearChartSel = useCallback(() => {
    setCMonths([]); setCDepts([]); setCProblems([]); setCMachines([]); setCJobs([])
  }, [])

  const availableYears = useMemo(() => {
    const s = new Set<number>()
    allRows.forEach(r => { if (r.CalendarYear) s.add(r.CalendarYear) })
    return Array.from(s).sort((a,b) => a-b)
  }, [allRows])

  const availableMonths = useMemo(() => {
    const s = new Set<number>()
    allRows.forEach(r => { if (r.MonthNo) s.add(r.MonthNo) })
    return Array.from(s).sort((a,b) => a-b)
  }, [allRows])

  const availableDepts = useMemo(() => {
    const s = new Set<string>()
    allRows.forEach(r => { if (r.Dept) s.add(r.Dept) })
    return Array.from(s).sort()
  }, [allRows])

  // Only dropdown sel cuts data
  const filterRows = useMemo(() => (rows: WasteRow[]) =>
    rows.filter(r => {
      if (years.length && !years.includes(r.CalendarYear)) return false
      if (month !== null && r.MonthNo && r.MonthNo !== month) return false
      if (depts.length && r.Dept && !depts.includes(r.Dept)) return false
      return true
    })
  , [years, month, depts])

  const dd: DropdownSel       = { years, month, depts }
  const chartSel: ChartSel    = { months: cMonths, depts: cDepts, problems: cProblems, machines: cMachines, jobs: cJobs }

  return {
    dd, chartSel,
    setYears, setMonth, setDepts,
    toggleChartMonth, toggleChartDept, toggleChartProblem, toggleChartMachine, toggleChartJob,
    clearChartSel,
    availableYears, availableMonths, availableDepts,
    filterRows,
  }
}
