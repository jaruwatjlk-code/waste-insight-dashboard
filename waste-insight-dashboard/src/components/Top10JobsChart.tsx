import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { WasteRow } from '../types'

function fmtK(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString()
}
function fmtFull(v: number) { return v.toLocaleString(undefined, { maximumFractionDigits: 0 }) }
function fmtDate(s: string | null) {
  if (!s) return '—'
  // already "dd-mmm-yyyy" → show "dd-mmm"
  const parts = s.split('-')
  return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : s
}

type SortKey = 'value' | 'date'
type SortDir  = 'asc' | 'desc'

interface Props {
  rows:        WasteRow[]
  selectedJobs: string[]
  onClickJob:  (jo: string, shift: boolean) => void
}

export function Top10JobsChart({ rows, selectedJobs, onClickJob }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('value')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // group by JO
  const jobMap = useMemo(() => {
    const m = new Map<string, { jo: string; comp: string; problem: string; joRef: string; machine: string; date: string | null; value: number }>()
    rows.forEach(r => {
      if (!r.JO) return
      if (!m.has(r.JO)) {
        m.set(r.JO, { jo: r.JO, comp: r.Component || r.Code || '', problem: r.Problem || '', joRef: r.JORef || '', machine: r.Machine || '', date: r.Date, value: 0 })
      }
      m.get(r.JO)!.value += r.Value ?? 0
    })
    return Array.from(m.values())
  }, [rows])

  const top10 = useMemo(() => [...jobMap].sort((a, b) => b.value - a.value).slice(0, 10), [jobMap])

  const tableSorted = useMemo(() => {
    const arr = [...top10]
    arr.sort((a, b) => {
      let diff = sortKey === 'value' ? a.value - b.value : (a.date ?? '').localeCompare(b.date ?? '')
      return sortDir === 'desc' ? -diff : diff
    })
    return arr
  }, [top10, sortKey, sortDir])

  const totalValue = tableSorted.reduce((s, r) => s + r.value, 0)
  const hasSelection = selectedJobs.length > 0

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(k); setSortDir('desc') }
  }
  const thCls = (k: SortKey) => `text-right py-1 cursor-pointer select-none hover:text-blue-600 ${sortKey === k ? 'text-blue-600' : ''}`

  if (!top10.length) return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Top 10 Jobs — by Value</h3>
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No data</div>
    </div>
  )

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Top 10 Jobs — by Value</h3>
      <div className="flex gap-4">
        {/* Horizontal bar chart */}
        <div className="w-56 shrink-0">
          <ResponsiveContainer width="100%" height={top10.length * 28 + 20}>
            <BarChart data={[...top10].reverse()} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 4 }}
              onClick={(d, e) => {
                if (d?.activeLabel) onClickJob(String(d.activeLabel), (e as unknown as React.MouseEvent).shiftKey ?? false)
              }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0"/>
              <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 9, fill: '#57606a' }}/>
              <YAxis type="category" dataKey="jo" tick={{ fontSize: 9, fill: '#57606a' }} width={52} cursor="pointer"/>
              <Tooltip formatter={(v: number) => [fmtFull(v), 'Value']} contentStyle={{ fontSize: 12 }}/>
              <Bar dataKey="value" maxBarSize={16} cursor="pointer">
                {[...top10].reverse().map((e, i) => {
                  const dimmed = hasSelection && !selectedJobs.includes(e.jo)
                  return <Cell key={i} fill="#1f6feb" opacity={dimmed ? 0.2 : 0.75}/>
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Side table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500">
                <th className="text-left py-1 w-5">#</th>
                <th className="text-left py-1 cursor-pointer hover:text-blue-600" onClick={() => toggleSort('date')}>
                  Date {sortKey==='date' ? (sortDir==='desc'?'↓':'↑') : ''}
                </th>
                <th className="text-left py-1">JO</th>
                <th className="text-left py-1">Comp</th>
                <th className="text-left py-1">Problem</th>
                <th className="text-left py-1">JO Ref</th>
                <th className="text-left py-1">Machine</th>
                <th className={thCls('value')} onClick={() => toggleSort('value')}>
                  Value {sortKey==='value' ? (sortDir==='desc'?'↓':'↑') : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {tableSorted.map((r, i) => {
                const dimmed = hasSelection && !selectedJobs.includes(r.jo)
                return (
                  <tr key={r.jo} onClick={e => onClickJob(r.jo, e.shiftKey)}
                    className={`border-b border-gray-50 cursor-pointer transition-opacity ${dimmed ? 'opacity-30' : 'hover:bg-gray-50'}`}>
                    <td className="py-1 text-gray-400">{i + 1}</td>
                    <td className="py-1 text-gray-600 whitespace-nowrap">{fmtDate(r.date)}</td>
                    <td className="py-1 font-mono text-gray-600">{r.jo}</td>
                    <td className="py-1 text-gray-700 max-w-[100px] truncate" title={r.comp}>{r.comp}</td>
                    <td className="py-1 text-gray-600 max-w-[100px] truncate" title={r.problem}>{r.problem || '—'}</td>
                    <td className="py-1 text-gray-500">{r.joRef || '—'}</td>
                    <td className="py-1 text-gray-600">{r.machine}</td>
                    <td className="py-1 text-right font-mono text-gray-700">
                      <span title={fmtFull(r.value)}>{fmtK(r.value)}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 font-semibold text-gray-700 text-xs">
                <td colSpan={7} className="pt-1.5">Total (top 10)</td>
                <td className="pt-1.5 text-right font-mono">
                  <span title={fmtFull(totalValue)}>{fmtK(totalValue)}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
