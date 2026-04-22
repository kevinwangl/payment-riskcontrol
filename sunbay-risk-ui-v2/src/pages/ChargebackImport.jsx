import React from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from '../components/shared/StatusBadge'
import DataTable from '../components/shared/DataTable'
import { chargebacks } from '../mock/chargebacks'
import { fmt } from '../utils/format'

export default function ChargebackImport() {
  const nav = useNavigate()
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Chargeback Import Records</h1>
        <div className="flex gap-3">
          <button onClick={() => alert('File import dialog')} className="px-4 py-2 text-[13px] border border-border hover:bg-surface">Import CSV</button>
          <button onClick={() => nav('/chargebacks/monitoring')} className="px-4 py-2 text-[13px] border border-border hover:bg-surface">CB Rate Monitor</button>
        </div>
      </div>
      <DataTable
        columns={[
          { key:'id', label:'CB ID', mono:true },
          { key:'txnId', label:'Txn ID', mono:true },
          { key:'merchantName', label:'Merchant' },
          { key:'cardBrand', label:'Brand' },
          { key:'reasonCode', label:'Reason', render:(v, row) => <div><span className="font-mono">{v}</span><div className="text-[11px] text-muted">{row.reasonDesc}</div></div> },
          { key:'amount', label:'Amount', mono:true, align:'right', render:v => fmt.usd(v) },
          { key:'outcome', label:'Outcome', render:v => <StatusBadge status={v || 'PENDING'} /> },
          { key:'receivedAt', label:'Received', render:v => fmt.date(v) },
        ]}
        data={chargebacks}
      />
    </div>
  )
}
