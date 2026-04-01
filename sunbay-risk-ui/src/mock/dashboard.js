const days7 = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-6+i); return d.toISOString().slice(0,10) })
const days30 = Array.from({length:30},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-29+i); return d.toISOString().slice(0,10) })

export const dashboardData = {
  kpis: { totalTransactions:1245678, fraudRate:1.24, automatedBlocks:12450, reviewQueue:342, trendTxn:'+5.2%', trendFraud:'+0.1%', trendBlocks:'-2.1%', trendQueue:'-1.5%' },
  txnTrend: days7.map(d=>({ date:d, volume:Math.floor(Math.random()*20000)+25000 })),
  cbRateTrend: days30.map(d=>({ date:d, rate:+(Math.random()*0.6+0.3).toFixed(3) })),
  topRules: [
    { ruleId:'P001', action:'BLOCK', hitCount:4201 },
    { ruleId:'I001', action:'REVIEW', hitCount:3210 },
    { ruleId:'I006', action:'BLOCK', hitCount:2890 },
    { ruleId:'P007', action:'REVIEW', hitCount:2105 },
    { ruleId:'I005', action:'REVIEW', hitCount:1678 },
  ],
  topEntities: [
    { entity:'192.168.1.104', type:'IP', riskScore:98, hitCount:8401 },
    { entity:'411111******1111', type:'Card', riskScore:95, hitCount:6234 },
    { entity:'10.0.0.55', type:'IP', riskScore:89, hitCount:4192 },
    { entity:'555555******5555', type:'Card', riskScore:82, hitCount:2845 },
    { entity:'172.16.254.1', type:'IP', riskScore:78, hitCount:1204 },
  ],
}
