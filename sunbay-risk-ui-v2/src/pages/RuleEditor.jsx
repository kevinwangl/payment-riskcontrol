import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { rules, fieldOptions, operatorOptions, tenantTree } from '../mock/rules'
import { deviceCategories, deviceFieldsByCategory } from '../mock/devices'

export default function RuleEditor() {
  const { id } = useParams()
  const nav = useNavigate()
  const existing = rules.find(r => r.id === id)

  const [name, setName] = useState(existing?.name || '')
  const [decision, setDecision] = useState(existing?.action?.decision || 'DECLINE')
  const [scoreWeight, setScoreWeight] = useState(existing?.action?.score_weight || 0)
  const [suggestions, setSuggestions] = useState(existing?.action?.suggestions || [])
  const [tenant, setTenant] = useState(existing?.tenant || 'ISO')
  const [tenantId, setTenantId] = useState(existing?.tenantId || 'ISO_2001')
  const [entryMode, setEntryMode] = useState(existing?.entryMode || 'ALL')
  const [deviceCategory, setDeviceCategory] = useState(existing?.device_category || 'ALL')
  const [groups, setGroups] = useState(
    existing?.condition_groups || [{ logic:'AND', conditions:[{ field:'txn.amount', op:'>', value:'1000' }] }]
  )
  const [groupLogic, setGroupLogic] = useState(existing?.group_logic || 'AND')
  const [saved, setSaved] = useState(false)

  const deviceCategoryFields = deviceCategory !== 'ALL' && deviceFieldsByCategory[deviceCategory]
    ? deviceFieldsByCategory[deviceCategory].map(f => ({ key:`device.${f.key}`, label:`device.${f.key}`, group:'Device', desc:f.desc }))
    : []
  const allFieldOptions = [...fieldOptions, ...deviceCategoryFields]

  const toggleSuggestion = (s) => setSuggestions(prev => prev.includes(s) ? prev.filter(x=>x!==s) : [...prev, s])

  const updateGroup = (gi, key, val) => setGroups(groups.map((g,i) => i===gi ? {...g,[key]:val} : g))
  const addGroup = () => setGroups([...groups, { logic:'AND', conditions:[{ field:'txn.amount', op:'>', value:'' }] }])
  const removeGroup = (gi) => groups.length > 1 && setGroups(groups.filter((_,i) => i!==gi))

  const addCondition = (gi) => updateGroup(gi, 'conditions', [...groups[gi].conditions, { field:'txn.amount', op:'>', value:'' }])
  const removeCondition = (gi, ci) => {
    const conds = groups[gi].conditions.filter((_,i) => i!==ci)
    if (conds.length === 0) removeGroup(gi)
    else updateGroup(gi, 'conditions', conds)
  }
  const updateCondition = (gi, ci, key, val) => updateGroup(gi, 'conditions', groups[gi].conditions.map((c,i) => i===ci ? {...c,[key]:val} : c))

  const handleSave = () => { setSaved(true); setTimeout(() => { setSaved(false); nav('/rules') }, 1500) }

  const layerLabel = tenant === 'Platform' ? 'L1 · Platform' : tenant === 'ISO' ? 'L2 · ISO' : 'L3 · Merchant'

  return (
    <div className="max-w-[800px] mx-auto">
      <button onClick={() => nav('/rules')} className="text-[13px] text-muted hover:text-black mb-4">← Back to Rules</button>

      {/* Header: Name + Layer badge */}
      <div className="flex items-center gap-3 mb-1">
        <span className={`px-2 py-0.5 text-[10px] font-medium tracking-wide ${tenant==='Platform'?'bg-black text-white':'tenant'==='ISO'?'bg-primary/10 text-primary':'bg-surface text-muted'}`}>{layerLabel}</span>
        <span className="text-[11px] text-muted">{tenantId}</span>
      </div>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Rule Name"
        className="text-2xl font-semibold bg-transparent border-0 border-b border-transparent focus:border-border outline-none w-full pb-1 mb-2" />

      {/* Layer + Tenant + Mode */}
      <div className="grid grid-cols-4 gap-4 mb-6 text-[13px]">
        <div>
          <div className="text-[11px] text-muted tracking-[0.05em] uppercase mb-1">Layer</div>
          <select value={tenant} onChange={e => setTenant(e.target.value)} className="border border-border px-3 py-1.5 w-full bg-white">
            <option value="Platform">L1 · Platform</option><option value="ISO">L2 · ISO</option><option value="Merchant">L3 · Merchant</option>
          </select>
        </div>
        <div>
          <div className="text-[11px] text-muted tracking-[0.05em] uppercase mb-1">Tenant</div>
          <select value={tenantId} onChange={e => setTenantId(e.target.value)} className="border border-border px-3 py-1.5 w-full bg-white">
            {tenantTree.map(t => <optgroup key={t.id} label={t.label}>
              <option value={t.id}>{t.label}</option>
              {t.children.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </optgroup>)}
          </select>
        </div>
        <div>
          <div className="text-[11px] text-muted tracking-[0.05em] uppercase mb-1">Entry Mode</div>
          <select value={entryMode} onChange={e => setEntryMode(e.target.value)} className="border border-border px-3 py-1.5 w-full bg-white">
            <option>ALL</option><option>CP</option><option>CNP</option>
          </select>
        </div>
        <div>
          <div className="text-[11px] text-muted tracking-[0.05em] uppercase mb-1">Device Category</div>
          <select value={deviceCategory} onChange={e => setDeviceCategory(e.target.value)} className="border border-border px-3 py-1.5 w-full bg-white">
            <option value="ALL">All Devices</option>
            {deviceCategories.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {/* Action: Decision + Score Weight + Suggestions */}
      <div className="grid grid-cols-3 gap-4 mb-6 text-[13px]">
        <div>
          <div className="text-[11px] text-muted tracking-[0.05em] uppercase mb-1">Decision</div>
          <select value={decision} onChange={e => setDecision(e.target.value)} className="border border-border px-3 py-1.5 w-full bg-white">
            <option>NONE</option><option>APPROVE</option><option>DECLINE</option>
          </select>
        </div>
        <div>
          <div className="text-[11px] text-muted tracking-[0.05em] uppercase mb-1">Score Weight</div>
          <input type="number" min="0" value={scoreWeight} onChange={e => setScoreWeight(Math.max(0, +e.target.value))}
            className="border border-border px-3 py-1.5 w-full font-mono" />
        </div>
        <div>
          <div className="text-[11px] text-muted tracking-[0.05em] uppercase mb-1">Suggestions</div>
          <div className="flex gap-3 mt-1">
            {['REQUIRE_3DS','REQUIRE_PIN','REQUIRE_OTP'].map(s => (
              <label key={s} className="flex items-center gap-1 text-[12px] cursor-pointer">
                <input type="checkbox" checked={suggestions.includes(s)} onChange={() => toggleSuggestion(s)} className="accent-primary" />
                {s.replace('REQUIRE_','')}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Condition Groups */}
      <div className="border-t border-border pt-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium">Condition Groups</h3>
          {groups.length > 1 && (
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-muted">Group Logic:</span>
              <select value={groupLogic} onChange={e => setGroupLogic(e.target.value)} className="border border-border px-2 py-1 bg-white text-[13px]">
                <option value="AND">AND (all groups)</option><option value="OR">OR (any group)</option>
              </select>
            </div>
          )}
        </div>

        {groups.map((g, gi) => (
          <div key={gi}>
            {gi > 0 && (
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 border-t border-dashed border-border" />
                <span className="text-[11px] font-medium text-muted tracking-wide">{groupLogic}</span>
                <div className="flex-1 border-t border-dashed border-border" />
              </div>
            )}
            <div className="border border-border p-4 mb-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted font-medium">Group {gi+1}</span>
                  <select value={g.logic} onChange={e => updateGroup(gi,'logic',e.target.value)} className="border border-border px-2 py-1 text-[12px] bg-white">
                    <option value="AND">AND</option><option value="OR">OR</option>
                  </select>
                </div>
                {groups.length > 1 && <button onClick={() => removeGroup(gi)} className="text-[12px] text-muted hover:text-danger">Remove</button>}
              </div>
              <div className="space-y-2">
                {g.conditions.map((c, ci) => (
                  <div key={ci} className="group flex items-center gap-2">
                    {ci > 0 && <span className="text-[10px] text-muted tracking-wide w-8 text-center">{g.logic}</span>}
                    {ci === 0 && <span className="w-8" />}
                    <FieldPicker value={c.field} options={allFieldOptions} onChange={v => updateCondition(gi,ci,'field',v)} />
                    <select value={c.op} onChange={e => updateCondition(gi,ci,'op',e.target.value)} className="border border-border px-2 py-1.5 text-[13px] bg-white w-[72px]">
                      {operatorOptions.map(o => <option key={o}>{o}</option>)}
                    </select>
                    <input value={c.value} onChange={e => updateCondition(gi,ci,'value',e.target.value)} className="border border-border px-3 py-1.5 text-[13px] w-[160px] font-mono" placeholder="Value" />
                    <button onClick={() => removeCondition(gi,ci)} className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 text-[13px]">×</button>
                  </div>
                ))}
                <button onClick={() => addCondition(gi)} className="text-[12px] text-primary hover:underline ml-8">+ Add Condition</button>
              </div>
            </div>
          </div>
        ))}
        <button onClick={addGroup} className="text-[13px] text-primary hover:underline mt-2">+ Add Group</button>
      </div>

      {/* Save */}
      <div className="border-t border-border pt-6 flex justify-end gap-3">
        {saved && <span className="text-[13px] text-success self-center">✓ Rule saved</span>}
        <button onClick={handleSave} className="px-6 py-2 text-[13px] font-medium bg-black text-white">Save Rule</button>
      </div>
    </div>
  )
}

function FieldPicker({ value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const [expandedGroup, setExpandedGroup] = useState(() => {
    // Auto-expand the group of the current value
    const match = options.find(f => f.key === value)
    return match?.group || null
  })
  const [search, setSearch] = useState('')

  const grouped = options.reduce((acc, f) => { (acc[f.group] = acc[f.group] || []).push(f); return acc }, {})
  const groupOrder = ['Transaction','Card','Verification','Merchant','Geo','Device','Velocity','Limit','Lists','Score']
  const sortedGroups = groupOrder.filter(g => grouped[g]).map(g => [g, grouped[g]])

  // Filter by search
  const filtered = search.trim()
    ? options.filter(f => f.key.toLowerCase().includes(search.toLowerCase()) || f.desc.toLowerCase().includes(search.toLowerCase()))
    : null

  const currentField = options.find(f => f.key === value)
  const displayLabel = currentField ? `${currentField.group} › ${value}` : (value || 'Select field…')

  return (
    <div className="relative">
      <button onClick={() => { setOpen(!open); setSearch('') }}
        className="border border-border px-3 py-1.5 text-[13px] bg-white text-left w-[320px] font-mono whitespace-nowrap overflow-hidden text-ellipsis">
        {displayLabel}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-border shadow-lg w-[420px] max-h-[420px] flex flex-col">
            {/* Search */}
            <div className="p-2 border-b border-border">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search fields…" autoFocus
                className="w-full border border-border px-2 py-1 text-[12px] outline-none focus:border-primary" />
            </div>

            <div className="overflow-y-auto flex-1">
              {/* Search results mode */}
              {filtered ? (
                filtered.length === 0 ? (
                  <div className="px-3 py-4 text-[12px] text-muted text-center">No fields match "{search}"</div>
                ) : (
                  filtered.map(f => (
                    <div key={f.key} onClick={() => { onChange(f.key); setOpen(false) }}
                      className={`px-3 py-2 cursor-pointer hover:bg-surface ${f.key === value ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted bg-surface px-1.5 py-0.5">{f.group}</span>
                        <span className="font-mono text-[12px]">{f.key}</span>
                      </div>
                      <div className="text-[11px] text-muted mt-0.5 leading-snug">{f.desc}</div>
                    </div>
                  ))
                )
              ) : (
                /* Collapsible group mode */
                sortedGroups.map(([group, fields]) => (
                  <div key={group}>
                    {/* Group header — clickable to expand/collapse */}
                    <div onClick={() => setExpandedGroup(expandedGroup === group ? null : group)}
                      className={`px-3 py-2 cursor-pointer flex items-center justify-between hover:bg-surface/80 ${expandedGroup === group ? 'bg-surface' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] w-3 text-muted">{expandedGroup === group ? '▾' : '▸'}</span>
                        <span className="text-[12px] font-medium">{group}</span>
                      </div>
                      <span className="text-[10px] text-muted">{fields.length}</span>
                    </div>
                    {/* Expanded fields */}
                    {expandedGroup === group && fields.map(f => (
                      <div key={f.key} onClick={() => { onChange(f.key); setOpen(false) }}
                        className={`pl-8 pr-3 py-1.5 cursor-pointer hover:bg-surface ${f.key === value ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
                        <div className="font-mono text-[12px]">{f.key}</div>
                        <div className="text-[11px] text-muted mt-0.5 leading-snug">{f.desc}</div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
