import React from 'react'

const styles = {
  APPROVE: 'bg-success/10 text-success', DECLINE: 'bg-danger/10 text-danger', REVIEW: 'bg-warning/10 text-warning',
  BLOCK: 'bg-black text-white', LOW: 'bg-success/10 text-success', MEDIUM: 'bg-warning/10 text-warning',
  HIGH: 'bg-danger/10 text-danger', PROHIBITED: 'bg-danger text-white',
  OPEN: 'bg-primary/10 text-primary', INVESTIGATING: 'bg-warning/10 text-warning',
  RESOLVED: 'bg-success/10 text-success', CLOSED: 'bg-muted/20 text-muted',
  RECEIVED: 'bg-warning/10 text-warning', UNDER_REVIEW: 'bg-primary/10 text-primary',
  REPRESENTED: 'bg-primary/10 text-primary', WON: 'bg-success/10 text-success',
  LOST: 'bg-danger/10 text-danger', ARBITRATION: 'bg-warning/10 text-warning',
  PENDING: 'bg-warning/10 text-warning', APPROVED: 'bg-success/10 text-success',
  REJECTED: 'bg-danger/10 text-danger', CLEAR: 'bg-success/10 text-success', HIT: 'bg-danger/10 text-danger',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase ${styles[status] || 'bg-muted/10 text-muted'}`}>
      {status}
    </span>
  )
}
