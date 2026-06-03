import {
  ComposedChart, Bar, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts'
import type { WasteRow } from '../types'
import { MONTH_NAMES } from '../hooks/useFilters'

function fmtK(v: number) {
  if (v >= 1_000_000) return `${(v/1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${(v/1_000).toFixed(0)}k`
  return String(v)
}
function fmtFull(v: number) { return v.toLocaleString(undefined, {maximumFractionDigits:0}) }

function barColor(achPct: number, dim: boolean): string {
  const base = achPct <= 0.75 ? '#059669' : achPct <= 0.90 ? '#10b981'
             : achPct <= 1.00 ? '#f59e0b' : achPct <= 1.10 ? '#f97316' : '#ef4444'
  return dim ? base + '40' : base
}

// Custom dot with label for area chart
const AreaDot = (props: { cx?: number; cy?: number; value?: number; index?: number; dataLength?: number }) => {
  const { cx = 0, cy = 0, value = 0 } = props
  if (!value) return null
  return (
    <g>
      <circle cx={cx} cy={cy} r={3} fill="#7c3aed" stroke="#fff" strokeWidth={1.5}/>
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#7c3aed" fontSize={8}>{value}</text>
    </g>
  )
}

// Custom bar label
const BarLabel = ({ x = 0, y = 0, width = 0, value = 0 }: { x?: number; y?: number; width?: number; value?: number }) => {
  if (!value || width < 24) return null
  return <text x={x + width/2} y={y - 4} textAnchor="middle" fill="#64748b" fontSize={9}>{fmtK(value)}</text>
}

interface Props {
  monthlyRows:    WasteRow[]
  detailRows:     WasteRow[]
  _selectedMonth?: number | null   // dropdown already filters data upstream
  chartMonths:    number[]        // chart-click dim
  onClickMonth:   (v: number, shift: boolean) => void
}

export function MonthlyChart({ monthlyRows, detailRows, chartMonths, onClickMonth }: Props) {
  // Aggregate by CalendarYear+MonthNo
  const map = new Map<string, { label: string; monthNo: number; actual: number; target: number; prevAvg: number; achPct: number; count: number }>()

  monthlyRows.forEach(r => {
    const key = `${r.CalendarYear}-${String(r.MonthNo).padStart(2,'0')}`
    if (!map.has(key)) map.set(key, { label:`${r.MonthName} ${r.CalendarYear}`, monthNo: r.MonthNo, actual:0, target:0, prevAvg:0, achPct:0, count:0 })
    const e = map.get(key)!
    e.actual  += r.Actual  ?? 0
    e.target  += r.Target  ?? 0
    e.prevAvg += r.PrevAvg ?? 0
  })

  // Job count from DETAIL
  const cntMap = new Map<string, number>()
  detailRows.forEach(r => {
    const key = `${r.CalendarYear}-${String(r.MonthNo).padStart(2,'0')}`
    cntMap.set(key, (cntMap.get(key) ?? 0) + 1)
  })

  const data = Array.from(map.entries()).sort((a,b) => a[0].localeCompare(b[0])).map(([key, v]) => {
    v.achPct = v.target > 0 ? v.actual / v.target : 0
    v.count  = cntMap.get(key) ?? 0
    return { ...v, key }
  })

  if (!data.length) return (
    <div className="card p-4 min-h-[280px] flex items-center justify-center text-slate-400 text-sm">No data</div>
  )

  const hasChartSel = chartMonths.length > 0

  return (
    <div className="card p-4 min-h-[300px]">
      <h3 className="card-title mb-4">Monthly Waste Trend</h3>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 18, right: 48, bottom: 48, left: 8 }}
          onClick={(d, e) => {
            const entry = data.find(x => x.label === d?.activeLabel)
            if (entry) onClickMonth(entry.monthNo, (e as unknown as React.MouseEvent).shiftKey ?? false)
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8' }} angle={-40} textAnchor="end" interval={0} axisLine={false} tickLine={false}/>

          {/* Left Y: value */}
          <YAxis yAxisId="v" tickFormatter={fmtK} tick={{ fontSize: 9, fill: '#94a3b8' }} width={40} axisLine={false} tickLine={false}/>

          {/* Right Y: count — compressed scale (×3 so area takes ~1/3 of chart height) */}
          <YAxis yAxisId="c" orientation="right" tickFormatter={v=>String(v)}
            tick={{ fontSize: 9, fill: '#7c3aed' }} width={32} axisLine={false} tickLine={false}/>

          <Tooltip
            formatter={(v: number, name: string) =>
              name === 'count' ? [fmtFull(v), 'Jobs'] : [fmtFull(v), name]
            }
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
            cursor={{ fill: '#f8fafc' }}
          />

          <Legend
            wrapperStyle={{ fontSize: 10, paddingTop: 0, bottom: 2 }}
            verticalAlign="bottom"
          />

          <Bar yAxisId="v" dataKey="actual" name="Actual" maxBarSize={36} cursor="pointer"
            label={<BarLabel/>}>
            {data.map((entry,i) => {
              const dim = hasChartSel && !chartMonths.includes(entry.monthNo)
              return <Cell key={i} fill={barColor(entry.achPct, dim)}/>
            })}
          </Bar>

          <Line yAxisId="v" dataKey="target"  name="Target"   stroke="#2563eb" strokeWidth={2} strokeDasharray="5 3" dot={false} type="monotone" legendType="plainline"/>
          <Line yAxisId="v" dataKey="prevAvg" name="Prev Avg" stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="2 3" dot={false} type="monotone" legendType="plainline"/>

          {/* Area for job count — right axis, compressed */}
          <Area yAxisId="c" dataKey="count" name="count" type="monotone"
            fill="#7c3aed" stroke="#7c3aed" fillOpacity={0.12} strokeWidth={1.5}
            dot={<AreaDot/>} legendType="none"/>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export { MONTH_NAMES }
