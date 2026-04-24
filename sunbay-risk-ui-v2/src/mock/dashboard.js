const days7 = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-6+i); return d.toISOString().slice(0,10) })
const days30 = Array.from({length:30},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-29+i); return d.toISOString().slice(0,10) })

export const dashboardData = {
  kpis: { totalTransactions: 1245678, declineRate: 4.8, cbRate: 0.62 },

  declineReasonTrend: days7.map(d => ({
    date: d,
    velocity: Math.floor(Math.random() * 120 + 80),
    blacklist: Math.floor(Math.random() * 60 + 40),
    limit: Math.floor(Math.random() * 90 + 50),
    device: Math.floor(Math.random() * 40 + 15),
    other: Math.floor(Math.random() * 30 + 10),
  })),

  deviceOverview: { totalDevices: 4480, highRiskDevices: 127 },

  // Issues by type (left bar chart)
  issuesByType: [
    { issue: 'Root/Jailbreak', count: 20 },
    { issue: 'FW Outdated', count: 13 },
    { issue: 'Attest Failed', count: 8 },
    { issue: 'TEE Unavailable', count: 5 },
    { issue: 'PTS Expired', count: 4 },
    { issue: 'Debug Mode', count: 3 },
    { issue: 'Hook Framework', count: 2 },
    { issue: 'Tamper Detected', count: 1 },
  ],

  // TreeMap data — affected device models
  affectedModels: [
    { name: 'OPPO A78',      size: 18, category: 'COTS',      issue: 'Root/Jailbreak' },
    { name: 'SUNMI P3K',     size: 12, category: 'POS',       issue: 'FW Outdated' },
    { name: 'Galaxy S25',    size: 8,  category: 'COTS',      issue: 'Attest Failed' },
    { name: 'SUNMI V2s',     size: 5,  category: 'Dedicated', issue: 'TEE Unavailable' },
    { name: 'SUNMI P3',      size: 4,  category: 'POS',       issue: 'PTS Expired' },
    { name: 'Xiaomi 14',     size: 3,  category: 'COTS',      issue: 'Debug Mode' },
    { name: 'SUNMI CPad Pay',size: 2,  category: 'Dedicated', issue: 'Root/Jailbreak' },
    { name: 'Pixel 9',       size: 2,  category: 'COTS',      issue: 'Hook Framework' },
    { name: 'SUNMI P3H',     size: 1,  category: 'POS',       issue: 'Tamper Detected' },
    { name: 'SUNMI P2',      size: 1,  category: 'POS',       issue: 'FW Outdated' },
  ],

  // Security threats trend (30d) — with geofence
  securityThreatTrend: days30.map(d => ({
    date: d,
    rootJailbreak: +(Math.random() * 1.8 + 0.5).toFixed(2),
    attestFail: +(Math.random() * 2.5 + 1.0).toFixed(2),
    debugMode: +(Math.random() * 0.8 + 0.2).toFixed(2),
    geofence: +(Math.random() * 1.5 + 0.8).toFixed(2),
  })),
}

// Analytics page data
export const topAffectedDevices = [
  { model: 'OPPO A78',           category: 'COTS',      issue: 'Root/Jailbreak',  count: 18, level: 'danger' },
  { model: 'SUNMI P3K',          category: 'POS',       issue: 'FW Outdated',     count: 12, level: 'danger' },
  { model: 'Samsung Galaxy S25', category: 'COTS',      issue: 'Attest Failed',   count: 8,  level: 'danger' },
  { model: 'SUNMI V2s',          category: 'Dedicated', issue: 'TEE Unavailable', count: 5,  level: 'danger' },
  { model: 'SUNMI P3',           category: 'POS',       issue: 'PTS Expired',     count: 4,  level: 'danger' },
  { model: 'Xiaomi 14',          category: 'COTS',      issue: 'Debug Mode',      count: 3,  level: 'warning' },
  { model: 'SUNMI CPad Pay',     category: 'Dedicated', issue: 'Root/Jailbreak',  count: 2,  level: 'warning' },
  { model: 'Google Pixel 9',     category: 'COTS',      issue: 'Hook Framework',  count: 2,  level: 'warning' },
  { model: 'SUNMI P3H',          category: 'POS',       issue: 'Tamper Detected', count: 1,  level: 'danger' },
  { model: 'SUNMI P2',           category: 'POS',       issue: 'FW Outdated',     count: 1,  level: 'warning' },
]

export const topRules = [
  { ruleId: 'P001', action: 'DECLINE', hitCount: 4201 },
  { ruleId: 'I001', action: 'DECLINE', hitCount: 3210 },
  { ruleId: 'I006', action: 'DECLINE', hitCount: 2890 },
  { ruleId: 'P004', action: 'DECLINE', hitCount: 1834 },
  { ruleId: 'I005', action: 'DECLINE', hitCount: 1678 },
]

export const topEntities = [
  { entity: '45.33.32.156', type: 'IP', riskScore: 98, hitCount: 8401 },
  { entity: '411111******1111', type: 'Card', riskScore: 95, hitCount: 6234 },
  { entity: '185.220.101.34', type: 'IP', riskScore: 89, hitCount: 4192 },
  { entity: '555555******5555', type: 'Card', riskScore: 82, hitCount: 2845 },
  { entity: '91.219.236.174', type: 'IP', riskScore: 78, hitCount: 1204 },
]
