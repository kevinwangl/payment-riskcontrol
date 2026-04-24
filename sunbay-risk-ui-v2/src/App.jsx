import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import RuleList from './pages/RuleList'
import RuleEditor from './pages/RuleEditor'
import RuleAnalytics from './pages/RuleAnalytics'
import ListManagement from './pages/ListManagement'
import VelocityConfig from './pages/VelocityConfig'
import TransactionLedger from './pages/TransactionLedger'
import TransactionDetail from './pages/TransactionDetail'
import MerchantList from './pages/MerchantList'
import MerchantDetail from './pages/MerchantDetail'
import ChargebackImport from './pages/ChargebackImport'
import ChargebackMonitoring from './pages/ChargebackMonitoring'
import Reports from './pages/Reports'
import Analytics from './pages/Analytics'
import AuditLog from './pages/AuditLog'
import Login from './pages/Login'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/rules" element={<RuleList />} />
        <Route path="/rules/edit/:id" element={<RuleEditor />} />
        <Route path="/rules/analytics" element={<RuleAnalytics />} />
        <Route path="/lists" element={<ListManagement />} />
        <Route path="/velocity" element={<VelocityConfig />} />
        <Route path="/transactions" element={<TransactionLedger />} />
        <Route path="/transactions/:id" element={<TransactionDetail />} />
        <Route path="/merchants" element={<MerchantList />} />
        <Route path="/merchants/:id" element={<MerchantDetail />} />
        <Route path="/chargebacks" element={<ChargebackImport />} />
        <Route path="/chargebacks/monitoring" element={<ChargebackMonitoring />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings/audit" element={<AuditLog />} />
        <Route path="*" element={<div className="text-center py-20"><div className="text-[64px] font-mono text-muted">404</div><div className="text-muted mt-2">Page not found</div></div>} />
      </Route>
    </Routes>
  )
}
