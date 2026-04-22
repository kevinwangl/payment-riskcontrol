import React, { useState } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import MetricTooltip from '../components/shared/MetricTooltip'

const reportTypes = ['Platform Overview','ISO Report','Merchant Report','Device Risk']
const COLORS = ['#1890FF','#52C41A','#FF4D4F','#FAAD14','#888']

const platformData = {
  summary: { total:245000, approved:228000, declined:17000 },
  trend: Array.from({length:7},(_,i)=>({day:`Day ${i+1}`,approved:Math.floor(Math.random()*5000+30000),declined:Math.floor(Math.random()*2000+1000)})),
  topMerchants: [{name:'GameZone',cbRate:1.8},{name:'TravelCo',cbRate:1.2},{name:'JewelBox',cbRate:0.95},{name:'OnlineShop',cbRate:0.78},{name:'TechStore',cbRate:0.62}],
}

const merchantData = {
  reasons: [{name:'HIGH_AMT_FOREIGN_CNP',value:35},{name:'CARD_VELOCITY',value:25},{name:'CVV_FAIL',value:20},{name:'AVS_FAIL_HIGH',value:12},{name:'Other',value:8}],
  scoreDist: Array.from({length:10},(_,i)=>({bin:`${i*10}-${i*10+10}`,count:Math.floor(Math.random()*500+(i<3?800:i>7?100:300))})),
}

const days30 = Array.from({length:30},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-29+i); return d.toISOString().slice(0,10) })
const deviceReportData = {
  summary: { totalDevices:156, activeDevices:142, blockedDevices:8, suspendedDevices:6 },
  categoryBreakdown: [{name:'COTS_DEVICE',value:45},{name:'CERTIFIED_POS',value:35},{name:'DEDICATED_DEVICE',value:20}],
  attestTrend: days30.map(d=>({ date:d, verified:Math.floor(Math.random()*200+800), failed:Math.floor(Math.random()*30+10), expired:Math.floor(Math.random()*15+5) })),
  ruleHitsByCategory: [
    {rule:'DEV-COTS-003',name:'Root/Jailbreak',hits:342,level:'HIGH_RISK'},
    {rule:'DEV-ALL-003',name:'Impossible Travel',hits:218,level:'HIGH_RISK'},
    {rule:'DEV-ALL-004',name:'Device High Freq',hits:189,level:'WARNING'},
    {rule:'DEV-COTS-007',name:'Debug Mode',hits:156,level:'HIGH_RISK'},
    {rule:'DEV-ALL-002',name:'Geofence Breach',hits:134,level:'WARNING'},
    {rule:'DEV-COTS-001',name:'Attestation Failed',hits:98,level:'HIGH_RISK'},
    {rule:'DEV-POS-005',name:'POS Location Anomaly',hits:67,level:'WARNING'},
    {rule:'DEV-ALL-005',name:'Multi-Card Device',hits:45,level:'WARNING'},
  ],
  riskLevelDist: [{name:'PASS',value:82},{name:'ALERT',value:8},{name:'WARNING',value:7},{name:'HIGH_RISK',value:3}],
  geofenceTrend: days30.map(d=>({ date:d, breaches:Math.floor(Math.random()*25+8), total:Math.floor(Math.random()*200+800) })),
  geofenceTopMerchants: [
    {name:'TravelCo',breaches:87,avgDistance:'128 km',category:'COTS_DEVICE'},
    {name:'OnlineShop',breaches:45,avgDistance:'67 km',category:'COTS_DEVICE'},
    {name:'FastFood',breaches:23,avgDistance:'12 km',category:'DEDICATED_DEVICE'},
    {name:'GrandHotel',breaches:11,avgDistance:'8 km',category:'CERTIFIED_POS'},
    {name:'QuickMart',breaches:6,avgDistance:'3 km',category:'CERTIFIED_POS'},
  ],
}

