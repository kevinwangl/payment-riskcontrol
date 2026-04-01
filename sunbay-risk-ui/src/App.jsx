import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import ReviewWorkbench from './pages/ReviewWorkbench'
import RuleList from './pages/RuleList'
import RuleEditor from './pages/RuleEditor'
import RuleAnalytics from './pages/RuleAnalytics'
import ListManagement from './pages/ListManagement'
import VelocityConfig from './pages/VelocityConfig'
import TransactionLedger from './pages/TransactionLedger'
import TransactionDetail from './pages/TransactionDetail'
import MerchantList from './pages/MerchantList'
import MerchantDetail from './pages/MerchantDetail'
import MerchantOnboarding from './pages/MerchantOnboarding'
import MerchantOnboardingDetail from './pages/MerchantOnboardingDetail'
import ChargebackList from './pages/ChargebackList'
import ChargebackDetail from './pages/ChargebackDetail'
import ChargebackMonitoring from './pages/ChargebackMonitoring'
import CaseList from './pages/CaseList'
import CaseDetail from './pages/CaseDetail'
import ModelList from './pages/ModelList'
import ModelMonitoring from './pages/ModelMonitoring'
import ModelComparison from './pages/ModelComparison'
import Reports from './pages/Reports'
import AuditLog from './pages/AuditLog'
import Login from './pages/Login'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/review" element={<ReviewWorkbench />} />
        <Route path="/rules" element={<RuleList />} />
        <Route path="/rules/edit/:id" element={<RuleEditor />} />
        <Route path="/rules/analytics" element={<RuleAnalytics />} />
        <Route path="/lists" element={<ListManagement />} />
        <Route path="/velocity" element={<VelocityConfig />} />
        <Route path="/transactions" element={<TransactionLedger />} />
        <Route path="/transactions/:id" element={<TransactionDetail />} />
        <Route path="/merchants" element={<MerchantList />} />
        <Route path="/merchants/:id" element={<MerchantDetail />} />
        <Route path="/merchants/onboarding" element={<MerchantOnboarding />} />
        <Route path="/merchants/onboarding/:id" element={<MerchantOnboardingDetail />} />
        <Route path="/chargebacks" element={<ChargebackList />} />
        <Route path="/chargebacks/monitoring" element={<ChargebackMonitoring />} />
        <Route path="/chargebacks/:id" element={<ChargebackDetail />} />
        <Route path="/cases" element={<CaseList />} />
        <Route path="/cases/:id" element={<CaseDetail />} />
        <Route path="/models" element={<ModelList />} />
        <Route path="/models/monitoring" element={<ModelMonitoring />} />
        <Route path="/models/comparison" element={<ModelComparison />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings/audit" element={<AuditLog />} />
      </Route>
    </Routes>
  )
}
