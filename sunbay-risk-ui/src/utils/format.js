export const fmt = {
  usd: (v) => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  num: (v) => Number(v).toLocaleString('en-US'),
  pct: (v) => `${Number(v).toFixed(2)}%`,
  date: (v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  time: (v) => new Date(v).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  datetime: (v) => `${new Date(v).toLocaleDateString('en-US')} ${new Date(v).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
  daysLeft: (v) => { const d = Math.ceil((new Date(v) - Date.now()) / 86400000); return d < 0 ? 'Overdue' : `${d}d`; },
}
