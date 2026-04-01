import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import StatusBadge from '../components/shared/StatusBadge'
import { onboardingQueue } from '../mock/merchants'

export default function MerchantOnboardingDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const m = onboardingQueue.find(x => x.id === id)
  if (!m) return <div className="text-muted">Not found</div>

  const scorecard = [
    { dim:'MCC Industry Risk', weight:'25%', score: m.mcc === '5966' ? 60 : m.mcc === '5944' ? 30 : 0 },
    { dim:'Business Age', weight:'15%', score:50 },
    { dim:'Chargeback History', weight:'20%', score:0 },
    { dim:'MATCH/TMF', weight:'20%', score: m.matchTmfCheck === 'HIT' ? 100 : 0 },
    { dim:'Expected Volume', weight:'10%', score:20 },
    { dim:'UBO Credit', weight:'10%', score:0 },
  ]

  return (
    <div className="max-w-[800px]">
      <button onClick={() => nav('/merchants/onboarding')} className="text-[13px] text-muted hover:text-black mb-4">← Back</button>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold">{m.name}</h1>
        <StatusBadge status={m.riskLevel} />
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8 text-[13px]">
        <div className="space-y-2">
          <R label="ISO" value={m.isoId} />
          <R label="MCC" value={m.mcc} />
          <R label="Applied" value={m.appliedAt} />
        </div>
        <div className="space-y-2">
          <R label="KYC" value={m.kycStatus} />
          <R label="OFAC" value={m.ofacCheck} />
          <R label="MATCH/TMF" value={m.matchTmfCheck} />
          <R label="Website" value={m.websiteReview} />
        </div>
      </div>

      <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-3 border-b border-border pb-2">Risk Scorecard</h3>
      <table className="w-full text-[13px] mb-8">
        <thead><tr className="border-b border-border">
          <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Dimension</th>
          <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Weight</th>
          <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Score</th>
        </tr></thead>
        <tbody>
          {scorecard.map(s => (
            <tr key={s.dim} className="border-b border-border/50">
              <td className="py-2">{s.dim}</td>
              <td className="py-2 text-right font-mono">{s.weight}</td>
              <td className="py-2 text-right font-mono">{s.score}</td>
            </tr>
          ))}
          <tr className="font-medium"><td className="py-2">Total</td><td /><td className="py-2 text-right font-mono">{m.riskScore}</td></tr>
        </tbody>
      </table>

      <div className="flex gap-3">
        <button onClick={() => alert("Merchant approved — entering trial period")} className="px-6 py-2 text-[13px] font-medium bg-black text-white">Approve</button>
        <button onClick={() => alert("Merchant rejected")} className="px-4 py-2 text-[13px] border border-danger text-danger">Reject</button>
        <button onClick={() => alert("Request sent to merchant")} className="px-4 py-2 text-[13px] border border-border">Request More Info</button>
      </div>
    </div>
  )
}

function R({ label, value }) {
  return <div className="flex justify-between"><span className="text-muted">{label}</span><span className="font-mono">{value}</span></div>
}
