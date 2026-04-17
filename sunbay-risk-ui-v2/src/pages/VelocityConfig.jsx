import React, { useState } from 'react'
import { deviceVelocityTemplates } from '../mock/devices'

const initialRules = [
  { id:'V1', name:'Card Txn Count', key:'vel:{card_hash}:cnt:{window}', windows:['5m','1h','24h'], thresholds:[10,5,20], tenant:'Platform' },
  { id:'V2', name:'Card Txn Amount', key:'vel:{card_hash}:amt:{window}', windows:['1h','24h'], thresholds:[5000,10000], tenant:'Platform' },
  { id:'V3', name:'IP Txn Count', key:'vel:{ip}:cnt:{window}', windows:['5m','1h'], thresholds:[20,50], tenant:'Platform' },
  { id:'V4', name:'Device Txn Count', key:'vel:{device_fp}:cnt:{window}', windows:['1h','24h'], thresholds:[10,30], tenant:'Platform' },
  { id:'V5', name:'Merchant+Card Count', key:'vel:{merchant}:{card_hash}:cnt:{window}', windows:['1h','24h'], thresholds:[3,5], tenant:'Platform' },
  { id:'V6', name:'ISO Custom Card Limit', key:'vel:{card_hash}:cnt:{window}', windows:['1h'], thresholds:[8], tenant:'ISO_2001' },
  ...deviceVelocityTemplates.map((t,i) => ({ id:`VD${i+1}`, name:t.name, key:t.key, windows:t.windows, thresholds:t.thresholds, tenant:'Platform' })),
]

export default function VelocityConfig() {
  const [rules, setRules] = useState(initialRules)
  const [saved, setSaved] = useState(false)

  const updateThreshold = (ruleIdx, windowIdx, val) => {
    setRules(prev => prev.map((r, ri) => ri === ruleIdx ? {
      ...r, thresholds: r.thresholds.map((t, wi) => wi === windowIdx ? Number(val) || 0 : t)
    } : r))
    setSaved(false)
  }

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const handleAdd = () => {
    setRules([...rules, {
      id: `V${Date.now()}`, name: 'New Counter', key: 'vel:{entity}:cnt:{window}',
      windows: ['1h'], thresholds: [10], tenant: 'ISO_2001',
    }])
  }

  const handleDelete = (id) => setRules(rules.filter(r => r.id !== id))

  // Flatten for display
  const rows = []
  rules.forEach((r, ri) => {
    r.windows.forEach((w, wi) => {
      rows.push({ rule: r, ruleIdx: ri, window: w, windowIdx: wi, threshold: r.thresholds[wi], isFirst: wi === 0 })
    })
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Velocity Configuration</h1>
        {saved && <span className="text-[13px] text-success">✓ Saved</span>}
      </div>
      <table className="w-full text-[13px]">
        <thead><tr className="border-b border-border">
          {['Counter','Key Pattern','Window','Threshold','Scope',''].map(h => (
            <th key={h} className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2 pr-4">{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.rule.id}-${row.window}`} className="border-b border-border/50 hover:bg-surface">
              <td className="py-2 pr-4">{row.isFirst ? row.rule.name : ''}</td>
              <td className="py-2 pr-4 font-mono text-[12px] text-muted">{row.rule.key.replace('{window}', row.window)}</td>
              <td className="py-2 pr-4 font-mono">{row.window}</td>
              <td className="py-2 pr-4">
                <input type="number" value={row.threshold}
                  onChange={e => row.rule.tenant !== 'Platform' && updateThreshold(row.ruleIdx, row.windowIdx, e.target.value)}
                  readOnly={row.rule.tenant === 'Platform'}
                  className={`w-20 border border-border px-2 py-1 text-[13px] font-mono text-right ${row.rule.tenant === 'Platform' ? 'bg-surface text-muted cursor-not-allowed' : ''}`} />
              </td>
              <td className="py-2 pr-4 text-muted">{row.rule.tenant}</td>
              <td className="py-2 pr-4">
                {row.isFirst && row.rule.tenant !== 'Platform' && (
                  <button onClick={() => handleDelete(row.rule.id)} className="text-[12px] text-danger hover:underline">Delete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex gap-3">
        <button onClick={handleSave} className="px-4 py-2 text-[13px] bg-black text-white">Save Changes</button>
        <button onClick={handleAdd} className="px-4 py-2 text-[13px] text-primary border border-border">+ Add Counter</button>
      </div>
    </div>
  )
}
