import React from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine, Legend } from 'recharts'
import KPICard from '../components/shared/KPICard'
import StatusBadge from '../components/shared/StatusBadge'
import MetricTooltip from '../components/shared/MetricTooltip'
import { dashboardData } from '../mock/dashboard'
import { fmt } from '../utils/format'

export default function Dashboard() {
  const { kpis, txnTrend, cbRateTrend, topRules, topEntities, deviceAttestation30d, deviceCategoryTrend, geofenceTrend30d, deviceRuleHits7d } = dashboardData
  const deviceStats = {
    attestFailRate: (deviceAttestation30d.reduce((s,d) => s+d.rate, 0) / deviceAttestation30d.length).toFixed(1),
    geofenceTriggerRate: (geofenceTrend30d.reduce((s,d) => s+d.rate, 0) / geofenceTrend30d.length).toFixed(1),
    cotsPct: Math.round(deviceCategoryTrend.reduce((s,d) => s+d.cots, 0) / deviceCategoryTrend.reduce((s,d) => s+d.cots+d.pos+d.dedicated, 0) * 100),
    posPct: Math.round(deviceCategoryTrend.reduce((s,d) => s+d.pos, 0) / deviceCategoryTrend.reduce((s,d) => s+d.cots+d.pos+d.dedicated, 0) * 100),
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Platform Telemetry</h1>
        <span className="flex items-center gap-1.5 text-[13px] text-muted"><span className="w-1.5 h-1.5 rounded-full bg-success" /> Live updating</span>
      </div>

      <div className="grid grid-cols-4 gap-8 mb-10">
        <MetricTooltip name="Approval Rate"><KPICard label="Total Transactions" value={fmt.num(kpis.totalTransactions)} trend={kpis.trendTxn.slice(1)} trendDir="up" /></MetricTooltip>
        <MetricTooltip name="Fraud Rate"><KPICard label="Current Fraud Rate" value={fmt.pct(kpis.fraudRate)} trend={kpis.trendFraud.slice(1)} trendDir="up" /></MetricTooltip>
        <MetricTooltip name="Decline Rate"><KPICard label="Automated Blocks" value={fmt.num(kpis.automatedBlocks)} trend={kpis.trendBlocks.slice(1)} trendDir="down" /></MetricTooltip>
        <MetricTooltip name="REVIEW Rate"><KPICard label="Manual Review Queue" value={fmt.num(kpis.reviewQueue)} trend={kpis.trendQueue.slice(1)} trendDir="down" /></MetricTooltip>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">Transaction Volume (7d)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={txnTrend}>
              <XAxis dataKey="date" tick={{fontSize:11,fill:'#888'}} tickFormatter={v=>v.slice(5)} axisLine={{stroke:'#eaeaea'}} tickLine={false} />
              <YAxis tick={{fontSize:11,fill:'#888',fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{fontSize:12,border:'1px solid #eaeaea',borderRadius:0}} />
              <Area type="monotone" dataKey="volume" stroke="#1890FF" fill="#1890FF" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">Chargeback Rate (30d)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={cbRateTrend}>
              <XAxis dataKey="date" tick={{fontSize:11,fill:'#888'}} tickFormatter={v=>v.slice(5)} axisLine={{stroke:'#eaeaea'}} tickLine={false} />
              <YAxis tick={{fontSize:11,fill:'#888',fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} domain={[0,1.8]} />
              <Tooltip contentStyle={{fontSize:12,border:'1px solid #eaeaea',borderRadius:0}} />
              <ReferenceLine y={0.9} stroke="#FF4D4F" strokeDasharray="4 4" label={{value:'Visa 0.9%',fontSize:10,fill:'#FF4D4F',position:'right'}} />
              <ReferenceLine y={1.5} stroke="#FF4D4F" strokeDasharray="4 4" label={{value:'MC 1.5%',fontSize:10,fill:'#FF4D4F',position:'right'}} />
              <Line type="monotone" dataKey="rate" stroke="#1890FF" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-12 pt-8 border-t border-border">
        <h2 className="text-lg font-semibold mb-6">Device Risk</h2>
        <div className="grid grid-cols-4 gap-8 mb-8">
          <div className="py-3 border-b border-border">
            <MetricTooltip name="Attestation Fail Rate"><div className="text-[11px] text-muted tracking-[0.08em] uppercase">Attestation Fail Rate</div></MetricTooltip>
            <div className="text-[24px] font-mono mt-1">{deviceStats.attestFailRate}%</div>
          </div>
          <div className="py-3 border-b border-border">
            <MetricTooltip name="Geofence Trigger Rate"><div className="text-[11px] text-muted tracking-[0.08em] uppercase">Geofence Trigger Rate</div></MetricTooltip>
            <div className="text-[24px] font-mono mt-1">{deviceStats.geofenceTriggerRate}%</div>
          </div>
          <div className="py-3 border-b border-border">
            <MetricTooltip name="COTS Device Share"><div className="text-[11px] text-muted tracking-[0.08em] uppercase">COTS Device Share</div></MetricTooltip>
            <div className="text-[24px] font-mono mt-1">{deviceStats.cotsPct}%</div>
          </div>
          <div className="py-3 border-b border-border">
            <MetricTooltip name="POS Device Share"><div className="text-[11px] text-muted tracking-[0.08em] uppercase">POS Device Share</div></MetricTooltip>
            <div className="text-[24px] font-mono mt-1">{deviceStats.posPct}%</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-12">
          <div>
            <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">Attestation Fail Rate (30d)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={deviceAttestation30d}>
                <XAxis dataKey="date" tick={{fontSize:11,fill:'#888'}} tickFormatter={v=>v.slice(5)} axisLine={{stroke:'#eaeaea'}} tickLine={false} />
                <YAxis tick={{fontSize:11,fill:'#888',fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} domain={[0,5]} />
                <Tooltip contentStyle={{fontSize:12,border:'1px solid #eaeaea',borderRadius:0}} formatter={v=>`${v}%`} />
                <ReferenceLine y={1} stroke="#52C41A" strokeDasharray="4 4" label={{value:'Target 1%',fontSize:10,fill:'#52C41A',position:'right'}} />
                <Line type="monotone" dataKey="rate" stroke="#FF4D4F" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">Geofence Trigger Rate (30d)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={geofenceTrend30d}>
                <XAxis dataKey="date" tick={{fontSize:11,fill:'#888'}} tickFormatter={v=>v.slice(5)} axisLine={{stroke:'#eaeaea'}} tickLine={false} />
                <YAxis tick={{fontSize:11,fill:'#888',fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} domain={[0,4]} />
                <Tooltip contentStyle={{fontSize:12,border:'1px solid #eaeaea',borderRadius:0}} formatter={v=>`${v}%`} />
                <ReferenceLine y={2} stroke="#FAAD14" strokeDasharray="4 4" label={{value:'Threshold 2%',fontSize:10,fill:'#FAAD14',position:'right'}} />
                <Line type="monotone" dataKey="rate" stroke="#1890FF" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">Device Category Volume (7d)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={deviceCategoryTrend}>
                <XAxis dataKey="date" tick={{fontSize:11,fill:'#888'}} tickFormatter={v=>v.slice(5)} axisLine={{stroke:'#eaeaea'}} tickLine={false} />
                <YAxis tick={{fontSize:11,fill:'#888',fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{fontSize:12,border:'1px solid #eaeaea',borderRadius:0}} />
                <Legend wrapperStyle={{fontSize:11}} />
                <Area type="monotone" dataKey="cots" name="COTS" stroke="#FF4D4F" fill="#FF4D4F" fillOpacity={0.12} strokeWidth={2} stackId="a" />
                <Area type="monotone" dataKey="dedicated" name="Dedicated" stroke="#1890FF" fill="#1890FF" fillOpacity={0.12} strokeWidth={2} stackId="a" />
                <Area type="monotone" dataKey="pos" name="Certified POS" stroke="#52C41A" fill="#52C41A" fillOpacity={0.12} strokeWidth={2} stackId="a" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">Device Rule Triggers (7d)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={deviceRuleHits7d}>
                <XAxis dataKey="date" tick={{fontSize:11,fill:'#888'}} tickFormatter={v=>v.slice(5)} axisLine={{stroke:'#eaeaea'}} tickLine={false} />
                <YAxis tick={{fontSize:11,fill:'#888',fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{fontSize:12,border:'1px solid #eaeaea',borderRadius:0}} />
                <Legend wrapperStyle={{fontSize:11}} />
                <Area type="monotone" dataKey="high_risk" name="HIGH_RISK" stroke="#FF4D4F" fill="#FF4D4F" fillOpacity={0.15} stackId="a" />
                <Area type="monotone" dataKey="warning" name="WARNING" stroke="#FAAD14" fill="#FAAD14" fillOpacity={0.15} stackId="a" />
                <Area type="monotone" dataKey="alert" name="ALERT" stroke="#1890FF" fill="#1890FF" fillOpacity={0.1} stackId="a" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12">
        <div>
          <h3 className="text-sm font-semibold mb-3">Top Breached Rules</h3>
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-border">
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Rule ID</th>
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Action</th>
              <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Hit Count</th>
            </tr></thead>
            <tbody>{topRules.map(r=>(
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
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Entity (BIN / IP)</th>
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Risk Score</th>
              <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Hit Count</th>
            </tr></thead>
            <tbody>{topEntities.map(e=>(
              <tr key={e.entity} className="border-b border-border/50 hover:bg-surface">
                <td className="py-2 font-mono">{e.entity}</td>
                <td className="py-2 font-mono text-danger">{e.riskScore}</td>
                <td className="py-2 text-right font-mono">{fmt.num(e.hitCount)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
