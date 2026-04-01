const mccs = ['5411','5812','5999','7011','5944','5966']
const countries = ['US','US','US','US','US','GB','CA','BR','DE','SG']
const merchants = ['QuickMart','TechStore','GrandHotel','FoodHub','JewelBox','LuxRetail','FastFood','DrugStore','GasStation','OnlineShop','TravelCo','GameZone','SubShop','PetCare','AutoParts']
const merchantIds = merchants.map((_,i) => `M_${1001+i}`)
const bins = ['411111','424242','540500','601100','378282','601101','400000','520000']
const brands = ['Visa','Visa','Mastercard','Discover','Amex','Discover','Visa','Mastercard']
const ips = ['192.168.1.104','10.0.0.55','172.16.254.1','203.0.113.42','198.51.100.7','192.168.1.45','10.0.0.12','172.16.0.1']
const devices = ['dev_a1b2c3d4e5f6','dev_x9y8z7w6v5u4','dev_m1n2o3p4q5r6','dev_s7t8u9v0w1x2','dev_f9a2b3c4d5e6']

const rulePool = {
  DECLINE: [
    {rules:['P004'],reason:'HIGH_AMT_FOREIGN_CNP',suggestions:[]},
    {rules:['P001'],reason:'OFAC_HIT',suggestions:[]},
    {rules:['I006'],reason:'CVV_FAIL',suggestions:[]},
    {rules:['I004'],reason:'CARD_SWEEP',suggestions:[]},
    {rules:['P006'],reason:'FRAUD_FACTORY',suggestions:[]},
    {rules:['P005'],reason:'CARD_TESTING',suggestions:[]},
    {rules:['M002'],reason:'NON_US_CARD',suggestions:[]},
    {rules:['P002'],reason:'LIMIT_EXCEEDED',suggestions:[]},
  ],
  REVIEW: [
    {rules:['I001'],reason:'CARD_VELOCITY',suggestions:['REQUIRE_3DS']},
    {rules:['I005'],reason:'AVS_FAIL_HIGH',suggestions:['REQUIRE_3DS']},
    {rules:['I003'],reason:'DEVICE_MULTI_CARD',suggestions:[]},
    {rules:['P007'],reason:'GREYLIST_HIT',suggestions:[]},
    {rules:['P008'],reason:'HIGH_RISK_BIN',suggestions:[]},
    {rules:['I007'],reason:'OFF_HOURS',suggestions:[]},
    {rules:['I009'],reason:'NEW_MERCHANT',suggestions:['REQUIRE_3DS']},
    {rules:['I010'],reason:'PREPAID_HIGH',suggestions:[]},
    {rules:['M001'],reason:'CUSTOM_LIMIT',suggestions:[]},
    {rules:['M007'],reason:'SAME_AMOUNT',suggestions:[]},
  ],
  APPROVE_WITH_SUGGESTION: [
    {rules:['M003'],reason:'FORCE_3DS',suggestions:['REQUIRE_3DS']},
    {rules:['M005'],reason:'CP_LARGE',suggestions:['REQUIRE_PIN']},
  ],
}

const pick = arr => arr[Math.floor(Math.random()*arr.length)]
const rand = (min,max) => Math.floor(Math.random()*(max-min+1))+min

export function generateTransactions(count=200) {
  const txns = []
  for (let i=0; i<count; i++) {
    let decision, score, triggeredRules, reasonCode, suggestions
    const r = Math.random()
    if (r < 0.05) {
      decision='DECLINE'; score=rand(72,98)
      const p = pick(rulePool.DECLINE); triggeredRules=p.rules; reasonCode=p.reason; suggestions=p.suggestions
    } else if (r < 0.15) {
      decision='REVIEW'; score=rand(42,71)
      const p = pick(rulePool.REVIEW); triggeredRules=p.rules; reasonCode=p.reason; suggestions=p.suggestions
    } else if (r < 0.30) {
      decision='APPROVE'; score=rand(20,55)
      const p = pick(rulePool.APPROVE_WITH_SUGGESTION); triggeredRules=p.rules; reasonCode=p.reason; suggestions=p.suggestions
    } else {
      decision='APPROVE'; score=rand(2,39); triggeredRules=[]; reasonCode=''; suggestions=[]
    }
    const entryMode = Math.random()>0.3?'CNP':'CP'
    const binIdx = rand(0,bins.length-1)
    const mIdx = rand(0,merchants.length-1)
    txns.push({
      id:`txn_${Date.now().toString(36)}_${i.toString(16).padStart(4,'0')}`,
      amount: decision==='DECLINE'&&reasonCode==='CARD_TESTING'? (Math.random()*1.5+0.01).toFixed(2) : (Math.random()*4990+10).toFixed(2),
      currency:'USD', merchantId:merchantIds[mIdx], merchantName:merchants[mIdx],
      mcc:mccs[rand(0,mccs.length-1)], country:pick(countries), entryMode,
      decision, score, triggeredRules, suggestions, reasonCode,
      avsResult:pick(['Y','Y','Y','N','U']), cvvResult:pick(['M','M','M','N','U']),
      ip:pick(ips), deviceFingerprint:pick(devices),
      cardBin:bins[binIdx], cardBrand:brands[binIdx], cardType:pick(['CREDIT','CREDIT','DEBIT','PREPAID']),
      cardIssuerCountry:pick(countries), cardLast4:String(rand(1000,9999)),
      timestamp: new Date(Date.now()-rand(0,86400000*7)).toISOString(),
      degraded:false,
    })
  }
  return txns.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp))
}

export const transactions = generateTransactions(200)
