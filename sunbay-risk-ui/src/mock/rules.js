// 30 rules covering all V3 risk scenarios
export const rules = [
  // === Platform Mandatory (8) ===
  { id:'P001', name:'OFAC Sanctions Block', tenant:'Platform', tenantId:'PLATFORM', priority:1, entryMode:'ALL', condition:"blacklist('card_hash') == true", action:{decision:'DECLINE',suggestions:[]}, reasonCode:'OFAC_HIT', enabled:true, version:3, hitCount:4201, createdAt:'2025-06-01', updatedAt:'2026-03-15' },
  { id:'P002', name:'Single Txn Limit Exceeded', tenant:'Platform', tenantId:'PLATFORM', priority:2, entryMode:'ALL', condition:"txn.amount > merchant.single_txn_limit", action:{decision:'DECLINE',suggestions:[]}, reasonCode:'LIMIT_EXCEEDED', enabled:true, version:1, hitCount:942, createdAt:'2025-06-01', updatedAt:'2025-06-01' },
  { id:'P003', name:'Frozen Merchant Block', tenant:'Platform', tenantId:'PLATFORM', priority:3, entryMode:'ALL', condition:"merchant.status IN ['FROZEN','SUSPENDED']", action:{decision:'DECLINE',suggestions:[]}, reasonCode:'MERCHANT_FROZEN', enabled:true, version:1, hitCount:156, createdAt:'2025-06-01', updatedAt:'2025-06-01' },
  { id:'P004', name:'High Amount Foreign CNP', tenant:'Platform', tenantId:'PLATFORM', priority:5, entryMode:'CNP', condition:"txn.amount > 5000 AND card.issuer_country != 'US'", action:{decision:'DECLINE',suggestions:[]}, reasonCode:'HIGH_AMT_FOREIGN_CNP', enabled:true, version:2, hitCount:1834, createdAt:'2025-06-01', updatedAt:'2026-01-10' },
  { id:'P005', name:'Card Testing Attack', tenant:'Platform', tenantId:'PLATFORM', priority:4, entryMode:'ALL', condition:"velocity('merchant_id','5m') > 20 AND avg_amount < 2", action:{decision:'DECLINE',suggestions:[]}, reasonCode:'CARD_TESTING', enabled:true, version:1, hitCount:612, createdAt:'2025-08-15', updatedAt:'2025-08-15' },
  { id:'P006', name:'Multi-Card Same IP', tenant:'Platform', tenantId:'PLATFORM', priority:6, entryMode:'CNP', condition:"link_count('ip','card','10m') > 5", action:{decision:'DECLINE',suggestions:[]}, reasonCode:'FRAUD_FACTORY', enabled:true, version:1, hitCount:389, createdAt:'2025-09-01', updatedAt:'2025-09-01' },
  { id:'P007', name:'Greylist Force Review', tenant:'Platform', tenantId:'PLATFORM', priority:10, entryMode:'ALL', condition:"greylist('card_hash') == true OR greylist('ip') == true", action:{decision:'REVIEW',suggestions:[]}, reasonCode:'GREYLIST_HIT', enabled:true, version:1, hitCount:2105, createdAt:'2025-06-01', updatedAt:'2025-06-01' },
  { id:'P008', name:'High Risk BIN Review', tenant:'Platform', tenantId:'PLATFORM', priority:15, entryMode:'ALL', condition:"card.bin IN ['601100','601101','540500'] AND txn.amount > 500", action:{decision:'REVIEW',suggestions:[]}, reasonCode:'HIGH_RISK_BIN', enabled:true, version:2, hitCount:1456, createdAt:'2025-07-01', updatedAt:'2026-02-20' },

  // === ISO Level (10) ===
  { id:'I001', name:'Card Velocity 1h > 5', tenant:'ISO', tenantId:'ISO_2001', priority:20, entryMode:'ALL', condition:"velocity('card_number','1h') > 5", action:{decision:'REVIEW',suggestions:['REQUIRE_3DS']}, reasonCode:'CARD_VELOCITY', enabled:true, version:4, hitCount:3210, createdAt:'2025-07-15', updatedAt:'2026-03-20' },
  { id:'I002', name:'Card Amount 24h > $10K', tenant:'ISO', tenantId:'ISO_2001', priority:22, entryMode:'ALL', condition:"velocity_amount('card_number','24h') > 10000", action:{decision:'REVIEW',suggestions:[]}, reasonCode:'CARD_AMT_VELOCITY', enabled:true, version:2, hitCount:876, createdAt:'2025-08-01', updatedAt:'2026-01-15' },
  { id:'I003', name:'Multi-Card Same Device', tenant:'ISO', tenantId:'ISO_2001', priority:25, entryMode:'CNP', condition:"link_count('device','card','1h') > 3", action:{decision:'REVIEW',suggestions:[]}, reasonCode:'DEVICE_MULTI_CARD', enabled:true, version:1, hitCount:543, createdAt:'2025-09-10', updatedAt:'2025-09-10' },
  { id:'I004', name:'Card Multi-Merchant Sweep', tenant:'ISO', tenantId:'ISO_2001', priority:18, entryMode:'ALL', condition:"link_count('card','merchant','1h') > 5", action:{decision:'DECLINE',suggestions:[]}, reasonCode:'CARD_SWEEP', enabled:true, version:1, hitCount:234, createdAt:'2025-10-01', updatedAt:'2025-10-01' },
  { id:'I005', name:'AVS Fail + High Amount', tenant:'ISO', tenantId:'ISO_2001', priority:30, entryMode:'CNP', condition:"avs_result == 'N' AND txn.amount > 1000", action:{decision:'REVIEW',suggestions:['REQUIRE_3DS']}, reasonCode:'AVS_FAIL_HIGH', enabled:true, version:3, hitCount:1678, createdAt:'2025-07-15', updatedAt:'2026-03-01' },
  { id:'I006', name:'CVV Mismatch Block', tenant:'ISO', tenantId:'ISO_2002', priority:15, entryMode:'CNP', condition:"cvv_result == 'N'", action:{decision:'DECLINE',suggestions:[]}, reasonCode:'CVV_FAIL', enabled:true, version:1, hitCount:2890, createdAt:'2025-06-15', updatedAt:'2025-06-15' },
  { id:'I007', name:'Off-Hours Restaurant', tenant:'ISO', tenantId:'ISO_2001', priority:40, entryMode:'ALL', condition:"txn.hour < 6 AND txn.amount > 500 AND merchant.mcc == '5812'", action:{decision:'REVIEW',suggestions:[]}, reasonCode:'OFF_HOURS', enabled:true, version:1, hitCount:89, createdAt:'2025-11-01', updatedAt:'2025-11-01' },
  { id:'I008', name:'Restaurant Over $300', tenant:'ISO', tenantId:'ISO_2002', priority:45, entryMode:'ALL', condition:"merchant.mcc == '5812' AND txn.amount > 300", action:{decision:'REVIEW',suggestions:[]}, reasonCode:'MCC_CONTEXT', enabled:true, version:1, hitCount:456, createdAt:'2025-11-15', updatedAt:'2025-11-15' },
  { id:'I009', name:'New Merchant Strict Mode', tenant:'ISO', tenantId:'ISO_2001', priority:35, entryMode:'ALL', condition:"merchant.age_days < 90 AND txn.amount > 1000", action:{decision:'REVIEW',suggestions:['REQUIRE_3DS']}, reasonCode:'NEW_MERCHANT', enabled:true, version:2, hitCount:312, createdAt:'2025-08-01', updatedAt:'2026-02-01' },
  { id:'I010', name:'Prepaid Card High Amount', tenant:'ISO', tenantId:'ISO_2001', priority:38, entryMode:'ALL', condition:"card.type == 'PREPAID' AND txn.amount > 500", action:{decision:'REVIEW',suggestions:[]}, reasonCode:'PREPAID_HIGH', enabled:true, version:1, hitCount:198, createdAt:'2025-12-01', updatedAt:'2025-12-01' },

  // === Merchant Level (7) ===
  { id:'M001', name:'Custom Single Limit $2K', tenant:'Merchant', tenantId:'M_1001', priority:50, entryMode:'ALL', condition:"txn.amount > 2000", action:{decision:'REVIEW',suggestions:[]}, reasonCode:'CUSTOM_LIMIT', enabled:true, version:1, hitCount:67, createdAt:'2026-01-15', updatedAt:'2026-01-15' },
  { id:'M002', name:'US Cards Only', tenant:'Merchant', tenantId:'M_1001', priority:48, entryMode:'ALL', condition:"card.issuer_country != 'US'", action:{decision:'DECLINE',suggestions:[]}, reasonCode:'NON_US_CARD', enabled:true, version:1, hitCount:234, createdAt:'2026-01-15', updatedAt:'2026-01-15' },
  { id:'M003', name:'Force 3DS All CNP', tenant:'Merchant', tenantId:'M_1002', priority:60, entryMode:'CNP', condition:"txn.entry_mode == 'CNP'", action:{decision:'APPROVE',suggestions:['REQUIRE_3DS']}, reasonCode:'FORCE_3DS', enabled:true, version:1, hitCount:5670, createdAt:'2026-02-01', updatedAt:'2026-02-01' },
  { id:'M004', name:'VIP Whitelist Pass', tenant:'Merchant', tenantId:'M_1002', priority:1, entryMode:'ALL', condition:"whitelist('card_hash') == true", action:{decision:'APPROVE',suggestions:[]}, reasonCode:'WHITELIST', enabled:true, version:1, hitCount:890, createdAt:'2026-01-01', updatedAt:'2026-01-01' },
  { id:'M005', name:'CP Large Amount PIN', tenant:'Merchant', tenantId:'M_1003', priority:55, entryMode:'CP', condition:"txn.entry_mode == 'CP' AND txn.amount > 5000", action:{decision:'APPROVE',suggestions:['REQUIRE_PIN']}, reasonCode:'CP_LARGE', enabled:true, version:1, hitCount:45, createdAt:'2026-02-15', updatedAt:'2026-02-15' },
  { id:'M006', name:'Cross-Region CP Alert', tenant:'Merchant', tenantId:'M_1003', priority:52, entryMode:'CP', condition:"geo_distance(txn.terminal_location, card.last_location) > 500", action:{decision:'REVIEW',suggestions:[]}, reasonCode:'CROSS_REGION', enabled:true, version:1, hitCount:23, createdAt:'2026-03-01', updatedAt:'2026-03-01' },
  { id:'M007', name:'Repeated Same Amount', tenant:'Merchant', tenantId:'M_1001', priority:58, entryMode:'ALL', condition:"same_amount_count('card_number','1h') > 3", action:{decision:'REVIEW',suggestions:[]}, reasonCode:'SAME_AMOUNT', enabled:true, version:1, hitCount:12, createdAt:'2026-03-10', updatedAt:'2026-03-10' },
]

