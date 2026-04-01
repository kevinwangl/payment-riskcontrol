import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import StatusBadge from '../components/shared/StatusBadge'
import { cases } from '../mock/cases'
import { fmt } from '../utils/format'

export default function CaseDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const c = cases.find(x => x.id === id)
  if (!c) return <div className="text-muted">Not found</div>

  return (
    <div className="max-w-[800px]">
      <button onClick={() => nav('/cases')} className="text-[13px] text-muted hover:text-black mb-4">← Back</button>
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-xl font-semibold">{c.id}</h1>
        <StatusBadge status={c.status} />
        <span className="font-mono text-sm font-medium">{c.priority}</span>
      </div>
      <p className="text-[13px] text-muted mb-6">{c.title}</p>

      <div className="grid grid-cols-2 gap-8 mb-8 text-[13px]">
        <div className="space-y-2">
          <div className="flex justify-between"><span className="text-muted">Type</span><span>{c.type}</span></div>
          <div className="flex justify-between"><span className="text-muted">Merchant</span><span className="cursor-pointer text-primary" onClick={() => nav(`/merchants/${c.merchantId}`)}>{c.merchantName}</span></div>
          <div className="flex justify-between"><span className="text-muted">ISO</span><span>{c.isoId}</span></div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between"><span className="text-muted">Assigned</span><span>{c.assignedTo}</span></div>
          <div className="flex justify-between"><span className="text-muted">Deadline</span><span className="font-mono">{fmt.datetime(c.deadline)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Created</span><span className="font-mono">{fmt.datetime(c.createdAt)}</span></div>
        </div>
      </div>

      <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4 border-b border-border pb-2">Investigation Timeline</h3>
      <div className="space-y-4 mb-8">
        {c.timeline.map((e, i) => (
          <div key={i} className="flex gap-4 text-[13px]">
            <div className="w-2 flex flex-col items-center">
              <div className="w-2 h-2 bg-primary mt-1.5" />
              {i < c.timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
            </div>
            <div>
              <div>{e.action}</div>
              <div className="text-[12px] text-muted">{fmt.datetime(e.at)} · {e.by}</div>
            </div>
          </div>
        ))}
      </div>

      {c.status !== 'CLOSED' && (
        <div className="flex gap-3">
          <button onClick={() => alert("Note added to timeline")} className="px-4 py-2 text-[13px] bg-black text-white">Add Note</button>
          <button onClick={() => alert("Case closed")} className="px-4 py-2 text-[13px] border border-border">Close Case</button>
        </div>
      )}
    </div>
  )
}
