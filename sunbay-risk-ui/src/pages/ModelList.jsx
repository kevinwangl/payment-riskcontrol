import React from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from '../components/shared/StatusBadge'
import DataTable from '../components/shared/DataTable'
import MetricTooltip from '../components/shared/MetricTooltip'
import { models } from '../mock/models'

const statusStyle = { PRODUCTION:'bg-success/10 text-success', SHADOW:'bg-primary/10 text-primary', TRAINING:'bg-warning/10 text-warning', RETIRED:'bg-muted/20 text-muted', 'CANARY_10':'bg-primary/10 text-primary' }

export default function ModelList() {
  const nav = useNavigate()
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Model Registry</h1>
        <div className="flex gap-3">
          <button onClick={() => nav('/models/monitoring')} className="px-4 py-2 text-[13px] border border-border hover:bg-surface">Monitoring</button>
          <button onClick={() => nav('/models/comparison')} className="px-4 py-2 text-[13px] border border-border hover:bg-surface">Shadow Compare</button>
        </div>
      </div>
      <DataTable
        columns={[
          { key:'version', label:'Version', mono:true },
          { key:'algorithm', label:<MetricTooltip name="Algorithm"><span>Algorithm</span></MetricTooltip> },
          { key:'trainTime', label:'Trained' },
          { key:'dataSize', label:'Data Size', mono:true, align:'right', render:v => v.toLocaleString() },
          { key:'auc', label:<MetricTooltip name="AUC"><span>AUC</span></MetricTooltip>, mono:true, align:'right', render:v => v.toFixed(3) },
          { key:'precision', label:<MetricTooltip name="Precision"><span>Precision</span></MetricTooltip>, mono:true, align:'right', render:v => v.toFixed(2) },
          { key:'recall', label:<MetricTooltip name="Recall"><span>Recall</span></MetricTooltip>, mono:true, align:'right', render:v => v.toFixed(2) },
          { key:'status', label:'Status', render:v => <span className={`px-2 py-0.5 text-[11px] font-medium ${statusStyle[v]||''}`}>{v}</span> },
          { key:'version', label:'Actions', sortable:false, render:(_,row) => (
            <div className="flex gap-2">
              {row.status === 'SHADOW' && <button onClick={() => alert("Deploying to 10% traffic...")} className="text-[12px] text-primary hover:underline">Deploy 10%</button>}
              {row.status === 'PRODUCTION' && <button onClick={() => alert("Rolling back to previous model...")} className="text-[12px] text-danger hover:underline">Rollback</button>}
            </div>
          )},
        ]}
        data={models}
        rowKey="version"
      />
    </div>
  )
}
