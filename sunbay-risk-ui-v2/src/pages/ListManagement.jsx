import React, { useState } from 'react'
import DataTable from '../components/shared/DataTable'
import { lists as initialLists, ruleExemptions as initialExemptions } from '../mock/lists'
import { rules } from '../mock/rules'
import { merchants } from '../mock/merchants'
import { fmt } from '../utils/format'

const dimensions = ['CARD_HASH','IP','EMAIL','DEVICE_ID','PHONE','MERCHANT_ID']
const merchantName = (id) => { const m = merchants.find(x => x.id === id); return m ? m.name : id }
const placeholders = { CARD_HASH:'411111******1234', IP:'203.0.113.50', EMAIL:'user@example.com', DEVICE_ID:'dev_abc123', PHONE:'+1-555-123-4567' }

export default function ListManagement() {
  const [tab, setTab] = useState('BLACKLIST') // BLACKLIST | WHITELIST | EXEMPTIONS
  const [search, setSearch] = useState('')
  const [lists, setLists] = useState(initialLists)
  const [exemptions, setExemptions] = useState(initialExemptions)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ dimension:'CARD_HASH', value:'', reason:'', expiresAt:'' })
  // Exemption form
  const [exForm, setExForm] = useState({ merchantId:'', ruleIds:[], reason:'' })

  // --- List filtering ---
  const filteredLists = lists.filter(l => l.type === tab && (search === '' || l.value.toLowerCase().includes(search.toLowerCase()) || l.dimension.includes(search.toUpperCase())))

  // --- Exemptions grouped by merchant ---
  const exemptionsByMerchant = exemptions.reduce((acc, e) => {
    (acc[e.merchantId] = acc[e.merchantId] || []).push(e)
    return acc
  }, {})
  const filteredExMerchants = Object.keys(exemptionsByMerchant).filter(mid =>
    search === '' || merchantName(mid).toLowerCase().includes(search.toLowerCase()) || exemptionsByMerchant[mid].some(e => e.ruleId.toLowerCase().includes(search.toLowerCase()))
  )

  // --- Add entity ---
  const handleAddEntity = () => {
    if (!form.value.trim()) return
    setLists([{ id:`L${Date.now()}`, type:tab, dimension:form.dimension, value:form.value, reason:form.reason||'Manual add', addedBy:'admin@sunbay.io', tenantId:'PLATFORM', expiresAt:form.expiresAt||null, createdAt:new Date().toISOString() }, ...lists])
    setForm({ dimension:'CARD_HASH', value:'', reason:'', expiresAt:'' })
    setShowAdd(false)
  }

  // --- Add exemption ---
  const handleAddExemption = () => {
    if (!exForm.merchantId || exForm.ruleIds.length === 0) return
    const now = new Date().toISOString()
    const newItems = exForm.ruleIds.map(rId => ({ id:`E${Date.now()}_${rId}`, merchantId:exForm.merchantId, ruleId:rId, reason:exForm.reason||'Rule exemption', addedBy:'admin@sunbay.io', expiresAt:null, createdAt:now }))
    setExemptions([...newItems, ...exemptions])
    setExForm({ merchantId:'', ruleIds:[], reason:'' })
    setShowAdd(false)
  }

  const toggleExRule = (rId) => setExForm(f => ({ ...f, ruleIds: f.ruleIds.includes(rId) ? f.ruleIds.filter(x=>x!==rId) : [...f.ruleIds, rId] }))

  // Already exempted rule IDs for selected merchant
  const existingExRuleIds = exForm.merchantId ? exemptions.filter(e => e.merchantId === exForm.merchantId).map(e => e.ruleId) : []

  const isExTab = tab === 'EXEMPTIONS'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">List Management</h1>
        <button onClick={() => { setShowAdd(true); setExForm({ merchantId:'', ruleIds:[], reason:'' }) }} className="px-4 py-2 text-[13px] bg-black text-white">
          {isExTab ? '+ Add Exemption' : '+ Add Entry'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border mb-6">
        {[['BLACKLIST','Blocklist',lists.filter(l=>l.type==='BLACKLIST').length], ['WHITELIST','Allowlist',lists.filter(l=>l.type==='WHITELIST').length], ['EXEMPTIONS','Rule Exemptions',exemptions.length]].map(([key,label,count]) => (
          <button key={key} onClick={() => { setTab(key); setSearch('') }}
            className={`pb-2 text-[13px] border-b-2 ${tab === key ? 'border-black font-medium' : 'border-transparent text-muted hover:text-black'}`}>
            {label} <span className="text-[11px] text-muted">({count})</span>
          </button>
        ))}
      </div>

      <div className="mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isExTab ? 'Search merchants or rules...' : 'Search values, dimensions...'}
          className="border-0 border-b border-border pb-2 text-[13px] w-[300px] outline-none focus:border-primary" />
      </div>

      {/* Blocklist / Allowlist table */}
      {!isExTab && (
        <DataTable
          columns={[
            { key:'value', label:'Value', mono:true },
            { key:'dimension', label:'Dimension' },
            { key:'tenantId', label:'Scope' },
            { key:'addedBy', label:'Added By' },
            { key:'expiresAt', label:'TTL', render:v => v ? fmt.daysLeft(v) : 'Permanent' },
            { key:'createdAt', label:'Date', render:v => fmt.date(v) },
            { key:'id', label:'', sortable:false, render:(_,row) => (
              <button onClick={(e) => { e.stopPropagation(); setLists(lists.filter(l=>l.id!==row.id)) }} className="text-[12px] text-danger hover:underline">Remove</button>
            )},
          ]}
          data={filteredLists}
        />
      )}

      {/* Rule Exemptions — grouped by merchant */}
      {isExTab && (
        <div className="space-y-4">
          {filteredExMerchants.length === 0 && <div className="text-[13px] text-muted py-8 text-center">No rule exemptions configured.</div>}
          {filteredExMerchants.map(mid => (
            <div key={mid} className="border border-border">
              <div className="px-4 py-2 bg-surface flex items-center justify-between">
                <span className="text-[13px] font-medium">{merchantName(mid)} <span className="text-muted font-mono text-[11px]">({mid})</span></span>
                <span className="text-[11px] text-muted">{exemptionsByMerchant[mid].length} rules exempted</span>
              </div>
              <table className="w-full text-[13px]">
                <tbody>{exemptionsByMerchant[mid].map(e => {
                  const rule = rules.find(r => r.id === e.ruleId)
                  return (
                    <tr key={e.id} className="border-t border-border/50 hover:bg-surface/50">
                      <td className="px-4 py-2 font-mono w-[70px]">{e.ruleId}</td>
                      <td className="py-2">{rule?.name || e.ruleId}</td>
                      <td className="py-2 text-[12px] text-muted">{rule ? `${rule.action.decision}${rule.action.score_weight>0?' +'+rule.action.score_weight:''}` : ''}</td>
                      <td className="py-2 text-[12px] text-muted max-w-[200px] truncate">{e.reason}</td>
                      <td className="py-2 text-[12px] text-muted">{e.addedBy}</td>
                      <td className="py-2 text-right px-4">
                        <button onClick={() => setExemptions(exemptions.filter(x=>x.id!==e.id))} className="text-[12px] text-danger hover:underline">Remove</button>
                      </td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setShowAdd(false)} />
          <div className="fixed z-50 bg-white border border-border p-6 shadow-lg" style={{ top:'50%', left:'50%', transform:'translate(-50%,-50%)', width: isExTab ? 520 : 460 }}>

            {isExTab ? (
              /* --- Exemption form --- */
              <>
                <h3 className="text-sm font-semibold mb-4">Add Rule Exemption</h3>
                <div className="space-y-3 text-[13px]">
                  <div>
                    <label className="text-[11px] text-muted uppercase tracking-wide block mb-1">1. Select Merchant</label>
                    <select value={exForm.merchantId} onChange={e => setExForm({...exForm, merchantId:e.target.value, ruleIds:[]})} className="w-full border border-border px-3 py-1.5">
                      <option value="">Select merchant…</option>
                      {merchants.map(m => <option key={m.id} value={m.id}>{m.name} · MCC {m.mcc}</option>)}
                    </select>
                  </div>
                  {exForm.merchantId && (
                    <div>
                      <label className="text-[11px] text-muted uppercase tracking-wide block mb-1">2. Select Rules to Exempt</label>
                      <div className="border border-border max-h-[240px] overflow-y-auto">
                        {rules.filter(r => r.action.decision === 'DECLINE' || r.action.score_weight > 0).map(r => {
                          const already = existingExRuleIds.includes(r.id)
                          const checked = exForm.ruleIds.includes(r.id)
                          return (
                            <label key={r.id} className={`flex items-center gap-2 px-3 py-2 border-b border-border/30 cursor-pointer hover:bg-surface ${already ? 'opacity-40' : ''}`}>
                              <input type="checkbox" checked={checked} disabled={already} onChange={() => !already && toggleExRule(r.id)} className="accent-primary" />
                              <span className="font-mono text-[11px] text-muted w-[50px]">{r.id}</span>
                              <span className="flex-1">{r.name}</span>
                              <span className="text-[11px] text-muted">{r.action.decision}{r.action.score_weight>0?' +'+r.action.score_weight:''}</span>
                              {already && <span className="text-[10px] text-warning">Already exempt</span>}
                            </label>
                          )
                        })}
                      </div>
                      {exForm.ruleIds.length > 0 && <div className="text-[12px] text-primary mt-1">{exForm.ruleIds.length} rule(s) selected</div>}
                    </div>
                  )}
                  <div>
                    <label className="text-[11px] text-muted uppercase tracking-wide block mb-1">3. Reason</label>
                    <input value={exForm.reason} onChange={e => setExForm({...exForm, reason:e.target.value})} className="w-full border border-border px-3 py-1.5" placeholder="Why is this merchant exempt?" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={handleAddExemption} disabled={!exForm.merchantId || exForm.ruleIds.length===0}
                      className="px-4 py-2 bg-black text-white text-[13px] disabled:opacity-30">Add Exemption</button>
                    <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-border text-[13px]">Cancel</button>
                  </div>
                </div>
              </>
            ) : (
              /* --- Entity form --- */
              <>
                <h3 className="text-sm font-semibold mb-4">Add to {tab === 'BLACKLIST' ? 'Blocklist' : 'Allowlist'}</h3>
                <div className="space-y-3 text-[13px]">
                  <div>
                    <label className="text-[11px] text-muted uppercase tracking-wide block mb-1">Dimension</label>
                    <select value={form.dimension} onChange={e => setForm({...form, dimension:e.target.value, value:''})} className="w-full border border-border px-3 py-1.5">
                      {dimensions.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-muted uppercase tracking-wide block mb-1">Value</label>
                    {form.dimension === 'MERCHANT_ID' ? (
                      <select value={form.value} onChange={e => setForm({...form, value:e.target.value})} className="w-full border border-border px-3 py-1.5">
                        <option value="">Select merchant…</option>
                        {merchants.map(m => <option key={m.id} value={m.id}>{m.name} · MCC {m.mcc}</option>)}
                      </select>
                    ) : (
                      <input value={form.value} onChange={e => setForm({...form, value:e.target.value})} className="w-full border border-border px-3 py-1.5" placeholder={placeholders[form.dimension]||''} />
                    )}
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
                    <button onClick={handleAddEntity} className="px-4 py-2 bg-black text-white text-[13px]">Add</button>
                    <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-border text-[13px]">Cancel</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
