import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import StatusBadge from '../components/shared/StatusBadge'
import { merchants } from '../mock/merchants'
import { chargebacks } from '../mock/chargebacks'
import { mockDevices } from '../mock/devices'
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
        <StatusBadge status={m.status} />
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <Section title="Basic Info">
          <Row label="ID" value={m.id} />
          <Row label="ISO" value={m.isoId} />
          <Row label="MCC" value={m.mcc} />
        </Section>
        <Section title="Risk Parameters">
          <Row label={<MetricTooltip name="Risk Score"><span>Risk Level</span></MetricTooltip>} value={m.riskLevel} />
          <Row label={<MetricTooltip name="Single Txn Limit"><span>Single Limit</span></MetricTooltip>} value={fmt.usd(m.singleTxnLimit)} />
          <Row label="Daily Limit" value={fmt.usd(m.dailyLimit)} />
          <Row label={<MetricTooltip name="Monthly Limit"><span>Monthly Limit</span></MetricTooltip>} value={fmt.usd(m.monthlyLimit)} />
          <Row label={<MetricTooltip name="Settlement Cycle"><span>Settlement Cycle</span></MetricTooltip>} value={m.settlementCycle} />
          <Row label="Require 3DS" value={m.require3ds ? 'Yes' : 'No'} />
          <Row label={<MetricTooltip name="CB Rate"><span>CB Rate</span></MetricTooltip>} value={fmt.pct(m.chargebackRate)} />
        </Section>
      </div>

      {mCbs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Chargeback Records</h3>
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-border">
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">ID</th>
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Amount</th>
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Outcome</th>
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Reason</th>
            </tr></thead>
            <tbody>{mCbs.map(c => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-surface">
                <td className="py-2 font-mono">{c.id}</td>
                <td className="py-2 font-mono">{fmt.usd(c.amount)}</td>
                <td className="py-2"><StatusBadge status={c.outcome || 'PENDING'} /></td>
                <td className="py-2 text-muted">{c.reasonDesc}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {mockDevices.filter(d => d.merchant_id === id).length > 0 && (
      <div className="mt-8">
        <h3 className="text-sm font-semibold mb-3">Associated Devices</h3>
        <table className="w-full text-[13px]">
          <thead><tr className="border-b border-border">
            <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Device ID</th>
            <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Category</th>
            <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Model</th>
            <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Status</th>
          </tr></thead>
          <tbody>{mockDevices.filter(d => d.merchant_id === id).map(d => (
            <tr key={d.device_id} className="border-b border-border/50 hover:bg-surface">
              <td className="py-2 font-mono">{d.device_id}</td>
              <td className="py-2">{d.device_category}</td>
              <td className="py-2">{d.manufacturer} {d.model}</td>
              <td className="py-2"><StatusBadge status={d.status === 'ACTIVE' ? 'APPROVED' : d.status} /></td>
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
