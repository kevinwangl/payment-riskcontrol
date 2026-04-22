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
        <h1 className="text-xl font-semibold">Merchant Risk Config</h1>
      </div>
      <DataTable
        columns={[
          { key:'name', label:'Merchant' },
          { key:'isoId', label:'ISO' },
          { key:'mcc', label:'MCC', mono:true },
          { key:'riskLevel', label:'Risk', render:v => <StatusBadge status={v} /> },
          { key:'status', label:'Status', render:v => <StatusBadge status={v} /> },
          { key:'chargebackRate', label:'CB Rate', mono:true, align:'right', render:(v) => <MetricTooltip name="CB Rate"><span className={v > 0.9 ? 'text-danger' : v > 0.5 ? 'text-warning' : ''}>{fmt.pct(v)}</span></MetricTooltip> },
        ]}
        data={merchants}
        onRowClick={row => nav(`/merchants/${row.id}`)}
      />
    </div>
  )
}
