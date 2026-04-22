export const lists = [
  // === BLACKLIST ===
  { id:'L001', type:'BLACKLIST', dimension:'CARD_HASH', value:'411111******1111', reason:'Confirmed fraud - chargeback CB003', addedBy:'system_auto', tenantId:'PLATFORM', expiresAt:null, createdAt:'2026-03-24T09:00:00Z' },
  { id:'L002', type:'BLACKLIST', dimension:'CARD_HASH', value:'540500******5678', reason:'Stolen card report from issuer', addedBy:'j.smith@sunbay.io', tenantId:'ISO_2002', expiresAt:null, createdAt:'2026-03-10T14:00:00Z' },
  { id:'L003', type:'BLACKLIST', dimension:'IP', value:'45.33.32.156', reason:'Confirmed fraud source - Case #C001', addedBy:'system_auto', tenantId:'PLATFORM', expiresAt:null, createdAt:'2026-03-24T14:00:00Z' },
  { id:'L004', type:'BLACKLIST', dimension:'IP', value:'185.220.101.34', reason:'Tor exit node - card testing attack', addedBy:'system_auto', tenantId:'PLATFORM', expiresAt:'2026-04-15T00:00:00Z', createdAt:'2026-03-22T10:00:00Z' },
  { id:'L005', type:'BLACKLIST', dimension:'IP', value:'203.0.113.42', reason:'Bot traffic - automated card testing', addedBy:'system_auto', tenantId:'PLATFORM', expiresAt:'2026-04-30T00:00:00Z', createdAt:'2026-03-25T09:00:00Z' },
  { id:'L006', type:'BLACKLIST', dimension:'IP', value:'198.51.100.7', reason:'OFAC sanctioned region proxy', addedBy:'system_auto', tenantId:'PLATFORM', expiresAt:null, createdAt:'2026-02-28T08:00:00Z' },
  { id:'L007', type:'BLACKLIST', dimension:'EMAIL', value:'fraud***@example.com', reason:'Chargeback pattern - 5 CBs in 30 days', addedBy:'a.chen@sunbay.io', tenantId:'ISO_2001', expiresAt:null, createdAt:'2026-03-18T16:00:00Z' },
  { id:'L008', type:'BLACKLIST', dimension:'EMAIL', value:'test***@tempmail.org', reason:'Disposable email - card testing', addedBy:'system_auto', tenantId:'PLATFORM', expiresAt:null, createdAt:'2026-03-20T11:00:00Z' },
  { id:'L009', type:'BLACKLIST', dimension:'DEVICE_ID', value:'dev_a1b2c3d4e5f6', reason:'Multi-card fraud device - 12 cards in 1h', addedBy:'system_auto', tenantId:'ISO_2001', expiresAt:'2026-04-24T00:00:00Z', createdAt:'2026-03-20T11:00:00Z' },
  { id:'L010', type:'BLACKLIST', dimension:'DEVICE_ID', value:'dev_x9y8z7w6v5u4', reason:'Account takeover device', addedBy:'a.chen@sunbay.io', tenantId:'ISO_2001', expiresAt:null, createdAt:'2026-03-12T15:00:00Z' },
  { id:'L011', type:'BLACKLIST', dimension:'PHONE', value:'+1-555-***-7890', reason:'Linked to 3 chargeback cases', addedBy:'system_auto', tenantId:'ISO_2001', expiresAt:null, createdAt:'2026-03-15T08:00:00Z' },
  { id:'L012', type:'BLACKLIST', dimension:'MERCHANT_ID', value:'M_1012', reason:'CB rate 1.8% - exceeded Visa VDMP threshold', addedBy:'system_auto', tenantId:'PLATFORM', expiresAt:null, createdAt:'2026-03-22T10:00:00Z' },
  // === WHITELIST ===
  { id:'L013', type:'WHITELIST', dimension:'CARD_HASH', value:'424242******4242', reason:'VIP customer - CEO corporate card', addedBy:'j.smith@sunbay.io', tenantId:'M_1002', expiresAt:null, createdAt:'2026-03-01T10:00:00Z' },
  { id:'L014', type:'WHITELIST', dimension:'CARD_HASH', value:'378282******0005', reason:'Test card - QA environment', addedBy:'admin@sunbay.io', tenantId:'PLATFORM', expiresAt:'2026-12-31T00:00:00Z', createdAt:'2026-01-01T00:00:00Z' },
  { id:'L015', type:'WHITELIST', dimension:'IP', value:'38.122.42.10', reason:'Corporate office IP - Alpha Corp HQ', addedBy:'admin@sunbay.io', tenantId:'ISO_2001', expiresAt:null, createdAt:'2026-01-15T08:00:00Z' },
  { id:'L016', type:'WHITELIST', dimension:'DEVICE_ID', value:'dev_m1n2o3p4q5r6', reason:'Internal testing device', addedBy:'admin@sunbay.io', tenantId:'PLATFORM', expiresAt:null, createdAt:'2025-12-01T00:00:00Z' },
  { id:'L017', type:'WHITELIST', dimension:'EMAIL', value:'vip***@partner.com', reason:'ISO VIP partner', addedBy:'j.smith@sunbay.io', tenantId:'ISO_2001', expiresAt:null, createdAt:'2026-02-15T10:00:00Z' },
  { id:'L018', type:'WHITELIST', dimension:'MERCHANT_ID', value:'M_1003', reason:'GrandHotel - low risk, 2yr history', addedBy:'admin@sunbay.io', tenantId:'ISO_2001', expiresAt:null, createdAt:'2026-01-01T00:00:00Z' },
]

// Rule exemptions — merchant × rule
export const ruleExemptions = [
  { id:'E001', merchantId:'M_1002', ruleId:'I001', reason:'TechStore - batch reload business, high frequency is normal', addedBy:'a.chen@sunbay.io', expiresAt:null, createdAt:'2026-02-10T09:00:00Z' },
  { id:'E002', merchantId:'M_1002', ruleId:'I002', reason:'TechStore - high daily card amount expected for electronics', addedBy:'a.chen@sunbay.io', expiresAt:null, createdAt:'2026-02-10T09:00:00Z' },
  { id:'E003', merchantId:'M_1011', ruleId:'I002', reason:'TravelCo - high-value hotel bookings are normal', addedBy:'a.chen@sunbay.io', expiresAt:null, createdAt:'2026-03-12T11:00:00Z' },
  { id:'E004', merchantId:'M_1001', ruleId:'S001', reason:'QuickMart - serves international tourists, foreign cards expected', addedBy:'j.smith@sunbay.io', expiresAt:null, createdAt:'2026-03-05T14:00:00Z' },
]
