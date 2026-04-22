import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import StatusBadge from '../components/shared/StatusBadge'
import RiskScore from '../components/shared/RiskScore'
import { transactions } from '../mock/transactions'
import { rules } from '../mock/rules'
import { deviceRiskRules } from '../mock/devices'
import { fmt } from '../utils/format'
import MetricTooltip from '../components/shared/MetricTooltip'

const allRules = [...rules, ...deviceRiskRules]

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

      <Section title="Risk Score Breakdown">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-[28px] font-mono font-semibold">{t.score}</span>
          <StatusBadge status={t.decision} />
          <span className="text-[13px] text-muted">threshold: 70</span>
        </div>
        {/* Score bar */}
        <div className="relative h-7 bg-surface mb-4 overflow-hidden">
          <div className="absolute inset-y-0 left-0 bg-success/20" style={{ width: `${Math.min(100, (70 / 140) * 100)}%` }} />
          <div className="absolute inset-y-0 bg-danger/20" style={{ left: `${(70 / 140) * 100}%`, right: 0 }} />
          <div className="absolute inset-y-0 w-0.5 bg-danger" style={{ left: `${(70 / 140) * 100}%` }} />
          <div className="absolute inset-y-0 w-1 bg-black" style={{ left: `${Math.min(100, (t.score / 140) * 100)}%` }} />
          <div className="absolute bottom-0 text-[9px] font-mono" style={{ left: `${Math.min(95, (t.score / 140) * 100)}%` }}>▲{t.score}</div>
        </div>
        {/* Score composition */}
        {t.triggeredRules.length > 0 && (
          <div className="space-y-1.5">
            {t.triggeredRules.map(rId => {
              const rule = allRules.find(r => r.id === rId)
              if (!rule) return <div key={rId} className="flex items-center gap-2 text-[12px]"><span className="font-mono w-[60px]">{rId}</span><span className="text-success">✓ HIT</span></div>
              const w = rule.action?.score_weight || 0
              return (
                <div key={rId} className="flex items-center gap-2 text-[12px]">
                  <span className="font-mono w-[60px] flex-shrink-0">{rId}</span>
                  <span className="w-[180px] truncate">{rule.name}</span>
                  <div className="flex-1 h-3 bg-surface overflow-hidden">
                    {w > 0 && <div className="h-full bg-danger/40" style={{ width: `${(w / 30) * 100}%` }} />}
                  </div>
                  <span className="font-mono w-[40px] text-right">{w > 0 ? `+${w}` : '—'}</span>
                  <span className="text-success w-[50px]">✓ HIT</span>
                </div>
              )
            })}
            {/* Show non-triggered score rules as MISS */}
            {rules.filter(r => r.action.score_weight > 0 && !t.triggeredRules.includes(r.id)).slice(0, 3).map(r => (
              <div key={r.id} className="flex items-center gap-2 text-[12px] opacity-40">
                <span className="font-mono w-[60px] flex-shrink-0">{r.id}</span>
                <span className="w-[180px] truncate">{r.name}</span>
                <div className="flex-1 h-3 bg-surface" />
                <span className="font-mono w-[40px] text-right">0</span>
                <span className="text-muted w-[50px]">✗ MISS</span>
              </div>
            ))}
          </div>
        )}
        {t.triggeredRules.length === 0 && <div className="text-[13px] text-muted">No rules triggered — transaction passed all checks.</div>}
        <R label="Reason Code" value={t.reasonCode || '—'} />
      </Section>

      {t.device && (
      <Section title="Device Information">
        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
          <R label="Device ID" value={t.device.device_id} />
          <R label="Category" value={t.device.device_category} />
          <R label="Acceptance" value={t.device.acceptance_method} />
          <R label="Model" value={`${t.device.manufacturer} ${t.device.model}`} />
          {t.device.os && <R label="OS" value={`${t.device.os} ${t.device.os_version}`} />}
          {t.device.app_version && <R label="App Version" value={t.device.app_version} />}
          {t.device.attestation && <R label="Attestation" value={t.device.attestation.status} color={t.device.attestation.status === 'VERIFIED' ? 'text-success' : 'text-danger'} />}
          {t.device.security?.tee_available !== undefined && <R label="TEE" value={t.device.security.tee_available ? 'Available' : 'Unavailable'} />}
          {t.device.security?.is_rooted !== undefined && <R label="Root" value={t.device.security.is_rooted ? 'Detected' : 'Clean'} color={t.device.security.is_rooted ? 'text-danger' : 'text-success'} />}
          {t.device.security?.debug_mode !== undefined && <R label="Debug Mode" value={t.device.security.debug_mode ? 'On' : 'Off'} color={t.device.security.debug_mode ? 'text-danger' : ''} />}
          {t.device.security?.is_emulator !== undefined && <R label="Emulator" value={t.device.security.is_emulator ? 'Detected' : 'No'} color={t.device.security.is_emulator ? 'text-danger' : ''} />}
          {t.device.security?.hook_framework_detected !== undefined && <R label="Hook Framework" value={t.device.security.hook_framework_detected ? 'Detected' : 'No'} color={t.device.security.hook_framework_detected ? 'text-danger' : ''} />}
          {t.device.firmware_version && <R label="Firmware" value={t.device.firmware_version} />}
          {t.device.pts_cert_expiry && <R label="PTS Expiry" value={t.device.pts_cert_expiry} />}
          {t.device.location && <R label="Location" value={`${t.device.location.lat.toFixed(4)}, ${t.device.location.lng.toFixed(4)}`} />}
        </div>
      </Section>
      )}

    </div>
  )
}

function Section({ title, children }) {
  return <div className="mb-6"><h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-3 pb-2 border-b border-border">{title}</h3><div className="space-y-2">{children}</div></div>
}
function R({ label, value, color, link }) {
  return <div className="flex justify-between text-[13px]"><span className="text-muted">{label}</span><span className={`font-mono ${color||''} ${link?'text-primary cursor-pointer':''}`} onClick={link}>{value}</span></div>
}
