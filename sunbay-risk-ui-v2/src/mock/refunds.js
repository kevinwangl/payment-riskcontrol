// Refund monitoring mock data

export const refundMerchants = [
  { merchantId:'M_1005', name:'JewelBox', isoId:'ISO_2002', refundRate:18.5, amountRatio:22.3, fullRefundRatio:85, fastRefundRate:42, totalRefunds:127, totalAmount:89400, alertLevel:'CRITICAL' },
  { merchantId:'M_1012', name:'GameZone', isoId:'ISO_2002', refundRate:14.2, amountRatio:16.8, fullRefundRatio:72, fastRefundRate:35, totalRefunds:98, totalAmount:45200, alertLevel:'CRITICAL' },
  { merchantId:'M_1011', name:'TravelCo', isoId:'ISO_2001', refundRate:11.3, amountRatio:13.5, fullRefundRatio:60, fastRefundRate:18, totalRefunds:64, totalAmount:128000, alertLevel:'WARNING' },
  { merchantId:'M_1002', name:'TechStore', isoId:'ISO_2001', refundRate:9.8, amountRatio:11.2, fullRefundRatio:55, fastRefundRate:12, totalRefunds:52, totalAmount:67800, alertLevel:'WARNING' },
  { merchantId:'M_1010', name:'OnlineShop', isoId:'ISO_2001', refundRate:8.5, amountRatio:9.1, fullRefundRatio:48, fastRefundRate:8, totalRefunds:41, totalAmount:32100, alertLevel:'INFO' },
  { merchantId:'M_1004', name:'FoodHub', isoId:'ISO_2002', refundRate:6.2, amountRatio:5.8, fullRefundRatio:30, fastRefundRate:5, totalRefunds:28, totalAmount:8400, alertLevel:'INFO' },
  { merchantId:'M_1013', name:'SubShop', isoId:'ISO_2001', refundRate:4.1, amountRatio:3.5, fullRefundRatio:22, fastRefundRate:3, totalRefunds:15, totalAmount:4200, alertLevel:null },
  { merchantId:'M_1001', name:'QuickMart', isoId:'ISO_2001', refundRate:2.3, amountRatio:1.8, fullRefundRatio:18, fastRefundRate:2, totalRefunds:12, totalAmount:3600, alertLevel:null },
]

export const refundTrend = [
  { date:'Jan', count:180, amount:95000 },
  { date:'Feb', count:210, amount:112000 },
  { date:'Mar', count:245, amount:134000 },
  { date:'Apr', count:320, amount:178000 },
  { date:'May', count:290, amount:156000 },
  { date:'Jun', count:350, amount:198000 },
]

export const refundAlerts = [
  { id:'RA_001', merchantId:'M_1005', merchantName:'JewelBox', level:'CRITICAL', message:'Full refund ratio 85% + fast refund rate 42% — possible fraudulent pattern', createdAt:'2026-05-06T14:22:00Z' },
  { id:'RA_002', merchantId:'M_1012', merchantName:'GameZone', level:'CRITICAL', message:'Refund amount surge 5.2x above 30-day average', createdAt:'2026-05-06T09:15:00Z' },
  { id:'RA_003', merchantId:'M_1011', merchantName:'TravelCo', level:'WARNING', message:'Refund rate 11.3% exceeds 10% threshold for 2 consecutive months', createdAt:'2026-05-05T16:40:00Z' },
  { id:'RA_004', merchantId:'M_1002', merchantName:'TechStore', level:'WARNING', message:'Refund amount ratio 11.2% approaching 15% threshold', createdAt:'2026-05-04T11:30:00Z' },
  { id:'RA_005', merchantId:'M_1010', merchantName:'OnlineShop', level:'INFO', message:'Refund rate 8.5% — monitoring', createdAt:'2026-05-03T08:00:00Z' },
]

