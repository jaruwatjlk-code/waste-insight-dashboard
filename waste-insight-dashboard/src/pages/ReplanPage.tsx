import { useMemo } from 'react'
import { useWasteData }   from '../hooks/useWasteData'
import { useFilters }     from '../hooks/useFilters'
import { KpiCard }        from '../components/KpiCard'
import { FilterBar }      from '../components/FilterBar'
import { MonthlyChart }   from '../components/MonthlyChart'
import { DeptChart }      from '../components/DeptChart'
import { Top10JobsChart } from '../components/Top10JobsChart'
import { ParetoChart }    from '../components/ParetoChart'
import { DetailTable }    from '../components/DetailTable'

function Sk({ h='h-64' }: { h?: string }) {
  return <div className={`card ${h} animate-pulse bg-slate-100`}/>
}
function Err({ msg }: { msg: string }) {
  return <div className="card p-4 text-sm text-red-600 border-red-200 bg-red-50">⚠ {msg}</div>
}
function fmtK(v: number) {
  if (v >= 1_000_000) return `${(v/1_000_000).toFixed(2)}M`
  if (v >= 1_000)     return `${(v/1_000).toFixed(1)}k`
  return v.toLocaleString()
}
function sign(v: number) { return v >= 0 ? '+' : '' }

export function ReplanPage() {
  const monthly = useWasteData('Replan', 'MONTHLY')
  const dept    = useWasteData('Replan', 'DEPT')
  const detail  = useWasteData('Replan', 'DETAIL')

  const allRows = useMemo(() =>
    [...monthly.rows, ...dept.rows, ...detail.rows],
    [monthly.rows, dept.rows, detail.rows])

  const f = useFilters(allRows)

  // Dropdown filter only (for KPI + charts)
  const filteredMonthly = useMemo(() => f.filterRows(monthly.rows), [f.filterRows, monthly.rows])
  const filteredDetail  = useMemo(() => f.filterRows(detail.rows),  [f.filterRows, detail.rows])

  // Monthly chart: if dept dropdown active → use DEPT rows aggregated by month
  const monthlyForChart = useMemo(() =>
    f.dd.depts.length > 0 ? f.filterRows(dept.rows) : filteredMonthly,
    [f.dd.depts, f.filterRows, dept.rows, filteredMonthly])

  const filteredDept = useMemo(() => f.filterRows(dept.rows), [f.filterRows, dept.rows])

  // ── KPI ──────────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const totalValue = filteredDetail.reduce((s,r) => s + (r.Value??0), 0)
    const totalJobs  = filteredDetail.length
    const bigJobs    = filteredDetail.filter(r => (r.Value??0) > 5000).length
    const bigVal     = filteredDetail.filter(r => (r.Value??0) > 5000).reduce((s,r)=>s+(r.Value??0),0)

    // Target & achievement from MONTHLY rows
    const totalTarget = filteredMonthly.reduce((s,r) => s + (r.Target??0), 0)
    const achPct      = totalTarget > 0 ? (totalValue / totalTarget - 1) * 100 : null

    // Prev month comparison (from year-filtered monthly, sorted)
    const yearFiltered = monthly.rows.filter(r =>
      f.dd.years.length === 0 || f.dd.years.includes(r.CalendarYear))
    const sorted = [...yearFiltered].sort((a,b) =>
      (a.CalendarYear*100+a.MonthNo) - (b.CalendarYear*100+b.MonthNo))

    let vsPrevPct: number | null = null
    if (f.dd.month !== null) {
      // Specific month selected
      const cur  = sorted.filter(r => r.MonthNo === f.dd.month)
      const prev = sorted.filter(r => r.CalendarYear*100+r.MonthNo < (cur[0] ? cur[0].CalendarYear*100+cur[0].MonthNo : 0))
      const curA  = cur.reduce((s,r) => s+(r.Actual??0), 0)
      const prevA = prev.length ? prev[prev.length-1].Actual??0 : 0
      if (prevA > 0) vsPrevPct = (curA - prevA) / prevA * 100
    } else if (sorted.length >= 2) {
      const last = sorted[sorted.length-1]
      const prev = sorted[sorted.length-2]
      if (prev.Actual && last.Actual) vsPrevPct = (last.Actual - prev.Actual) / prev.Actual * 100
    }

    return { totalValue, totalJobs, bigJobs, bigVal, totalTarget, achPct, vsPrevPct }
  }, [filteredDetail, filteredMonthly, monthly.rows, f.dd.years, f.dd.month])

  const anyLoading = monthly.loading || dept.loading
  const anyError   = monthly.error ?? dept.error ?? detail.error
  const handleRefresh = () => { monthly.refetch(); dept.refetch(); detail.refetch() }

  return (
    <div className="space-y-4">
      <FilterBar
        availableYears={f.availableYears} availableMonths={f.availableMonths} availableDepts={f.availableDepts}
        dd={f.dd} chartSel={f.chartSel}
        setYears={f.setYears} setMonth={f.setMonth} setDepts={f.setDepts}
        clearChartSel={f.clearChartSel} onRefresh={handleRefresh}
      />

      {anyError && <Err msg={anyError}/>}

      {/* KPI */}
      <div className="grid grid-cols-3 gap-3" style={{ minHeight: 100 }}>
        {anyLoading ? [0,1,2].map(i=><Sk key={i} h="h-24"/>) : (<>
          <KpiCard
            label="Total Value (THB)"
            value={fmtK(kpi.totalValue)}
            sub1={kpi.totalTarget > 0
              ? `Target: ${fmtK(kpi.totalTarget)} · ${kpi.achPct !== null ? `${sign(kpi.achPct)}${kpi.achPct.toFixed(1)}% vs target` : ''}`
              : undefined}
            sub2={kpi.vsPrevPct !== null ? `${sign(kpi.vsPrevPct)}${kpi.vsPrevPct.toFixed(1)}% vs prev month` : undefined}
            trend1={kpi.achPct !== null ? (kpi.achPct >= 0 ? 'up-bad' : 'down-good') : null}
            trend2={kpi.vsPrevPct !== null ? (kpi.vsPrevPct >= 0 ? 'up-bad' : 'down-good') : null}
            accent="blue"
          />
          <KpiCard
            label="Total Jobs"
            value={kpi.totalJobs.toLocaleString()}
            sub1="จำนวนรายการทั้งหมด"
            accent="green"
          />
          <KpiCard
            label="Jobs > 5,000 THB"
            value={kpi.bigJobs.toLocaleString()}
            sub1={`มูลค่ารวม: ${fmtK(kpi.bigVal)}`}
            accent="red"
          />
        </>)}
      </div>

      {/* Monthly + Dept */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: 300 }}>
        {anyLoading ? <><Sk h="h-[300px]"/><Sk h="h-[300px]"/></> : (<>
          <MonthlyChart
            monthlyRows={monthlyForChart} detailRows={filteredDetail}
            chartMonths={f.chartSel.months}
            onClickMonth={f.toggleChartMonth}
          />
          <DeptChart
            deptRows={filteredDept}
            chartDepts={f.chartSel.depts}
            onClickDept={f.toggleChartDept}
          />
        </>)}
      </div>

      {/* Top 10 Jobs */}
      <div style={{ minHeight: 200 }}>
        {detail.loading ? <Sk h="h-[280px]"/> : (
          <Top10JobsChart rows={filteredDetail} chartJobs={f.chartSel.jobs} onClickJob={f.toggleChartJob}/>
        )}
      </div>

      {/* Pareto */}
      <div style={{ minHeight: 280 }}>
        {detail.loading ? <Sk h="h-[280px]"/> : <ParetoChart rows={filteredDetail}/>}
      </div>

      {/* Detail */}
      <div style={{ minHeight: 200 }}>
        {detail.loading ? <Sk h="h-[300px]"/> : <DetailTable rows={filteredDetail} dataset="Replan"/>}
      </div>
    </div>
  )
}
