import {
  ComposedChart, Bar, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts'
import type { WasteRow } from '../types'

function fmtK(v: number) {
  if (v >= 1_000_000) return `${(v/1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${(v/1_000).toFixed(0)}k`
  return String(v)
}
function fmtFull(v: number) { return v.toLocaleString(undefined, {maximumFractionDigits:0}) }

// Gray when not selected; color by ach% when selected or no selection active
function barFill(achPct: number, isGray: boolean): string {
  if (isGray) return '#e2e8f0'
  if (achPct <= 0.75) return '#059669'
  if (achPct <= 0.90) return '#10b981'
  if (achPct <= 1.00) return '#f59e0b'
  if (achPct <= 1.10) return '#f97316'
  return '#ef4444'
}

const BarLabel = ({ x=0, y=0, width=0, value=0, isGray }: { x?: number; y?: number; width?: number; value?: number; isGray?: boolean }) => {
  if (!value || width < 24) return null
  return <text x={x+width/2} y={y-4} textAnchor="middle" fill={isGray ? '#cbd5e1' : '#64748b'} fontSize={9}>{fmtK(value)}</text>
}

interface Props {
  monthlyRows:  WasteRow[]   // dropdown-filtered (not chartSel filtered) — for display
  detailRows:   WasteRow[]   // same, dropdown-filtered only
  chartMonths:  number[]     // chart-click selection → gray others
  onClickMonth: (v: number, shift: boolean) => void
}

export function MonthlyChart({ monthlyRows, detailRows, chartMonths, onClickMonth }: Props) {
  const map = new Map<string, { label: string; monthNo: number; actual: number; target: number; prevAvg: number; achPct: number; count: number }>()

  monthlyRows.forEach(r => {
    const key = `${r.CalendarYear}-${String(r.MonthNo).padStart(2,'0')}`
    if (!map.has(key)) map.set(key, { label:`${r.MonthName} ${r.CalendarYear}`, monthNo: r.MonthNo, actual:0, target:0, prevAvg:0, achPct:0, count:0 })
    const e = map.get(key)!
    e.actual  += r.Actual  ?? 0
    e.target  += r.Target  ?? 0
    e.prevAvg += r.PrevAvg ?? 0
  })

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
    <div className="card p-4 min-h-[300px] flex items-center justify-center text-slate-400 text-sm">No data</div>
  )

  const hasSel    = chartMonths.length > 0
  const maxCount  = Math.max(...data.map(d => d.count), 1)
  // Compress area to bottom ~25% of chart — set right axis domain to 4× maxCount
  const rightMax  = maxCount * 4

  // Custom legend with Jobs entry
  const legendPayload = [
    { value: 'Actual',   type: 'square' as const, color: '#059669', id: 'actual' },
    { value: 'Target',   type: 'plainline' as const, color: '#2563eb', id: 'target' },
    { value: 'Prev Avg', type: 'plainline' as const, color: '#a78bfa', id: 'prevAvg' },
    { value: 'Jobs',     type: 'circle' as const, color: '#7c3aed', id: 'count' },
  ]

  return (
    <div className="card p-4 min-h-[300px]">
      <h3 className="card-title mb-4">Monthly Waste Trend</h3>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 18, right: 48, bottom: 48, left: 8 }}
          onClick={(d, e) => {
            const entry = data.find(x => x.label === d?.activeLabel)
            if (entry) onClickMonth(entry.monthNo, (e as unknown as React.MouseEvent).shiftKey ?? false)
          }}
          style={{ cursor: 'pointer' }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8' }} angle={-40} textAnchor="end" interval={0} axisLine={false} tickLine={false}/>
          <YAxis yAxisId="v" tickFormatter={fmtK} tick={{ fontSize: 9, fill: '#94a3b8' }} width={40} axisLine={false} tickLine={false}/>
          <YAxis yAxisId="c" orientation="right" domain={[0, rightMax]} tickFormatter={v=>String(v)}
            tick={{ fontSize: 9, fill: '#7c3aed' }} width={32} axisLine={false} tickLine={false}/>

          <Tooltip
            formatter={(v: number, name: string) =>
              name === 'count' ? [fmtFull(v), 'Jobs'] : [fmtFull(v), name]
            }
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            cursor={{ fill: 'rgba(241,245,249,0.8)' }}
          />

          <Legend payload={legendPayload} wrapperStyle={{ fontSize: 10, paddingBottom: 0, bottom: 0 }} verticalAlign="bottom"/>

          <Bar yAxisId="v" dataKey="actual" maxBarSize={36} cursor="pointer"
            label={(props) => <BarLabel {...props} isGray={hasSel && !chartMonths.includes(data[props.index ?? 0]?.monthNo)}/>}>
            {data.map((entry,i) => (
              <Cell key={i}
                fill={barFill(entry.achPct, hasSel && !chartMonths.includes(entry.monthNo))}
                style={{ transition: 'fill 0.2s ease' }}
              />
            ))}
          </Bar>

          <Line yAxisId="v" dataKey="target"  stroke="#2563eb" strokeWidth={2} strokeDasharray="5 3" dot={false} type="monotone" legendType="none"/>
          <Line yAxisId="v" dataKey="prevAvg" stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="2 3" dot={false} type="monotone" legendType="none"/>

          {/* Area for job count — right axis, stays in bottom quarter */}
          <Area yAxisId="c" dataKey="count" type="monotone"
            fill="#7c3aed" stroke="#7c3aed" fillOpacity={0.12} strokeWidth={1.5}
            dot={{ r: 3, fill: '#7c3aed', stroke: '#fff', strokeWidth: 1.5 }}
            activeDot={{ r: 5, fill: '#7c3aed' }}
            legendType="none"
          />
        </ComposedChart>
      </ResponsiveContainer>
      {hasSel && (
        <p className="text-xs text-slate-400 mt-1 text-center">
          Shift+click เพื่อเลือกเพิ่ม · คลิกซ้ำเพื่อยกเลิก
        </p>
      )}
    </div>
  )
}
