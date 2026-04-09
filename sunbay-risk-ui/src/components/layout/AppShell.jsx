import React, { useState, useEffect, createContext, useContext } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import AIAssistant from '../shared/AIAssistant'

export const AIContext = createContext()
export const useAI = () => useContext(AIContext)

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Review', to: '/review' },
  { label: 'Rules', to: '/rules' },
  { label: 'Lists', to: '/lists' },
  { label: 'Transactions', to: '/transactions' },
  { label: 'Merchants', to: '/merchants' },
  { label: 'Chargebacks', to: '/chargebacks' },
  { label: 'Cases', to: '/cases' },
  { label: 'Models', to: '/models' },
  { label: 'Reports', to: '/reports' },
  { label: 'Audit', to: '/settings/audit' },
]

export default function AppShell() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [aiOpen, setAiOpen] = useState(false)

  const themes = ['light', 'cyber', 'matrix']
  const themeLabels = { light: '☀ Swiss', cyber: '◆ Cyber', matrix: '⬡ Matrix' }
  const nextTheme = () => setTheme(t => themes[(themes.indexOf(t) + 1) % themes.length])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'light' ? '' : theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <AIContext.Provider value={{ aiOpen, setAiOpen }}>
      <div className="min-h-screen flex">
        {/* Main content area — shrinks when AI opens */}
        <div className="flex-1 min-w-0 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ marginRight: aiOpen ? 420 : 0 }}>
          <header className="border-b border-border flex items-center h-12 px-6 gap-8 sticky top-0 z-50" style={{ background: 'var(--bg, #fff)' }}>
            <NavLink to="/dashboard" className="font-semibold text-sm tracking-wide flex items-center gap-1.5">
              <span className="text-primary">◆</span> SUNBAY
            </NavLink>
            <nav className="flex gap-6 text-[13px]">
              {navItems.map(n => (
                <NavLink key={n.to} to={n.to} end={n.to === '/dashboard'}
                  className={({ isActive }) =>
                    `py-3 border-b-2 ${isActive ? 'border-primary text-primary font-medium' : 'border-transparent text-muted hover:text-primary'}`
                  }>{n.label}</NavLink>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-4 text-[13px]">
              <button onClick={nextTheme}
                className="px-2.5 py-1 text-[11px] border border-border text-muted hover:text-primary hover:border-primary transition-colors">
                {themeLabels[theme]} →
              </button>
              <span className="flex items-center gap-1.5 text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-success" /> System Operational
              </span>
            </div>
          </header>
          <main className="max-w-[1400px] w-full mx-auto px-6 py-8 flex-1">
            <Outlet />
          </main>
        </div>

        {/* AI Panel — fixed right, pushes content */}
        <AIAssistant />
      </div>
    </AIContext.Provider>
  )
}
