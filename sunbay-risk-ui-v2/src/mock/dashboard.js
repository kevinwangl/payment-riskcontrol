const days7 = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-6+i); return d.toISOString().slice(0,10) })
const days30 = Array.from({length:30},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-29+i); return d.toISOString().slice(0,10) })

// Device risk trends
const deviceAttestation30d = days30.map(d => ({ date: d, rate: +(Math.random() * 2.5 + 1.0).toFixed(2) }))
const deviceCategoryTrend = days7.map(d => ({ date: d, cots: Math.floor(Math.random() * 800 + 3000), pos: Math.floor(Math.random() * 600 + 2200), dedicated: Math.floor(Math.random() * 400 + 1200) }))
const geofenceTrend30d = days30.map(d => ({ date: d, rate: +(Math.random() * 1.5 + 0.8).toFixed(2) }))
const deviceRuleHits7d = days7.map(d => ({ date: d, high_risk: Math.floor(Math.random() * 30 + 10), warning: Math.floor(Math.random() * 50 + 20), alert: Math.floor(Math.random() * 80 + 40) }))

export const dashboardData = {
  kpis: { totalTransactions:1245678, fraudRate:1.24, automatedBlocks:12450, trendTxn:'+5.2%', trendFraud:'+0.1%', trendBlocks:'-2.1%' },
  txnTrend: days7.map(d=>({ date:d, volume:Math.floor(Math.random()*20000)+25000 })),
  cbRateTrend: days30.map(d=>({ date:d, rate:+(Math.random()*0.6+0.3).toFixed(3) })),
  topRules: [
    { ruleId:'P001', action:'DECLINE', hitCount:4201 },
    { ruleId:'I001', action:'DECLINE', hitCount:3210 },
    { ruleId:'I006', action:'DECLINE', hitCount:2890 },
    { ruleId:'P007', action:'DECLINE', hitCount:2105 },
    { ruleId:'I005', action:'DECLINE', hitCount:1678 },
  ],
  topEntities: [
    { entity:'45.33.32.156', type:'IP', riskScore:98, hitCount:8401 },
    { entity:'411111******1111', type:'Card', riskScore:95, hitCount:6234 },
    { entity:'185.220.101.34', type:'IP', riskScore:89, hitCount:4192 },
    { entity:'555555******5555', type:'Card', riskScore:82, hitCount:2845 },
    { entity:'91.219.236.174', type:'IP', riskScore:78, hitCount:1204 },
  ],
  deviceAttestation30d,
  deviceCategoryTrend,
  geofenceTrend30d,
  deviceRuleHits7d,
}
