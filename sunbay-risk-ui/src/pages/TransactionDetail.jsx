import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import StatusBadge from '../components/shared/StatusBadge'
import RiskScore from '../components/shared/RiskScore'
import { transactions } from '../mock/transactions'
import { fmt } from '../utils/format'
import MetricTooltip from '../components/shared/MetricTooltip'

export default function TransactionDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const t = transactions.find(x => x.id === id)
  if (!t) return <div className="text-muted">Transaction not found</div>

  return (
    <div className="max-w-[900px]">
      <button onClick={() => nav('/transactions')} className="text-[13px] text-muted hover:text-black mb-4">← Back</button>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-[32px] font-mono">{fmt.usd(t.amount)}</div>
          <div className="text-[13px] text-muted mt-1">{t.id} · {fmt.datetime(t.timestamp)}</div>
          <div className="flex gap-2 mt-2">
            <StatusBadge status={t.decision} />
            {t.suggestions.map(s => <span key={s} className="px-2 py-0.5 text-[11px] border border-primary text-primary">{s}</span>)}
          </div>
        </div>
        <RiskScore score={t.score} />
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <Section title="Transaction">
          <R label={<MetricTooltip name="MCC"><span>MCC</span></MetricTooltip>} value={t.mcc} /><R label={<MetricTooltip name="Entry Mode"><span>Entry Mode</span></MetricTooltip>} value={t.entryMode} /><R label="Country" value={t.country} /><R label="Merchant" value={t.merchantName} link={() => nav(`/merchants/${t.merchantId}`)} />
        </Section>
        <Section title="Card">
          <R label="BIN" value={t.cardBin} /><R label="Brand" value={t.cardBrand} /><R label="Type" value={t.cardType} /><R label="Issuer" value={t.cardIssuerCountry} />
          <R label={<MetricTooltip name="AVS Result"><span>AVS</span></MetricTooltip>} value={t.avsResult} color={t.avsResult==='Y'?'text-success':'text-danger'} />
          <R label={<MetricTooltip name="CVV Result"><span>CVV</span></MetricTooltip>} value={t.cvvResult} color={t.cvvResult==='M'?'text-success':'text-danger'} />
        </Section>
      </div>

      <Section title="Risk Decision">
        <R label={<MetricTooltip name="Risk Score"><span>Risk Score</span></MetricTooltip>} value={t.score} /><R label="Reason" value={t.reasonCode || '—'} />
        <div className="mt-2">
          <span className="text-[13px] text-muted">Triggered Rules: </span>
          {t.triggeredRules.length ? t.triggeredRules.map(r => <span key={r} className="font-mono text-[12px] mr-2 px-1.5 py-0.5 bg-surface">{r}</span>) : <span className="text-muted text-[13px]">None</span>}
        </div>
      </Section>

      <div className="mt-4 text-[13px] text-muted">Network: {t.ip} · Device: {t.deviceFingerprint}</div>
    </div>
  )
}

function Section({ title, children }) {
  return <div className="mb-6"><h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-3 pb-2 border-b border-border">{title}</h3><div className="space-y-2">{children}</div></div>
}
function R({ label, value, color, link }) {
  return <div className="flex justify-between text-[13px]"><span className="text-muted">{label}</span><span className={`font-mono ${color||''} ${link?'text-primary cursor-pointer':''}`} onClick={link}>{value}</span></div>
}
