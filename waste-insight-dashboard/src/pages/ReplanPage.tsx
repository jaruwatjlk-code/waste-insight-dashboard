import { useMemo } from 'react'
import { useWasteData }     from '../hooks/useWasteData'
import { useFilters }       from '../hooks/useFilters'
import { KpiCard }          from '../components/KpiCard'
import { FilterBar }        from '../components/FilterBar'
import { MonthlyChart }     from '../components/MonthlyChart'
import { DeptChart }        from '../components/DeptChart'
import { Top10Table }       from '../components/Top10Table'
import { Top10JobsChart }   from '../components/Top10JobsChart'
import { ParetoChart }      from '../components/ParetoChart'
import { DetailTable }      from '../components/DetailTable'

function Sk({ h='h-48' }: { h?: string }) {
  return <div className={`${h} bg-gray-100 rounded-lg animate-pulse`}/>
}
function Err({ msg }: { msg: string }) {
  return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">⚠ {msg}</div>
}
function fmtK(v: number) {
  if (v >= 1_000_000) return `${(v/1_000_000).toFixed(2)}M`
  if (v >= 1_000)     return `${(v/1_000).toFixed(1)}k`
  return v.toLocaleString()
}

export function ReplanPage() {
  const monthly = useWasteData('Replan', 'MONTHLY')
  const dept    = useWasteData('Replan', 'DEPT')
  const detail  = useWasteData('Replan', 'DETAIL')

  const allRows = useMemo(() => [...monthly.rows, ...dept.rows, ...detail.rows], [monthly.rows, dept.rows, detail.rows])

  const f = useFilters(allRows)

  // Apply base filters (year/month/dept/cause/machine/job) to each dataset
  const filteredDetail  = useMemo(() => f.filterRows(detail.rows),  [f.filterRows, detail.rows])

  // For monthly chart: if dept filter active → aggregate from DEPT rows; else use MONTHLY rows
  const monthlyForChart = useMemo(() => {
    const baseRows = f.sel.depts.length > 0
      ? f.filterRows(dept.rows)    // dept-filtered DEPT rows → aggregate by month
      : f.filterRows(monthly.rows) // normal MONTHLY rows
    return baseRows
  }, [f.filterRows, f.sel.depts, dept.rows, monthly.rows])

  const filteredDept    = useMemo(() => f.filterRows(dept.rows),    [f.filterRows, dept.rows])

  // KPIs from filtered DETAIL rows
  const kpi = useMemo(() => {
    const totalValue = filteredDetail.reduce((s, r) => s + (r.Value ?? 0), 0)
    const totalJobs  = filteredDetail.length
    const bigJobs    = filteredDetail.filter(r => (r.Value ?? 0) > 5000).length
    const bigVal     = filteredDetail.filter(r => (r.Value ?? 0) > 5000).reduce((s,r)=>s+(r.Value??0),0)
    return { totalValue, totalJobs, bigJobs, bigVal }
  }, [filteredDetail])

  const anyLoading = monthly.loading || dept.loading
  const anyError   = monthly.error ?? dept.error ?? detail.error
  const handleRefresh = () => { monthly.refetch(); dept.refetch(); detail.refetch() }

  return (
    <div className="space-y-4">
      <FilterBar
        availableYears={f.availableYears} availableMonths={f.availableMonths} availableDepts={f.availableDepts}
        sel={f.sel} setYears={f.setYears} setMonths={f.setMonths} setDepts={f.setDepts}
        toggleMonth={f.toggleMonth} toggleDept={f.toggleDept} clearDim={f.clearDim}
        onRefresh={handleRefresh}
      />

      {anyError && <Err msg={anyError}/>}

      {/* KPI */}
      {anyLoading
        ? <div className="grid grid-cols-3 gap-3">{[0,1,2].map(i=><Sk key={i} h="h-20"/>)}</div>
        : <div className="grid grid-cols-3 gap-3">
            <KpiCard label="Total Value (THB)" value={fmtK(kpi.totalValue)} color="blue"/>
            <KpiCard label="Total Jobs" value={kpi.totalJobs.toLocaleString()} color="green"
              sub="จำนวนรายการทั้งหมด"/>
            <KpiCard label="Jobs > 5,000 THB" value={kpi.bigJobs.toLocaleString()} color="red"
              sub={`มูลค่ารวม: ${fmtK(kpi.bigVal)}`}/>
          </div>
      }

      {/* Monthly + Dept */}
      {anyLoading
        ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><Sk h="h-72"/><Sk h="h-72"/></div>
        : <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MonthlyChart
              monthlyRows={monthlyForChart}
              detailRows={filteredDetail}
              selectedMonths={f.sel.months}
              onClickMonth={f.toggleMonth}
            />
            <DeptChart
              deptRows={filteredDept}
              selectedDepts={f.sel.depts}
              onClickDept={f.toggleDept}
            />
          </div>
      }

      {/* Top 10 Cause + Machine */}
      {detail.loading
        ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><Sk h="h-56"/><Sk h="h-56"/></div>
        : <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Top10Table rows={filteredDetail} groupBy="Cause"   metricBy="Value" title="Top 10 Causes — by Value"
              selectedKeys={f.sel.causes} onClickKey={f.toggleCause}/>
            <Top10Table rows={filteredDetail} groupBy="Machine" metricBy="Count" title="Top 10 Machines — by Count"
              selectedKeys={f.sel.machines} onClickKey={f.toggleMachine}/>
          </div>
      }

      {/* Top 10 Jobs */}
      {detail.loading ? <Sk h="h-56"/> : (
        <Top10JobsChart rows={filteredDetail} selectedJobs={f.sel.jobs} onClickJob={f.toggleJob}/>
      )}

      {/* Pareto */}
      {detail.loading ? <Sk h="h-72"/> : <ParetoChart rows={filteredDetail}/>}

      {/* Detail */}
      {detail.loading ? <Sk h="h-64"/> : <DetailTable rows={filteredDetail} dataset="Replan"/>}
    </div>
  )
}