// Detail data for merchant refund drill-down
export const refundDetails = {
  'M_1005': {
    refunds: [
      { refundId:'RF_5001', originalTxnId:'TXN_80012', cardHash:'****3847', refundAmount:1200, originalAmount:1200, refundRatio:1.0, status:'COMPLETED', initiatedAt:'2026-05-06T13:45:00Z', timeToRefund:'25m', reason:'Customer request' },
      { refundId:'RF_5002', originalTxnId:'TXN_80045', cardHash:'****7721', refundAmount:890, originalAmount:890, refundRatio:1.0, status:'COMPLETED', initiatedAt:'2026-05-06T10:12:00Z', timeToRefund:'18m', reason:'' },
      { refundId:'RF_5003', originalTxnId:'TXN_80078', cardHash:'****3847', refundAmount:2400, originalAmount:2400, refundRatio:1.0, status:'COMPLETED', initiatedAt:'2026-05-05T15:30:00Z', timeToRefund:'42m', reason:'Defective item' },
      { refundId:'RF_5004', originalTxnId:'TXN_80091', cardHash:'****3847', refundAmount:560, originalAmount:750, refundRatio:0.75, status:'COMPLETED', initiatedAt:'2026-05-05T09:20:00Z', timeToRefund:'3h 12m', reason:'Partial return' },
      { refundId:'RF_5005', originalTxnId:'TXN_80110', cardHash:'****9102', refundAmount:3200, originalAmount:3200, refundRatio:1.0, status:'COMPLETED', initiatedAt:'2026-05-04T16:55:00Z', timeToRefund:'8m', reason:'' },
      { refundId:'RF_5006', originalTxnId:'TXN_80134', cardHash:'****7721', refundAmount:1450, originalAmount:1450, refundRatio:1.0, status:'COMPLETED', initiatedAt:'2026-05-04T11:40:00Z', timeToRefund:'35m', reason:'Customer request' },
      { refundId:'RF_5007', originalTxnId:'TXN_80156', cardHash:'****9102', refundAmount:780, originalAmount:780, refundRatio:1.0, status:'PROCESSING', initiatedAt:'2026-05-03T14:10:00Z', timeToRefund:'22m', reason:'' },
      { refundId:'RF_5008', originalTxnId:'TXN_80189', cardHash:'****5543', refundAmount:4100, originalAmount:4100, refundRatio:1.0, status:'COMPLETED', initiatedAt:'2026-05-02T08:30:00Z', timeToRefund:'12m', reason:'Wrong item' },
    ],
    cardAggregation: [
      { cardHash:'****3847', refundCount:4, totalRefunded:4960, avgTimeToRefund:'28m', flagged:true },
      { cardHash:'****7721', refundCount:3, totalRefunded:3540, avgTimeToRefund:'26m', flagged:true },
      { cardHash:'****9102', refundCount:2, totalRefunded:3980, avgTimeToRefund:'15m', flagged:false },
      { cardHash:'****5543', refundCount:1, totalRefunded:4100, avgTimeToRefund:'12m', flagged:false },
    ],
    hourlyHeatmap: [
      [0,0,1,0,2,1,0],[0,1,2,1,3,2,0],[1,2,3,2,4,3,1],[2,3,4,3,5,4,2],
      [1,2,3,2,3,2,1],[0,1,2,1,2,1,0],[0,0,1,0,1,0,0],[0,0,0,0,0,0,0],
    ],
  },
  'M_1012': {
    refunds: [
      { refundId:'RF_1201', originalTxnId:'TXN_90001', cardHash:'****4412', refundAmount:29.99, originalAmount:29.99, refundRatio:1.0, status:'COMPLETED', initiatedAt:'2026-05-06T22:10:00Z', timeToRefund:'5m', reason:'' },
      { refundId:'RF_1202', originalTxnId:'TXN_90015', cardHash:'****4412', refundAmount:59.99, originalAmount:59.99, refundRatio:1.0, status:'COMPLETED', initiatedAt:'2026-05-06T21:45:00Z', timeToRefund:'12m', reason:'Duplicate charge' },
      { refundId:'RF_1203', originalTxnId:'TXN_90022', cardHash:'****8833', refundAmount:14.99, originalAmount:14.99, refundRatio:1.0, status:'COMPLETED', initiatedAt:'2026-05-05T23:30:00Z', timeToRefund:'3m', reason:'' },
      { refundId:'RF_1204', originalTxnId:'TXN_90034', cardHash:'****8833', refundAmount:49.99, originalAmount:49.99, refundRatio:1.0, status:'COMPLETED', initiatedAt:'2026-05-05T22:15:00Z', timeToRefund:'8m', reason:'' },
      { refundId:'RF_1205', originalTxnId:'TXN_90041', cardHash:'****2201', refundAmount:99.99, originalAmount:99.99, refundRatio:1.0, status:'COMPLETED', initiatedAt:'2026-05-04T20:50:00Z', timeToRefund:'15m', reason:'Customer request' },
      { refundId:'RF_1206', originalTxnId:'TXN_90055', cardHash:'****4412', refundAmount:39.99, originalAmount:39.99, refundRatio:1.0, status:'COMPLETED', initiatedAt:'2026-05-03T21:20:00Z', timeToRefund:'7m', reason:'' },
    ],
    cardAggregation: [
      { cardHash:'****4412', refundCount:3, totalRefunded:129.97, avgTimeToRefund:'8m', flagged:true },
      { cardHash:'****8833', refundCount:2, totalRefunded:64.98, avgTimeToRefund:'5m', flagged:true },
      { cardHash:'****2201', refundCount:1, totalRefunded:99.99, avgTimeToRefund:'15m', flagged:false },
    ],
    hourlyHeatmap: [
      [0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],
      [0,0,0,0,1,0,0],[1,1,0,1,2,1,0],[2,3,1,2,4,2,1],[3,4,2,3,5,3,2],
    ],
  },
  'M_1011': {
    refunds: [
      { refundId:'RF_1101', originalTxnId:'TXN_70001', cardHash:'****6655', refundAmount:2800, originalAmount:2800, refundRatio:1.0, status:'COMPLETED', initiatedAt:'2026-05-05T10:00:00Z', timeToRefund:'2h 30m', reason:'Flight cancelled' },
      { refundId:'RF_1102', originalTxnId:'TXN_70012', cardHash:'****9944', refundAmount:1500, originalAmount:3200, refundRatio:0.47, status:'COMPLETED', initiatedAt:'2026-05-04T14:20:00Z', timeToRefund:'4h 15m', reason:'Partial cancellation' },
      { refundId:'RF_1103', originalTxnId:'TXN_70025', cardHash:'****6655', refundAmount:4200, originalAmount:4200, refundRatio:1.0, status:'COMPLETED', initiatedAt:'2026-05-03T09:45:00Z', timeToRefund:'1h 10m', reason:'Service not provided' },
      { refundId:'RF_1104', originalTxnId:'TXN_70038', cardHash:'****3311', refundAmount:890, originalAmount:890, refundRatio:1.0, status:'PROCESSING', initiatedAt:'2026-05-02T16:30:00Z', timeToRefund:'45m', reason:'Customer request' },
      { refundId:'RF_1105', originalTxnId:'TXN_70042', cardHash:'****9944', refundAmount:2100, originalAmount:2100, refundRatio:1.0, status:'COMPLETED', initiatedAt:'2026-05-01T11:00:00Z', timeToRefund:'3h 45m', reason:'Hotel overbooked' },
    ],
    cardAggregation: [
      { cardHash:'****6655', refundCount:2, totalRefunded:7000, avgTimeToRefund:'1h 50m', flagged:false },
      { cardHash:'****9944', refundCount:2, totalRefunded:3600, avgTimeToRefund:'4h', flagged:false },
      { cardHash:'****3311', refundCount:1, totalRefunded:890, avgTimeToRefund:'45m', flagged:false },
    ],
    hourlyHeatmap: [
      [1,0,1,1,2,0,0],[1,1,2,1,2,1,0],[0,1,1,1,1,0,0],[0,0,1,0,1,0,0],
      [0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],
    ],
  },
}

export const platformKPI = {
  refundRate: 7.8,
  amountRatio: 8.9,
  fullRefundRatio: 52,
  fastRefundRate: 15,
}
