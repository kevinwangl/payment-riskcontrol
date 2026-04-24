import React from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend, Cell, Treemap } from 'recharts'
import MetricTooltip from '../components/shared/MetricTooltip'
import { dashboardData } from '../mock/dashboard'
import { fmt } from '../utils/format'

const catColor = { COTS: '#FF4D4F', Dedicated: '#1890FF', POS: '#52C41A' }
const catColorLight = { COTS: '#FFF1F0', Dedicated: '#E6F7FF', POS: '#F6FFED' }

// Custom TreeMap cell renderer
function TreeMapCell(props) {
  const { x, y, width, height, name, size, category, issue, depth } = props
  // depth 0 = root, depth 1 = leaf cells we want to render
  if (depth !== 1 || width < 2 || height < 2) return null
  const border = catColor[category] || '#999'
  const bg = catColorLight[category] || '#f5f5f5'
  const pad = 6
  const canFitName = width > 55 && height > 30
  const canFitSize = width > 28 && height > 18
  const canFitIssue = width > 85 && height > 52
  const clipId = `clip-${x}-${y}`
  return (
    <g>
      <defs><clipPath id={clipId}><rect x={x+1} y={y+1} width={width-2} height={height-2} /></clipPath></defs>
      <rect x={x} y={y} width={width} height={height} fill={bg} stroke={border} strokeWidth={1.5} />
      <g clipPath={`url(#${clipId})`}>
        {canFitName && (
          <text x={x + pad} y={y + 16} fontSize={11} fill="#333" fontWeight={600}>{name}</text>
        )}
        {canFitSize && (
          <text x={x + pad} y={canFitName ? y + 34 : y + 15} fontSize={canFitName ? 16 : 11} fill="#333" fontWeight={700} fontFamily="JetBrains Mono, monospace">{size}</text>
        )}
        {canFitIssue && (
          <text x={x + pad} y={y + 48} fontSize={9} fill="#999">{issue}</text>
        )}
      </g>
    </g>
  )
}

