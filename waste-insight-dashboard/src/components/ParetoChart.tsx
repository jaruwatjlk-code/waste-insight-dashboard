import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
  type TooltipProps,
} from 'recharts'
import type { WasteRow } from '../types'

function fmtK(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}k`
  return String(v)
}
function fmtFull(v: number) { return v.toLocaleString(undefined, { maximumFractionDigits: 0 }) }

function buildPareto(rows: WasteRow[], key: 'Value' | 'Count') {
  const m = new Map<string, { value: number; count: number }>()
  rows.forEach(r => {
    const k = r.Cause || '(blank)'
    const e = m.get(k) ?? { value: 0, count: 0 }
    m.set(k, { value: e.value + (r.Value ?? 0), count: e.count + 1 })
  })
  const sorted = Array.from(m.entries())
    .sort((a, b) => (key === 'Value' ? b[1].value - a[1].value : b[1].count - a[1].count))
    .slice(0, 10)
  const grand = sorted.reduce((s, [, v]) => s + (key === 'Value' ? v.value : v.count), 0)
  let cum = 0
  return sorted.map(([name, v]) => {
    const metric = key === 'Value' ? v.value : v.count
    cum += metric
    return { name: name.length > 14 ? name.slice(0,13)+'…' : name, fullName: name, metric, cumPct: grand > 0 ? (cum / grand) * 100 : 0 }
  })
}

function ParetoTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const fullName = (payload[0]?.payload as { fullName?: string })?.fullName ?? ''
  return (
    <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:6, padding:'8px 12px', fontSize:12 }}>
      {fullName && <p style={{ marginBottom:4, fontWeight:600, maxWidth:220 }}>{fullName}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin:'2px 0' }}>
          {p.name === 'cumPct'
            ? `Cumulative: ${Number(p.value).toFixed(1)}%`
            : `${p.name}: ${fmtFull(Number(p.value))}`}
        </p>
      ))}
    </div>
  )
}

function SinglePareto({ rows, metricKey, title, fillColor }: { rows: WasteRow[]; metricKey: 'Value' | 'Count'; title: string; fillColor: string }) {
  const data = buildPareto(rows, metricKey)
  if (!data.length) return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data</div>

  return (
    <div className="flex-1 min-w-0">
      <h4 className="text-xs font-semibold text-gray-600 mb-2">{title}</h4>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 8, right: 44, bottom: 52, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#57606a' }} angle={-40} textAnchor="end" interval={0}/>
          <YAxis yAxisId="left" tickFormatter={metricKey === 'Value' ? fmtK : v => String(v)} tick={{ fontSize: 9, fill: '#57606a' }} width={40}/>
          <YAxis yAxisId="right" orientation="right" domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{ fontSize: 9, fill: '#8250df' }} width={36}/>
          <Tooltip content={<ParetoTooltip/>}/>
          <ReferenceLine yAxisId="right" y={80} stroke="#d4a017" strokeDasharray="4 3"
            label={{ value:'80%', position:'right', fontSize:9, fill:'#d4a017' }}/>
          <Bar yAxisId="left" dataKey="metric" name={metricKey} fill={fillColor} opacity={0.75} maxBarSize={36}/>
          <Line yAxisId="right" type="monotone" dataKey="cumPct" name="cumPct" stroke="#8250df" strokeWidth={2} dot={{ r:2, fill:'#8250df' }}/>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

interface Props { rows: WasteRow[] }

export function ParetoChart({ rows }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Pareto — Cause <span className="text-xs font-normal text-gray-400">(Top 10)</span></h3>
      <div className="flex gap-6">
        <SinglePareto rows={rows} metricKey="Value" title="by Value (THB)" fillColor="#1f6feb"/>
        <SinglePareto rows={rows} metricKey="Count" title="by Count (jobs)" fillColor="#2da44e"/>
      </div>
    </div>
  )
}
