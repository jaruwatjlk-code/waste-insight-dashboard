interface KpiCardProps {
  label:   string
  value:   string
  sub1?:   string
  sub2?:   string
  trend1?: 'up-good' | 'up-bad' | 'down-good' | 'down-bad' | null
  trend2?: 'up-good' | 'up-bad' | 'down-good' | 'down-bad' | null
  accent?: 'blue' | 'green' | 'red' | 'purple' | 'amber'
}

const accentMap = {
  blue:   { bar: 'bg-blue-500',   val: 'text-blue-600' },
  green:  { bar: 'bg-emerald-500',val: 'text-emerald-600' },
  red:    { bar: 'bg-red-500',    val: 'text-red-600' },
  purple: { bar: 'bg-violet-500', val: 'text-violet-600' },
  amber:  { bar: 'bg-amber-500',  val: 'text-amber-600' },
}

const trendIcon = (t?: string | null) => {
  if (!t) return null
  const isUp   = t.startsWith('up')
  const isGood = t.endsWith('good')
  const color  = isGood ? 'text-emerald-600' : 'text-red-500'
  return <span className={`font-bold ${color}`}>{isUp ? '▲' : '▼'}</span>
}

export function KpiCard({ label, value, sub1, sub2, trend1, trend2, accent = 'blue' }: KpiCardProps) {
  const a = accentMap[accent]
  return (
    <div className="card p-4 flex flex-col gap-2 relative overflow-hidden">
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${a.bar} rounded-l-xl`}/>

      <span className="section-label pl-1">{label}</span>
      <span className={`kpi-value pl-1 ${a.val}`}>{value}</span>

      {(sub1 || sub2) && (
        <div className="pl-1 space-y-0.5">
          {sub1 && (
            <p className="text-xs text-slate-500 flex items-center gap-1">
              {trendIcon(trend1)}{sub1}
            </p>
          )}
          {sub2 && (
            <p className="text-xs text-slate-400 flex items-center gap-1">
              {trendIcon(trend2)}{sub2}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