export default function Dashboard() {
  const { kpis, declineReasonTrend, deviceOverview, issuesByType, affectedModels, securityThreatTrend } = dashboardData

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Risk Overview</h1>
        <span className="flex items-center gap-1.5 text-[13px] text-muted"><span className="w-1.5 h-1.5 rounded-full bg-success" /> Live</span>
      </div>

      {/* Layer 1: KPI */}
      <div className="grid grid-cols-3 gap-8 mb-10">
        {[
          { label: 'Total Transactions', value: fmt.num(kpis.totalTransactions) },
          { label: 'Decline Rate', value: fmt.pct(kpis.declineRate), tooltip: 'Decline Rate' },
          { label: 'Chargeback Rate', value: fmt.pct(kpis.cbRate), tooltip: 'CB Rate' },
        ].map(k => (
          <div key={k.label} className="py-3 border-b border-border">
            {k.tooltip
              ? <MetricTooltip name={k.tooltip}><div className="text-[11px] text-muted tracking-[0.08em] uppercase">{k.label}</div></MetricTooltip>
              : <div className="text-[11px] text-muted tracking-[0.08em] uppercase">{k.label}</div>}
            <div className="text-[28px] font-mono mt-1">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Layer 2: Decline Reasons */}
      <div className="mb-10">
        <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">Decline Reasons (7d)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={declineReasonTrend}>
            <XAxis dataKey="date" tick={{fontSize:11,fill:'#888'}} tickFormatter={v=>v.slice(5)} axisLine={{stroke:'#eaeaea'}} tickLine={false} />
            <YAxis tick={{fontSize:11,fill:'#888',fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{fontSize:12,border:'1px solid #eaeaea',borderRadius:0}} />
            <Legend wrapperStyle={{fontSize:11}} />
            <Area type="monotone" dataKey="velocity" name="Velocity" stroke="#FF4D4F" fill="#FF4D4F" fillOpacity={0.15} stackId="a" />
            <Area type="monotone" dataKey="blacklist" name="Blacklist" stroke="#434343" fill="#434343" fillOpacity={0.12} stackId="a" />
            <Area type="monotone" dataKey="limit" name="Limit" stroke="#FAAD14" fill="#FAAD14" fillOpacity={0.15} stackId="a" />
            <Area type="monotone" dataKey="device" name="Device" stroke="#722ED1" fill="#722ED1" fillOpacity={0.12} stackId="a" />
            <Area type="monotone" dataKey="other" name="Other" stroke="#1890FF" fill="#1890FF" fillOpacity={0.1} stackId="a" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Layer 3: Device Security */}
      <div className="pt-8 border-t border-border">
        <div className="flex items-baseline gap-6 mb-5">
          <h2 className="text-sm font-semibold">Device Security</h2>
          <span className="text-[12px] text-muted font-mono">{fmt.num(deviceOverview.totalDevices)} devices</span>
          <span className="text-[12px] text-danger font-mono">{deviceOverview.highRiskDevices} high-risk</span>
        </div>

        {/* Dual charts */}
        <div className="grid grid-cols-2 gap-12 mb-8">
          {/* Left: Issues by Type */}
          <div>
            <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">Issues by Type</h3>
            <ResponsiveContainer width="100%" height={issuesByType.length * 32 + 20}>
              <BarChart data={issuesByType} layout="vertical" margin={{left:0,right:20}}>
                <XAxis type="number" tick={{fontSize:11,fill:'#888',fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="issue" tick={{fontSize:11,fill:'#888'}} axisLine={false} tickLine={false} width={110} />
                <Tooltip contentStyle={{fontSize:12,border:'1px solid #eaeaea',borderRadius:0}} />
                <Bar dataKey="count" radius={[0,2,2,0]} barSize={16}>
                  {issuesByType.map((d,i) => <Cell key={i} fill={i < 3 ? '#FF4D4F' : '#FAAD14'} fillOpacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Right: Affected Models TreeMap */}
          <div>
            <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">
              Affected Models
              <span className="ml-3 font-normal text-[10px]">
                <span className="inline-block w-2 h-2 rounded-sm mr-0.5" style={{background:catColor.COTS}} /> COTS
                <span className="inline-block w-2 h-2 rounded-sm ml-2 mr-0.5" style={{background:catColor.POS}} /> POS
                <span className="inline-block w-2 h-2 rounded-sm ml-2 mr-0.5" style={{background:catColor.Dedicated}} /> Dedicated
              </span>
            </h3>
            <ResponsiveContainer width="100%" height={issuesByType.length * 32 + 20}>
              <Treemap
                data={affectedModels}
                dataKey="size"
                stroke="none"
                fill="none"
                content={<TreeMapCell />}
                isAnimationActive={false}
              >
                <Tooltip
                  contentStyle={{fontSize:12,border:'1px solid #eaeaea',borderRadius:0}}
                  formatter={(v, n, p) => [`${v} devices`, p.payload.issue]}
                  labelFormatter={(v) => v}
                />
              </Treemap>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Security Threats trend with Geofence */}
        <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">Security Threats (30d)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={securityThreatTrend}>
            <XAxis dataKey="date" tick={{fontSize:11,fill:'#888'}} tickFormatter={v=>v.slice(5)} axisLine={{stroke:'#eaeaea'}} tickLine={false} />
            <YAxis tick={{fontSize:11,fill:'#888',fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} />
            <Tooltip contentStyle={{fontSize:12,border:'1px solid #eaeaea',borderRadius:0}} formatter={v=>`${v}%`} />
            <Legend wrapperStyle={{fontSize:11}} />
            <Line type="monotone" dataKey="rootJailbreak" name="Root/Jailbreak" stroke="#FF4D4F" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="attestFail" name="Attest Fail" stroke="#FAAD14" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="debugMode" name="Debug Mode" stroke="#722ED1" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
            <Line type="monotone" dataKey="geofence" name="Geofence" stroke="#1890FF" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
