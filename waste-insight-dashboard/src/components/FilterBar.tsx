import { useRef, useState, useEffect } from 'react'
import { MONTH_NAMES } from '../hooks/useFilters'
import type { Selection } from '../hooks/useFilters'

// ─── Generic multi-select ─────────────────────────────────────
interface MultiSelectProps<T extends string | number> {
  label:     string
  options:   T[]
  selected:  T[]
  onChange:  (v: T[]) => void
  fmt?:      (v: T) => string
}
function MultiSelect<T extends string | number>({ label, options, selected, onChange, fmt }: MultiSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const toggle = (v: T) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])
  const lbl = selected.length === 0 ? `${label}: All`
    : `${label}: ${selected.map(v => fmt ? fmt(v) : String(v)).join(', ')}`
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md bg-white hover:border-blue-500 text-gray-700 whitespace-nowrap ${selected.length ? 'border-blue-500 text-blue-600 font-medium' : 'border-gray-300'}`}>
        {lbl}
        <svg className="w-3 h-3 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 min-w-full bg-white border border-gray-200 rounded-md shadow-lg py-1 max-h-56 overflow-auto">
          <div className="flex gap-2 px-3 py-1 border-b border-gray-100">
            <button onClick={() => onChange(options.slice())} className="text-xs text-blue-600 hover:underline">All</button>
            <span className="text-gray-300">|</span>
            <button onClick={() => onChange([])} className="text-xs text-gray-500 hover:underline">Clear</button>
          </div>
          {options.map(opt => (
            <label key={String(opt)} className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 text-sm text-gray-700">
              <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} className="accent-blue-600"/>
              {fmt ? fmt(opt) : String(opt)}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Filter chip ──────────────────────────────────────────────
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-blue-900 leading-none">×</button>
    </span>
  )
}

// ─── FilterBar ────────────────────────────────────────────────
interface Props {
  availableYears:  number[]
  availableMonths: number[]
  availableDepts:  string[]
  sel:             Selection
  setYears:        (v: number[]) => void
  setMonths:       (v: number[]) => void
  setDepts:        (v: string[]) => void
  toggleMonth:     (v: number, s: boolean) => void
  toggleDept:      (v: string, s: boolean) => void
  clearDim:        () => void
  onRefresh?:      () => void
}

export function FilterBar({
  availableYears, availableMonths, availableDepts,
  sel, setYears, setMonths, setDepts, clearDim, onRefresh,
}: Props) {
  // active chips
  const chips: { label: string; remove: () => void }[] = [
    ...sel.causes.map(c => ({ label: `Cause: ${c}`, remove: () => clearDim() })),
    ...sel.machines.map(m => ({ label: `Machine: ${m}`, remove: () => clearDim() })),
    ...sel.jobs.map(j => ({ label: `JO: ${j}`, remove: () => clearDim() })),
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">Filter</span>
        <MultiSelect<number> label="Year"  options={availableYears}  selected={sel.years}  onChange={setYears} />
        <MultiSelect<number> label="Month" options={availableMonths} selected={sel.months} onChange={setMonths}
          fmt={v => MONTH_NAMES[v - 1]} />
        <MultiSelect<string> label="Dept"  options={availableDepts}  selected={sel.depts}  onChange={setDepts} />
        {onRefresh && (
          <button onClick={onRefresh}
            className="ml-auto flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </button>
        )}
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c, i) => <Chip key={i} label={c.label} onRemove={c.remove}/>)}
          <button onClick={clearDim} className="text-xs text-gray-400 hover:text-gray-600 ml-1">Clear chart filters</button>
        </div>
      )}
    </div>
  )
}
