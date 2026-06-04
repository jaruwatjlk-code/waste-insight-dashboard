import { useMemo, useState, useCallback } from 'react'
import type { WasteRow } from '../types'

export const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun',
                            'Jul','Aug','Sep','Oct','Nov','Dec']

export interface DropdownSel { years: number[]; month: number | null; depts: string[] }
export interface ChartSel    { months: number[]; depts: string[]; problems: string[]; machines: string[]; jobs: string[] }

export interface UseFiltersResult {
  dd:              DropdownSel
  chartSel:        ChartSel
  setYears:        (v: number[]) => void
  setMonth:        (v: number | null) => void
  setDepts:        (v: string[]) => void
  toggleChartMonth:    (v: number, shift: boolean) => void
  toggleChartDept:     (v: string, shift: boolean) => void
  toggleChartProblem:  (v: string, shift: boolean) => void
  toggleChartMachine:  (v: string, shift: boolean) => void
  toggleChartJob:      (v: string, shift: boolean) => void
  clearChartSel:       () => void
  availableYears:      number[]
  availableMonths:     number[]
  availableDepts:      string[]
  /** Full filter — for KPI / Detail / Pareto */
  filterRows:          (rows: WasteRow[]) => WasteRow[]
  /** Year + dept only — for Monthly chart (shows all months, caller handles dim) */
  filterForMonthly:    (rows: WasteRow[]) => WasteRow[]
  /** Year + month + chartMonths — for Dept chart (filters by month but NOT by dept) */
  filterForDept:       (rows: WasteRow[]) => WasteRow[]
  /** Full filter except chartJobs — for Top10Jobs chart */
  filterForJobs:       (rows: WasteRow[]) => WasteRow[]
  /** Full filter except chartProblems — for Pareto chart */
  filterForProblems:   (rows: WasteRow[]) => WasteRow[]
  hasChartSel:         boolean
}

function toggle<T>(arr: T[], v: T, shift: boolean): T[] {
  const has = arr.includes(v)
  if (has)   return arr.filter(x => x !== v)
  if (shift) return [...arr, v]
  return [v]
}

