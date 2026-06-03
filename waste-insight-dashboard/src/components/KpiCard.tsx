interface KpiCardProps {
  label:  string
  value:  string
  sub?:   string
  color?: 'blue' | 'green' | 'red' | 'purple' | 'yellow'
}
const colorClass: Record<NonNullable<KpiCardProps['color']>, string> = {
  blue:   'text-blue-600',
  green:  'text-green-700',
  red:    'text-red-600',
  purple: 'text-purple-600',
  yellow: 'text-yellow-600',
}
export function KpiCard({ label, value, sub, color = 'blue' }: KpiCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex flex-col gap-1 shadow-sm">
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      <span className={`text-2xl font-bold ${colorClass[color]}`}>{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  )
}
