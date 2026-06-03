import { useState, useMemo } from 'react'
import type { WasteRow } from '../types'

function fmtK(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString()
}
function fmtFull(v: number) { return v.toLocaleString(undefined, { maximumFractionDigits: 0 }) }

type GroupBy  = 'Cause' | 'Machine'
type MetricBy = 'Value' | 'Count'
type SortDir  = 'asc' | 'desc'

interface Props {
  rows:          WasteRow[]
  groupBy:       GroupBy
  metricBy:      MetricBy
  title:         string
  selectedKeys:  string[]
  onClickKey:    (k: string, shift: boolean) => void
}

export function Top10Table({ rows, groupBy, metricBy, title, selectedKeys, onClickKey }: Props) {
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const agg = useMemo(() => {
    const m = new Map<string, { value: number; count: number }>()
    rows.forEach(r => {
      const k = (r[groupBy] as string) || '(blank)'
      const e = m.get(k) ?? { value: 0, count: 0 }
      m.set(k, { value: e.value + (r.Value ?? 0), count: e.count + 1 })
    })
    return Array.from(m.entries()).map(([k, v]) => ({ key: k, ...v }))
      .sort((a, b) => (metricBy === 'Value' ? b.value - a.value : b.count - a.count))
      .slice(0, 10)
  }, [rows, groupBy, metricBy])

  const sorted = useMemo(() => {
    const arr = [...agg]
    if (sortDir === 'asc') arr.reverse()
    return arr
  }, [agg, sortDir])

  const total = sorted.reduce((s, r) => s + (metricBy === 'Value' ? r.value : r.count), 0)
  const grandTotal = rows.reduce((s, r) => s + (metricBy === 'Value' ? (r.Value ?? 0) : 1), 0)

  const hasSelection = selectedKeys.length > 0

  if (!sorted.length) return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No data</div>
    </div>
  )

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100 text-gray-500">
            <th className="text-left py-1 w-5">#</th>
            <th className="text-left py-1">{groupBy}</th>
            <th className="text-right py-1 cursor-pointer select-none hover:text-blue-600"
              onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}>
              {metricBy === 'Value' ? 'Value' : 'Count'} {sortDir === 'desc' ? '↓' : '↑'}
            </th>
            <th className="text-right py-1 w-12">%</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => {
            const metric = metricBy === 'Value' ? row.value : row.count
            const pct = grandTotal > 0 ? (metric / grandTotal) * 100 : 0
            const dimmed = hasSelection && !selectedKeys.includes(row.key)
            return (
              <tr key={row.key}
                className={`border-b border-gray-50 cursor-pointer transition-opacity ${dimmed ? 'opacity-30' : 'hover:bg-gray-50'}`}
                onClick={e => onClickKey(row.key, e.shiftKey)}>
                <td className="py-1 text-gray-400">{i + 1}</td>
                <td className="py-1 text-gray-700 max-w-[160px] truncate" title={row.key}>{row.key}</td>
                <td className="py-1 text-right font-mono text-gray-700">
                  <span title={fmtFull(metric)}>
                    {metricBy === 'Value' ? fmtK(metric) : metric.toLocaleString()}
                  </span>
                </td>
                <td className="py-1 text-right text-gray-400">{pct.toFixed(1)}%</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-200 font-semibold text-gray-700 text-xs">
            <td colSpan={2} className="pt-1.5">Total (top 10)</td>
            <td className="pt-1.5 text-right font-mono">
              <span title={fmtFull(total)}>
                {metricBy === 'Value' ? fmtK(total) : total.toLocaleString()}
              </span>
            </td>
            <td className="pt-1.5 text-right text-gray-400">
              {grandTotal > 0 ? `${((total / grandTotal) * 100).toFixed(1)}%` : '—'}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
