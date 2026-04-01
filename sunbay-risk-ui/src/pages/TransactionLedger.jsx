import React, { useState } from 'react'
import StatusBadge from '../components/shared/StatusBadge'
import RiskScore from '../components/shared/RiskScore'
import { transactions } from '../mock/transactions'
import { fmt } from '../utils/format'

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
                <tr key={t.id} onClick={() => setSelected(t)}
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

        {/* JSON Inspector Drawer */}
        {selected && (
          <div className="w-[40%] border-l border-border pl-6 ml-6 overflow-y-auto" style={{maxHeight:'calc(100vh - 200px)'}}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-mono text-sm font-medium">{selected.id.slice(0,16)}</div>
                <div className="text-[11px] text-muted">RAW PAYLOAD INSPECTOR</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted hover:text-black text-lg">×</button>
            </div>
            <pre className="text-[12px] font-mono leading-relaxed whitespace-pre-wrap">
              {JSON.stringify({
                id: selected.id, object:'transaction', amount: Number(selected.amount)*100,
                currency: selected.currency, status: selected.decision.toLowerCase(),
                merchant: { id: selected.merchantId, name: selected.merchantName, mcc: selected.mcc },
                payment_method: { card: { brand: selected.cardBrand, country: selected.cardIssuerCountry, last4: selected.cardLast4, type: selected.cardType }},
                risk_details: { score: selected.score, rules_evaluated: selected.triggeredRules, suggestions: selected.suggestions },
                client_ip: selected.ip, device_id: selected.deviceFingerprint,
              }, null, 2).replace(/"([^"]+)":/g, '<span class="text-black">"$1"</span>:').replace(/: "([^"]+)"/g, ': <span class="text-primary">"$1"</span>').replace(/: (true|false)/g, ': <span class="text-success">$1</span>').replace(/: (\d+)/g, ': <span class="text-black">$1</span>')}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
