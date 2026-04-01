import React from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from '../components/shared/StatusBadge'
import DataTable from '../components/shared/DataTable'
import { chargebacks } from '../mock/chargebacks'
import { fmt } from '../utils/format'

export default function ChargebackList() {
  const nav = useNavigate()
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Chargeback Management</h1>
        <button onClick={() => nav('/chargebacks/monitoring')} className="px-4 py-2 text-[13px] border border-border hover:bg-surface">CB Rate Monitor</button>
      </div>
      <DataTable
        columns={[
          { key:'id', label:'Case ID', mono:true },
          { key:'txnId', label:'Txn ID', mono:true },
          { key:'merchantName', label:'Merchant' },
          { key:'cardBrand', label:'Brand' },
          { key:'reasonCode', label:'Reason', mono:true },
          { key:'amount', label:'Amount', mono:true, align:'right', render:v => fmt.usd(v) },
          { key:'status', label:'Status', render:v => <StatusBadge status={v} /> },
          { key:'deadline', label:'Deadline', render:v => {
            const d = Math.ceil((new Date(v)-Date.now())/86400000)
            return <span className={`font-mono ${d < 7 ? 'text-danger' : ''}`}>{d}d</span>
          }},
        ]}
        data={chargebacks}
        onRowClick={row => nav(`/chargebacks/${row.id}`)}
      />
    </div>
  )
}
