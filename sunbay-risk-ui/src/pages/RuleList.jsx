import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from '../components/shared/StatusBadge'
import DataTable from '../components/shared/DataTable'
import { rules, tenantTree } from '../mock/rules'

export default function RuleList() {
  const [selectedTenant, setSelectedTenant] = useState(null)
  const nav = useNavigate()

  const filtered = selectedTenant
    ? rules.filter(r => r.tenantId === selectedTenant || r.tenant === 'Platform')
    : rules

  return (
    <div className="flex gap-8">
      {/* Tenant Tree */}
      <div className="w-[220px] flex-shrink-0">
        <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-3">Tenant Scope</h3>
        <div className="space-y-1">
          <div onClick={() => setSelectedTenant(null)}
            className={`px-3 py-1.5 text-[13px] cursor-pointer ${!selectedTenant ? 'bg-surface font-medium' : 'hover:bg-surface/50'}`}>
            All Rules
          </div>
          {tenantTree.map(t => (
            <div key={t.id}>
              <div onClick={() => setSelectedTenant(t.id)}
                className={`px-3 py-1.5 text-[13px] cursor-pointer ${selectedTenant === t.id ? 'bg-surface font-medium' : 'hover:bg-surface/50'}`}>
                {t.label}
              </div>
              {t.children?.map(c => (
                <div key={c.id} onClick={() => setSelectedTenant(c.id)}
                  className={`pl-6 px-3 py-1 text-[12px] cursor-pointer ${selectedTenant === c.id ? 'bg-surface font-medium' : 'text-muted hover:bg-surface/50'}`}>
                  {c.label}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Rules Table */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Rule Engine</h1>
          <button onClick={() => nav('/rules/edit/new')} className="px-4 py-2 text-[13px] font-medium bg-black text-white hover:bg-black/80">New Rule</button>
        </div>
        <DataTable
          columns={[
            { key:'id', label:'Rule ID', mono:true },
            { key:'name', label:'Name' },
            { key:'tenant', label:'Scope', render:(v,row) => (
              <span className={row.tenant === 'Platform' ? 'text-muted' : ''}>{v} {row.tenant === 'Platform' && '🔒'}</span>
            )},
            { key:'priority', label:'Priority', mono:true, align:'right' },
            { key:'entryMode', label:'Mode' },
            { key:'action', label:'Decision', render:v => <StatusBadge status={v.decision} /> },
            { key:'enabled', label:'Status', render:v => <span className={v ? 'text-success' : 'text-muted'}>{v ? '● Active' : '○ Disabled'}</span> },
            { key:'hitCount', label:'Hits', mono:true, align:'right', render:v => v?.toLocaleString() },
          ]}
          data={filtered}
          onRowClick={(row) => nav(`/rules/edit/${row.id}`)}
        />
      </div>
    </div>
  )
}
