import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '../components/shared/StatusBadge'
import RiskScore from '../components/shared/RiskScore'
import { transactions } from '../mock/transactions'
import { rules } from '../mock/rules'
import { deviceRiskRules } from '../mock/devices'
import { fmt } from '../utils/format'

const allRules = [...rules, ...deviceRiskRules]

export default function TransactionLedger() {
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = transactions.filter(t =>
    !filter || t.id.includes(filter) || t.merchantName.toLowerCase().includes(filter.toLowerCase()) || t.decision === filter.toUpperCase()
  )

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Transaction Ledger</h1>

      <div className="mb-4">
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search by ID, merchant, or status..."
          className="border-0 border-b border-border pb-2 text-[13px] w-[400px] outline-none focus:border-primary font-mono" />
      </div>
      <div className="flex">
        <div className={`${selected ? 'w-[60%]' : 'w-full'} overflow-x-auto`}>
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-border">
              {['Transaction ID','Timestamp','Amount','Merchant','Score','Decision'].map(h => (
                <th key={h} className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2 pr-4">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.slice(0,50).map(t => (
                <tr key={t.id} onClick={() => setSelected(s => s?.id === t.id ? null : t)}
                  className={`border-b border-border/50 cursor-pointer hover:bg-surface ${selected?.id === t.id ? 'bg-surface' : ''}`} style={{height:32}}>
                  <td className="py-1 pr-4 font-mono text-[12px]">{t.id.slice(0,16)}</td>
                  <td className="py-1 pr-4 text-muted text-[12px] font-mono">{fmt.datetime(t.timestamp)}</td>
                  <td className="py-1 pr-4 font-mono">{fmt.usd(t.amount)}</td>
                  <td className="py-1 pr-4">{t.merchantName}</td>
                  <td className="py-1 pr-4"><RiskScore score={t.score} /></td>
                  <td className="py-1 pr-4"><StatusBadge status={t.decision} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <TxnInspector txn={selected} />
        )}
      </div>
    </div>
  )
}

function TxnInspector({ txn: t }) {
  const [showJson, setShowJson] = useState(false)
  const matched = t.triggeredRules.map(id => allRules.find(r => r.id === id)).filter(Boolean)
  const d = t.device

  return (
    <div className="w-[40%] border-l border-border pl-6 ml-6 overflow-y-auto" style={{maxHeight:'calc(100vh - 200px)'}}>
      <div className="flex items-center justify-between mb-4">
        <Link to={`/transactions/${t.id}`} className="font-mono text-sm font-medium text-primary hover:underline">{t.id.slice(0,16)} →</Link>
        <span className="text-[12px] text-muted">{t.entryMode} · {t.ip}</span>
      </div>

      {/* Triggered Rules */}
      <div className="mb-4">
        <div className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-2">
          Triggered Rules {matched.length > 0 && <span className="text-danger">({matched.length})</span>}
        </div>
        {matched.length === 0 && <div className="text-[12px] text-muted py-1">No rules triggered</div>}
        {matched.map(r => (
          <div key={r.id} className="py-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-medium">{r.id}</span>
              <span className="text-[12px]">{r.name}</span>
              <StatusBadge status={r.action?.decision || r.risk_level || ''} />
            </div>
            <div className="font-mono text-[10px] text-muted mt-1 truncate" title={r.condition}>{r.condition}</div>
          </div>
        ))}
        {t.reasonCode && <div className="text-[11px] text-muted mt-2">Reason: <span className="font-mono">{t.reasonCode}</span></div>}
        <div className="text-[10px] text-muted mt-1">Score = Σ(Rule Weight × Match) · 0-70 APPROVE · 71+ DECLINE</div>
      </div>

      {/* Device Summary */}
      {d && (
        <div className="mb-4 pb-4 border-b border-border">
          <div className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-2">Device</div>
          <div className="text-[12px]">
            <span className="font-mono">{d.device_category}</span> · {d.manufacturer} {d.model} · {d.acceptance_method}
          </div>
          <div className="flex gap-4 mt-1 text-[11px]">
            {d.attestation && <span>Attestation: <span className={d.attestation.status === 'VERIFIED' ? 'text-success' : 'text-danger'}>{d.attestation.status}</span></span>}
            {d.security?.is_rooted !== undefined && <span>Root: <span className={d.security.is_rooted ? 'text-danger' : 'text-success'}>{d.security.is_rooted ? 'Yes' : 'Clean'}</span></span>}
            {d.security?.tee_available !== undefined && <span>TEE: <span className={d.security.tee_available ? 'text-success' : 'text-danger'}>{d.security.tee_available ? '✓' : '✗'}</span></span>}
            {d.firmware_version && <span>FW: {d.firmware_version}</span>}
          </div>
          {d.location && <div className="text-[11px] text-muted mt-1">📍 {d.location.lat.toFixed(4)}, {d.location.lng.toFixed(4)} ({d.location.source})</div>}
        </div>
      )}

      {/* Collapsible Raw JSON */}
      <button onClick={() => setShowJson(!showJson)} className="text-[12px] text-muted hover:text-black mb-2">
        {showJson ? '▾' : '▸'} Raw JSON
      </button>
      {showJson && (
        <pre className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap bg-surface p-3 max-h-[300px] overflow-y-auto">
          <JsonHighlight data={{
            id:t.id, amount:Number(t.amount)*100, currency:t.currency, status:t.decision.toLowerCase(),
            merchant:{id:t.merchantId,name:t.merchantName,mcc:t.mcc},
            card:{brand:t.cardBrand,country:t.cardIssuerCountry,last4:t.cardLast4,type:t.cardType},
            risk:{score:t.score,rules:t.triggeredRules,reason:t.reasonCode,suggestions:t.suggestions},
            ip:t.ip, ...(t.device?{device:t.device}:{}),
          }} />
        </pre>
      )}
    </div>
  )
}

function JsonHighlight({ data }) {
  const json = JSON.stringify(data, null, 2)
  return json.split('\n').map((line, i) => {
    const parts = []
    let rest = line
    // Match key
    const km = rest.match(/^(\s*)"([^"]+)":/)
    if (km) {
      parts.push(km[1])
      parts.push(<span key="k" className="text-black">"{km[2]}"</span>)
      parts.push(': ')
      rest = rest.slice(km[0].length).replace(/^\s*/, '')
    }
    // Match value
    const sm = rest.match(/^"([^"]*)"(.*)/)
    const bm = rest.match(/^(true|false)(.*)/)
    const nm = rest.match(/^(-?\d+\.?\d*)(.*)/)
    if (sm) { parts.push(<span key="v" className="text-primary">"{sm[1]}"</span>); parts.push(sm[2]) }
    else if (bm) { parts.push(<span key="v" className="text-success">{bm[1]}</span>); parts.push(bm[2]) }
    else if (nm) { parts.push(<span key="v" className="text-black">{nm[1]}</span>); parts.push(nm[2]) }
    else parts.push(rest)
    return <span key={i}>{parts}{'\n'}</span>
  })
}