// Rules with condition_groups + score_weight structure
export const rules = [
  // === L1 Platform (7) ===
  { id:'P001', name:'OFAC Sanctions Block', tenant:'Platform', tenantId:'PLATFORM', priority:1, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:"blacklist('card_hash')",op:'==',value:'true'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'OFAC_HIT', enabled:true, version:3, hitCount:4201, createdAt:'2025-06-01', updatedAt:'2026-03-15' },
  { id:'P002', name:'Single Txn Limit Exceeded', tenant:'Platform', tenantId:'PLATFORM', priority:2, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'limit.single_txn_amount',op:'>',value:'merchant.single_txn_limit'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'LIMIT_EXCEEDED', enabled:true, version:1, hitCount:942, createdAt:'2025-06-01', updatedAt:'2025-06-01' },
  { id:'P003', name:'Frozen Merchant Block', tenant:'Platform', tenantId:'PLATFORM', priority:3, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'merchant.status',op:'IN',value:"['FROZEN','SUSPENDED']"}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'MERCHANT_FROZEN', enabled:true, version:1, hitCount:156, createdAt:'2025-06-01', updatedAt:'2025-06-01' },
  { id:'P004', name:'High Amount Foreign CNP', tenant:'Platform', tenantId:'PLATFORM', priority:5, entryMode:'CNP', condition_groups:[{logic:'AND',conditions:[{field:'txn.amount',op:'>',value:'5000'},{field:'card.issuer_country',op:'!=',value:'US'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'HIGH_AMT_FOREIGN_CNP', enabled:true, version:2, hitCount:1834, createdAt:'2025-06-01', updatedAt:'2026-01-10' },
  { id:'P005', name:'Card Testing Attack', tenant:'Platform', tenantId:'PLATFORM', priority:4, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:"velocity.count",op:'>',value:'20',params:{dimension:'merchant_id',window:'5m'}},{field:'txn.amount',op:'<',value:'2'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'CARD_TESTING', enabled:true, version:1, hitCount:612, createdAt:'2025-08-15', updatedAt:'2025-08-15' },
  { id:'P006', name:'Multi-Card Same IP', tenant:'Platform', tenantId:'PLATFORM', priority:6, entryMode:'CNP', condition_groups:[{logic:'AND',conditions:[{field:'velocity.distinct',op:'>',value:'5',params:{from:'ip',to:'card_hash',window:'10m'}}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'FRAUD_FACTORY', enabled:true, version:1, hitCount:389, createdAt:'2025-09-01', updatedAt:'2025-09-01' },
  { id:'P008', name:'High Risk BIN Decline', tenant:'Platform', tenantId:'PLATFORM', priority:15, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'card.bin',op:'IN',value:"['601100','601101','540500']"},{field:'txn.amount',op:'>',value:'500'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'HIGH_RISK_BIN', enabled:true, version:2, hitCount:1456, createdAt:'2025-07-01', updatedAt:'2026-02-20' },

  // === L2 ISO — Score rules (NONE decision, only add score) ===
  { id:'S001', name:'Foreign Card Score', tenant:'ISO', tenantId:'ISO_2001', priority:10, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'card.issuer_country',op:'!=',value:'US'}]}], group_logic:'AND', action:{decision:'NONE',score_weight:15,suggestions:[]}, reasonCode:'FOREIGN_CARD', enabled:true, version:1, hitCount:8920, createdAt:'2025-07-01', updatedAt:'2025-07-01' },
  { id:'S002', name:'High Amount CNP Score', tenant:'ISO', tenantId:'ISO_2001', priority:11, entryMode:'CNP', condition_groups:[{logic:'AND',conditions:[{field:'txn.amount',op:'>',value:'3000'},{field:'txn.entry_mode',op:'==',value:'CNP'}]}], group_logic:'AND', action:{decision:'NONE',score_weight:25,suggestions:[]}, reasonCode:'HIGH_AMT_CNP', enabled:true, version:1, hitCount:4560, createdAt:'2025-07-01', updatedAt:'2025-07-01' },
  { id:'S003', name:'AVS Mismatch Score', tenant:'ISO', tenantId:'ISO_2001', priority:12, entryMode:'CNP', condition_groups:[{logic:'AND',conditions:[{field:'verify.avs_result',op:'==',value:'N'}]}], group_logic:'AND', action:{decision:'NONE',score_weight:20,suggestions:[]}, reasonCode:'AVS_FAIL', enabled:true, version:1, hitCount:6780, createdAt:'2025-07-01', updatedAt:'2025-07-01' },
  { id:'S004', name:'CVV Mismatch Score', tenant:'ISO', tenantId:'ISO_2001', priority:13, entryMode:'CNP', condition_groups:[{logic:'AND',conditions:[{field:'verify.cvv_result',op:'==',value:'N'}]}], group_logic:'AND', action:{decision:'NONE',score_weight:25,suggestions:[]}, reasonCode:'CVV_FAIL', enabled:true, version:1, hitCount:5430, createdAt:'2025-07-01', updatedAt:'2025-07-01' },
  { id:'S005', name:'High Velocity Score', tenant:'ISO', tenantId:'ISO_2001', priority:14, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'velocity.count',op:'>',value:'3',params:{dimension:'card_hash',window:'1h'}}]}], group_logic:'AND', action:{decision:'NONE',score_weight:20,suggestions:[]}, reasonCode:'HIGH_VELOCITY', enabled:true, version:1, hitCount:3210, createdAt:'2025-07-01', updatedAt:'2025-07-01' },
  { id:'S006', name:'New Merchant Score', tenant:'ISO', tenantId:'ISO_2001', priority:15, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'merchant.age_days',op:'<',value:'90'}]}], group_logic:'AND', action:{decision:'NONE',score_weight:10,suggestions:[]}, reasonCode:'NEW_MERCHANT', enabled:true, version:1, hitCount:2100, createdAt:'2025-07-01', updatedAt:'2025-07-01' },
  { id:'S007', name:'CNP Entry Score', tenant:'ISO', tenantId:'ISO_2001', priority:16, entryMode:'CNP', condition_groups:[{logic:'AND',conditions:[{field:'txn.entry_mode',op:'==',value:'CNP'}]}], group_logic:'AND', action:{decision:'NONE',score_weight:10,suggestions:[]}, reasonCode:'CNP_MODE', enabled:true, version:1, hitCount:12400, createdAt:'2025-07-01', updatedAt:'2025-07-01' },

  // === L2 ISO — Decision rules ===
  { id:'I001', name:'Card Velocity 1h > 5', tenant:'ISO', tenantId:'ISO_2001', priority:20, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'velocity.count',op:'>',value:'5',params:{dimension:'card_hash',window:'1h'}}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:['REQUIRE_3DS']}, reasonCode:'CARD_VELOCITY', enabled:true, version:4, hitCount:3210, createdAt:'2025-07-15', updatedAt:'2026-03-20' },
  { id:'I002', name:'Card Amount 24h > $10K', tenant:'ISO', tenantId:'ISO_2001', priority:22, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'velocity.amount',op:'>',value:'10000',params:{dimension:'card_hash',window:'24h'}}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'CARD_AMT_VELOCITY', enabled:true, version:2, hitCount:876, createdAt:'2025-08-01', updatedAt:'2026-01-15' },
  { id:'I003', name:'Multi-Card Same Device', tenant:'ISO', tenantId:'ISO_2001', priority:25, entryMode:'CNP', condition_groups:[{logic:'AND',conditions:[{field:'velocity.distinct',op:'>',value:'3',params:{from:'device_id',to:'card_hash',window:'1h'}}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'DEVICE_MULTI_CARD', enabled:true, version:1, hitCount:543, createdAt:'2025-09-10', updatedAt:'2025-09-10' },
  { id:'I004', name:'Card Multi-Merchant Sweep', tenant:'ISO', tenantId:'ISO_2001', priority:18, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'velocity.distinct',op:'>',value:'5',params:{from:'card_hash',to:'merchant_id',window:'1h'}}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'CARD_SWEEP', enabled:true, version:1, hitCount:234, createdAt:'2025-10-01', updatedAt:'2025-10-01' },
  { id:'I005', name:'AVS Fail + High Amount', tenant:'ISO', tenantId:'ISO_2001', priority:30, entryMode:'CNP', condition_groups:[{logic:'AND',conditions:[{field:'verify.avs_result',op:'==',value:'N'},{field:'txn.amount',op:'>',value:'1000'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:['REQUIRE_3DS']}, reasonCode:'AVS_FAIL_HIGH', enabled:true, version:3, hitCount:1678, createdAt:'2025-07-15', updatedAt:'2026-03-01' },
  { id:'I006', name:'CVV Mismatch Block', tenant:'ISO', tenantId:'ISO_2002', priority:15, entryMode:'CNP', condition_groups:[{logic:'AND',conditions:[{field:'verify.cvv_result',op:'==',value:'N'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'CVV_FAIL', enabled:true, version:1, hitCount:2890, createdAt:'2025-06-15', updatedAt:'2025-06-15' },
  { id:'I007', name:'Off-Hours Restaurant', tenant:'ISO', tenantId:'ISO_2001', priority:40, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'txn.hour',op:'<',value:'6'},{field:'txn.amount',op:'>',value:'500'},{field:'merchant.mcc',op:'==',value:'5812'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'OFF_HOURS', enabled:true, version:1, hitCount:89, createdAt:'2025-11-01', updatedAt:'2025-11-01' },
  { id:'I008', name:'Merchant Daily Limit', tenant:'ISO', tenantId:'ISO_2002', priority:45, entryMode:'ALL', condition_groups:[{logic:'OR',conditions:[{field:'limit.merchant_daily_amount',op:'>',value:'50000000'},{field:'limit.merchant_daily_count',op:'>',value:'100000'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'MERCHANT_DAILY_LIMIT', enabled:true, version:1, hitCount:12, createdAt:'2025-11-15', updatedAt:'2025-11-15' },
  { id:'I009', name:'New Merchant Strict Mode', tenant:'ISO', tenantId:'ISO_2001', priority:35, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'merchant.age_days',op:'<',value:'90'},{field:'txn.amount',op:'>',value:'1000'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:['REQUIRE_3DS']}, reasonCode:'NEW_MERCHANT', enabled:true, version:2, hitCount:312, createdAt:'2025-08-01', updatedAt:'2026-02-01' },
  { id:'I010', name:'Prepaid Card High Amount', tenant:'ISO', tenantId:'ISO_2001', priority:38, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'card.type',op:'==',value:'PREPAID'},{field:'txn.amount',op:'>',value:'500'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'PREPAID_HIGH', enabled:true, version:1, hitCount:198, createdAt:'2025-12-01', updatedAt:'2025-12-01' },
  // ISO_2002 decision rules (additional)
  { id:'I011', name:'Card Velocity 1h > 8', tenant:'ISO', tenantId:'ISO_2002', priority:20, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'velocity.count',op:'>',value:'8',params:{dimension:'card_hash',window:'1h'}}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'CARD_VELOCITY', enabled:true, version:1, hitCount:1450, createdAt:'2025-08-01', updatedAt:'2025-08-01' },
  { id:'I012', name:'Card Amount 24h > $15K', tenant:'ISO', tenantId:'ISO_2002', priority:22, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'velocity.amount',op:'>',value:'15000',params:{dimension:'card_hash',window:'24h'}}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'CARD_AMT_VELOCITY', enabled:true, version:1, hitCount:320, createdAt:'2025-08-01', updatedAt:'2025-08-01' },
  { id:'I013', name:'High Risk MCC Block', tenant:'ISO', tenantId:'ISO_2002', priority:10, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'merchant.mcc',op:'IN',value:"['5967','5966','7995']"},{field:'txn.amount',op:'>',value:'200'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'HIGH_RISK_MCC', enabled:true, version:1, hitCount:78, createdAt:'2025-09-01', updatedAt:'2025-09-01' },

  // === L2 ISO_2002 — Score rules ===
  { id:'S008', name:'Foreign Card Score', tenant:'ISO', tenantId:'ISO_2002', priority:10, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'card.issuer_country',op:'!=',value:'US'}]}], group_logic:'AND', action:{decision:'NONE',score_weight:20,suggestions:[]}, reasonCode:'FOREIGN_CARD', enabled:true, version:1, hitCount:5640, createdAt:'2025-08-01', updatedAt:'2025-08-01' },
  { id:'S009', name:'High Amount CNP Score', tenant:'ISO', tenantId:'ISO_2002', priority:11, entryMode:'CNP', condition_groups:[{logic:'AND',conditions:[{field:'txn.amount',op:'>',value:'2000'}]}], group_logic:'AND', action:{decision:'NONE',score_weight:25,suggestions:[]}, reasonCode:'HIGH_AMT_CNP', enabled:true, version:1, hitCount:3120, createdAt:'2025-08-01', updatedAt:'2025-08-01' },
  { id:'S010', name:'AVS Mismatch Score', tenant:'ISO', tenantId:'ISO_2002', priority:12, entryMode:'CNP', condition_groups:[{logic:'AND',conditions:[{field:'verify.avs_result',op:'==',value:'N'}]}], group_logic:'AND', action:{decision:'NONE',score_weight:20,suggestions:[]}, reasonCode:'AVS_FAIL', enabled:true, version:1, hitCount:4230, createdAt:'2025-08-01', updatedAt:'2025-08-01' },
  { id:'S011', name:'CVV Mismatch Score', tenant:'ISO', tenantId:'ISO_2002', priority:13, entryMode:'CNP', condition_groups:[{logic:'AND',conditions:[{field:'verify.cvv_result',op:'==',value:'N'}]}], group_logic:'AND', action:{decision:'NONE',score_weight:30,suggestions:[]}, reasonCode:'CVV_FAIL', enabled:true, version:1, hitCount:3890, createdAt:'2025-08-01', updatedAt:'2025-08-01' },
  { id:'S012', name:'Prepaid Card Score', tenant:'ISO', tenantId:'ISO_2002', priority:14, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'card.type',op:'==',value:'PREPAID'}]}], group_logic:'AND', action:{decision:'NONE',score_weight:15,suggestions:[]}, reasonCode:'PREPAID_CARD', enabled:true, version:1, hitCount:1870, createdAt:'2025-08-01', updatedAt:'2025-08-01' },
  { id:'S013', name:'CNP Entry Score', tenant:'ISO', tenantId:'ISO_2002', priority:15, entryMode:'CNP', condition_groups:[{logic:'AND',conditions:[{field:'txn.entry_mode',op:'==',value:'CNP'}]}], group_logic:'AND', action:{decision:'NONE',score_weight:10,suggestions:[]}, reasonCode:'CNP_MODE', enabled:true, version:1, hitCount:8900, createdAt:'2025-08-01', updatedAt:'2025-08-01' },

  // === L3 Merchant — ISO_2001 merchants ===
  // M_1001 QuickMart (convenience store)
  { id:'M001', name:'Custom Single Limit $2K', tenant:'Merchant', tenantId:'M_1001', priority:50, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'txn.amount',op:'>',value:'2000'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'CUSTOM_LIMIT', enabled:true, version:1, hitCount:67, createdAt:'2026-01-15', updatedAt:'2026-01-15' },
  { id:'M002', name:'US Cards Only', tenant:'Merchant', tenantId:'M_1001', priority:48, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'card.issuer_country',op:'!=',value:'US'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'NON_US_CARD', enabled:true, version:1, hitCount:234, createdAt:'2026-01-15', updatedAt:'2026-01-15' },
  { id:'M007', name:'Repeated Same Amount', tenant:'Merchant', tenantId:'M_1001', priority:58, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'velocity.count',op:'>',value:'3',params:{dimension:'card_hash_amount',window:'1h'}}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'SAME_AMOUNT', enabled:true, version:1, hitCount:12, createdAt:'2026-03-10', updatedAt:'2026-03-10' },
  // M_1002 TechStore (electronics)
  { id:'M003', name:'Force 3DS All CNP', tenant:'Merchant', tenantId:'M_1002', priority:60, entryMode:'CNP', condition_groups:[{logic:'AND',conditions:[{field:'txn.entry_mode',op:'==',value:'CNP'}]}], group_logic:'AND', action:{decision:'APPROVE',score_weight:0,suggestions:['REQUIRE_3DS']}, reasonCode:'FORCE_3DS', enabled:true, version:1, hitCount:5670, createdAt:'2026-02-01', updatedAt:'2026-02-01' },
  { id:'M004', name:'VIP Whitelist Pass', tenant:'Merchant', tenantId:'M_1002', priority:1, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:"whitelist('card_hash')",op:'==',value:'true'}]}], group_logic:'AND', action:{decision:'APPROVE',score_weight:0,suggestions:[]}, reasonCode:'WHITELIST', enabled:true, version:1, hitCount:890, createdAt:'2026-01-01', updatedAt:'2026-01-01' },
  // M_1003 GrandHotel (hotel)
  { id:'M005', name:'CP Large Amount PIN', tenant:'Merchant', tenantId:'M_1003', priority:55, entryMode:'CP', condition_groups:[{logic:'AND',conditions:[{field:'txn.entry_mode',op:'==',value:'CP'},{field:'txn.amount',op:'>',value:'5000'}]}], group_logic:'AND', action:{decision:'APPROVE',score_weight:0,suggestions:['REQUIRE_PIN']}, reasonCode:'CP_LARGE', enabled:true, version:1, hitCount:45, createdAt:'2026-02-15', updatedAt:'2026-02-15' },
  { id:'M006', name:'Cross-Region CP Alert', tenant:'Merchant', tenantId:'M_1003', priority:52, entryMode:'CP', condition_groups:[{logic:'AND',conditions:[{field:'geo.distance_km',op:'>',value:'500'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'CROSS_REGION', enabled:true, version:1, hitCount:23, createdAt:'2026-03-01', updatedAt:'2026-03-01' },
  // M_1006 LuxRetail (luxury retail)
  { id:'M008', name:'High Value Txn 3DS', tenant:'Merchant', tenantId:'M_1006', priority:50, entryMode:'CNP', condition_groups:[{logic:'AND',conditions:[{field:'txn.amount',op:'>',value:'1000'}]}], group_logic:'AND', action:{decision:'APPROVE',score_weight:0,suggestions:['REQUIRE_3DS']}, reasonCode:'LUX_HIGH_VALUE', enabled:true, version:1, hitCount:1230, createdAt:'2026-02-01', updatedAt:'2026-02-01' },
  { id:'M009', name:'Prepaid Card Block', tenant:'Merchant', tenantId:'M_1006', priority:48, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'card.type',op:'==',value:'PREPAID'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'PREPAID_BLOCK', enabled:true, version:1, hitCount:89, createdAt:'2026-02-01', updatedAt:'2026-02-01' },
  // M_1007 FastFood (fast food, MCC 5812)
  { id:'M010', name:'Max Txn $200', tenant:'Merchant', tenantId:'M_1007', priority:50, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'txn.amount',op:'>',value:'200'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'FF_LIMIT', enabled:true, version:1, hitCount:156, createdAt:'2026-01-20', updatedAt:'2026-01-20' },
  { id:'M011', name:'Off-Hours Block', tenant:'Merchant', tenantId:'M_1007', priority:45, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'txn.hour',op:'<',value:'5'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'OFF_HOURS', enabled:true, version:1, hitCount:34, createdAt:'2026-01-20', updatedAt:'2026-01-20' },
  // M_1008 DrugStore (pharmacy)
  { id:'M012', name:'Single Limit $500', tenant:'Merchant', tenantId:'M_1008', priority:50, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'txn.amount',op:'>',value:'500'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'DRUG_LIMIT', enabled:true, version:1, hitCount:78, createdAt:'2026-02-10', updatedAt:'2026-02-10' },
  // M_1010 OnlineShop (e-commerce, CNP only)
  { id:'M013', name:'Force 3DS Above $100', tenant:'Merchant', tenantId:'M_1010', priority:50, entryMode:'CNP', condition_groups:[{logic:'AND',conditions:[{field:'txn.amount',op:'>',value:'100'}]}], group_logic:'AND', action:{decision:'APPROVE',score_weight:0,suggestions:['REQUIRE_3DS']}, reasonCode:'ONLINE_3DS', enabled:true, version:1, hitCount:8920, createdAt:'2026-01-10', updatedAt:'2026-01-10' },
  { id:'M014', name:'VPN/Proxy Block', tenant:'Merchant', tenantId:'M_1010', priority:45, entryMode:'CNP', condition_groups:[{logic:'AND',conditions:[{field:'geo.is_vpn',op:'==',value:'true'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'VPN_BLOCK', enabled:true, version:1, hitCount:456, createdAt:'2026-01-10', updatedAt:'2026-01-10' },
  // M_1011 TravelCo (travel agency)
  { id:'M015', name:'International Cards Welcome', tenant:'Merchant', tenantId:'M_1011', priority:1, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'card.is_international',op:'==',value:'true'},{field:'verify.3ds_result',op:'==',value:'AUTHENTICATED'}]}], group_logic:'AND', action:{decision:'APPROVE',score_weight:0,suggestions:[]}, reasonCode:'INTL_3DS_OK', enabled:true, version:1, hitCount:2340, createdAt:'2026-02-15', updatedAt:'2026-02-15' },
  { id:'M016', name:'High Value No 3DS Block', tenant:'Merchant', tenantId:'M_1011', priority:50, entryMode:'CNP', condition_groups:[{logic:'AND',conditions:[{field:'txn.amount',op:'>',value:'3000'},{field:'verify.3ds_result',op:'!=',value:'AUTHENTICATED'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:['REQUIRE_3DS']}, reasonCode:'TRAVEL_NO_3DS', enabled:true, version:1, hitCount:178, createdAt:'2026-02-15', updatedAt:'2026-02-15' },
  // M_1013 SubShop (subscription service)
  { id:'M017', name:'Allow Recurring', tenant:'Merchant', tenantId:'M_1013', priority:1, entryMode:'CNP', condition_groups:[{logic:'AND',conditions:[{field:'txn.is_recurring',op:'==',value:'true'},{field:'txn.amount',op:'<',value:'100'}]}], group_logic:'AND', action:{decision:'APPROVE',score_weight:0,suggestions:[]}, reasonCode:'RECURRING_OK', enabled:true, version:1, hitCount:15600, createdAt:'2026-03-01', updatedAt:'2026-03-01' },
  { id:'M018', name:'Non-Recurring Limit $200', tenant:'Merchant', tenantId:'M_1013', priority:50, entryMode:'CNP', condition_groups:[{logic:'AND',conditions:[{field:'txn.is_recurring',op:'!=',value:'true'},{field:'txn.amount',op:'>',value:'200'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'SUB_LIMIT', enabled:true, version:1, hitCount:45, createdAt:'2026-03-01', updatedAt:'2026-03-01' },
  // M_1014 PetCare (pet store)
  { id:'M019', name:'Single Limit $800', tenant:'Merchant', tenantId:'M_1014', priority:50, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'txn.amount',op:'>',value:'800'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'PET_LIMIT', enabled:true, version:1, hitCount:34, createdAt:'2026-02-20', updatedAt:'2026-02-20' },

  // === L3 Merchant — ISO_2002 merchants ===
  // M_1004 FoodHub (food delivery, CNP)
  { id:'M020', name:'Force 3DS All Orders', tenant:'Merchant', tenantId:'M_1004', priority:50, entryMode:'CNP', condition_groups:[{logic:'AND',conditions:[{field:'txn.entry_mode',op:'==',value:'CNP'}]}], group_logic:'AND', action:{decision:'APPROVE',score_weight:0,suggestions:['REQUIRE_3DS']}, reasonCode:'FOOD_3DS', enabled:true, version:1, hitCount:6780, createdAt:'2026-01-15', updatedAt:'2026-01-15' },
  { id:'M021', name:'Max Order $300', tenant:'Merchant', tenantId:'M_1004', priority:48, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'txn.amount',op:'>',value:'300'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'FOOD_LIMIT', enabled:true, version:1, hitCount:123, createdAt:'2026-01-15', updatedAt:'2026-01-15' },
  // M_1005 JewelBox (jewelry, high value)
  { id:'M022', name:'Mandatory 3DS + PIN', tenant:'Merchant', tenantId:'M_1005', priority:50, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'txn.amount',op:'>',value:'500'}]}], group_logic:'AND', action:{decision:'APPROVE',score_weight:0,suggestions:['REQUIRE_3DS','REQUIRE_PIN']}, reasonCode:'JEWEL_VERIFY', enabled:true, version:1, hitCount:890, createdAt:'2026-02-01', updatedAt:'2026-02-01' },
  { id:'M023', name:'Block Non-US High Value', tenant:'Merchant', tenantId:'M_1005', priority:45, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'card.issuer_country',op:'!=',value:'US'},{field:'txn.amount',op:'>',value:'2000'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'JEWEL_FOREIGN', enabled:true, version:1, hitCount:67, createdAt:'2026-02-01', updatedAt:'2026-02-01' },
  // M_1009 GasStation (gas station, CP, small amounts)
  { id:'M024', name:'Max Pump $150', tenant:'Merchant', tenantId:'M_1009', priority:50, entryMode:'CP', condition_groups:[{logic:'AND',conditions:[{field:'txn.amount',op:'>',value:'150'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'GAS_LIMIT', enabled:true, version:1, hitCount:210, createdAt:'2026-01-20', updatedAt:'2026-01-20' },
  { id:'M025', name:'Rapid Swipe Block', tenant:'Merchant', tenantId:'M_1009', priority:45, entryMode:'CP', condition_groups:[{logic:'AND',conditions:[{field:'velocity.count',op:'>',value:'3',params:{dimension:'card_hash',window:'10m'}}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'GAS_RAPID', enabled:true, version:1, hitCount:56, createdAt:'2026-01-20', updatedAt:'2026-01-20' },
  // M_1012 GameZone (gaming, digital goods)
  { id:'M026', name:'Prepaid Card Block', tenant:'Merchant', tenantId:'M_1012', priority:50, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'card.type',op:'==',value:'PREPAID'},{field:'txn.amount',op:'>',value:'50'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'GAME_PREPAID', enabled:true, version:1, hitCount:345, createdAt:'2026-02-10', updatedAt:'2026-02-10' },
  { id:'M027', name:'Daily Card Limit 5 Txns', tenant:'Merchant', tenantId:'M_1012', priority:48, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'limit.card_daily_count',op:'>',value:'5'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'GAME_DAILY', enabled:true, version:1, hitCount:189, createdAt:'2026-02-10', updatedAt:'2026-02-10' },
  // M_1015 AutoParts (auto parts)
  { id:'M028', name:'Single Limit $3K', tenant:'Merchant', tenantId:'M_1015', priority:50, entryMode:'ALL', condition_groups:[{logic:'AND',conditions:[{field:'txn.amount',op:'>',value:'3000'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'AUTO_LIMIT', enabled:true, version:1, hitCount:45, createdAt:'2026-03-01', updatedAt:'2026-03-01' },
  { id:'M029', name:'Chip Fallback Block', tenant:'Merchant', tenantId:'M_1015', priority:45, entryMode:'CP', condition_groups:[{logic:'AND',conditions:[{field:'txn.is_fallback',op:'==',value:'true'}]}], group_logic:'AND', action:{decision:'DECLINE',score_weight:0,suggestions:[]}, reasonCode:'FALLBACK_BLOCK', enabled:true, version:1, hitCount:12, createdAt:'2026-03-01', updatedAt:'2026-03-01' },
]

export const tenantTree = [
  { id:'PLATFORM', label:'Platform', children:[] },
  { id:'ISO_2001', label:'ISO Alpha Corp', children:[
    { id:'M_1001', label:'Merchant - QuickMart' },
    { id:'M_1002', label:'Merchant - TechStore' },
    { id:'M_1003', label:'Merchant - GrandHotel' },
    { id:'M_1006', label:'Merchant - LuxRetail' },
    { id:'M_1007', label:'Merchant - FastFood' },
    { id:'M_1008', label:'Merchant - DrugStore' },
    { id:'M_1010', label:'Merchant - OnlineShop' },
    { id:'M_1011', label:'Merchant - TravelCo' },
    { id:'M_1013', label:'Merchant - SubShop' },
    { id:'M_1014', label:'Merchant - PetCare' },
  ]},
  { id:'ISO_2002', label:'ISO Beta Pay', children:[
    { id:'M_1004', label:'Merchant - FoodHub' },
    { id:'M_1005', label:'Merchant - JewelBox' },
    { id:'M_1009', label:'Merchant - GasStation' },
    { id:'M_1012', label:'Merchant - GameZone' },
    { id:'M_1015', label:'Merchant - AutoParts' },
  ]},
]

export const fieldOptions = [
  // Transaction
  { key:'txn.amount', label:'txn.amount', group:'Transaction', desc:'Transaction amount in local currency.' },
  { key:'txn.entry_mode', label:'txn.entry_mode', group:'Transaction', desc:'CP (Card Present) or CNP (Card Not Present).' },
  { key:'txn.currency', label:'txn.currency', group:'Transaction', desc:'Transaction currency code (USD, EUR, etc).' },
  { key:'txn.hour', label:'txn.hour', group:'Transaction', desc:'Hour of day (0-23).' },
  { key:'txn.mcc', label:'txn.mcc', group:'Transaction', desc:'Merchant Category Code.' },
  { key:'txn.pos_entry_mode', label:'txn.pos_entry_mode', group:'Transaction', desc:'CHIP / SWIPE / CONTACTLESS / MANUAL_KEY / ECOMMERCE.' },
  { key:'txn.is_recurring', label:'txn.is_recurring', group:'Transaction', desc:'Whether this is a recurring payment.' },
  { key:'txn.is_fallback', label:'txn.is_fallback', group:'Transaction', desc:'Chip-to-swipe fallback transaction.' },
  // Card
  { key:'card.issuer_country', label:'card.issuer_country', group:'Card', desc:'ISO country code of card issuer.' },
  { key:'card.bin', label:'card.bin', group:'Card', desc:'First 6-8 digits of card number.' },
  { key:'card.type', label:'card.type', group:'Card', desc:'CREDIT / DEBIT / PREPAID / COMMERCIAL.' },
  { key:'card.brand', label:'card.brand', group:'Card', desc:'VISA / MC / AMEX / DISCOVER.' },
  { key:'card.is_international', label:'card.is_international', group:'Card', desc:'Whether card is issued outside merchant country.' },
  // Verification
  { key:'verify.avs_result', label:'verify.avs_result', group:'Verification', desc:'Address Verification: Y / N / U / A / Z.' },
  { key:'verify.cvv_result', label:'verify.cvv_result', group:'Verification', desc:'CVV check: M (match) / N (mismatch) / U.' },
  { key:'verify.3ds_result', label:'verify.3ds_result', group:'Verification', desc:'3DS: AUTHENTICATED / ATTEMPTED / FAILED / NOT_ENROLLED.' },
  { key:'verify.pin_verified', label:'verify.pin_verified', group:'Verification', desc:'PIN verification passed (true/false).' },
  // Merchant
  { key:'merchant.status', label:'merchant.status', group:'Merchant', desc:'ACTIVE / FROZEN / SUSPENDED.' },
  { key:'merchant.age_days', label:'merchant.age_days', group:'Merchant', desc:'Days since merchant onboarding.' },
  { key:'merchant.mcc', label:'merchant.mcc', group:'Merchant', desc:'Merchant Category Code.' },
  { key:'merchant.chargeback_rate', label:'merchant.chargeback_rate', group:'Merchant', desc:'Current chargeback rate.' },
  { key:'merchant.risk_level', label:'merchant.risk_level', group:'Merchant', desc:'LOW / MEDIUM / HIGH.' },
  // Geo/Network
  { key:'geo.ip_country', label:'geo.ip_country', group:'Geo', desc:'IP geolocation country.' },
  { key:'geo.ip_card_country_match', label:'geo.ip_card_country_match', group:'Geo', desc:'IP country matches card issuer country.' },
  { key:'geo.is_vpn', label:'geo.is_vpn', group:'Geo', desc:'VPN/proxy detected.' },
  { key:'geo.distance_km', label:'geo.distance_km', group:'Geo', desc:'Distance in km between two points.' },
  // Device
  { key:'device.category', label:'device.category', group:'Device', desc:'CERTIFIED_POS / DEDICATED_DEVICE / COTS_DEVICE.' },
  { key:'device.attestation_status', label:'device.attestation_status', group:'Device', desc:'VERIFIED / FAILED / EXPIRED.' },
  { key:'device.is_rooted', label:'device.is_rooted', group:'Device', desc:'Root/jailbreak detected.' },
  { key:'device.tamper_detected', label:'device.tamper_detected', group:'Device', desc:'Physical tamper detected.' },
  // Velocity (advanced)
  { key:'velocity.count', label:'velocity.count', group:'Velocity', desc:'Transaction count by dimension + window.' },
  { key:'velocity.amount', label:'velocity.amount', group:'Velocity', desc:'Cumulative amount by dimension + window.' },
  { key:'velocity.distinct', label:'velocity.distinct', group:'Velocity', desc:'Distinct count (from→to) by window.' },
  // Limit (simplified)
  { key:'limit.single_txn_amount', label:'limit.single_txn_amount', group:'Limit', desc:'Single transaction amount limit.' },
  { key:'limit.merchant_daily_amount', label:'limit.merchant_daily_amount', group:'Limit', desc:'Merchant daily cumulative amount.' },
  { key:'limit.merchant_daily_count', label:'limit.merchant_daily_count', group:'Limit', desc:'Merchant daily transaction count.' },
  { key:'limit.card_daily_count', label:'limit.card_daily_count', group:'Limit', desc:'Single card daily transaction count.' },
  { key:'limit.card_daily_amount', label:'limit.card_daily_amount', group:'Limit', desc:'Single card daily cumulative amount.' },
  // Lists
  { key:"blacklist('card_hash')", label:"blacklist('card_hash')", group:'Lists', desc:'Check if card hash is on blacklist.' },
  { key:"whitelist('card_hash')", label:"whitelist('card_hash')", group:'Lists', desc:'Check if card hash is on whitelist.' },
  // Score
  { key:'score.risk_score', label:'score.risk_score', group:'Score', desc:'Current accumulated risk score.' },
]

export const operatorOptions = ['>','<','>=','<=','==','!=','IN','NOT_IN','BETWEEN']

// Rule templates
export const ruleTemplates = [
  { id:'TPL_001', name:'General Industry Template', source:'PLATFORM', description:'Standard risk rules for all MCC types. Includes 7 score rules (max 125) + 8 decision rules covering velocity, AVS/CVV, limits, and blacklist.', mccScope:'ALL', ruleCount:15 },
  { id:'TPL_002', name:'High Risk Industry Template', source:'PLATFORM', description:'Strict rules for MCC 5967/5966/7995 (gambling, telemarketing). Lower amount thresholds, tighter velocity windows, mandatory 3DS for all CNP.', mccScope:'HIGH_RISK', ruleCount:20 },
  { id:'TPL_003', name:'Low Risk Industry Template', source:'PLATFORM', description:'Relaxed thresholds for MCC 5411/5812 (grocery, restaurant). Higher amount limits, wider velocity windows.', mccScope:'LOW_RISK', ruleCount:10 },
  { id:'TPL_004', name:'Alpha Corp Custom', source:'ISO', sourceId:'ISO_2001', description:'Based on General template. 7 score rules (max 125, threshold 70) + 8 decision rules with adjusted velocity and new merchant checks.', mccScope:'ALL', ruleCount:15 },
]
