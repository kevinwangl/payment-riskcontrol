import React from 'react'
import { useParams, Link } from 'react-router-dom'
import MetricTooltip from '../components/shared/MetricTooltip'
import { refundMerchants, refundDetails } from '../mock/refunds'
import { fmt } from '../utils/format'

const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const hours = ['9am','10am','11am','12pm','1pm','2pm','3pm','4pm']

export default function RefundMerchantDetail() {
  const { merchantId } = useParams()
  const merchant = refundMerchants.find(m => m.merchantId === merchantId)
  const detail = refundDetails[merchantId]

  if (!merchant) return <div className="text-muted py-20 text-center">Merchant not found</div>

  return (
    <div>
      <Link to="/refunds/monitoring" className="text-[12px] text-muted hover:text-primary">← Back to Refund Monitoring</Link>
      <h1 className="text-xl font-semibold mt-2 mb-6">{merchant.name} — Refund Analysis</h1>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {[
          { label:'Refund Rate', value:fmt.pct(merchant.refundRate), warn:merchant.refundRate > 10 },
          { label:'Amount Ratio', value:fmt.pct(merchant.amountRatio), warn:merchant.amountRatio > 15 },
          { label:'Full Refund Ratio', value:`${merchant.fullRefundRatio}%`, warn:merchant.fullRefundRatio > 80 },
          { label:'Fast Refund Rate', value:`${merchant.fastRefundRate}%`, warn:merchant.fastRefundRate > 30 },
        ].map(k => (
          <div key={k.label} className="border border-border p-4">
            <MetricTooltip name={k.label}><span className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium">{k.label}</span></MetricTooltip>
            <div className={`text-2xl font-mono mt-1 ${k.warn ? 'text-danger' : ''}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      {detail && (
        <div className="mb-10">
          <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-3">Refund Time Distribution (Hour × Day)</h3>
          <div className="inline-block">
            <div className="flex gap-0.5 mb-1 ml-12">
              {days.map(d => <div key={d} className="w-8 text-[10px] text-muted text-center">{d}</div>)}
            </div>
            {detail.hourlyHeatmap.map((row, hi) => (
              <div key={hi} className="flex items-center gap-0.5">
                <div className="w-10 text-[10px] text-muted text-right pr-1">{hours[hi]}</div>
                {row.map((v, di) => (
                  <div key={di} className="w-8 h-6 border border-border/30" style={{ background: v === 0 ? 'transparent' : `rgba(255,77,79,${Math.min(v/5, 1)})` }} title={`${days[di]} ${hours[hi]}: ${v} refunds`} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card Aggregation */}
      {detail && (
        <div className="mb-10">
          <h3 className="text-sm font-semibold mb-3">Card Refund Aggregation</h3>
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-border">
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Card</th>
              <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Refund Count</th>
              <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Total Refunded</th>
              <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Avg Time</th>
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Flag</th>
            </tr></thead>
            <tbody>{detail.cardAggregation.map(c => (
              <tr key={c.cardHash} className="border-b border-border/50">
                <td className="py-2 font-mono">{c.cardHash}</td>
                <td className={`py-2 text-right font-mono ${c.flagged ? 'text-danger' : ''}`}>{c.refundCount}</td>
                <td className="py-2 text-right font-mono">{fmt.usd(c.totalRefunded)}</td>
                <td className="py-2 text-right font-mono">{c.avgTimeToRefund}</td>
                <td className="py-2">{c.flagged && <span className="text-[11px] px-1.5 py-0.5 text-danger bg-danger/10">HIGH FREQ</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {/* Refund List */}
      {detail && (
        <>
          <h3 className="text-sm font-semibold mb-3">Recent Refunds</h3>
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-border">
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Refund ID</th>
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Card</th>
              <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Amount</th>
              <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Ratio</th>
              <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Time to Refund</th>
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Status</th>
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Date</th>
            </tr></thead>
            <tbody>{detail.refunds.map(r => (
              <tr key={r.refundId} className="border-b border-border/50">
                <td className="py-2 font-mono text-[12px]">{r.refundId}</td>
                <td className="py-2 font-mono">{r.cardHash}</td>
                <td className="py-2 text-right font-mono">{fmt.usd(r.refundAmount)}</td>
                <td className={`py-2 text-right font-mono ${r.refundRatio === 1.0 ? 'text-danger' : ''}`}>{(r.refundRatio * 100).toFixed(0)}%</td>
                <td className={`py-2 text-right font-mono ${r.timeToRefund.includes('m') && !r.timeToRefund.includes('h') ? 'text-danger' : ''}`}>{r.timeToRefund}</td>
                <td className="py-2"><span className={`text-[11px] ${r.status === 'COMPLETED' ? 'text-success' : 'text-muted'}`}>{r.status}</span></td>
                <td className="py-2 text-muted text-[12px]">{fmt.datetime(r.initiatedAt)}</td>
              </tr>
            ))}</tbody>
          </table>
        </>
      )}

      {!detail && <div className="text-muted text-center py-10">No detailed refund data available for this merchant.</div>}
    </div>
  )
}
