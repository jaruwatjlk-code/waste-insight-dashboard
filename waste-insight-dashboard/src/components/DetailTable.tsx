import { useState, useMemo } from 'react'
import type { WasteRow, Dataset } from '../types'

const PAGE_SIZE = 20

function fmtK(v: number | null) {
  if (v === null || v === undefined) return '—'
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString()
}
function fmtFull(v: number | null) {
  if (v === null || v === undefined) return '—'
  return v.toLocaleString(undefined, { maximumFractionDigits: 0 })
}
function fmtDate(s: string | null) {
  if (!s) return '—'
  const parts = s.split('-')   // "dd-mmm-yyyy"
  if (parts.length >= 3) return `${parts[0]}-${parts[1]}-${parts[2].slice(2)}`
  return s
}

type SortKey = 'Date' | 'JO' | 'Dept' | 'Value'
type SortDir  = 'asc' | 'desc'

interface Props {
  rows:    WasteRow[]
  dataset: Dataset
}

export function DetailTable({ rows, dataset }: Props) {
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(1)
  const [sortKey, setSortKey] = useState<SortKey>('Date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [tooltip, setTooltip] = useState<{ row: WasteRow; x: number; y: number } | null>(null)

  const isReplan = dataset === 'Replan'

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q
      ? rows.filter(r => (r.SearchText ?? '').toLowerCase().includes(q) || (r.JO ?? '').toLowerCase().includes(q))
      : rows
  }, [rows, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let diff = 0
      if (sortKey === 'Date')  diff = (a.Date ?? '').localeCompare(b.Date ?? '')
      if (sortKey === 'JO')    diff = (a.JO ?? '').localeCompare(b.JO ?? '')
      if (sortKey === 'Dept')  diff = (a.Dept ?? '').localeCompare(b.Dept ?? '')
      if (sortKey === 'Value') diff = (a.Value ?? 0) - (b.Value ?? 0)
      return sortDir === 'desc' ? -diff : diff
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const curPage    = Math.min(page, totalPages)
  const pageRows   = sorted.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE)
  const totalValue = filtered.reduce((s, r) => s + (r.Value ?? 0), 0)

  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(k); setSortDir('desc') }
  }
  const thCls = (k: SortKey) =>
    `px-3 py-2 cursor-pointer select-none hover:text-blue-600 ${sortKey === k ? 'text-blue-600' : ''}`

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm relative"
      onMouseLeave={() => setTooltip(null)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 shrink-0">Detail Records</h3>
        <span className="text-xs text-gray-400">{filtered.length.toLocaleString()} rows</span>
        <input type="text" value={search} onChange={e => handleSearch(e.target.value)}
          placeholder="Search JO, cause, machine…"
          className="ml-auto border border-gray-200 rounded-md px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500 w-52"/>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr className="text-gray-500 border-b border-gray-200">
              <th className="text-left px-3 py-2 w-6">#</th>
              <th className={`text-left ${thCls('Date')}`} onClick={() => toggleSort('Date')}>
                Date {sortKey==='Date' ? (sortDir==='desc'?'↓':'↑') : ''}
              </th>
              <th className={`text-left ${thCls('JO')}`} onClick={() => toggleSort('JO')}>
                JO {sortKey==='JO' ? (sortDir==='desc'?'↓':'↑') : ''}
              </th>
              <th className="text-left px-3 py-2">Comp</th>
              {isReplan && <th className="text-left px-3 py-2">JO Ref</th>}
              <th className="text-left px-3 py-2">Machine</th>
              <th className="text-left px-3 py-2">Cause</th>
              <th className={`text-left ${thCls('Dept')}`} onClick={() => toggleSort('Dept')}>
                Dept {sortKey==='Dept' ? (sortDir==='desc'?'↓':'↑') : ''}
              </th>
              <th className={`text-right ${thCls('Value')}`} onClick={() => toggleSort('Value')}>
                Value {sortKey==='Value' ? (sortDir==='desc'?'↓':'↑') : ''}
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr><td colSpan={isReplan ? 9 : 8} className="text-center py-10 text-gray-400">No records</td></tr>
            ) : pageRows.map((r, i) => (
              <tr key={i}
                className="border-b border-gray-50 hover:bg-blue-50 cursor-default"
                onMouseEnter={e => setTooltip({ row: r, x: (e.target as HTMLElement).getBoundingClientRect().right, y: (e.target as HTMLElement).getBoundingClientRect().top })}
              >
                <td className="px-3 py-1.5 text-gray-400">{(curPage-1)*PAGE_SIZE + i + 1}</td>
                <td className="px-3 py-1.5 text-gray-600 whitespace-nowrap">{fmtDate(r.Date)}</td>
                <td className="px-3 py-1.5 font-mono text-gray-600">{r.JO}</td>
                <td className="px-3 py-1.5 text-gray-600 max-w-[120px] truncate" title={r.Component || r.Code}>{r.Component || r.Code}</td>
                {isReplan && <td className="px-3 py-1.5 text-gray-500">{r.JORef || '—'}</td>}
                <td className="px-3 py-1.5 text-gray-600">{r.Machine}</td>
                <td className="px-3 py-1.5 text-gray-700 max-w-[140px] truncate" title={r.Cause}>{r.Cause}</td>
                <td className="px-3 py-1.5 text-gray-700">{r.Dept}</td>
                <td className="px-3 py-1.5 text-right font-mono text-gray-700">
                  <span title={fmtFull(r.Value)}>{fmtK(r.Value)}</span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold text-xs text-gray-700">
              <td colSpan={isReplan ? 8 : 7} className="px-3 py-1.5">Total ({filtered.length.toLocaleString()} rows)</td>
              <td className="px-3 py-1.5 text-right font-mono">
                <span title={fmtFull(totalValue)}>{fmtK(totalValue)}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 text-xs text-gray-500">
          <span>Page {curPage} of {totalPages}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(1)} disabled={curPage===1}
              className="px-2 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">«</button>
            <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={curPage===1}
              className="px-2 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">‹ Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={curPage===totalPages}
              className="px-2 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">Next ›</button>
            <button onClick={() => setPage(totalPages)} disabled={curPage===totalPages}
              className="px-2 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">»</button>
          </div>
        </div>
      )}

      {/* Row tooltip */}
      {tooltip && (
        <div className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs max-w-xs pointer-events-none"
          style={{ top: Math.min(tooltip.y, window.innerHeight - 200), left: Math.min(tooltip.x + 8, window.innerWidth - 260) }}>
          <div className="font-semibold text-gray-700 mb-1">{tooltip.row.JO} — {tooltip.row.Component || tooltip.row.Code}</div>
          <div className="space-y-0.5 text-gray-600">
            <div><span className="text-gray-400">Date:</span> {tooltip.row.Date ?? '—'}</div>
            <div><span className="text-gray-400">Dept:</span> {tooltip.row.Dept}</div>
            <div><span className="text-gray-400">Machine:</span> {tooltip.row.Machine}</div>
            <div><span className="text-gray-400">Cause:</span> {tooltip.row.Cause}</div>
            {isReplan && <div><span className="text-gray-400">JO Ref:</span> {tooltip.row.JORef || '—'}</div>}
            <div><span className="text-gray-400">Value:</span> <strong>{fmtFull(tooltip.row.Value)}</strong></div>
            <div><span className="text-gray-400">QtySheet:</span> {fmtFull(tooltip.row.QtySheet)}</div>
          </div>
        </div>
      )}
    </div>
  )
}
