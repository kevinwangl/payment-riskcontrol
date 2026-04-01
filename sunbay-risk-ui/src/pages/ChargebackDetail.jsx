import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import StatusBadge from '../components/shared/StatusBadge'
import { chargebacks } from '../mock/chargebacks'
import { fmt } from '../utils/format'

export default function ChargebackDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const cb = chargebacks.find(c => c.id === id)
  if (!cb) return <div className="text-muted">Not found</div>

  return (
    <div className="max-w-[800px]">
      <button onClick={() => nav('/chargebacks')} className="text-[13px] text-muted hover:text-black mb-4">← Back</button>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold">{cb.id}</h1>
        <StatusBadge status={cb.status} />
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-2 text-[13px]">
          <div className="flex justify-between"><span className="text-muted">Transaction</span><span className="font-mono cursor-pointer text-primary" onClick={() => nav(`/transactions/${cb.txnId}`)}>{cb.txnId}</span></div>
          <div className="flex justify-between"><span className="text-muted">Merchant</span><span>{cb.merchantName}</span></div>
          <div className="flex justify-between"><span className="text-muted">Amount</span><span className="font-mono">{fmt.usd(cb.amount)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Card Brand</span><span>{cb.cardBrand}</span></div>
        </div>
        <div className="space-y-2 text-[13px]">
          <div className="flex justify-between"><span className="text-muted">Reason Code</span><span className="font-mono">{cb.reasonCode}</span></div>
          <div className="flex justify-between"><span className="text-muted">Reason</span><span>{cb.reasonDesc}</span></div>
          <div className="flex justify-between"><span className="text-muted">Deadline</span><span className="font-mono">{fmt.date(cb.deadline)}</span></div>
        </div>
      </div>

      <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4 border-b border-border pb-2">Timeline</h3>
      <div className="space-y-4 mb-8">
        {cb.timeline.map((e, i) => (
          <div key={i} className="flex gap-4 text-[13px]">
            <div className="w-2 flex flex-col items-center">
              <div className="w-2 h-2 bg-primary mt-1.5" />
              {i < cb.timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
            </div>
            <div>
              <div>{e.action}</div>
              <div className="text-[12px] text-muted">{fmt.datetime(e.at)} · {e.by}</div>
            </div>
          </div>
        ))}
      </div>

      {cb.status === 'RECEIVED' && (
        <div className="flex gap-3">
          <button onClick={() => alert("Marked as disputable — collect evidence")} className="px-4 py-2 text-[13px] bg-black text-white">Mark Disputable</button>
          <button onClick={() => alert("Accepted — merchant debited")} className="px-4 py-2 text-[13px] border border-border">Accept (Non-disputable)</button>
        </div>
      )}
    </div>
  )
}