export const tenantTree = [
  { id:'PLATFORM', label:'Platform', children:[] },
  { id:'ISO_2001', label:'ISO Alpha Corp', children:[
    { id:'M_1001', label:'Merchant - QuickMart' },
    { id:'M_1002', label:'Merchant - TechStore' },
    { id:'M_1003', label:'Merchant - GrandHotel' },
  ]},
  { id:'ISO_2002', label:'ISO Beta Pay', children:[
    { id:'M_1004', label:'Merchant - FoodHub' },
    { id:'M_1005', label:'Merchant - JewelBox' },
  ]},
]

export const fieldOptions = [
  'txn.amount','txn.entry_mode','txn.hour','card.issuer_country','card.bin','card.type','card.brand',
  'avs_result','cvv_result','merchant.mcc','merchant.status','merchant.age_days',
  "velocity('card_number','1h')","velocity('merchant_id','5m')","velocity_amount('card_number','24h')",
  "link_count('device','card','1h')","link_count('ip','card','10m')","link_count('card','merchant','1h')",
  "blacklist('card_hash')","greylist('card_hash')","greylist('ip')","whitelist('card_hash')",
  "geo_distance(txn.terminal_location, card.last_location)","same_amount_count('card_number','1h')",
]

export const operatorOptions = ['>','<','>=','<=','==','!=','IN','NOT IN']
