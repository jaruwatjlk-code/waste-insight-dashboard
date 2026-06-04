import { useMemo, useState, useCallback } from 'react'
import type { WasteRow } from '../types'

export const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun',
                            'Jul','Aug','Sep','Oct','Nov','Dec']

// Parse "dd-mmm-yyyy" → "yyyy-mm-dd" for date comparison
const MONTH_N: Record<string,string> = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'}
function wasteToISO(s: string): string {
  const [d,m,y] = s.split('-')
  return `${y}-${MONTH_N[m]??'00'}-${d?.padStart(2,'0')??'00'}`
}

export interface DropdownSel { years: number[]; month: number | null; depts: string[] }
export interface ChartSel    { months: number[]; depts: string[]; problems: string[]; machines: string[]; jobs: string[] }

export interface UseFiltersResult {
  dd:              DropdownSel
  chartSel:        ChartSel
  dateFrom:        string | null   // "yyyy-mm-dd"
  dateTo:          string | null   // "yyyy-mm-dd"
  dateRangeActive: boolean
  setDateFrom:     (v: string | null) => void
  setDateTo:       (v: string | null) => void
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
  const [years, setYears]       = useState<number[]>([])
  const [month, setMonth]       = useState<number | null>(null)
  const [depts, setDepts]       = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo,   setDateTo]   = useState<string | null>(null)

  const dateRangeActive = dateFrom !== null && dateTo !== null && dateFrom <= dateTo

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

  // Date range filter helper
  function applyDateRange(r: WasteRow): boolean {
    if (!dateRangeActive) return true
    if (r.Date) {
      // DETAIL rows: compare exact date
      const iso = wasteToISO(r.Date)
      return iso >= dateFrom! && iso <= dateTo!
    } else {
      // MONTHLY/DEPT rows: include months that overlap with the range
      const yr = r.CalendarYear; const mo = String(r.MonthNo).padStart(2,'0')
      return `${yr}-${mo}-01` <= dateTo! && `${yr}-${mo}-31` >= dateFrom!
    }
  }

  // Full filter — date range overrides everything; else dropdown + all chartSel
  const filterRows = useMemo(() => (rows: WasteRow[]) => rows.filter(r => {
    if (dateRangeActive) return applyDateRange(r)
    if (years.length && !years.includes(r.CalendarYear)) return false
    if (month !== null && r.MonthNo && r.MonthNo !== month) return false
    if (depts.length && r.Dept && !depts.includes(r.Dept)) return false
    if (cMonths.length && r.MonthNo && !cMonths.includes(r.MonthNo)) return false
    if (cDepts.length && r.Dept && !cDepts.includes(r.Dept)) return false
    if (cProblems.length && r.Problem && !cProblems.includes(r.Problem)) return false
    if (cMachines.length && r.Machine && !cMachines.includes(r.Machine)) return false
    if (cJobs.length && r.JO && !cJobs.includes(r.JO)) return false
    return true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [years, month, depts, cMonths, cDepts, cProblems, cMachines, cJobs, dateRangeActive, dateFrom, dateTo])

  // For Monthly chart: year+dept only (NOT month) — or date range
  const filterForMonthly = useMemo(() => (rows: WasteRow[]) => rows.filter(r => {
    if (dateRangeActive) return applyDateRange(r)
    if (years.length && !years.includes(r.CalendarYear)) return false
    if (depts.length && r.Dept && !depts.includes(r.Dept)) return false
    if (cDepts.length && r.Dept && !cDepts.includes(r.Dept)) return false
    return true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [years, depts, cDepts, dateRangeActive, dateFrom, dateTo])

  // For Dept chart: year+month+cMonths but NOT dept — or date range
  const filterForDept = useMemo(() => (rows: WasteRow[]) => rows.filter(r => {
    if (dateRangeActive) return applyDateRange(r)
    if (years.length && !years.includes(r.CalendarYear)) return false
    if (month !== null && r.MonthNo && r.MonthNo !== month) return false
    if (cMonths.length && r.MonthNo && !cMonths.includes(r.MonthNo)) return false
    if (cProblems.length && r.Problem && !cProblems.includes(r.Problem)) return false
    if (cMachines.length && r.Machine && !cMachines.includes(r.Machine)) return false
    if (cJobs.length && r.JO && !cJobs.includes(r.JO)) return false
    return true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [years, month, cMonths, cProblems, cMachines, cJobs, dateRangeActive, dateFrom, dateTo])

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
    dateFrom, dateTo, dateRangeActive,
    setDateFrom, setDateTo,
    setYears, setMonth, setDepts,
    toggleChartMonth, toggleChartDept, toggleChartProblem, toggleChartMachine, toggleChartJob,
    clearChartSel,
    availableYears, availableMonths, availableDepts,
    filterRows, filterForMonthly, filterForDept, filterForJobs, filterForProblems,
    hasChartSel,
  }
}
