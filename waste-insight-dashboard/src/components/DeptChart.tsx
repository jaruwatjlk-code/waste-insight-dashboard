import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList, Legend,
} from 'recharts'
import type { WasteRow } from '../types'

function fmtK(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}k`
  return String(v)
}
function fmtFull(v: number) { return v.toLocaleString(undefined, { maximumFractionDigits: 0 }) }
function achColor(p: number) {
  if (p <= 0.75) return '#1a7f37'
  if (p <= 0.90) return '#2da44e'
  if (p <= 1.00) return '#d4a017'
  if (p <= 1.10) return '#e16b2d'
  return '#cf222e'
}

interface Props {
  deptRows:      WasteRow[]   // DEPT record type
  selectedDepts: string[]
  onClickDept:   (dept: string, shift: boolean) => void
}

export function DeptChart({ deptRows, selectedDepts, onClickDept }: Props) {
  const map = new Map<string, { actual: number; target: number }>()
  deptRows.forEach(r => {
    if (!r.Dept) return
    const e = map.get(r.Dept) ?? { actual: 0, target: 0 }
    map.set(r.Dept, { actual: e.actual + (r.Actual ?? 0), target: e.target + (r.Target ?? 0) })
  })

  const data = Array.from(map.entries()).map(([dept, { actual, target }]) => ({
    dept, actual, target,
    achPct: target > 0 ? actual / target : 0,
  })).sort((a, b) => b.actual - a.actual)

  if (!data.length) return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data</div>

  const hasSelection = selectedDepts.length > 0

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Waste by Department</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 72, bottom: 4, left: 8 }}
          onClick={(d, e) => {
            if (d?.activeLabel) onClickDept(String(d.activeLabel), (e as unknown as React.MouseEvent).shiftKey ?? false)
          }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0"/>
          <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 10, fill: '#57606a' }}/>
          <YAxis type="category" dataKey="dept" tick={{ fontSize: 11, fill: '#57606a' }} width={60} cursor="pointer"/>
          <Tooltip formatter={(v: number, name: string) => [fmtFull(v), name]} contentStyle={{ fontSize: 12 }}/>
          <Legend wrapperStyle={{ fontSize: 10 }}/>

          {/* Actual bars */}
          <Bar dataKey="actual" name="Actual" maxBarSize={14} cursor="pointer">
            {data.map((e, i) => {
              const dimmed = hasSelection && !selectedDepts.includes(e.dept)
              return <Cell key={i} fill={achColor(e.achPct)} opacity={dimmed ? 0.3 : 1}/>
            })}
            <LabelList dataKey="achPct" position="right" formatter={(v: number) => `${(v*100).toFixed(1)}%`} style={{ fontSize: 9, fill: '#57606a' }}/>
          </Bar>

          {/* Target bars */}
          <Bar dataKey="target" name="Target" maxBarSize={14} fill="#1f6feb" opacity={0.35} cursor="pointer">
            {data.map((e, i) => {
              const dimmed = hasSelection && !selectedDepts.includes(e.dept)
              return <Cell key={i} fill="#1f6feb" opacity={dimmed ? 0.1 : 0.35}/>
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {hasSelection && <p className="text-xs text-gray-400 mt-1">Shift+click to add dept · Click again to deselect</p>}
    </div>
  )
}
