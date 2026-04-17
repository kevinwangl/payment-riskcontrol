import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import KPICard from '../components/shared/KPICard'
import MetricTooltip from '../components/shared/MetricTooltip'
import { modelMonitoring } from '../mock/models'

export default function ModelMonitoring() {
  const m = modelMonitoring
  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Model Monitoring</h1>

      {m.psiTrend.some(p => p.value > 0.2) && (
        <div className="bg-danger/5 border border-danger/20 px-4 py-2 text-[13px] text-danger mb-6">
          ⚠ PSI threshold exceeded — feature distribution drift detected
        </div>
      )}

      <div className="grid grid-cols-4 gap-8 mb-10">
        <KPICard label="Current Model" value={m.currentModel} />
        <MetricTooltip name="AUC"><KPICard label="AUC-ROC" value={m.currentAuc.toFixed(3)} /></MetricTooltip>
        <MetricTooltip name="Precision"><KPICard label="Precision" value={m.currentPrecision.toFixed(2)} /></MetricTooltip>
        <MetricTooltip name="Recall"><KPICard label="Recall" value={m.currentRecall.toFixed(2)} /></MetricTooltip>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <ChartPanel title="Feature Drift (PSI)" data={m.psiTrend} dataKey="value" threshold={0.2} thresholdLabel="PSI 0.2" metricName="PSI" />
        <ChartPanel title="Precision Trend" data={m.precisionTrend} dataKey="value" domain={[0.8,1]} metricName="Precision" />
        <ChartPanel title="Recall Trend" data={m.recallTrend} dataKey="value" domain={[0.75,1]} metricName="Recall" />
      </div>
    </div>
  )
}

function ChartPanel({ title, data, dataKey, threshold, thresholdLabel, domain, metricName }) {
  return (
    <div className="mb-8">
      <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">
        {metricName ? <MetricTooltip name={metricName}><span>{title}</span></MetricTooltip> : title}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{fontSize:10,fill:'#888'}} tickFormatter={v=>v.slice(5)} axisLine={{stroke:'#eaeaea'}} tickLine={false} />
          <YAxis tick={{fontSize:10,fill:'#888',fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} domain={domain} />
          <Tooltip contentStyle={{fontSize:12,border:'1px solid #eaeaea',borderRadius:0}} />
          {threshold && <ReferenceLine y={threshold} stroke="#FF4D4F" strokeDasharray="4 4" label={{value:thresholdLabel,fontSize:10,fill:'#FF4D4F',position:'right'}} />}
          <Line type="monotone" dataKey={dataKey} stroke="#1890FF" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
