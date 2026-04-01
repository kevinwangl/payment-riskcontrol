import { transactions } from './transactions'

export const reviewQueue = transactions
  .filter(t => t.decision === 'REVIEW')
  .map(t => ({
    ...t,
    velocity: { cardCount1h: Math.floor(Math.random()*8)+2, cardAmount1h: (Math.random()*8000+500).toFixed(2), ipCount1h: Math.floor(Math.random()*5)+1 },
    linkAnalysis: { sameDeviceCards: Math.floor(Math.random()*4)+1, sameIpCards: Math.floor(Math.random()*3)+1 },
    billingAddress: { name:'<name>', email:'<email>', address:'123 Main St, New York, NY 10001, US' },
    shippingAddress: { name:'<name>', address:'456 Market St, San Francisco, CA 94105, US', distance: Math.floor(Math.random()*3000)+100 },
  }))
