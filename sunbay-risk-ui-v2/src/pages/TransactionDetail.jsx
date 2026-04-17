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

      <Section title="Risk Decision">
        <R label="Reason Code" value={t.reasonCode || '—'} />
        <div className="mt-2 mb-1 text-[11px] text-muted">
          Score = Σ(Rule Weight × Match) · 0-70 APPROVE · 71+ DECLINE
        </div>

        {t.triggeredRules.length > 0 && (
          <div className="mt-4">
            <div className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-2">Triggered Rules ({t.triggeredRules.length})</div>
            <div className="space-y-2">
              {t.triggeredRules.map(rId => {
                const rule = allRules.find(r => r.id === rId)
                if (!rule) return <div key={rId} className="px-3 py-2 bg-surface text-[13px] font-mono">{rId}</div>
                const isDevice = rId.startsWith('DEV-')
                return (
                  <div key={rId} className="border border-border p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] font-medium">{rId}</span>
                        <span className="text-[13px]">{rule.name}</span>
                        {isDevice && <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary">DEVICE</span>}
                      </div>
                      <StatusBadge status={rule.action?.decision || rule.risk_level || ''} />
                    </div>
                    <div className="font-mono text-[11px] text-muted mt-1.5 bg-surface px-2 py-1">{rule.condition}</div>
                    <div className="flex gap-4 mt-1.5 text-[11px] text-muted">
                      <span>Reason: <span className="font-mono">{rule.reasonCode || rule.reason_code}</span></span>
                      <span>Tenant: {rule.tenant}</span>
                      {rule.priority !== undefined && <span>Priority: {rule.priority}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {t.triggeredRules.length === 0 && <div className="mt-2 text-[13px] text-muted">No rules triggered — transaction passed all checks.</div>}
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
