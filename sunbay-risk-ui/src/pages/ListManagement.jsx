import React, { useState } from 'react'
import DataTable from '../components/shared/DataTable'
import { lists as initialLists } from '../mock/lists'
import { fmt } from '../utils/format'

const tabs = ['BLACKLIST','WHITELIST','GREYLIST']
const dimensions = ['IP','CARD_HASH','BIN','DEVICE','EMAIL']

export default function ListManagement() {
  const [tab, setTab] = useState('BLACKLIST')
  const [search, setSearch] = useState('')
  const [data, setData] = useState(initialLists)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ dimension:'IP', value:'', reason:'', expiresAt:'' })

  const filtered = data.filter(l => l.type === tab && (search === '' || l.value.includes(search) || l.dimension.includes(search.toUpperCase())))

  const handleAdd = () => {
    if (!form.value.trim()) return
    const entry = {
      id: `L${Date.now()}`, type: tab, dimension: form.dimension, value: form.value,
      reason: form.reason || 'Manual add', addedBy: 'admin@sunbay.io', tenantId: 'PLATFORM',
      expiresAt: form.expiresAt || null, createdAt: new Date().toISOString(),
    }
    setData([entry, ...data])
    setForm({ dimension:'IP', value:'', reason:'', expiresAt:'' })
    setShowAdd(false)
  }

  const handleRemove = (id) => setData(data.filter(l => l.id !== id))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">List Management</h1>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 text-[13px] bg-black text-white">+ Add Entry</button>
      </div>

      {/* Add modal */}
      {showAdd && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setShowAdd(false)} />
          <div className="fixed z-50 bg-white border border-border p-6 w-[420px] shadow-lg" style={{ top:'50%', left:'50%', transform:'translate(-50%,-50%)', maxHeight:'80vh' }}>
            <h3 className="text-sm font-semibold mb-4">Add to {tab === 'BLACKLIST' ? 'Blocklist' : tab === 'WHITELIST' ? 'Allowlist' : 'Greylist'}</h3>
            <div className="space-y-3 text-[13px]">
              <div>
                <label className="text-[11px] text-muted uppercase tracking-wide block mb-1">Dimension</label>
                <select value={form.dimension} onChange={e => setForm({...form, dimension:e.target.value})} className="w-full border border-border px-3 py-1.5">
                  {dimensions.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-muted uppercase tracking-wide block mb-1">Value</label>
                <input value={form.value} onChange={e => setForm({...form, value:e.target.value})} className="w-full border border-border px-3 py-1.5" placeholder="e.g. 192.168.1.100" />
              </div>
              <div>
                <label className="text-[11px] text-muted uppercase tracking-wide block mb-1">Reason</label>
                <input value={form.reason} onChange={e => setForm({...form, reason:e.target.value})} className="w-full border border-border px-3 py-1.5" placeholder="Reason for adding" />
              </div>
              <div>
                <label className="text-[11px] text-muted uppercase tracking-wide block mb-1">Expires (optional)</label>
                <input type="datetime-local" value={form.expiresAt} onChange={e => setForm({...form, expiresAt:e.target.value})} className="w-full border border-border px-3 py-1.5" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleAdd} className="px-4 py-2 bg-black text-white text-[13px]">Add</button>
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-border text-[13px]">Cancel</button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex gap-6 border-b border-border mb-6">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2 text-[13px] border-b-2 ${tab === t ? 'border-black font-medium' : 'border-transparent text-muted hover:text-black'}`}>
            {t === 'BLACKLIST' ? 'Blocklist' : t === 'WHITELIST' ? 'Allowlist' : 'Greylist'}
          </button>
        ))}
      </div>
      <div className="mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search values..."
          className="border-0 border-b border-border pb-2 text-[13px] w-[300px] outline-none focus:border-primary" />
      </div>
      <DataTable
        columns={[
          { key:'value', label:'Value', mono:true },
          { key:'dimension', label:'Dimension' },
          { key:'tenantId', label:'Scope' },
          { key:'addedBy', label:'Added By' },
          { key:'expiresAt', label:'TTL', render:v => v ? fmt.daysLeft(v) : 'Permanent' },
          { key:'createdAt', label:'Date', render:v => fmt.date(v) },
          { key:'id', label:'', sortable:false, render:(_,row) => (
            <button onClick={(e) => { e.stopPropagation(); handleRemove(row.id) }} className="text-[12px] text-danger hover:underline">Remove</button>
          )},
        ]}
        data={filtered}
      />
    </div>
  )
}
