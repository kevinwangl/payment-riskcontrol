import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { rules, fieldOptions, operatorOptions } from '../mock/rules'
import { deviceCategories, deviceFieldsByCategory } from '../mock/devices'

// Build a sample JSON object from conditions that would MATCH all conditions
function buildTestJson(conditions) {
  const obj = {}
  const set = (path, val) => {
    const keys = path.split('.')
    let cur = obj
    for (let i = 0; i < keys.length - 1; i++) { cur[keys[i]] = cur[keys[i]] || {}; cur = cur[keys[i]] }
    cur[keys[keys.length - 1]] = val
  }
  conditions.forEach(c => {
    const field = c.field.replace(/['"]/g, '')
    if (field.includes('(')) {
      // Generate stub values for function-style fields
      const v = c.value.replace(/['"]/g, '')
      const num = Number(v)
      const stubVal = c.op === '>' ? (isNaN(num) ? 999 : num + 1000) : (isNaN(num) ? 0 : num)
      // Extract function name as key
      const fname = field.split('(')[0]
      set(`_fn.${fname}`, stubVal)
      // Also extract any dotted args as real paths (e.g. txn.terminal_location)
      const args = field.match(/[\w.]+/g) || []
      args.slice(1).forEach(a => { if (a.includes('.')) set(a, a.includes('lat') || a.includes('location') ? 37.7749 : 'sample') })
      return
    }
    const v = c.value.replace(/['"]/g, '')
    const num = Number(v)
    if (c.op === '>') set(field, isNaN(num) ? v : num + 1000)
    else if (c.op === '>=') set(field, isNaN(num) ? v : num)
    else if (c.op === '<') set(field, isNaN(num) ? v : Math.max(0, num - 1))
    else if (c.op === '<=') set(field, isNaN(num) ? v : num)
    else if (c.op === '==' || c.op === 'IN') set(field, isNaN(num) ? v : num)
    else if (c.op === '!=') set(field, isNaN(num) ? v + '_other' : num + 999)
    else if (c.op === 'NOT IN') set(field, 'OTHER')
    else set(field, isNaN(num) ? v : num)
  })
  return JSON.stringify(obj, null, 2)
}

export default function RuleEditor() {
  const { id } = useParams()
  const nav = useNavigate()
  const existing = rules.find(r => r.id === id)

  const [name, setName] = useState(existing?.name || '')
  const [decision, setDecision] = useState(existing?.action?.decision || 'DECLINE')
  const [suggestions, setSuggestions] = useState(existing?.action?.suggestions || [])
  const [conditions, setConditions] = useState(
    existing ? parseConditions(existing.condition) : [{ field:'txn.amount', op:'>', value:'1000' }]
  )
  const [deviceCategory, setDeviceCategory] = useState(existing?.device_category || 'ALL')
  const [testJson, setTestJson] = useState('')
  const [testResult, setTestResult] = useState(null)

  const deviceCategoryFields = deviceCategory !== 'ALL' && deviceFieldsByCategory[deviceCategory]
    ? deviceFieldsByCategory[deviceCategory].map(f => ({ key:`device.${f.key}`, label:`device.${f.key}`, group:'Device', desc:f.desc }))
    : []
  const allFieldOptions = [...fieldOptions, ...deviceCategoryFields]

  // Auto-generate test JSON whenever conditions change
  useEffect(() => {
    setTestJson(buildTestJson(conditions))
    setTestResult(null)
  }, [conditions])

  const toggleSuggestion = (s) => setSuggestions(prev => prev.includes(s) ? prev.filter(x=>x!==s) : [...prev, s])
  const addCondition = () => setConditions([...conditions, { field:'txn.amount', op:'>', value:'' }])
  const removeCondition = (i) => setConditions(conditions.filter((_,idx) => idx !== i))
  const updateCondition = (i, key, val) => setConditions(conditions.map((c,idx) => idx === i ? {...c,[key]:val} : c))

  const [saved, setSaved] = useState(false)
  const handleSave = () => { setSaved(true); setTimeout(() => { setSaved(false); nav('/rules') }, 1500) }

  const runTest = () => {
    if (!testJson.trim()) { setTestResult('ENTER JSON'); return }
    try {
      const txn = JSON.parse(testJson)
      const hit = conditions.every(c => {
        // Resolve nested field path like "txn.amount" or "card.issuer_country"
        const fieldPath = c.field.replace(/['"]/g, '')
        // Skip function-style fields (velocity, link_count, etc) — always treat as matching for demo
        if (fieldPath.includes('(')) return true
        const val = fieldPath.split('.').reduce((o, k) => o?.[k], txn)
        if (val === undefined) return false
        const numVal = Number(val), numTarget = Number(c.value)
        const strVal = String(val).replace(/['"]/g, ''), strTarget = c.value.replace(/['"]/g, '')
        if (c.op === '>') return numVal > numTarget
        if (c.op === '<') return numVal < numTarget
        if (c.op === '>=') return numVal >= numTarget
        if (c.op === '<=') return numVal <= numTarget
        if (c.op === '==') return strVal === strTarget
        if (c.op === '!=') return strVal !== strTarget
        if (c.op === 'IN') return c.value.replace(/[\[\]'"\s]/g, '').split(',').includes(strVal)
        if (c.op === 'NOT IN') return !c.value.replace(/[\[\]'"\s]/g, '').split(',').includes(strVal)
        return false
      })
      setTestResult(hit ? 'HIT ✓' : 'NO MATCH')
    } catch (e) { setTestResult('INVALID JSON: ' + e.message) }
  }

  return (
    <div className="max-w-[800px] mx-auto">
      <button onClick={() => nav('/rules')} className="text-[13px] text-muted hover:text-black mb-4">← Back to Rules</button>

      <div className="flex items-start justify-between mb-2">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Rule Name"
          className="text-2xl font-semibold bg-transparent border-0 border-b border-transparent focus:border-border outline-none w-full pb-1" />
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <span className="text-[11px] text-muted tracking-[0.05em] uppercase">Action</span>
          <select value={decision} onChange={e => setDecision(e.target.value)}
            className="border border-border px-3 py-1.5 text-[13px] bg-white">
            <option>APPROVE</option><option>DECLINE</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[12px] text-muted mb-8">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-success" /> Active</span>
        <span>|</span>
        <span>Last modified: {existing?.updatedAt || 'now'}</span>
      </div>

      {/* Device Category */}
      <div className="mb-6">
        <span className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium">Device Category</span>
        <div className="flex gap-3 mt-2">
          {[{code:'ALL',label:'All Devices'}, ...deviceCategories].map(c => (
            <label key={c.code} className={`flex items-center gap-1.5 text-[13px] cursor-pointer px-3 py-1.5 border ${deviceCategory === c.code ? 'border-black bg-black text-white' : 'border-border'}`}
              onClick={() => setDeviceCategory(c.code)}>
              {c.label}
            </label>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <div className="mb-6">
        <span className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium">Suggestions</span>
        <div className="flex gap-3 mt-2">
          {['REQUIRE_3DS','REQUIRE_PIN','REQUIRE_OTP'].map(s => (
            <label key={s} className="flex items-center gap-1.5 text-[13px] cursor-pointer">
              <input type="checkbox" checked={suggestions.includes(s)} onChange={() => toggleSuggestion(s)} className="accent-primary" />
              {s}
            </label>
          ))}
        </div>
      </div>

      {/* Conditions */}
      <div className="border-t border-border pt-6 mb-6">
        <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-4">Conditions</h3>
        <div className="text-[13px] font-medium mb-3">IF</div>
        <div className="space-y-3 ml-4">
          {conditions.map((c, i) => (
            <div key={i} className="group">
              <div className="flex items-center gap-2">
                {i > 0 && <span className="text-[11px] text-muted tracking-[0.05em] uppercase w-8">AND</span>}
                {i === 0 && <span className="w-8" />}
                <FieldPicker value={c.field} options={allFieldOptions} onChange={v => updateCondition(i,'field',v)} />
                <select value={c.op} onChange={e => updateCondition(i,'op',e.target.value)}
                  className="border border-border px-3 py-1.5 text-[13px] bg-white w-[80px]">
                  {operatorOptions.map(o => <option key={o}>{o}</option>)}
                </select>
                <input value={c.value} onChange={e => updateCondition(i,'value',e.target.value)}
                  className="border border-border px-3 py-1.5 text-[13px] w-[200px]" placeholder="Value" />
                <button onClick={() => removeCondition(i)} className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 text-[13px]">×</button>
              </div>
              {(() => { const info = allFieldOptions.find(f => f.key === c.field); return info?.desc ? (
                <div className="ml-8 mt-1 text-[11px] text-muted leading-relaxed">{info.desc}</div>
              ) : null })()}
            </div>
          ))}
          <button onClick={addCondition} className="text-[13px] text-primary hover:underline ml-8">+ Add Condition</button>
        </div>
      </div>

      {/* Sandbox Test */}
      <div className="border-t border-border pt-6 mb-6">
        <h3 className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mb-3">Sandbox Test</h3>
        <textarea value={testJson} onChange={e => setTestJson(e.target.value)} rows={4} placeholder='{"txn":{"amount":6000,"entry_mode":"CNP"},"card":{"issuer_country":"GB","type":"CREDIT"},"merchant":{"mcc":"5812"}}'
          className="w-full border border-border p-3 text-[13px] font-mono resize-none" />
        <div className="flex items-center gap-3 mt-2">
          <button onClick={runTest} className="px-4 py-1.5 text-[13px] bg-black text-white">Test Rule</button>
          {testResult && <span className={`text-[13px] font-mono ${testResult.startsWith('HIT') ? 'text-success' : testResult === 'NO MATCH' ? 'text-muted' : 'text-danger'}`}>{testResult}</span>}
        </div>
      </div>

      <div className="border-t border-border pt-6 flex justify-end gap-3">
        {saved && <span className="text-[13px] text-success self-center">✓ Rule saved</span>}
        <button onClick={handleSave} className="px-6 py-2 text-[13px] font-medium bg-black text-white">Save Rule</button>
      </div>
    </div>
  )
}

function FieldPicker({ value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const groups = options.reduce((acc, f) => { (acc[f.group] = acc[f.group] || []).push(f); return acc }, {})
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="border border-border px-3 py-1.5 text-[13px] bg-white text-left w-[420px] font-mono whitespace-nowrap overflow-x-auto">
        {value || 'Select field…'}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-border shadow-lg w-[460px] max-h-[400px] overflow-y-auto">
            {Object.entries(groups).map(([group, fields]) => (
              <div key={group}>
                <div className="px-3 py-1.5 text-[10px] text-muted tracking-[0.08em] uppercase font-medium bg-surface sticky top-0">{group}</div>
                {fields.map(f => (
                  <div key={f.key} onClick={() => { onChange(f.key); setOpen(false) }}
                    className={`px-3 py-2 cursor-pointer hover:bg-surface ${f.key === value ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
                    <div className="font-mono text-[12px]">{f.key}</div>
                    <div className="text-[11px] text-muted mt-0.5 leading-snug">{f.desc}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function parseConditions(expr) {
  if (!expr) return [{ field: 'txn.amount', op: '>', value: '1000' }]
  // Split on AND but not inside parentheses/quotes
  const parts = expr.split(/\s+AND\s+/)
  return parts.map(p => {
    // Try standard comparison: field op value
    const m = p.trim().match(/^(.+?)\s*(>=|<=|>|<|==|!=|NOT IN|IN)\s*(.+)$/)
    if (m) return { field: m[1].trim(), op: m[2].trim(), value: m[3].trim().replace(/^['"]|['"]$/g, '') }
    // Fallback: treat whole expression as a field == true
    return { field: p.trim(), op: '==', value: 'true' }
  })
}
