import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { chargebacks, chargebackTimelines } from '../mock/chargebacks'
import { fmt } from '../utils/format'

const statusColor = { RECEIVED:'bg-muted/10 text-muted', UNDER_REVIEW:'bg-primary/10 text-primary', REPRESENTED:'bg-warning/10 text-warning', WON:'bg-success/10 text-success', LOST:'bg-danger/10 text-danger', ARBITRATION:'bg-purple-100 text-purple-700' }

export default function ChargebackDetail() {
  const { id } = useParams()
  const cb = chargebacks.find(c => c.id === id)
  const timeline = chargebackTimelines[id] || []

  if (!cb) return <div className="text-muted py-20 text-center">Chargeback not found</div>

  return (
    <div>
      <Link to="/chargebacks" className="text-[12px] text-muted hover:text-primary">← Back to Chargebacks</Link>
      <div className="flex items-center gap-3 mt-2 mb-6">
        <h1 className="text-xl font-semibold">{cb.id}</h1>
        <span className={`text-[11px] px-2 py-0.5 ${statusColor[cb.status]}`}>{cb.status}</span>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-[13px] mb-8 max-w-2xl">
        {[
          ['Transaction ID', cb.txnId],
          ['Merchant', cb.merchantName],
          ['ISO', cb.isoId],
          ['Card Brand', cb.cardBrand],
          ['Reason Code', `${cb.reasonCode} — ${cb.reasonDesc}`],
          ['Amount', fmt.usd(cb.amount)],
          ['Received', fmt.datetime(cb.receivedAt)],
          ['Deadline', fmt.daysLeft(cb.deadline) === 'Overdue' ? 'Overdue' : `${fmt.date(cb.deadline)} (${fmt.daysLeft(cb.deadline)} left)`],
        ].map(([label, value]) => (
          <div key={label} className="flex">
            <span className="text-muted w-32 shrink-0">{label}</span>
            <span className={`font-mono ${label === 'Deadline' && fmt.daysLeft(cb.deadline) !== 'Overdue' && parseInt(fmt.daysLeft(cb.deadline)) < 7 ? 'text-danger' : ''}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Risk Decision Association */}
      <div className="border border-border p-4 mb-8 max-w-2xl">
        <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-3">Original Transaction Risk Decision</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[13px]">
          <div className="flex"><span className="text-muted w-28 shrink-0">Decision</span><span className="font-mono">APPROVE</span></div>
          <div className="flex"><span className="text-muted w-28 shrink-0">Risk Score</span><span className="font-mono">32</span></div>
          <div className="flex"><span className="text-muted w-28 shrink-0">Rules Hit</span><span className="font-mono text-[12px]">None</span></div>
          <div className="flex"><span className="text-muted w-28 shrink-0">3DS</span><span className="font-mono">Not Applied</span></div>
        </div>
        <div className="text-[11px] text-muted mt-3 pt-2 border-t border-border/50">This chargeback was on a transaction that passed risk checks — indicates rule gap or friendly fraud.</div>
      </div>

      {/* Timeline (read-only, synced from Processor) */}
      <h3 className="text-sm font-semibold mb-1">Status History</h3>
      <p className="text-[11px] text-muted mb-4">Synced from Processor. Dispute handling is managed externally.</p>
      {timeline.length > 0 ? (
        <div className="border-l-2 border-border ml-2 space-y-0">
          {timeline.map((t, i) => (
            <div key={i} className="relative pl-6 pb-6">
              <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-primary border-2 border-white" />
              <div className="text-[11px] text-muted">{fmt.datetime(t.date)} · {t.actor}</div>
              <div className="text-[13px] font-medium mt-0.5">{t.action}</div>
              <div className="text-[12px] text-muted mt-0.5">{t.detail}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[13px] text-muted">No status updates synced yet.</div>
      )}
    </div>
  )
}
