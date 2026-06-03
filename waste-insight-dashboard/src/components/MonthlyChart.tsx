import {
  ComposedChart, Bar, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { WasteRow } from '../types'

function fmtK(v: number) {
  if (v >= 1_000_000) return `${(v/1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${(v/1_000).toFixed(0)}k`
  return String(v)
}
function fmtFull(v: number) { return v.toLocaleString(undefined, {maximumFractionDigits:0}) }

function barFill(achPct: number, gray: boolean): string {
  if (gray) return '#e2e8f0'
  if (achPct <= 0.75) return '#059669'
  if (achPct <= 0.90) return '#10b981'
  if (achPct <= 1.00) return '#f59e0b'
  if (achPct <= 1.10) return '#f97316'
  return '#ef4444'
}

const BarLabel = ({ x=0, y=0, width=0, value=0, gray }: { x?: number; y?: number; width?: number; value?: number; gray?: boolean }) => {
  if (!value || width < 24) return null
  return <text x={x+width/2} y={y-4} textAnchor="middle" fill={gray ? '#cbd5e1' : '#64748b'} fontSize={9}>{fmtK(value)}</text>
}

// Custom legend
function ChartLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"/>Actual
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#2563eb" strokeWidth="2" strokeDasharray="5 3"/></svg>
        Target
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="2 3"/></svg>
        Prev Avg
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-violet-600 inline-block"/>
        <span className="text-violet-600 font-medium">Jobs</span>
        <span className="text-slate-400 text-[10px]">(→ right axis)</span>
      </span>
    </div>
  )
}

interface Props {
  monthlyRows:  WasteRow[]
  detailRows:   WasteRow[]
  ddMonth:      number | null
  chartMonths:  number[]
  onClickMonth: (v: number, shift: boolean) => void
}

export function MonthlyChart({ monthlyRows, detailRows, ddMonth, chartMonths, onClickMonth }: Props) {
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
    return { ...v }
  })

  if (!data.length) return <div className="card p-4 min-h-[300px] flex items-center justify-center text-slate-400 text-sm">No data</div>

  const hasMonthSel = ddMonth !== null || chartMonths.length > 0
  const isGray = (monthNo: number) => {
    if (!hasMonthSel) return false
    if (ddMonth !== null && monthNo === ddMonth) return false
    if (chartMonths.includes(monthNo)) return false
    return true
  }

  const maxCount = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="card p-4 min-h-[300px]">
      <div className="flex items-start justify-between mb-2">
        <h3 className="card-title">Monthly Waste Trend</h3>
      </div>
      <ChartLegend/>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 18, right: 48, bottom: 44, left: 8 }} style={{ cursor: 'pointer' }}
          onClick={(d, e) => {
            const entry = data.find(x => x.label === d?.activeLabel)
            if (entry) onClickMonth(entry.monthNo, (e as unknown as React.MouseEvent).shiftKey ?? false)
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8' }} angle={-40} textAnchor="end" interval={0} axisLine={false} tickLine={false}/>
          <YAxis yAxisId="v" tickFormatter={fmtK} tick={{ fontSize: 9, fill: '#94a3b8' }} width={40} axisLine={false} tickLine={false}/>
          <YAxis yAxisId="c" orientation="right" domain={[0, maxCount * 4]} tickFormatter={v=>String(v)}
            tick={{ fontSize: 9, fill: '#7c3aed' }} width={32} axisLine={false} tickLine={false}/>
          <Tooltip
            formatter={(v: number, name: string) => name === 'count' ? [fmtFull(v), 'Jobs'] : [fmtFull(v), name]}
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            cursor={{ fill: 'rgba(241,245,249,0.6)' }}
          />

          <Bar yAxisId="v" dataKey="actual" name="Actual" maxBarSize={36} cursor="pointer"
            label={(props: { x?: number; y?: number; width?: number; value?: number; index?: number }) =>
              <BarLabel {...props} gray={isGray(data[props.index ?? 0]?.monthNo)}/>
            }
          >
            {data.map((entry,i) => (
              <Cell key={i} fill={barFill(entry.achPct, isGray(entry.monthNo))} style={{ transition: 'fill 0.2s ease' }}/>
            ))}
          </Bar>

          <Line yAxisId="v" dataKey="target"  name="Target"   stroke="#2563eb" strokeWidth={2} strokeDasharray="5 3" dot={false} type="monotone" legendType="none"/>
          <Line yAxisId="v" dataKey="prevAvg" name="Prev Avg" stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="2 3" dot={false} type="monotone" legendType="none"/>
          <Area yAxisId="c" dataKey="count" name="Jobs" type="monotone"
            fill="#7c3aed" stroke="#7c3aed" fillOpacity={0.12} strokeWidth={1.5}
            legendType="none"
            dot={(props: { cx?: number; cy?: number; value?: number | number[] }) => {
              const { cx=0, cy=0, value } = props
              // Area ส่ง value เป็น [baseValue, dataValue] — เอาแค่ตัวที่ 2
              const count = Array.isArray(value) ? Number(value[1]) : Number(value ?? 0)
              if (!count || count <= 0) return <g key={`dot-${cx}`}/>
              return (
                <g key={`dot-${cx}`}>
                  <circle cx={cx} cy={cy} r={3} fill="#7c3aed" stroke="#fff" strokeWidth={1.5}/>
                  <text x={cx} y={cy-9} textAnchor="middle" fill="#7c3aed" fontSize={8} fontWeight="500">{count}</text>
                </g>
              )
            }}
            activeDot={{ r: 5, fill: '#7c3aed' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      {hasMonthSel && <p className="text-xs text-slate-400 mt-1 text-center">Shift+click เพื่อเลือกเพิ่ม · คลิกซ้ำเพื่อยกเลิก</p>}
    </div>
  )
}
