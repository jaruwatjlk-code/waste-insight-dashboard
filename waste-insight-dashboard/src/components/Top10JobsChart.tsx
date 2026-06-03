import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
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

type SortDir = 'asc' | 'desc'

interface JobRow {
  jo: string; comp: string; problem: string; joRef: string
  machine: string; date: string | null; value: number
}

interface Props {
  rows:         WasteRow[]
  chartJobs:    string[]
  onClickJob:   (jo: string, shift: boolean) => void
}

export function Top10JobsChart({ rows, chartJobs, onClickJob }: Props) {
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [tooltip, setTooltip] = useState<{ job: JobRow; x: number; y: number } | null>(null)

  const top10: JobRow[] = useMemo(() => {
    const m = new Map<string, JobRow>()
    rows.forEach(r => {
      if (!r.JO) return
      if (!m.has(r.JO)) {
        m.set(r.JO, { jo: r.JO, comp: r.Component || r.Code || '', problem: r.Problem || '',
          joRef: r.JORef || '', machine: r.Machine || '', date: r.Date, value: 0 })
      }
      m.get(r.JO)!.value += r.Value ?? 0
    })
    return Array.from(m.values()).sort((a,b) => b.value - a.value).slice(0, 10)
  }, [rows])

  const sorted = useMemo(() => {
    return sortDir === 'desc' ? [...top10] : [...top10].reverse()
  }, [top10, sortDir])

  const totalValue = sorted.reduce((s,r) => s + r.value, 0)
  const hasChartSel = chartJobs.length > 0

  if (!top10.length) return (
    <div className="card p-4 min-h-[200px] flex items-center justify-center text-slate-400 text-sm">No data</div>
  )

  const barData = [...top10].reverse()

  return (
    <div className="card p-4 min-h-[300px]" onMouseLeave={() => setTooltip(null)}>
      <h3 className="card-title mb-4">Top 10 Jobs — by Value</h3>
      <div className="flex gap-4">

        {/* Bar chart */}
        <div className="w-48 shrink-0">
          <ResponsiveContainer width="100%" height={top10.length * 30 + 24}>
            <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 4 }}
              onClick={(d,e) => {
                if (d?.activeLabel) onClickJob(String(d.activeLabel), (e as unknown as React.MouseEvent).shiftKey ?? false)
              }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9"/>
              <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="jo" tick={{ fontSize: 9, fill: '#64748b' }} width={50} cursor="pointer" axisLine={false} tickLine={false}/>
              <Tooltip formatter={(v: number) => [fmtFull(v), 'Value']} contentStyle={{ fontSize: 11, borderRadius: 8 }}/>
              <Bar dataKey="value" maxBarSize={16} cursor="pointer">
                {barData.map((e,i) => {
                  const dim = hasChartSel && !chartJobs.includes(e.jo)
                  return <Cell key={i} fill="#2563eb" opacity={dim ? 0.15 : 0.75}/>
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Simplified table: Date | JO | Comp | Value — tooltip for details */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="text-left py-1.5 w-5">#</th>
                <th className="text-left py-1.5">Date</th>
                <th className="text-left py-1.5">JO</th>
                <th className="text-left py-1.5">Comp</th>
                <th className="text-right py-1.5 cursor-pointer hover:text-blue-600 select-none"
                  onClick={() => setSortDir(d => d==='desc'?'asc':'desc')}>
                  Value {sortDir==='desc'?'↓':'↑'}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r,i) => {
                const dim = hasChartSel && !chartJobs.includes(r.jo)
                return (
                  <tr key={r.jo}
                    className={`border-b border-slate-50 cursor-pointer transition-opacity ${dim ? 'opacity-25' : 'hover:bg-slate-50'}`}
                    onClick={e => onClickJob(r.jo, e.shiftKey)}
                    onMouseEnter={ev => {
                      const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect()
                      setTooltip({ job: r, x: rect.right, y: rect.top })
                    }}
                  >
                    <td className="py-1.5 text-slate-400">{i+1}</td>
                    <td className="py-1.5 text-slate-600 whitespace-nowrap">{fmtDate(r.date)}</td>
                    <td className="py-1.5 font-mono text-slate-600">{r.jo}</td>
                    <td className="py-1.5 text-slate-700 max-w-[120px] truncate" title={r.comp}>{r.comp}</td>
                    <td className="py-1.5 text-right font-mono text-slate-700">
                      <span title={fmtFull(r.value)}>{fmtK(r.value)}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 font-semibold text-slate-700">
                <td colSpan={4} className="pt-2 text-slate-500">Total (top 10)</td>
                <td className="pt-2 text-right font-mono">
                  <span title={fmtFull(totalValue)}>{fmtK(totalValue)}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Row detail tooltip */}
      {tooltip && (
        <div className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs pointer-events-none max-w-[240px]"
          style={{ top: Math.min(tooltip.y, window.innerHeight-200), left: Math.min(tooltip.x+8, window.innerWidth-256) }}>
          <div className="font-semibold text-slate-800 mb-1.5">{tooltip.job.jo}</div>
          <div className="space-y-1 text-slate-600">
            <div><span className="text-slate-400">Comp:</span> {tooltip.job.comp}</div>
            <div><span className="text-slate-400">Problem:</span> {tooltip.job.problem || '—'}</div>
            <div><span className="text-slate-400">JO Ref:</span> {tooltip.job.joRef || '—'}</div>
            <div><span className="text-slate-400">Machine:</span> {tooltip.job.machine}</div>
            <div><span className="text-slate-400">Value:</span> <strong>{fmtFull(tooltip.job.value)}</strong></div>
          </div>
        </div>
      )}
    </div>
  )
}
