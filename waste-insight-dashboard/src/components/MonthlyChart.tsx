import {
  ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts'
import type { WasteRow } from '../types'
import { MONTH_NAMES } from '../hooks/useFilters'

function fmtK(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}k`
  return String(v)
}
function fmtFull(v: number) { return v.toLocaleString(undefined, { maximumFractionDigits: 0 }) }

function achColor(achPct: number, dimmed: boolean): string {
  const opacity = dimmed ? '66' : 'ff'
  if (achPct <= 0.75) return `#1a7f37${opacity}`
  if (achPct <= 0.90) return `#2da44e${opacity}`
  if (achPct <= 1.00) return `#d4a017${opacity}`
  if (achPct <= 1.10) return `#e16b2d${opacity}`
  return `#cf222e${opacity}`
}

interface Props {
  monthlyRows: WasteRow[]   // MONTHLY record type (or aggregated from DEPT)
  detailRows:  WasteRow[]   // DETAIL record type for job count
  selectedMonths: number[]
  onClickMonth: (monthNo: number, shift: boolean) => void
}

export function MonthlyChart({ monthlyRows, detailRows, selectedMonths, onClickMonth }: Props) {
  // build monthly map from MONTHLY rows
  const map = new Map<string, { label: string; monthNo: number; actual: number; target: number; prevAvg: number; achPct: number; count: number }>()

  monthlyRows.forEach(r => {
    const key = `${r.CalendarYear}-${String(r.MonthNo).padStart(2,'0')}`
    if (!map.has(key)) map.set(key, { label: `${r.MonthName} ${r.CalendarYear}`, monthNo: r.MonthNo, actual: 0, target: 0, prevAvg: 0, achPct: 0, count: 0 })
    const e = map.get(key)!
    e.actual  += r.Actual  ?? 0
    e.target  += r.Target  ?? 0
    e.prevAvg += r.PrevAvg ?? 0
  })

  // job count from DETAIL rows per month
  const countMap = new Map<string, number>()
  detailRows.forEach(r => {
    const key = `${r.CalendarYear}-${String(r.MonthNo).padStart(2,'0')}`
    countMap.set(key, (countMap.get(key) ?? 0) + 1)
  })

  const data = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([key, v]) => {
    v.achPct = v.target > 0 ? v.actual / v.target : 0
    v.count  = countMap.get(key) ?? 0
    return { ...v, key }
  })

  if (!data.length) return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data</div>

  const hasSelection = selectedMonths.length > 0

  // Custom bar label
  const BarLabel = (props: { x?: number; y?: number; width?: number; value?: number }) => {
    const { x = 0, y = 0, width = 0, value = 0 } = props
    if (!value || width < 28) return null
    return <text x={x + width / 2} y={y - 4} fill="#57606a" fontSize={9} textAnchor="middle">{fmtK(value)}</text>
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Monthly Waste Trend</h3>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 16, right: 16, bottom: 44, left: 16 }}
          onClick={(d, e) => {
            if (d?.activeLabel) {
              const entry = data.find(x => x.label === d.activeLabel)
              if (entry) onClickMonth(entry.monthNo, (e as unknown as React.MouseEvent).shiftKey ?? false)
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#57606a' }} angle={-40} textAnchor="end" interval={0}/>
          <YAxis yAxisId="left" tickFormatter={fmtK} tick={{ fontSize: 10, fill: '#57606a' }} width={44}/>
          <YAxis yAxisId="right" orientation="right" tickFormatter={v => String(v)} tick={{ fontSize: 10, fill: '#8250df' }} width={36}/>
          <Tooltip
            formatter={(v: number, name: string) =>
              name === 'count' ? [fmtFull(v), 'Job Count'] : [fmtFull(v), name]
            }
            contentStyle={{ fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }}/>
          <Bar yAxisId="left" dataKey="actual" name="Actual" maxBarSize={36} cursor="pointer" label={<BarLabel/>}>
            {data.map((entry, i) => {
              const dimmed = hasSelection && !selectedMonths.includes(entry.monthNo)
              return <Cell key={i} fill={achColor(entry.achPct, dimmed)}/>
            })}
          </Bar>
          <Line yAxisId="left" dataKey="target" name="Target" stroke="#1f6feb" strokeWidth={2} strokeDasharray="5 3" dot={false} type="monotone"/>
          <Line yAxisId="left" dataKey="prevAvg" name="Prev Avg" stroke="#8250df" strokeWidth={1.5} strokeDasharray="2 3" dot={false} type="monotone"/>
          <Area yAxisId="right" dataKey="count" name="count" type="monotone" fill="#8250df" stroke="#8250df" fillOpacity={0.15} strokeWidth={1.5} dot={false}/>
        </ComposedChart>
      </ResponsiveContainer>
      {hasSelection && <p className="text-xs text-gray-400 mt-1">Shift+click to add month · Click again to deselect</p>}
    </div>
  )
}

export { MONTH_NAMES }
