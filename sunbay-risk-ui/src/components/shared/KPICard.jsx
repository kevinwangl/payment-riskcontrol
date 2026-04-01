import React from 'react'

export default function KPICard({ label, value, trend, trendDir }) {
  const color = trendDir === 'up' ? 'text-danger' : trendDir === 'down' ? 'text-success' : 'text-muted'
  const arrow = trendDir === 'up' ? '↑' : trendDir === 'down' ? '↓' : ''
  return (
    <div className="flex-1 py-4 border-b border-border">
      <div className="text-[11px] text-muted tracking-[0.08em] uppercase font-medium">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-[32px] font-mono font-normal leading-none">{value}</span>
        {trend && <span className={`text-[13px] ${color}`}>{arrow}{trend}</span>}
      </div>
    </div>
  )
}
