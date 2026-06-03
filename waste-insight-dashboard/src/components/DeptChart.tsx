import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList, Legend,
} from 'recharts'
import type { WasteRow } from '../types'

function fmtK(v: number) {
  if (v >= 1_000_000) return `${(v/1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${(v/1_000).toFixed(0)}k`
  return String(v)
}
function fmtFull(v: number) { return v.toLocaleString(undefined, {maximumFractionDigits:0}) }

function barColor(p: number): string {
  if (p <= 0.75) return '#059669'
  if (p <= 0.90) return '#10b981'
  if (p <= 1.00) return '#f59e0b'
  if (p <= 1.10) return '#f97316'
  return '#ef4444'
}

interface Props {
  deptRows:    WasteRow[]
  chartDepts:  string[]            // chart-click dim (visual only)
  onClickDept: (dept: string, shift: boolean) => void
}

export function DeptChart({ deptRows, chartDepts, onClickDept }: Props) {
  const map = new Map<string, { actual: number; target: number }>()
  deptRows.forEach(r => {
    if (!r.Dept) return
    const e = map.get(r.Dept) ?? { actual:0, target:0 }
    map.set(r.Dept, { actual: e.actual + (r.Actual??0), target: e.target + (r.Target??0) })
  })

  const data = Array.from(map.entries())
    .map(([dept, { actual, target }]) => ({ dept, actual, target, achPct: target>0 ? actual/target : 0 }))
    .sort((a,b) => b.actual - a.actual)

  if (!data.length) return (
    <div className="card p-4 min-h-[280px] flex items-center justify-center text-slate-400 text-sm">No data</div>
  )

  const hasChartSel = chartDepts.length > 0

  return (
    <div className="card p-4 min-h-[300px]">
      <h3 className="card-title mb-4">Waste by Department</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 72, bottom: 4, left: 4 }}
          onClick={(d, e) => {
            if (d?.activeLabel) onClickDept(String(d.activeLabel), (e as unknown as React.MouseEvent).shiftKey ?? false)
          }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9"/>
          <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
          <YAxis type="category" dataKey="dept" tick={{ fontSize: 10, fill: '#475569' }} width={58} axisLine={false} tickLine={false} cursor="pointer"/>
          <Tooltip formatter={(v: number, name: string) => [fmtFull(v), name]} contentStyle={{ fontSize: 11, borderRadius: 8 }}/>
          <Legend wrapperStyle={{ fontSize: 10 }} verticalAlign="bottom"/>

          <Bar dataKey="actual" name="Actual" maxBarSize={13} cursor="pointer">
            {data.map((e,i) => {
              const dim = hasChartSel && !chartDepts.includes(e.dept)
              return <Cell key={i} fill={barColor(e.achPct)} opacity={dim ? 0.2 : 1}/>
            })}
            <LabelList dataKey="achPct" position="right"
              formatter={(v: number) => `${(v*100).toFixed(1)}%`}
              style={{ fontSize: 9, fill: '#64748b' }}/>
          </Bar>

          <Bar dataKey="target" name="Target" maxBarSize={13} cursor="pointer">
            {data.map((e,i) => {
              const dim = hasChartSel && !chartDepts.includes(e.dept)
              return <Cell key={i} fill="#2563eb" opacity={dim ? 0.08 : 0.3}/>
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {hasChartSel && <p className="text-xs text-slate-400 mt-1">Shift+click to add · Click again to deselect</p>}
    </div>
  )
}
