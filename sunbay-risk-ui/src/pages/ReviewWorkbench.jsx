import React, { useState, useEffect, useCallback } from 'react'
import RiskScore from '../components/shared/RiskScore'
import StatusBadge from '../components/shared/StatusBadge'
import { reviewQueue as initialQueue } from '../mock/reviewQueue'
import { fmt } from '../utils/format'
import MetricTooltip from '../components/shared/MetricTooltip'

export default function ReviewWorkbench() {
  const [queue, setQueue] = useState(initialQueue)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const current = queue[selectedIdx]

  const handleDecision = useCallback((label) => {
    if (!current) return
    setQueue(q => {
      const next = q.filter((_, i) => i !== selectedIdx)
      setSelectedIdx(i => Math.min(i, Math.max(0, next.length - 1)))
      return next
    })
  }, [current, selectedIdx])

  useEffect(() => {
    const handler = (e) => {
      // Don't capture when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      if (e.key === 'a' || e.key === 'A') handleDecision('LEGIT')
      else if (e.key === 'r' || e.key === 'R') handleDecision('FRAUD')
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(0, i - 1)) }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(queue.length - 1, i + 1)) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleDecision, queue.length])

  if (queue.length === 0) return <div className="flex items-center justify-center h-96 text-muted">🎉 All review tasks completed</div>

  return (
    <div className="flex gap-0 -mx-6 -mt-8" style={{height:'calc(100vh - 48px)'}}>
      {/* Left: Queue */}
      <div className="w-[320px] border-r border-border overflow-y-auto flex-shrink-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium">Priority Queue</span>
          <span className="text-[13px] text-muted">{queue.length} pending</span>
        </div>
        {queue.map((item, i) => (
          <div key={item.id} onClick={() => setSelectedIdx(i)}
            className={`px-4 py-3 border-b border-border/50 cursor-pointer ${i === selectedIdx ? 'bg-surface border-l-2 border-l-primary' : 'hover:bg-surface/50'}`}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[13px]">{item.id.slice(0,12)}</span>
              <RiskScore score={item.score} />
            </div>
            <div className="flex items-center justify-between mt-1 text-[12px] text-muted">
              <span>{fmt.time(item.timestamp)}</span>
              <span className="font-mono">{fmt.usd(item.amount)}</span>
            </div>
            {item.triggeredRules[0] && (
              <div className="mt-1"><span className="text-[11px] text-warning">■</span> <span className="text-[11px] text-muted">{item.reasonCode}</span></div>
            )}
          </div>
        ))}
      </div>

      {/* Right: Detail */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[900px] mx-auto px-8 py-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-[32px] font-mono">{fmt.usd(current.amount)}</div>
              <div className="text-[13px] text-muted mt-1">{current.id} · {fmt.datetime(current.timestamp)}</div>
              <div className="flex gap-2 mt-3">
                {current.triggeredRules.map(r => <span key={r} className="px-2 py-0.5 text-[11px] border border-danger text-danger">{r}</span>)}
                {current.entryMode === 'CNP' && <span className="px-2 py-0.5 text-[11px] border border-border">CNP</span>}
                {current.cardType === 'PREPAID' && <span className="px-2 py-0.5 text-[11px] border border-warning text-warning">Prepaid</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-muted tracking-[0.05em] uppercase"><MetricTooltip name="Risk Score">Risk Score</MetricTooltip></div>
              <div className="mt-1"><RiskScore score={current.score} /></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <Section title="Network & Device">
              <Row label="IP Address" value={current.ip} tag={current.ip.startsWith('192') ? 'VPN' : null} />
              <Row label="Device" value={current.deviceFingerprint} />
              <Row label="Entry Mode" value={current.entryMode} />
              <Row label="Country" value={current.country} />
            </Section>
            <Section title="Payment Method">
              <Row label="Card" value={`•••• ${current.cardLast4}`} extra={current.cardBrand} />
              <Row label="Type" value={current.cardType} />
              <Row label="Issuer Country" value={current.cardIssuerCountry} />
              <Row label={<MetricTooltip name="CVV Result">CVC Check</MetricTooltip>} value={current.cvvResult} color={current.cvvResult === 'M' ? 'text-success' : 'text-danger'} />
              <Row label={<MetricTooltip name="AVS Result">AVS Check</MetricTooltip>} value={current.avsResult} color={current.avsResult === 'Y' ? 'text-success' : 'text-danger'} />
            </Section>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <Section title="Velocity">
              <Row label="Card txns (1h)" value={current.velocity.cardCount1h} />
              <Row label="Card amount (1h)" value={fmt.usd(current.velocity.cardAmount1h)} />
              <Row label="IP txns (1h)" value={current.velocity.ipCount1h} />
            </Section>
            <Section title="Link Analysis">
              <Row label="Same device cards" value={current.linkAnalysis.sameDeviceCards} />
              <Row label="Same IP cards" value={current.linkAnalysis.sameIpCards} />
              <Row label="Shipping distance" value={`${current.shippingAddress.distance} miles`} color={current.shippingAddress.distance > 500 ? 'text-danger' : ''} />
            </Section>
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="sticky bottom-0 bg-white border-t border-border px-8 py-3 flex items-center justify-between">
          <span className="text-[12px] text-muted">Press ↑ ↓ to navigate</span>
          <div className="flex gap-3">
            <button onClick={() => handleDecision('FRAUD')} className="px-4 py-2 text-[13px] font-medium border border-danger text-danger hover:bg-danger/5">
              Reject <span className="ml-2 text-[11px] text-muted border border-border px-1">R</span>
            </button>
            <button onClick={() => handleDecision('LEGIT')} className="px-4 py-2 text-[13px] font-medium border border-black hover:bg-surface">
              Approve <span className="ml-2 text-[11px] text-muted border border-border px-1">A</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-3 pb-2 border-b border-border">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({ label, value, tag, extra, color }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-muted">{label}</span>
      <span className={`font-mono ${color || ''}`}>
        {value} {tag && <span className="ml-1 px-1 py-0.5 text-[10px] border border-warning text-warning">{tag}</span>}
        {extra && <span className="ml-1 text-muted">{extra}</span>}
      </span>
    </div>
  )
}