export default function Reports() {
  const [type, setType] = useState(0)
  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Reports</h1>
      <div className="flex gap-6 border-b border-border mb-8">
        {reportTypes.map((t,i) => (
          <button key={t} onClick={() => setType(i)} className={`pb-2 text-[13px] border-b-2 ${type===i?'border-black font-medium':'border-transparent text-muted'}`}>{t}</button>
        ))}
      </div>

      {type === 0 && (
        <div>
          <div className="grid grid-cols-3 gap-6 mb-8 text-[13px]">
            {[['Total',platformData.summary.total],['Approved',platformData.summary.approved],['Declined',platformData.summary.declined]].map(([l,v])=>(
              <div key={l} className="border-b border-border pb-3"><div className="text-[11px] text-muted uppercase tracking-wide">{l}</div><div className="text-2xl font-mono mt-1">{v.toLocaleString()}</div></div>
            ))}
          </div>
          <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">Decision Trend (7d)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={platformData.trend} barSize={32} barGap={4}>
              <XAxis dataKey="day" tick={{fontSize:11,fill:'#888'}} axisLine={{stroke:'#eaeaea'}} tickLine={false} />
              <YAxis tick={{fontSize:11,fill:'#888',fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{fontSize:12,border:'1px solid #eaeaea',borderRadius:0}} />
              <Bar dataKey="approved" fill="var(--primary, #1890FF)" fillOpacity={0.6} stackId="a" /><Bar dataKey="declined" fill="#FF6B6B" fillOpacity={0.7} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
          <h3 className="text-sm font-semibold mt-8 mb-3"><MetricTooltip name="CB Rate"><span>Top CB Rate Merchants</span></MetricTooltip></h3>
          <table className="w-full text-[13px]"><tbody>{platformData.topMerchants.map(m=>(
            <tr key={m.name} className="border-b border-border/50"><td className="py-2">{m.name}</td><td className="py-2 text-right font-mono text-danger">{m.cbRate}%</td></tr>
          ))}</tbody></table>
        </div>
      )}

      {type === 2 && (
        <div className="grid grid-cols-2 gap-12">
          <div>
            <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">Decline Reason Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart><Pie data={merchantData.reasons} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {merchantData.reasons.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">Risk Score Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={merchantData.scoreDist}>
                <XAxis dataKey="bin" tick={{fontSize:10,fill:'#888'}} axisLine={{stroke:'#eaeaea'}} tickLine={false} />
                <YAxis tick={{fontSize:10,fill:'#888',fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} />
                <Bar dataKey="count" fill="#1890FF" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {type === 1 && (
        <div>
          <div className="grid grid-cols-3 gap-6 mb-8 text-[13px]">
            {[['Total Merchants',8],['Active Alerts',3]].map(([l,v])=>(
              <div key={l} className="border-b border-border pb-3"><div className="text-[11px] text-muted uppercase tracking-wide">{l}</div><div className="text-2xl font-mono mt-1">{v}</div></div>
            ))}
            <div className="border-b border-border pb-3"><div className="text-[11px] text-muted uppercase tracking-wide"><MetricTooltip name="CB Rate"><span>Avg CB Rate</span></MetricTooltip></div><div className="text-2xl font-mono mt-1">0.68%</div></div>
          </div>
          <h3 className="text-sm font-semibold mb-3">Merchant CB Rate Ranking (ISO Alpha Corp)</h3>
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-border">
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Merchant</th>
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">MCC</th>
              <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Txn Volume</th>
              <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2"><MetricTooltip name="CB Rate"><span>CB Rate</span></MetricTooltip></th>
              <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2"><MetricTooltip name="Limit Usage"><span>Limit Usage</span></MetricTooltip></th>
            </tr></thead>
            <tbody>
              {[{name:'TravelCo',mcc:'7011',vol:12400,cb:1.2,usage:82},{name:'OnlineShop',mcc:'5999',vol:8900,cb:0.78,usage:45},{name:'TechStore',mcc:'5999',vol:15600,cb:0.62,usage:39},{name:'SubShop',mcc:'5812',vol:6200,cb:0.35,usage:16},{name:'QuickMart',mcc:'5411',vol:22100,cb:0.15,usage:22},{name:'GrandHotel',mcc:'7011',vol:18300,cb:0.08,usage:37},{name:'LuxRetail',mcc:'5999',vol:9800,cb:0.05,usage:10},{name:'FastFood',mcc:'5812',vol:3100,cb:0.0,usage:21}].map(m=>(
                <tr key={m.name} className="border-b border-border/50 hover:bg-surface">
                  <td className="py-2">{m.name}</td>
                  <td className="py-2 font-mono">{m.mcc}</td>
                  <td className="py-2 text-right font-mono">{m.vol.toLocaleString()}</td>
                  <td className={`py-2 text-right font-mono ${m.cb>0.9?'text-danger':m.cb>0.5?'text-warning':''}`}>{m.cb}%</td>
                  <td className="py-2 text-right font-mono">{m.usage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 className="text-sm font-semibold mt-8 mb-3">Risk Events This Period</h3>
          <div className="grid grid-cols-2 gap-6 text-[13px]">
            <div className="border-b border-border pb-3"><div className="text-[11px] text-muted uppercase tracking-wide">Chargebacks</div><div className="text-xl font-mono mt-1">7</div></div>
            <div className="border-b border-border pb-3"><div className="text-[11px] text-muted uppercase tracking-wide">Rules Triggered</div><div className="text-xl font-mono mt-1">1,245</div></div>
          </div>
        </div>
      )}

      {type === 3 && (
        <div>
          <div className="grid grid-cols-4 gap-6 mb-8 text-[13px]">
            {[['Total Devices',deviceReportData.summary.totalDevices],['Active',deviceReportData.summary.activeDevices],['Blocked',deviceReportData.summary.blockedDevices],['Suspended',deviceReportData.summary.suspendedDevices]].map(([l,v])=>(
              <div key={l} className="border-b border-border pb-3"><div className="text-[11px] text-muted uppercase tracking-wide">{l}</div><div className="text-2xl font-mono mt-1">{v}</div></div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-12 mb-8">
            <div>
              <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">Device Category Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart><Pie data={deviceReportData.categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({name,percent})=>`${name.replace('_DEVICE','').replace('CERTIFIED_','')} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {deviceReportData.categoryBreakdown.map((_,i)=><Cell key={i} fill={['#FF4D4F','#52C41A','#1890FF'][i]} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">Risk Level Distribution (%)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart><Pie data={deviceReportData.riskLevelDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={75} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {deviceReportData.riskLevelDist.map((_,i)=><Cell key={i} fill={['#52C41A','#1890FF','#FAAD14','#FF4D4F'][i]} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">Attestation Status Trend (30d)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deviceReportData.attestTrend} barSize={8}>
              <XAxis dataKey="date" tick={{fontSize:11,fill:'#888'}} tickFormatter={v=>v.slice(5)} axisLine={{stroke:'#eaeaea'}} tickLine={false} interval={4} />
              <YAxis tick={{fontSize:11,fill:'#888',fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{fontSize:12,border:'1px solid #eaeaea',borderRadius:0}} />
              <Bar dataKey="verified" name="Verified" fill="#52C41A" stackId="a" />
              <Bar dataKey="expired" name="Expired" fill="#FAAD14" stackId="a" />
              <Bar dataKey="failed" name="Failed" fill="#FF4D4F" stackId="a" />
            </BarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-12 mt-8">
            <div>
              <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4"><MetricTooltip name="Geofence Trigger Rate"><span>Geofence Breaches (30d)</span></MetricTooltip></h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={deviceReportData.geofenceTrend}>
                  <XAxis dataKey="date" tick={{fontSize:11,fill:'#888'}} tickFormatter={v=>v.slice(5)} axisLine={{stroke:'#eaeaea'}} tickLine={false} interval={4} />
                  <YAxis tick={{fontSize:11,fill:'#888',fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{fontSize:12,border:'1px solid #eaeaea',borderRadius:0}} />
                  <Line type="monotone" dataKey="breaches" name="Breaches" stroke="#FF4D4F" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="total" name="Total Txns" stroke="#1890FF" strokeWidth={1} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">Top Geofence Breach Merchants</h3>
              <table className="w-full text-[13px]">
                <thead><tr className="border-b border-border">
                  <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Merchant</th>
                  <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Device Type</th>
                  <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Avg Distance</th>
                  <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Breaches</th>
                </tr></thead>
                <tbody>{deviceReportData.geofenceTopMerchants.map(m=>(
                  <tr key={m.name} className="border-b border-border/50 hover:bg-surface">
                    <td className="py-2">{m.name}</td>
                    <td className="py-2 text-muted">{m.category}</td>
                    <td className="py-2 text-right font-mono">{m.avgDistance}</td>
                    <td className="py-2 text-right font-mono text-danger">{m.breaches}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>

          <h3 className="text-sm font-semibold mt-8 mb-3">Top Triggered Device Rules</h3>
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-border">
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Rule ID</th>
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Name</th>
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Risk Level</th>
              <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Hit Count</th>
            </tr></thead>
            <tbody>{deviceReportData.ruleHitsByCategory.map(r=>(
              <tr key={r.rule} className="border-b border-border/50 hover:bg-surface">
                <td className="py-2 font-mono">{r.rule}</td>
                <td className="py-2">{r.name}</td>
                <td className="py-2"><span className={`px-2 py-0.5 text-[11px] font-medium ${r.level==='HIGH_RISK'?'bg-danger/10 text-danger':'bg-warning/10 text-warning'}`}>{r.level}</span></td>
                <td className="py-2 text-right font-mono">{r.hits.toLocaleString()}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      <div className="mt-8 flex justify-end"><button onClick={() => alert("PDF export started")} className="px-4 py-2 text-[13px] border border-border hover:bg-surface">Export PDF</button></div>
    </div>
  )
}
