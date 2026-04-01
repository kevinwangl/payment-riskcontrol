import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { rules } from '../mock/rules'

export default function RuleAnalytics() {
  const sorted = [...rules].sort((a,b) => (b.hitCount||0) - (a.hitCount||0)).slice(0,15)
  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Rule Effect Analysis</h1>
      <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">Top 15 Rules by Hit Count</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={sorted} layout="vertical" margin={{left:120}} barSize={16}>
          <XAxis type="number" tick={{fontSize:11,fill:'#888',fontFamily:'JetBrains Mono'}} axisLine={{stroke:'#eaeaea'}} tickLine={false} />
          <YAxis type="category" dataKey="id" tick={{fontSize:11,fill:'#888',fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} width={100} />
          <Tooltip contentStyle={{fontSize:12,border:'1px solid #eaeaea',borderRadius:0}} />
          <Bar dataKey="hitCount" fill="#1890FF" />
        </BarChart>
      </ResponsiveContainer>
      <table className="w-full text-[13px] mt-8">
        <thead><tr className="border-b border-border">
          <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Rule</th>
          <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Name</th>
          <th className="text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Decision</th>
          <th className="text-right text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2">Hits</th>
        </tr></thead>
        <tbody>{sorted.map(r => (
          <tr key={r.id} className="border-b border-border/50">
            <td className="py-2 font-mono">{r.id}</td>
            <td className="py-2">{r.name}</td>
            <td className="py-2">{r.action.decision}</td>
            <td className="py-2 text-right font-mono">{r.hitCount?.toLocaleString()}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
