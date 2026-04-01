import React, { useState } from 'react'
import DataTable from '../components/shared/DataTable'
import { auditLog } from '../mock/auditLog'
import { fmt } from '../utils/format'

export default function AuditLog() {
  const [filter, setFilter] = useState('')
  const filtered = auditLog.filter(l => !filter || l.eventType.includes(filter.toUpperCase()) || l.actorId.includes(filter))

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Audit Log</h1>
      <div className="mb-4">
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter by event type or actor..."
          className="border-0 border-b border-border pb-2 text-[13px] w-[300px] outline-none focus:border-primary" />
      </div>
      <DataTable
        columns={[
          { key:'createdAt', label:'Time', mono:true, render:v => fmt.datetime(v) },
          { key:'actorId', label:'Actor' },
          { key:'eventType', label:'Event' },
          { key:'resourceType', label:'Resource' },
          { key:'resourceId', label:'Resource ID', mono:true },
          { key:'action', label:'Action' },
          { key:'detail', label:'Detail', render:v => (
            <details className="text-[12px]">
              <summary className="cursor-pointer text-primary">View</summary>
              <pre className="mt-1 text-[11px] font-mono bg-surface p-2 max-w-[300px] overflow-x-auto">{JSON.stringify(v, null, 2)}</pre>
            </details>
          )},
        ]}
        data={filtered}
      />
    </div>
  )
}
