import React from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from '../components/shared/StatusBadge'
import DataTable from '../components/shared/DataTable'
import { onboardingQueue } from '../mock/merchants'

export default function MerchantOnboarding() {
  const nav = useNavigate()
  return (
    <div>
      <button onClick={() => nav('/merchants')} className="text-[13px] text-muted hover:text-black mb-4">← Back to Merchants</button>
      <h1 className="text-xl font-semibold mb-6">Onboarding Queue</h1>
      <DataTable
        columns={[
          { key:'name', label:'Merchant' },
          { key:'isoId', label:'ISO' },
          { key:'mcc', label:'MCC', mono:true },
          { key:'riskScore', label:'Score', mono:true },
          { key:'riskLevel', label:'Risk', render:v => <StatusBadge status={v} /> },
          { key:'kycStatus', label:'KYC', render:v => <StatusBadge status={v} /> },
          { key:'ofacCheck', label:'OFAC', render:v => <StatusBadge status={v === 'CLEAR' ? 'CLEAR' : v} /> },
          { key:'appliedAt', label:'Applied' },
        ]}
        data={onboardingQueue}
        onRowClick={row => nav(`/merchants/onboarding/${row.id}`)}
      />
    </div>
  )
}
