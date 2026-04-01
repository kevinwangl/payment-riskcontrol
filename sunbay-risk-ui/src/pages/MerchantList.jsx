import React from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from '../components/shared/StatusBadge'
import DataTable from '../components/shared/DataTable'
import MetricTooltip from '../components/shared/MetricTooltip'
import { merchants } from '../mock/merchants'
import { fmt } from '../utils/format'

export default function MerchantList() {
  const nav = useNavigate()
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Merchants</h1>
        <button onClick={() => nav('/merchants/onboarding')} className="px-4 py-2 text-[13px] border border-border hover:bg-surface">Onboarding Queue</button>
      </div>
      <DataTable
        columns={[
          { key:'name', label:'Merchant' },
          { key:'isoId', label:'ISO' },
          { key:'mcc', label:'MCC', mono:true },
          { key:'riskLevel', label:'Risk', render:v => <StatusBadge status={v} /> },
          { key:'status', label:'Status', render:v => <StatusBadge status={v === 'ACTIVE' ? 'APPROVED' : v === 'TRIAL' ? 'PENDING' : v === 'FROZEN' ? 'HIT' : v} /> },
          { key:'chargebackRate', label:'CB Rate', mono:true, align:'right', render:(v,row) => <MetricTooltip name="CB Rate"><span className={v > 0.9 ? 'text-danger' : v > 0.5 ? 'text-warning' : ''}>{fmt.pct(v)}</span></MetricTooltip> },
          { key:'settlementCycle', label:'Settlement', mono:true },
        ]}
        data={merchants}
        onRowClick={row => nav(`/merchants/${row.id}`)}
      />
    </div>
  )
}
