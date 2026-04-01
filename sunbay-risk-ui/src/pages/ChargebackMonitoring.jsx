import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import MetricTooltip from '../components/shared/MetricTooltip'
import { merchants } from '../mock/merchants'
import { fmt } from '../utils/format'

const months = ['Oct','Nov','Dec','Jan','Feb','Mar']
const trendData = months.map(m => ({ month:m, rate:+(Math.random()*0.8+0.2).toFixed(3) }))

export default function ChargebackMonitoring() {
  const atRisk = merchants.filter(m => m.chargebackRate > 0.7).sort((a,b) => b.chargebackRate - a.chargebackRate)

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6"><MetricTooltip name="CB Rate"><span>Chargeback Rate Monitoring</span></MetricTooltip></h1>

      <div className="mb-10">
        <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">Platform CB Rate Trend (6 months)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trendData}>
            <XAxis dataKey="month" tick={{fontSize:11,fill:'#888'}} axisLine={{stroke:'#eaeaea'}} tickLine={false} />
            <YAxis tick={{fontSize:11,fill:'#888',fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} domain={[0,2]} />
            <Tooltip contentStyle={{fontSize:12,border:'1px solid #eaeaea',borderRadius:0}} />
            <ReferenceLine y={0.9} stroke="#FF4D4F" strokeDasharray="4 4" label={{value:'Visa 0.9%',fontSize:10,fill:'#FF4D4F',position:'right'}} />
            <ReferenceLine y={1.5} stroke="#FF4D4F" strokeDasharray="4 4" label={{value:'MC 1.5%',fontSize:10,fill:'#FF4D4F',position:'right'}} />
            <Line type="monotone" dataKey="rate" stroke="#1890FF" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 className="text-sm font-semibold mb-3">At-Risk Merchants (CB Rate &gt; 0.7%)</h3>
      <table className="w-full text-[13px]">
        <thead><tr className="border-b border-border">
          <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Merchant</th>
          <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">ISO</th>
          <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">CB Rate</th>
          <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Status</th>
        </tr></thead>
        <tbody>{atRisk.map(m => (
          <tr key={m.id} className="border-b border-border/50">
            <td className="py-2">{m.name}</td>
            <td className="py-2 text-muted">{m.isoId}</td>
            <td className="py-2 text-right font-mono text-danger">{fmt.pct(m.chargebackRate)}</td>
            <td className="py-2">{m.status}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
