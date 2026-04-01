import React from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from '../components/shared/StatusBadge'
import DataTable from '../components/shared/DataTable'
import { cases } from '../mock/cases'
import { fmt } from '../utils/format'
import MetricTooltip from '../components/shared/MetricTooltip'

const prioColor = { P0:'text-danger', P1:'text-warning', P2:'text-[#d4a017]', P3:'text-muted' }

export default function CaseList() {
  const nav = useNavigate()
  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Case Management</h1>
      <DataTable
        columns={[
          { key:'id', label:'Case ID', mono:true },
          { key:'type', label:'Type' },
          { key:'priority', label:<MetricTooltip name='Priority'><span>Priority</span></MetricTooltip>, render:v => <span className={`font-mono font-medium ${prioColor[v]}`}>{v}</span> },
          { key:'merchantName', label:'Merchant' },
          { key:'title', label:'Title' },
          { key:'status', label:'Status', render:v => <StatusBadge status={v} /> },
          { key:'assignedTo', label:'Assigned', render:v => v?.split('@')[0] },
          { key:'deadline', label:<MetricTooltip name='Deadline'><span>Deadline</span></MetricTooltip>, render:v => fmt.daysLeft(v) },
        ]}
        data={cases}
        onRowClick={row => nav(`/cases/${row.id}`)}
      />
    </div>
  )
}
