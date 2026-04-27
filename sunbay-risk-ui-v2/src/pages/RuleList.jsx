import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from '../components/shared/StatusBadge'
import { rules, tenantTree, ruleTemplates } from '../mock/rules'

const layers = [
  { key:'Platform', label:'L1 · Platform', badge:'bg-black text-white' },
  { key:'ISO', label:'L2 · ISO', badge:'bg-primary/10 text-primary' },
  { key:'Merchant', label:'L3 · Merchant', badge:'bg-surface text-muted' },
]

export default function RuleList() {
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [threshold, setThreshold] = useState(70)
  const [scoreExpanded, setScoreExpanded] = useState(false)
  const nav = useNavigate()

  // Resolve tenant hierarchy: find which ISO a merchant belongs to
  const findParentISO = (tenantId) => tenantTree.find(t => t.children?.some(c => c.id === tenantId))
  const selectedNode = tenantTree.find(t => t.id === selectedTenant)
  const isMerchant = !selectedNode && selectedTenant && findParentISO(selectedTenant)
  const isISO = selectedNode && selectedNode.children?.length > 0
  const parentISO = isMerchant ? findParentISO(selectedTenant) : null

  // Cascading filter: show all effective rules for the selected tenant
  // Platform → all rules | ISO → Platform + ISO | Merchant → Platform + ISO + Merchant
  const filtered = !selectedTenant
    ? rules
    : selectedTenant === 'PLATFORM'
      ? rules.filter(r => r.tenant === 'Platform')
      : isISO
        ? rules.filter(r => r.tenant === 'Platform' || r.tenantId === selectedTenant)
        : isMerchant
          ? rules.filter(r => r.tenant === 'Platform' || r.tenantId === parentISO.id || r.tenantId === selectedTenant)
          : rules.filter(r => r.tenant === 'Platform' || r.tenantId === selectedTenant)

  // Determine which tenantId is the "own" editable layer
  const editableTenantId = selectedTenant

  const grouped = layers.map(l => ({ ...l, rules: filtered.filter(r => r.tenant === l.key) })).filter(g => g.rules.length > 0)

  const scoreRules = filtered.filter(r => r.action.score_weight > 0 && r.enabled)
  const maxScore = scoreRules.reduce((s, r) => s + r.action.score_weight, 0)
  const barMax = Math.max(maxScore, threshold + 10)

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

      {/* Main */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Rule Engine</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowTemplates(true)} className="px-3 py-1.5 text-[13px] border border-border hover:bg-surface">Apply Template</button>
            {isISO && (
              <button onClick={() => { setTemplateName(selectedNode.label + ' Template'); setShowSaveTemplate(true) }}
                className="px-3 py-1.5 text-[13px] border border-border hover:bg-surface">Save as Template</button>
            )}
            <button onClick={() => nav('/rules/edit/new')} className="px-4 py-1.5 text-[13px] font-medium bg-black text-white">+ New Rule</button>
          </div>
        </div>

        {/* Score Formula — collapsible, only at ISO/Merchant level */}
        {(isISO || isMerchant) && (
          <div className="border border-border mb-6">
            {/* Summary bar — always visible */}
            <div className="flex items-center gap-4 px-4 py-2.5 cursor-pointer hover:bg-surface/50 text-[13px]"
              onClick={() => setScoreExpanded(!scoreExpanded)}>
              <span className="text-[11px] text-muted">{scoreExpanded ? '▾' : '▸'}</span>
              <span className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium">Risk Score</span>
              <span className="font-mono">Threshold ≥ {threshold} → <span className="text-danger">DECLINE</span></span>
              <span className="text-muted">│</span>
              <span className="text-muted">{scoreRules.length} rules</span>
              <span className="text-muted">│</span>
              <span className="text-muted">Max: <span className="font-mono font-medium">{maxScore}</span></span>
              {isMerchant && <span className="text-[11px] text-muted ml-auto">Inherited from {parentISO.label}</span>}
            </div>

            {/* Expanded detail */}
            {scoreExpanded && (
              <div className="border-t border-border px-4 py-3">
                <div className="flex items-center gap-4 mb-2 text-[13px]">
                  <span className="text-muted">Decline Threshold:</span>
                  <div className="flex items-center border border-border">
                    <span className="px-2 py-1 text-[12px] text-muted bg-surface">score ≥</span>
                    <input type="number" min="1" max="200" value={threshold} onChange={e => setThreshold(Math.max(1, +e.target.value))}
                      className="w-[56px] px-2 py-1 text-[13px] font-mono text-center border-l border-border outline-none focus:bg-primary/5" />
                    <span className="px-2 py-1 text-[12px] text-danger bg-surface">→ DECLINE</span>
                  </div>
                  <span className="text-[12px] text-muted font-mono ml-auto">risk_score = Σ (hit rules × score_weight)</span>
                </div>

                <div className="relative h-7 bg-surface overflow-hidden mb-3">
                  <div className="absolute inset-y-0 left-0 bg-success/15" style={{ width: `${(threshold / barMax) * 100}%` }} />
                  <div className="absolute inset-y-0 bg-danger/15" style={{ left: `${(threshold / barMax) * 100}%`, right: 0 }} />
                  <div className="absolute inset-y-0 w-0.5 bg-danger" style={{ left: `${(threshold / barMax) * 100}%` }} />
                  <div className="absolute top-1 text-[10px] font-mono text-success" style={{ left: '4px' }}>APPROVE &lt; {threshold}</div>
                  <div className="absolute top-1 text-[10px] font-mono text-danger" style={{ left: `calc(${(threshold / barMax) * 100}% + 6px)` }}>DECLINE ≥ {threshold}</div>
                  {maxScore > 0 && <div className="absolute top-1 right-1 text-[10px] font-mono text-muted">{maxScore}</div>}
                </div>

                {scoreRules.length > 0 ? (
                  <table className="w-full text-[12px]">
                    <tbody>{scoreRules.map(r => {
                      const condStr = r.condition_groups[0]?.conditions.map(c => `${c.field} ${c.op} ${c.value}`).join(' & ')
                      return (
                        <tr key={r.id} className="border-b border-border/30 hover:bg-surface cursor-pointer" onClick={() => nav(`/rules/edit/${r.id}`)}>
                          <td className="py-1 font-mono text-muted w-[50px]">{r.id}</td>
                          <td className="py-1">{r.name}</td>
                          <td className="py-1 text-muted text-[11px] max-w-[240px] truncate">{condStr}</td>
                          <td className="py-1 text-right font-mono font-medium w-[50px]">+{r.action.score_weight}</td>
                        </tr>
                      )
                    })}</tbody>
                    <tfoot><tr className="border-t border-border">
                      <td colSpan={3} className="py-1 text-right text-muted">Total</td>
                      <td className="py-1 text-right font-mono font-semibold">= {maxScore}</td>
                    </tr></tfoot>
                  </table>
                ) : (
                  <div className="text-[12px] text-muted">No score rules in current scope.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Rules grouped by layer */}
        {grouped.map(g => {
          // Determine if this layer is inherited (read-only) vs editable
          const isInherited = selectedTenant && !(
            (g.key === 'Platform' && editableTenantId === 'PLATFORM') ||
            (g.key === 'ISO' && isISO) ||
            (g.key === 'Merchant' && isMerchant)
          )
          return (
          <div key={g.key} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 text-[10px] font-medium tracking-wide ${g.badge}`}>{g.label}</span>
              <span className="text-[12px] text-muted">{g.rules.length} rules</span>
              {isInherited && <span className="text-[11px] text-muted">🔒 Inherited · read-only</span>}
            </div>
            <table className="w-full text-[13px]">
              <thead><tr className="border-b border-border">
                <th className="text-left py-2 text-[11px] text-muted tracking-wide uppercase font-medium w-[80px]">ID</th>
                <th className="text-left py-2 text-[11px] text-muted tracking-wide uppercase font-medium">Name</th>
                <th className="text-left py-2 text-[11px] text-muted tracking-wide uppercase font-medium w-[60px]">Mode</th>
                <th className="text-left py-2 text-[11px] text-muted tracking-wide uppercase font-medium w-[80px]">Decision</th>
                <th className="text-right py-2 text-[11px] text-muted tracking-wide uppercase font-medium w-[60px]">Weight</th>
                <th className="text-right py-2 text-[11px] text-muted tracking-wide uppercase font-medium w-[50px]">Status</th>
                <th className="text-right py-2 text-[11px] text-muted tracking-wide uppercase font-medium w-[70px]">Hits</th>
              </tr></thead>
              <tbody>{g.rules.map(r => (
                <tr key={r.id} className={`border-b border-border/50 hover:bg-surface cursor-pointer ${isInherited ? 'opacity-60' : ''}`} onClick={() => nav(`/rules/edit/${r.id}`)}>
                  <td className="py-2 font-mono">{r.id}</td>
                  <td className="py-2">{r.name}</td>
                  <td className="py-2">{r.entryMode}</td>
                  <td className="py-2"><StatusBadge status={r.action.decision} /></td>
                  <td className="py-2 text-right font-mono">{r.action.score_weight > 0 ? `+${r.action.score_weight}` : '—'}</td>
                  <td className="py-2 text-right"><span className={r.enabled ? 'text-success' : 'text-muted'}>{r.enabled ? '●' : '○'}</span></td>
                  <td className="py-2 text-right font-mono">{r.hitCount?.toLocaleString()}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          )
        })}

        {/* Apply Template Modal */}
        {showTemplates && (
          <>
            <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowTemplates(false)} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white border border-border shadow-xl w-[520px] p-6">
              <h2 className="text-lg font-semibold mb-4">Apply Rule Template</h2>
              <div className="space-y-3 mb-4">
                <div className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium">System Templates</div>
                {ruleTemplates.filter(t => t.source === 'PLATFORM').map(t => (
                  <div key={t.id} className="border border-border p-3 hover:bg-surface cursor-pointer" onClick={() => { alert(`Applied: ${t.name}\n${t.ruleCount} rules copied.`); setShowTemplates(false) }}>
                    <div className="flex justify-between"><span className="font-medium text-[13px]">{t.name}</span><span className="text-[12px] text-muted">{t.ruleCount} rules</span></div>
                    <div className="text-[12px] text-muted mt-1">{t.description}</div>
                  </div>
                ))}
                {ruleTemplates.some(t => t.source === 'ISO') && (
                  <>
                    <div className="text-[11px] text-muted tracking-[0.05em] uppercase font-medium mt-4">Shared by ISOs</div>
                    {ruleTemplates.filter(t => t.source === 'ISO').map(t => (
                      <div key={t.id} className="border border-border p-3 hover:bg-surface cursor-pointer" onClick={() => { alert(`Applied: ${t.name}\n${t.ruleCount} rules copied.`); setShowTemplates(false) }}>
                        <div className="flex justify-between"><span className="font-medium text-[13px]">{t.name}</span><span className="text-[12px] text-muted">{t.ruleCount} rules</span></div>
                        <div className="text-[12px] text-muted mt-1">{t.description}</div>
                      </div>
                    ))}
                  </>
                )}
              </div>
              <button onClick={() => setShowTemplates(false)} className="px-4 py-1.5 text-[13px] border border-border">Cancel</button>
            </div>
          </>
        )}

        {/* Save as Template Modal */}
        {showSaveTemplate && (
          <>
            <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowSaveTemplate(false)} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white border border-border shadow-xl w-[460px] p-6">
              <h2 className="text-lg font-semibold mb-4">Save as Template</h2>
              <p className="text-[13px] text-muted mb-4">
                Save current ISO rules as a public template. Other ISOs can apply it to quickly set up their rules.
              </p>
              <div className="mb-3">
                <div className="text-[11px] text-muted tracking-[0.05em] uppercase mb-1">Template Name</div>
                <input value={templateName} onChange={e => setTemplateName(e.target.value)}
                  className="border border-border px-3 py-1.5 text-[13px] w-full" />
              </div>
              <div className="mb-4 text-[12px] border border-border p-3">
                <div className="text-muted mb-1">Rules to save (excluding Platform):</div>
                {filtered.filter(r => r.tenant !== 'Platform').map(r => (
                  <div key={r.id} className="flex justify-between py-0.5">
                    <span><span className="font-mono text-[11px] text-muted">{r.id}</span> {r.name}</span>
                    <span className="text-[11px] text-muted">{r.action.decision}{r.action.score_weight > 0 ? ` +${r.action.score_weight}` : ''}</span>
                  </div>
                ))}
                <div className="border-t border-border mt-1 pt-1 font-medium">{filtered.filter(r => r.tenant !== 'Platform').length} rules total</div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowSaveTemplate(false)} className="px-4 py-1.5 text-[13px] border border-border">Cancel</button>
                <button onClick={() => { alert(`Template "${templateName}" saved!\nNow visible to all ISOs.`); setShowSaveTemplate(false) }}
                  className="px-4 py-1.5 text-[13px] font-medium bg-black text-white">Save Template</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
