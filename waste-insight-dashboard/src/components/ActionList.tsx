import { useMemo, useState } from 'react'
import type { WasteRow } from '../types'

function fmtK(v: number) {
  if (v >= 1_000_000) return `${(v/1_000_000).toFixed(2)}M`
  if (v >= 1_000)     return `${(v/1_000).toFixed(1)}k`
  return v.toLocaleString()
}
function fmtFull(v: number) { return v.toLocaleString(undefined, { maximumFractionDigits: 0 }) }
function fmtDate(s: string | null) {
  if (!s) return '—'
  const p = s.split('-')
  return p.length >= 2 ? `${p[0]}-${p[1]}` : s
}

interface JobSummary {
  jo: string; comp: string; problem: string; machine: string
  dept: string; date: string | null; value: number
}

interface Props {
  rows:         WasteRow[]     // DETAIL rows (filtered)
  actionedJos:  Set<string>
  onToggle:     (jo: string) => void
  loading:      boolean
  onRefetch:    () => void
}

export function ActionList({ rows, actionedJos, onToggle, loading, onRefetch }: Props) {
  const [showActioned, setShowActioned] = useState(false)

  // Group by JO, only Value >= 5,000
  const jobs = useMemo((): JobSummary[] => {
    const m = new Map<string, JobSummary>()
    rows.forEach(r => {
      if (!r.JO || (r.Value ?? 0) < 5000) return
      if (!m.has(r.JO)) {
        m.set(r.JO, { jo: r.JO, comp: r.Component || r.Code || '',
          problem: r.Problem || '', machine: r.Machine || '',
          dept: r.Dept || '', date: r.Date, value: 0 })
      }
      m.get(r.JO)!.value += r.Value ?? 0
    })
    return Array.from(m.values()).sort((a,b) => b.value - a.value)
  }, [rows])

  const pending   = jobs.filter(j => !actionedJos.has(j.jo))
  const actioned  = jobs.filter(j => actionedJos.has(j.jo))

  if (jobs.length === 0) return null

  return (
    <div className="card p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div>
          <h3 className="card-title">Weekly Action List</h3>
          <p className="text-xs text-slate-400 mt-0.5">Jobs ≥ 5,000 THB · กดเพื่อ mark ว่าเสนอแล้ว</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {loading && <span className="text-xs text-slate-400 animate-pulse">syncing…</span>}
          <button onClick={onRefetch}
            className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1.5">
            ⟳ Sync
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-3 mb-4 text-xs">
        <span className="flex items-center gap-1.5 bg-red-50 text-red-700 px-2.5 py-1 rounded-full border border-red-100">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"/>
          ต้องเสนอ: <strong>{pending.length}</strong>
        </span>
        <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"/>
          เสนอแล้ว: <strong>{actioned.length}</strong>
        </span>
        <span className="ml-auto text-slate-400">
          รวม: {fmtK(jobs.reduce((s,j)=>s+j.value,0))} THB
        </span>
      </div>

      {/* Pending jobs */}
      {pending.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">
            🔴 ต้องเสนอในที่ประชุม ({pending.length})
          </p>
          <div className="space-y-1.5">
            {pending.map(j => (
              <div key={j.jo}
                className="flex items-center gap-3 p-2.5 bg-red-50/60 rounded-lg border border-red-100 hover:bg-red-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-slate-700">{j.jo}</span>
                    <span className="text-xs text-slate-600 truncate max-w-[160px]" title={j.comp}>{j.comp}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded">{j.dept}</span>
                    {j.problem && <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-100 px-1.5 rounded">{j.problem}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400">{j.machine}</span>
                    <span className="text-[10px] text-slate-400">·</span>
                    <span className="text-[10px] text-slate-400">{fmtDate(j.date)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold text-red-600" title={fmtFull(j.value)}>{fmtK(j.value)}</span>
                  <button
                    onClick={() => onToggle(j.jo)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors">
                    ✓ Actioned
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actioned jobs (collapsible) */}
      {actioned.length > 0 && (
        <div>
          <button
            onClick={() => setShowActioned(s => !s)}
            className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2 hover:text-emerald-800">
            <span>✅ เสนอแล้ว ({actioned.length})</span>
            <span className="text-slate-400">{showActioned ? '▲' : '▼'}</span>
          </button>
          {showActioned && (
            <div className="space-y-1.5">
              {actioned.map(j => (
                <div key={j.jo}
                  className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100 opacity-60 hover:opacity-80 transition-opacity">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-slate-500 line-through">{j.jo}</span>
                      <span className="text-xs text-slate-400 truncate max-w-[160px]">{j.comp}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 rounded">{j.dept}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-medium text-slate-400">{fmtK(j.value)}</span>
                    <button
                      onClick={() => onToggle(j.jo)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                      ↩ Undo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
