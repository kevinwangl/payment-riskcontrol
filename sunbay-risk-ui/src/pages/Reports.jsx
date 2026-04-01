import React, { useState } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import MetricTooltip from '../components/shared/MetricTooltip'

const reportTypes = ['Platform Overview','ISO Report','Merchant Report','Model Monitoring']
const COLORS = ['#1890FF','#52C41A','#FF4D4F','#FAAD14','#888']

const platformData = {
  summary: { total:245000, approved:228000, declined:10500, review:6500 },
  trend: Array.from({length:7},(_,i)=>({day:`Day ${i+1}`,approved:Math.floor(Math.random()*5000+30000),declined:Math.floor(Math.random()*2000+1000),review:Math.floor(Math.random()*1000+500)})),
  topMerchants: [{name:'GameZone',cbRate:1.8},{name:'TravelCo',cbRate:1.2},{name:'JewelBox',cbRate:0.95},{name:'OnlineShop',cbRate:0.78},{name:'TechStore',cbRate:0.62}],
}

const merchantData = {
  reasons: [{name:'HIGH_AMT_FOREIGN_CNP',value:35},{name:'CARD_VELOCITY',value:25},{name:'CVV_FAIL',value:20},{name:'AVS_FAIL_HIGH',value:12},{name:'Other',value:8}],
  scoreDist: Array.from({length:10},(_,i)=>({bin:`${i*10}-${i*10+10}`,count:Math.floor(Math.random()*500+(i<3?800:i>7?100:300))})),
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
          <div className="grid grid-cols-4 gap-6 mb-8 text-[13px]">
            {[['Total',platformData.summary.total],['Approved',platformData.summary.approved],['Declined',platformData.summary.declined],['Review',platformData.summary.review]].map(([l,v])=>(
              <div key={l} className="border-b border-border pb-3"><div className="text-[11px] text-muted uppercase tracking-wide">{l}</div><div className="text-2xl font-mono mt-1">{v.toLocaleString()}</div></div>
            ))}
          </div>
          <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">Decision Trend (7d)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={platformData.trend} barSize={32} barGap={4}>
              <XAxis dataKey="day" tick={{fontSize:11,fill:'#888'}} axisLine={{stroke:'#eaeaea'}} tickLine={false} />
              <YAxis tick={{fontSize:11,fill:'#888',fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{fontSize:12,border:'1px solid #eaeaea',borderRadius:0}} />
              <Bar dataKey="approved" fill="var(--primary, #1890FF)" fillOpacity={0.6} stackId="a" /><Bar dataKey="declined" fill="#FF6B6B" fillOpacity={0.7} stackId="a" /><Bar dataKey="review" fill="#FBBF24" fillOpacity={0.6} stackId="a" />
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
          <div className="grid grid-cols-3 gap-6 text-[13px]">
            <div className="border-b border-border pb-3"><div className="text-[11px] text-muted uppercase tracking-wide">New Cases</div><div className="text-xl font-mono mt-1">4</div></div>
            <div className="border-b border-border pb-3"><div className="text-[11px] text-muted uppercase tracking-wide">Chargebacks</div><div className="text-xl font-mono mt-1">7</div></div>
            <div className="border-b border-border pb-3"><div className="text-[11px] text-muted uppercase tracking-wide">Rules Triggered</div><div className="text-xl font-mono mt-1">1,245</div></div>
          </div>
        </div>
      )}

      {type === 3 && (
        <div>
          <div className="grid grid-cols-4 gap-6 mb-8 text-[13px]">
            {[['Model','v2.3_xgb'],['AUC','0.941'],['Precision','0.89'],['Recall','0.84']].map(([l,v])=>(
              <div key={l} className="border-b border-border pb-3"><div className="text-[11px] text-muted uppercase tracking-wide">{l}</div><div className="text-2xl font-mono mt-1">{v}</div></div>
            ))}
          </div>
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-border">
              <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Metric</th>
              <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">This Week</th>
              <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Last Week</th>
              <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Change</th>
            </tr></thead>
            <tbody>
              {[{m:'AUC-ROC',cur:0.941,prev:0.939,fmt:3,tip:'AUC'},{m:'Precision',cur:0.89,prev:0.88,fmt:2,tip:'Precision'},{m:'Recall',cur:0.84,prev:0.85,fmt:2,tip:'Recall'},{m:'PSI (max)',cur:0.12,prev:0.09,fmt:3,tip:'PSI'},{m:'REVIEW Rate',cur:10.2,prev:9.8,fmt:1,tip:'REVIEW Rate'}].map(r=>{
                const delta = r.cur - r.prev; const pct = ((delta/r.prev)*100).toFixed(1)
                return <tr key={r.m} className="border-b border-border/50">
                  <td className="py-2"><MetricTooltip name={r.tip}><span>{r.m}</span></MetricTooltip></td>
                  <td className="py-2 text-right font-mono">{r.cur.toFixed(r.fmt)}</td>
                  <td className="py-2 text-right font-mono text-muted">{r.prev.toFixed(r.fmt)}</td>
                  <td className={`py-2 text-right font-mono ${delta>0?'text-success':'text-danger'}`}>{delta>0?'+':''}{pct}%</td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 flex justify-end"><button onClick={() => alert("PDF export started")} className="px-4 py-2 text-[13px] border border-border hover:bg-surface">Export PDF</button></div>
    </div>
  )
}
