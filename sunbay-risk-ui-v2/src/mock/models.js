const days30 = Array.from({length:30},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-29+i); return d.toISOString().slice(0,10) })

export const models = [
  { version:'v1.0_xgb', algorithm:'XGBoost', trainTime:'2025-09-15', dataSize:45000, auc:0.891, precision:0.82, recall:0.76, status:'RETIRED' },
  { version:'v2.0_xgb', algorithm:'XGBoost', trainTime:'2025-12-01', dataSize:82000, auc:0.923, precision:0.87, recall:0.81, status:'RETIRED' },
  { version:'v2.3_xgb', algorithm:'XGBoost', trainTime:'2026-02-15', dataSize:125000, auc:0.941, precision:0.89, recall:0.84, status:'PRODUCTION' },
  { version:'v2.4_lgb', algorithm:'LightGBM', trainTime:'2026-03-20', dataSize:138000, auc:0.948, precision:0.91, recall:0.86, status:'SHADOW' },
  { version:'v2.5_xgb', algorithm:'XGBoost', trainTime:'2026-03-28', dataSize:142000, auc:0.945, precision:0.90, recall:0.85, status:'TRAINING' },
]

export const modelMonitoring = {
  currentModel: 'v2.3_xgb',
  currentAuc: 0.941,
  currentPrecision: 0.89,
  currentRecall: 0.84,
  psiTrend: days30.map(d => ({ date:d, value:+(Math.random()*0.15+0.05).toFixed(3) })),
  precisionTrend: days30.map(d => ({ date:d, value:+(Math.random()*0.06+0.86).toFixed(3) })),
  recallTrend: days30.map(d => ({ date:d, value:+(Math.random()*0.06+0.81).toFixed(3) })),
  reviewRateTrend: days30.map(d => ({ date:d, value:+(Math.random()*3+8).toFixed(1) })),
  predictionShift: days30.map(d => ({ date:d, value:+(Math.random()*10+45).toFixed(1) })),
}

// Shadow comparison: production v2.3 vs shadow v2.4
const bins = Array.from({length:20},(_,i)=>i*5)
export const shadowComparison = {
  production: { version:'v2.3_xgb', auc:0.941, precision:0.89, recall:0.84, declineRate:4.2,
    scoreDistribution: bins.map(b=>({ bin:`${b}-${b+5}`, count: Math.floor(Math.random()*800 + (b<30?1500:b>70?200:500)) })),
  },
  shadow: { version:'v2.4_lgb', auc:0.948, precision:0.91, recall:0.86, declineRate:3.8,
    scoreDistribution: bins.map(b=>({ bin:`${b}-${b+5}`, count: Math.floor(Math.random()*800 + (b<30?1600:b>70?180:480)) })),
  },
}