export function useFilters(allRows: WasteRow[]): UseFiltersResult {
  const [years, setYears] = useState<number[]>([])
  const [month, setMonth] = useState<number | null>(null)
  const [depts, setDepts] = useState<string[]>([])

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
  const clearChartSel      = useCallback(() => { setCMonths([]); setCDepts([]); setCProblems([]); setCMachines([]); setCJobs([]) }, [])

  const availableYears = useMemo(() => {
    const s = new Set<number>(); allRows.forEach(r => { if (r.CalendarYear) s.add(r.CalendarYear) }); return Array.from(s).sort((a,b)=>a-b)
  }, [allRows])
  const availableMonths = useMemo(() => {
    const s = new Set<number>(); allRows.forEach(r => { if (r.MonthNo) s.add(r.MonthNo) }); return Array.from(s).sort((a,b)=>a-b)
  }, [allRows])
  const availableDepts = useMemo(() => {
    const s = new Set<string>(); allRows.forEach(r => { if (r.Dept) s.add(r.Dept) }); return Array.from(s).sort()
  }, [allRows])

  // Full filter — dropdown + all chartSel
  const filterRows = useMemo(() => (rows: WasteRow[]) => rows.filter(r => {
    if (years.length && !years.includes(r.CalendarYear)) return false
    if (month !== null && r.MonthNo && r.MonthNo !== month) return false
    if (depts.length && r.Dept && !depts.includes(r.Dept)) return false
    if (cMonths.length && r.MonthNo && !cMonths.includes(r.MonthNo)) return false
    if (cDepts.length && r.Dept && !cDepts.includes(r.Dept)) return false
    if (cProblems.length && r.Problem && !cProblems.includes(r.Problem)) return false
    if (cMachines.length && r.Machine && !cMachines.includes(r.Machine)) return false
    if (cJobs.length && r.JO && !cJobs.includes(r.JO)) return false
    return true
  }), [years, month, depts, cMonths, cDepts, cProblems, cMachines, cJobs])

  // For Monthly chart: year+dept only (NOT month — chart handles dim itself)
  const filterForMonthly = useMemo(() => (rows: WasteRow[]) => rows.filter(r => {
    if (years.length && !years.includes(r.CalendarYear)) return false
    if (depts.length && r.Dept && !depts.includes(r.Dept)) return false
    if (cDepts.length && r.Dept && !cDepts.includes(r.Dept)) return false
    return true
  }), [years, depts, cDepts])

  // For Dept chart: year+month+cMonths but NOT dept (chart handles dim for dept)
  const filterForDept = useMemo(() => (rows: WasteRow[]) => rows.filter(r => {
    if (years.length && !years.includes(r.CalendarYear)) return false
    if (month !== null && r.MonthNo && r.MonthNo !== month) return false
    if (cMonths.length && r.MonthNo && !cMonths.includes(r.MonthNo)) return false
    // NOT filtering by dept/cDepts — chart handles dim
    if (cProblems.length && r.Problem && !cProblems.includes(r.Problem)) return false
    if (cMachines.length && r.Machine && !cMachines.includes(r.Machine)) return false
    if (cJobs.length && r.JO && !cJobs.includes(r.JO)) return false
    return true
  }), [years, month, cMonths, cProblems, cMachines, cJobs])

  // For Pareto: full filter EXCEPT chartProblems — chart handles dim for problems
  const filterForProblems = useMemo(() => (rows: WasteRow[]) => rows.filter(r => {
    if (years.length && !years.includes(r.CalendarYear)) return false
    if (month !== null && r.MonthNo && r.MonthNo !== month) return false
    if (depts.length && r.Dept && !depts.includes(r.Dept)) return false
    if (cMonths.length && r.MonthNo && !cMonths.includes(r.MonthNo)) return false
    if (cDepts.length && r.Dept && !cDepts.includes(r.Dept)) return false
    if (cMachines.length && r.Machine && !cMachines.includes(r.Machine)) return false
    if (cJobs.length && r.JO && !cJobs.includes(r.JO)) return false
    // NOT filtering by cProblems
    return true
  }), [years, month, depts, cMonths, cDepts, cMachines, cJobs])

  // For Top10Jobs: full filter EXCEPT chartJobs — chart handles dim for jobs
  const filterForJobs = useMemo(() => (rows: WasteRow[]) => rows.filter(r => {
    if (years.length && !years.includes(r.CalendarYear)) return false
    if (month !== null && r.MonthNo && r.MonthNo !== month) return false
    if (depts.length && r.Dept && !depts.includes(r.Dept)) return false
    if (cMonths.length && r.MonthNo && !cMonths.includes(r.MonthNo)) return false
    if (cDepts.length && r.Dept && !cDepts.includes(r.Dept)) return false
    if (cProblems.length && r.Problem && !cProblems.includes(r.Problem)) return false
    if (cMachines.length && r.Machine && !cMachines.includes(r.Machine)) return false
    // NOT filtering by cJobs — chart handles dim
    return true
  }), [years, month, depts, cMonths, cDepts, cProblems, cMachines])

  const hasChartSel = !!(cMonths.length || cDepts.length || cProblems.length || cMachines.length || cJobs.length)

  return {
    dd: { years, month, depts },
    chartSel: { months: cMonths, depts: cDepts, problems: cProblems, machines: cMachines, jobs: cJobs },
    setYears, setMonth, setDepts,
    toggleChartMonth, toggleChartDept, toggleChartProblem, toggleChartMachine, toggleChartJob,
    clearChartSel,
    availableYears, availableMonths, availableDepts,
    filterRows, filterForMonthly, filterForDept, filterForJobs, filterForProblems,
    hasChartSel,
  }
}
