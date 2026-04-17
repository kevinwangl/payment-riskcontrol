import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { shadowComparison } from '../mock/models'

export default function ModelComparison() {
  const nav = useNavigate()
  const { production: prod, shadow } = shadowComparison
  const combined = prod.scoreDistribution.map((p, i) => ({
    bin: p.bin, production: p.count, shadow: shadow.scoreDistribution[i].count,
  }))

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Shadow Model Comparison</h1>

      {/* Metrics comparison */}
      <div className="grid grid-cols-2 gap-8 mb-10">
        <MetricCard label="Production" version={prod.version} auc={prod.auc} precision={prod.precision} recall={prod.recall} declineRate={prod.declineRate} />
        <MetricCard label="Shadow" version={shadow.version} auc={shadow.auc} precision={shadow.precision} recall={shadow.recall} declineRate={shadow.declineRate} highlight />
      </div>

      {/* Score distribution overlay */}
      <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">Score Distribution Comparison</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={combined} barGap={0} barSize={20}>
          <XAxis dataKey="bin" tick={{fontSize:10,fill:'#888'}} axisLine={{stroke:'#eaeaea'}} tickLine={false} />
          <YAxis tick={{fontSize:10,fill:'#888',fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{fontSize:12,border:'1px solid #eaeaea',borderRadius:0}} />
          <Legend wrapperStyle={{fontSize:12}} />
          <Bar dataKey="production" fill="#1890FF" fillOpacity={0.4} name={prod.version} />
          <Bar dataKey="shadow" fill="#52C41A" fillOpacity={0.4} name={shadow.version} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-8 flex justify-end gap-3">
        <button onClick={() => nav(-1)} className="px-4 py-2 text-[13px] border border-border hover:bg-surface">Cancel</button>
        <button onClick={() => alert("Shadow model deployed to 10% traffic")} className="px-6 py-2 text-[13px] font-medium bg-black text-white">Deploy Shadow → Canary 10%</button>
      </div>
    </div>
  )
}

function MetricCard({ label, version, auc, precision, recall, declineRate, highlight }) {
  return (
    <div className={`p-6 border ${highlight ? 'border-primary' : 'border-border'}`}>
      <div className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-1">{label}</div>
      <div className="font-mono text-lg font-medium mb-4">{version}</div>
      <div className="grid grid-cols-2 gap-3 text-[13px]">
        <div><span className="text-muted">AUC</span> <span className="font-mono ml-2">{auc.toFixed(3)}</span></div>
        <div><span className="text-muted">Precision</span> <span className="font-mono ml-2">{precision.toFixed(2)}</span></div>
        <div><span className="text-muted">Recall</span> <span className="font-mono ml-2">{recall.toFixed(2)}</span></div>
        <div><span className="text-muted">Decline Rate</span> <span className="font-mono ml-2">{declineRate}%</span></div>
      </div>
    </div>
  )
}
