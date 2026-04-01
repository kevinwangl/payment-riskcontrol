import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import StatusBadge from '../components/shared/StatusBadge'
import { merchants } from '../mock/merchants'
import { chargebacks } from '../mock/chargebacks'
import { fmt } from '../utils/format'
import MetricTooltip from '../components/shared/MetricTooltip'

export default function MerchantDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const m = merchants.find(x => x.id === id)
  if (!m) return <div className="text-muted">Merchant not found</div>

  const mCbs = chargebacks.filter(c => c.merchantId === id)

  return (
    <div className="max-w-[900px]">
      <button onClick={() => nav('/merchants')} className="text-[13px] text-muted hover:text-black mb-4">← Back</button>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold">{m.name}</h1>
        <StatusBadge status={m.riskLevel} />
        <StatusBadge status={m.status === 'ACTIVE' ? 'APPROVED' : m.status} />
      </div>

      <div className="grid grid-cols-3 gap-8 mb-8">
        <Section title="Basic Info">
          <Row label="ID" value={m.id} />
          <Row label="ISO" value={m.isoId} />
          <Row label="MCC" value={m.mcc} />
          <Row label="Age" value={`${m.ageDays} days`} />
          {m.trialPeriod && <Row label="Trial ends" value={fmt.date(m.trialEndDate)} />}
        </Section>
        <Section title="Risk Parameters">
          <Row label={<MetricTooltip name="Risk Score"><span>Risk Score</span></MetricTooltip>} value={m.riskScore} />
          <Row label={<MetricTooltip name="Single Txn Limit"><span>Single Limit</span></MetricTooltip>} value={fmt.usd(m.singleTxnLimit)} />
          <Row label={<MetricTooltip name="Monthly Limit"><span>Monthly Limit</span></MetricTooltip>} value={fmt.usd(m.monthlyLimit)} />
          <Row label={<MetricTooltip name="Reserve Rate"><span>Reserve Rate</span></MetricTooltip>} value={`${m.reserveRate}%`} />
          <Row label={<MetricTooltip name="Settlement Cycle"><span>Settlement Cycle</span></MetricTooltip>} value={m.settlementCycle} />
        </Section>
        <Section title="Compliance">
          <Row label="KYC" value={m.kycStatus} />
          <Row label="OFAC" value={m.ofacCheck} />
          <Row label="MATCH/TMF" value={m.matchTmfCheck} />
          <Row label="CB Rate" value={fmt.pct(m.chargebackRate)} />
          {m.nextReviewDate && <Row label="Next Review" value={fmt.date(m.nextReviewDate)} />}
        </Section>
      </div>

      {mCbs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Related Chargebacks</h3>
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-border">
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">ID</th>
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Amount</th>
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Status</th>
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Reason</th>
            </tr></thead>
            <tbody>{mCbs.map(c => (
              <tr key={c.id} onClick={() => nav(`/chargebacks/${c.id}`)} className="border-b border-border/50 hover:bg-surface cursor-pointer">
                <td className="py-2 font-mono">{c.id}</td>
                <td className="py-2 font-mono">{fmt.usd(c.amount)}</td>
                <td className="py-2"><StatusBadge status={c.status} /></td>
                <td className="py-2 text-muted">{c.reasonDesc}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return <div><h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-3 pb-2 border-b border-border">{title}</h3><div className="space-y-2">{children}</div></div>
}
function Row({ label, value }) {
  return <div className="flex justify-between text-[13px]"><span className="text-muted">{label}</span><span className="font-mono">{value}</span></div>
}
