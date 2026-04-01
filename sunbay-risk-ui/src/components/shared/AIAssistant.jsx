import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAI } from '../layout/AppShell'
import { getAIResponse, pagePrompts } from '../../mock/aiResponses'
import LightningSeam from './LightningSeam'
import HeartbeatLine from './HeartbeatLine'

// Typewriter hook
function useTypewriter(text, speed = 22) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    setDisplayed(''); setDone(false)
    if (!text) return
    let i = 0
    const timer = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) { clearInterval(timer); setDone(true) }
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed])
  return { displayed, done }
}

// Highlight data references in AI text
function HighlightedText({ text }) {
  const parts = text.split(/(\b\d+[\d,.]*%?|\bv\d+\.\d+\w*|\b[A-Z][A-Z0-9_]{2,}\b|\$[\d,.]+|\bM_\d+\b|\bC\d{3}\b|\bCB\d{3}\b|\bP00[0-8]\b|\bI0\d{2}\b)/g)
  return parts.map((p, i) =>
    /^(\d|v\d|\$|[A-Z][A-Z0-9_]{2,}|M_|C\d|CB|P00|I0)/.test(p)
      ? <span key={i} className="ai-data-ref">{p}</span>
      : <span key={i}>{p}</span>
  )
}

// Typewriter message component
function TypewriterMessage({ text, links, onDone, nav, setOpen }) {
  const { displayed, done } = useTypewriter(text, 18)
  useEffect(() => { if (done) onDone?.() }, [done])
  return (
    <div className="ai-msg-bubble px-3.5 py-2.5 mr-4">
      <pre className="whitespace-pre-wrap text-[12px] leading-relaxed" style={{ fontFamily: 'var(--font-sans)', margin: 0 }}>
        <HighlightedText text={displayed} />
        {!done && <span className="ai-cursor">|</span>}
      </pre>
      {done && links?.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap" style={{ animation: 'promptItem 0.3s ease both' }}>
          {links.map(l => (
            <button key={l.to} onClick={() => { nav(l.to); setOpen(false) }}
              className="ai-link-btn text-[11px] px-2.5 py-1 border transition-all duration-200 hover:translate-x-0.5"
              style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
              {l.label} →
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AIAssistant() {
  const { aiOpen: open, setAiOpen: setOpen } = useAI()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [ready, setReady] = useState(false)
  const [activeTypewriter, setActiveTypewriter] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const location = useLocation()
  const nav = useNavigate()

  const prompts = pagePrompts[location.pathname] || pagePrompts['/dashboard']
  const pageName = location.pathname.split('/')[1] || 'dashboard'

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, thinking])
  useEffect(() => { if (open && ready) setTimeout(() => inputRef.current?.focus(), 100) }, [open, ready])
  useEffect(() => { setMessages([]); setReady(false); setActiveTypewriter(null) }, [location.pathname])

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); toggle() }
      if (e.key === 'Escape' && open) setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  const toggle = () => {
    if (!open) { setOpen(true); setReady(false); setTimeout(() => setReady(true), 1200) }
    else setOpen(false)
  }

  const send = (text) => {
    const q = text || input
    if (!q.trim() || thinking) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setThinking(true)
    setTimeout(() => {
      const resp = getAIResponse(q)
      setThinking(false)
      setActiveTypewriter(resp)
      setMessages(prev => [...prev, { role: 'ai', text: resp.text, links: resp.links }])
    }, 1200 + Math.random() * 800)
  }

  return (
    <>
      {/* Lightning seam trigger on right edge */}
      {!open && (
        <div className="fixed right-0 top-0 h-full z-50 group cursor-pointer" style={{ width: 48 }} onClick={toggle}>
          <LightningSeam />
          {/* AI label on hover */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:-translate-x-1 z-10"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
            <span className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--primary)', textShadow: `0 0 12px var(--primary-glow)` }}>AI</span>
            <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>⌘K</span>
          </div>
        </div>
      )}

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full flex flex-col z-20 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ width: 420, transform: open ? 'translateX(0)' : 'translateX(100%)', background: 'var(--bg, #fff)', borderLeft: '1px solid var(--border)' }}>

        {/* Glow edge + burst + lightning */}
        <div className="absolute left-0 top-0 w-[1px] h-full" style={{ background: `linear-gradient(180deg, transparent 0%, var(--primary) 20%, var(--primary) 80%, transparent 100%)`, opacity: open ? 0.4 : 0, transition: 'opacity 0.6s ease 0.2s', boxShadow: `0 0 8px var(--primary-glow), 2px 0 16px var(--primary-glow)` }} />
        {open && <div className="absolute left-0 top-0 w-[3px] h-full pointer-events-none" style={{ background: `linear-gradient(180deg, transparent 10%, var(--primary) 40%, var(--primary) 60%, transparent 90%)`, animation: 'seamBurst 0.6s ease-out forwards' }} />}
        {open && <div className="absolute left-[-20px] top-0 h-full pointer-events-none overflow-visible" style={{ width: 40, zIndex: 5 }}><LightningSeam /></div>}

        {/* Boot sequence */}
        {open && !ready && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg)' }}>
            <div style={{ width: 56, height: 56, position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', boxShadow: `0 0 20px var(--primary-glow)` }} />
              <div style={{ position: 'absolute', inset: 8, border: '2px solid var(--border)', borderBottomColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1.2s linear infinite reverse', boxShadow: `0 0 10px var(--primary-glow)` }} />
              <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold" style={{ color: 'var(--primary)' }}>AI</div>
            </div>
            <div className="text-[11px] font-mono space-y-1.5 text-center" style={{ color: 'var(--text-muted)' }}>
              <div style={{ animation: 'bootLine 0.3s ease 0.1s both' }}>Initializing neural engine...</div>
              <div style={{ animation: 'bootLine 0.3s ease 0.4s both' }}>Loading context: <span style={{ color: 'var(--primary)' }}>{pageName}</span></div>
              <div style={{ animation: 'bootLine 0.3s ease 0.7s both' }}>Connecting risk knowledge base...</div>
              <div style={{ animation: 'bootLine 0.3s ease 1.0s both', color: 'var(--primary)' }}>✓ Ready</div>
            </div>
          </div>
        )}

        {/* Header with animated orb */}
        <div className="px-5 py-4 border-b flex items-center gap-3 flex-shrink-0" style={{ borderColor: 'var(--border)', opacity: ready ? 1 : 0, transition: 'opacity 0.3s ease' }}>
          <div className="ai-orb">
            <div className="ai-orb-ring" />
            <div className="ai-orb-ring2" />
            <div className="ai-orb-dot ai-orb-dot1" />
            <div className="ai-orb-dot ai-orb-dot2" />
            <div className="ai-orb-dot ai-orb-dot3" />
            <span className="ai-orb-core">✦</span>
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>SUNBAY AI</div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Context: <span style={{ color: 'var(--primary)' }}>{pageName}</span> · {thinking ? <span style={{ color: 'var(--warning, #FAAD14)' }}>Thinking...</span> : <span style={{ color: 'var(--success, #52C41A)' }}>Online</span>}
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="ml-auto text-[18px] transition-all duration-200 hover:scale-110 hover:rotate-90" style={{ color: 'var(--text-muted)' }}>✕</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ fontSize: 13, opacity: ready ? 1 : 0, transition: 'opacity 0.4s ease 0.2s' }}>

          {/* Quick prompts */}
          {messages.length === 0 && ready && (
            <div style={{ animation: 'promptsReveal 0.5s ease 0.2s both' }}>
              <div className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>Suggestions for this page:</div>
              <div className="space-y-2">
                {prompts.map((p, i) => (
                  <button key={p} onClick={() => send(p)}
                    className="ai-prompt-card flex items-center w-full text-left px-3 py-2.5 text-[12px] transition-all duration-200 relative overflow-hidden"
                    style={{ color: 'var(--text)', background: 'transparent', animation: `promptItem 0.4s ease ${0.3 + i * 0.1}s both`, '--aurora-delay': `${i * -3}s` }}>
                    <div className="aurora-bg" />
                    <span className="relative z-[1]">{p}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{ animation: 'msgSlideIn 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
              {m.role === 'user' && (
                <>
                  <div className="flex items-center gap-1.5 mb-1.5 justify-end">
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>You</span>
                  </div>
                  <div className="px-3.5 py-2.5 ml-8" style={{ background: 'var(--primary)', color: '#fff' }}>
                    <pre className="whitespace-pre-wrap text-[12px] leading-relaxed" style={{ fontFamily: 'var(--font-sans)', margin: 0 }}>{m.text}</pre>
                  </div>
                </>
              )}
              {m.role === 'ai' && (
                <>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--primary)', boxShadow: `0 0 6px var(--primary-glow)` }} />
                    <span className="text-[11px] font-medium" style={{ color: 'var(--primary)' }}>SUNBAY AI</span>
                  </div>
                  {i === messages.length - 1 && activeTypewriter ? (
                    <TypewriterMessage text={m.text} links={m.links} nav={nav} setOpen={setOpen}
                      onDone={() => setActiveTypewriter(null)} />
                  ) : (
                    <div className="ai-msg-bubble px-3.5 py-2.5 mr-4">
                      <pre className="whitespace-pre-wrap text-[12px] leading-relaxed" style={{ fontFamily: 'var(--font-sans)', margin: 0 }}>
                        <HighlightedText text={m.text} />
                      </pre>
                      {m.links?.length > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {m.links.map(l => (
                            <button key={l.to} onClick={() => { nav(l.to); setOpen(false) }}
                              className="ai-link-btn text-[11px] px-2.5 py-1 border transition-all duration-200 hover:translate-x-0.5"
                              style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                              {l.label} →
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {/* Thinking state: scanner + waveform */}
          {thinking && (
            <div className="ai-thinking" style={{ animation: 'msgSlideIn 0.3s ease' }}>
              <div className="ai-thinking-header">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--primary)' }} />
                <span className="text-[11px] font-medium" style={{ color: 'var(--primary)' }}>SUNBAY AI</span>
              </div>
              <div className="ai-thinking-box">
                <div className="ai-scan-line" />
                <div className="ai-waveform">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="ai-wave-bar" style={{ animationDelay: `${i * 0.08}s` }} />
                  ))}
                </div>
                <div className="ai-thinking-text">Analyzing risk context<span className="ai-blink">...</span></div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t flex items-center gap-2 flex-shrink-0" style={{ borderColor: 'var(--border)', opacity: ready ? 1 : 0, transition: 'opacity 0.3s ease 0.3s' }}>
          <span className="text-[16px]" style={{ color: 'var(--primary)', filter: `drop-shadow(0 0 6px var(--primary-glow))`, animation: thinking ? 'spin 1s linear infinite' : 'spin 12s linear infinite' }}>✦</span>
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={thinking ? 'AI is thinking...' : 'Ask AI...'}
            disabled={thinking}
            className="flex-1 text-[13px] border-0 outline-none bg-transparent disabled:opacity-50"
            style={{ color: 'var(--text)' }} />
          {input && !thinking && (
            <button onClick={() => send()} className="px-3 py-1.5 text-[11px] font-medium"
              style={{ background: 'var(--primary)', color: '#fff', boxShadow: `0 0 12px var(--primary-glow)` }}>
              Send ↵
            </button>
          )}
          <kbd className="px-1.5 py-0.5 text-[10px] border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>ESC</kbd>
        </div>
      </div>
    </>
  )
}
