import React from 'react'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import MetricTooltip from '../components/shared/MetricTooltip'
import { refundMerchants, refundTrend, refundAlerts, platformKPI } from '../mock/refunds'
import { fmt } from '../utils/format'

const levelColor = { CRITICAL:'text-danger', WARNING:'text-warning', INFO:'text-muted' }
const levelBg = { CRITICAL:'bg-danger/10', WARNING:'bg-warning/10', INFO:'bg-muted/10' }

export default function RefundMonitoring() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Refund Anomaly Monitoring</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {[
          { label:'Refund Rate', value:fmt.pct(platformKPI.refundRate), warn:platformKPI.refundRate > 10 },
          { label:'Amount Ratio', value:fmt.pct(platformKPI.amountRatio), warn:platformKPI.amountRatio > 15 },
          { label:'Full Refund Ratio', value:fmt.pct(platformKPI.fullRefundRatio), warn:platformKPI.fullRefundRatio > 80 },
          { label:'Fast Refund Rate', value:fmt.pct(platformKPI.fastRefundRate), warn:platformKPI.fastRefundRate > 30 },
        ].map(k => (
          <div key={k.label} className="border border-border p-4">
            <MetricTooltip name={k.label}><span className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium">{k.label}</span></MetricTooltip>
            <div className={`text-2xl font-mono mt-1 ${k.warn ? 'text-danger' : ''}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Trend Chart */}
      <div className="mb-10">
        <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">Refund Trend (6 months)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={refundTrend}>
            <XAxis dataKey="date" tick={{fontSize:11,fill:'#888'}} axisLine={{stroke:'#eaeaea'}} tickLine={false} />
            <YAxis yAxisId="count" tick={{fontSize:11,fill:'#888',fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} />
            <YAxis yAxisId="amount" orientation="right" tick={{fontSize:11,fill:'#888',fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{fontSize:12,border:'1px solid #eaeaea',borderRadius:0}} />
            <ReferenceLine yAxisId="count" y={platformKPI.refundRate * 10} stroke="#FF4D4F" strokeDasharray="4 4" label={{value:'10% threshold',fontSize:10,fill:'#FF4D4F',position:'right'}} />
            <ReferenceLine yAxisId="count" y={platformKPI.refundRate * 15} stroke="#FF4D4F" strokeDasharray="4 4" label={{value:'15% threshold',fontSize:10,fill:'#FF4D4F',position:'right'}} />
            <Line yAxisId="count" type="monotone" dataKey="count" stroke="#1890FF" strokeWidth={2} dot name="Refund Count" />
            <Line yAxisId="amount" type="monotone" dataKey="amount" stroke="#52C41A" strokeWidth={2} dot name="Refund Amount" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Merchant Ranking */}
      <h3 className="text-sm font-semibold mb-3">Merchant Refund Rate Ranking</h3>
      <table className="w-full text-[13px] mb-10">
        <thead><tr className="border-b border-border">
          <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Merchant</th>
          <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">ISO</th>
          <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Refund Rate</th>
          <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Amount Ratio</th>
          <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Full Refund %</th>
          <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Fast Refund %</th>
          <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Alert</th>
        </tr></thead>
        <tbody>{refundMerchants.map(m => (
          <tr key={m.merchantId} className="border-b border-border/50">
            <td className="py-2"><Link to={`/refunds/monitoring/${m.merchantId}`} className="text-primary hover:underline">{m.name}</Link></td>
            <td className="py-2 text-muted">{m.isoId}</td>
            <td className={`py-2 text-right font-mono ${m.refundRate > 10 ? 'text-danger' : ''}`}>{fmt.pct(m.refundRate)}</td>
            <td className={`py-2 text-right font-mono ${m.amountRatio > 15 ? 'text-danger' : ''}`}>{fmt.pct(m.amountRatio)}</td>
            <td className={`py-2 text-right font-mono ${m.fullRefundRatio > 80 ? 'text-danger' : ''}`}>{m.fullRefundRatio}%</td>
            <td className={`py-2 text-right font-mono ${m.fastRefundRate > 30 ? 'text-danger' : ''}`}>{m.fastRefundRate}%</td>
            <td className="py-2">{m.alertLevel && <span className={`text-[11px] px-1.5 py-0.5 ${levelColor[m.alertLevel]} ${levelBg[m.alertLevel]}`}>{m.alertLevel}</span>}</td>
          </tr>
        ))}</tbody>
      </table>

      {/* Alerts */}
      <h3 className="text-sm font-semibold mb-3">Active Alerts</h3>
      <div className="space-y-2">
        {refundAlerts.map(a => (
          <div key={a.id} className={`border border-border p-3 flex items-start gap-3 ${a.level === 'CRITICAL' ? 'border-l-2 border-l-danger' : a.level === 'WARNING' ? 'border-l-2 border-l-warning' : ''}`}>
            <span className={`text-[11px] px-1.5 py-0.5 shrink-0 ${levelColor[a.level]} ${levelBg[a.level]}`}>{a.level}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px]"><Link to={`/refunds/monitoring/${a.merchantId}`} className="text-primary hover:underline">{a.merchantName}</Link> — {a.message}</div>
              <div className="text-[11px] text-muted mt-0.5">{fmt.datetime(a.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
