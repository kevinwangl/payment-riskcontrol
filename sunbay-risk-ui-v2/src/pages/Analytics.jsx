import React from 'react'
import StatusBadge from '../components/shared/StatusBadge'
import { topRules, topEntities, topAffectedDevices } from '../mock/dashboard'
import { fmt } from '../utils/format'

const dot = { danger: 'bg-danger', warning: 'bg-warning' }
const catStyle = { COTS: 'text-danger', Dedicated: 'text-primary', POS: 'text-success' }

export default function Analytics() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Risk Analytics</h1>

      {/* Top Rules & Entities */}
      <div className="grid grid-cols-2 gap-12 mb-10">
        <div>
          <h3 className="text-sm font-semibold mb-3">Top Breached Rules</h3>
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-border">
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Rule ID</th>
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Action</th>
              <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Hit Count</th>
            </tr></thead>
            <tbody>{topRules.map(r => (
              <tr key={r.ruleId} className="border-b border-border/50 hover:bg-surface">
                <td className="py-2 font-mono">{r.ruleId}</td>
                <td className="py-2"><StatusBadge status={r.action} /></td>
                <td className="py-2 text-right font-mono">{fmt.num(r.hitCount)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3">Highest Risk Entities</h3>
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-border">
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Entity</th>
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Type</th>
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Score</th>
              <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Hits</th>
            </tr></thead>
            <tbody>{topEntities.map(e => (
              <tr key={e.entity} className="border-b border-border/50 hover:bg-surface">
                <td className="py-2 font-mono">{e.entity}</td>
                <td className="py-2">{e.type}</td>
                <td className="py-2 font-mono text-danger">{e.riskScore}</td>
                <td className="py-2 text-right font-mono">{fmt.num(e.hitCount)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {/* Top Affected Devices */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Top Affected Devices</h3>
        <table className="w-full text-[13px]">
          <thead><tr className="border-b border-border">
            <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2 w-5"></th>
            <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Model</th>
            <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Category</th>
            <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Issue</th>
            <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Count</th>
          </tr></thead>
          <tbody>{topAffectedDevices.map((d, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-surface">
              <td className="py-2"><span className={`inline-block w-1.5 h-1.5 rounded-full ${dot[d.level]}`} /></td>
              <td className="py-2 font-mono">{d.model}</td>
              <td className={`py-2 text-[12px] ${catStyle[d.category] || 'text-muted'}`}>{d.category}</td>
              <td className="py-2">{d.issue}</td>
              <td className="py-2 text-right font-mono">{d.count}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}
