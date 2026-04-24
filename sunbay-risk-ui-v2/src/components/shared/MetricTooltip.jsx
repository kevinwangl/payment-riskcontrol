import React, { useState } from 'react'

const metrics = {
  // Rate metrics
  'Fraud Rate': { formula: 'Fraud Rate = (Declined Transactions / Total Transactions) × 100%', desc: 'Percentage of transactions automatically blocked by the risk engine. Includes all DECLINE decisions from rules, velocity, and blacklist hits.' },
  'CB Rate': { formula: 'Chargeback Rate = (Chargeback Count / Approved Transactions) × 100%', desc: 'Monthly ratio of chargebacks to approved transactions. Visa VDMP threshold: 0.9%, Mastercard ECP threshold: 1.5%. Exceeding triggers merchant restrictions.' },
  'Approval Rate': { formula: 'Approval Rate = (Approved Transactions / Total Transactions) × 100%', desc: 'Percentage of transactions that passed all risk checks and were approved. Higher is better, but must be balanced against fraud prevention.' },
  'Decline Rate': { formula: 'Decline Rate = (Declined Transactions / Total Transactions) × 100%', desc: 'Percentage of transactions rejected. Includes both rule-based and model-based declines. High decline rate may indicate over-blocking.' },
  'Limit Usage': { formula: 'Limit Usage = (Current Month Volume / Monthly Limit) × 100%', desc: 'How much of the merchant\'s approved monthly transaction limit has been consumed. Approaching 100% may require limit adjustment.' },
  'Reserve Rate': { formula: 'Reserve Rate = (Held Amount / Settlement Amount) × 100%', desc: 'Percentage of settlement funds held as security reserve. Set based on merchant risk level: LOW=0%, MEDIUM=5%, HIGH=10%.' },
  // Model metrics
  'Precision': { formula: 'Precision = True Positives / (True Positives + False Positives)', desc: 'Of all transactions the model flagged as fraud, how many were actually fraud. Higher precision = fewer false alarms (less merchant friction).' },
  'Recall': { formula: 'Recall = True Positives / (True Positives + False Negatives)', desc: 'Of all actual fraud transactions, how many did the model catch. Higher recall = fewer missed frauds (less financial loss).' },
  'AUC': { formula: 'AUC = Area Under the ROC Curve (0 to 1)', desc: 'Overall model discrimination ability. 0.5 = random guess, 1.0 = perfect. Production target: > 0.90.' },
  'PSI': { formula: 'PSI = Σ (Actual% - Expected%) × ln(Actual% / Expected%)', desc: 'Population Stability Index measures feature distribution drift between training and production data. PSI > 0.2 indicates significant drift requiring model retraining.' },
  'Hit Count': { formula: 'Hit Count = Total rule matches in the selected time period', desc: 'Number of times a specific rule was triggered. High hit count on DECLINE rules may indicate over-blocking; review for false positives.' },
  // Score & Level
  'Risk Score': { formula: 'Risk Score = Σ (Rule Weight × Condition Match) or ML Model Output × 100', desc: 'Transaction risk score from 0-100. Calculated by weighted rule scoring (Phase 1) or XGBoost model probability (Phase 2). Thresholds: 0-70 APPROVE, 71+ DECLINE.' },
  'Risk Level': { formula: 'Risk Level = f(Onboarding Risk Score)', desc: 'Merchant risk classification based on onboarding scorecard. LOW (0-25): standard limits. MEDIUM (26-50): enhanced monitoring. HIGH (51-75): strict limits + forced 3DS. PROHIBITED (76+): rejected.' },
  'Priority': { formula: 'Rule: lower number = higher priority (evaluated first)\nCase: P0 (4h SLA) > P1 (24h) > P2 (72h) > P3 (7d)', desc: 'For rules: execution order in the rule chain. Platform rules (1-10) run before ISO (20-50) and Merchant (50+). For cases: urgency level determining response SLA.' },
  // Decision & Action
  'Decision': { formula: 'Decision ∈ {APPROVE, DECLINE}', desc: 'Risk engine output. APPROVE: transaction passes. DECLINE: blocked. Any layer DECLINE = short-circuit reject. Suggestions (e.g. REQUIRE_3DS) can be attached to APPROVE decisions.' },
  'Suggestions': { formula: 'Suggestions ∈ {REQUIRE_3DS, REQUIRE_PIN, REQUIRE_OTP}', desc: 'Smart recommendations attached to the decision. Sent to payment service for execution. REQUIRE_3DS: trigger 3D Secure for CNP. REQUIRE_PIN: require PIN for CP. REQUIRE_OTP: send SMS verification.' },
  // Merchant parameters
  'Settlement Cycle': { formula: 'Settlement Cycle ∈ {T+2, T+3, T+7, T+14}', desc: 'Days after transaction before funds are settled to merchant. Longer cycles for higher risk. T+2 (LOW), T+3 (MEDIUM), T+7 (HIGH), T+14 (under investigation).' },
  'Single Txn Limit': { formula: 'Single Txn Limit = Max allowed amount per transaction ($)', desc: 'Maximum dollar amount for a single transaction. Exceeding triggers automatic DECLINE (rule P002). LOW=$10K, MEDIUM=$5K, HIGH=$2K.' },
  'Monthly Limit': { formula: 'Monthly Limit = Max total approved volume per calendar month ($)', desc: 'Maximum total approved transaction volume per month. Approaching limit triggers alerts. LOW=$500K, MEDIUM=$200K, HIGH=$50K.' },
  // Verification
  'AVS Result': { formula: 'AVS ∈ {Y (Match), N (No Match), U (Unavailable)}', desc: 'Address Verification System result from card issuer. Compares billing address with address on file. N (mismatch) is a fraud signal, especially combined with high amount (rule I005).' },
  'CVV Result': { formula: 'CVV ∈ {M (Match), N (No Match), U (Unavailable)}', desc: 'Card Verification Value check result. N (mismatch) indicates card number may be stolen without physical card. CVV fail triggers automatic DECLINE (rule I006).' },
  // Velocity & Lists
  'Velocity': { formula: 'Velocity = Count or Sum of txns per entity per time window', desc: 'Frequency/amount counters tracked in Redis. Examples: card txn count per 1h, IP txn count per 5m. Thresholds configured per counter, exceeding triggers DECLINE.' },
  'TTL': { formula: 'TTL = Expiration Time - Current Time', desc: 'Time-To-Live for blacklist entries. Permanent entries have no TTL. Temporary entries (e.g., 30-min freeze) auto-expire. Displayed as countdown.' },
  // Chargeback & Case
  'Deadline': { formula: 'Deadline = Received Date + Card Network Response Window', desc: 'Last date to respond to a chargeback or resolve a case. Visa: typically 30 days. Mastercard: varies by reason code. Missing deadline = automatic loss. < 7 days shown in red.' },
  'Reason Code': { formula: 'Reason Code = Card Network defined dispute category', desc: 'Standardized code explaining why a chargeback was filed. Visa 10.4: Fraud Card Absent. MC 4837: No Cardholder Auth. Determines if dispute is contestable.' },
  // Transaction
  'Entry Mode': { formula: 'Entry Mode ∈ {CP (Card Present), CNP (Card Not Present)}', desc: 'How the card was used. CP: physical swipe/insert/tap at terminal. CNP: online/phone/mail order. CNP has higher fraud risk, different rules apply (3DS, AVS/CVV checks).' },
  'MCC': { formula: 'MCC = 4-digit Merchant Category Code (ISO 18245)', desc: 'Industry classification. Determines risk profile and contextual rules. 5411 (Grocery), 5812 (Restaurants), 7011 (Hotels), 5966 (Direct Marketing - high risk). Some MCCs are prohibited.' },
  'Algorithm': { formula: 'Algorithm ∈ {XGBoost, LightGBM}', desc: 'Machine learning model type. XGBoost: gradient boosted trees, robust and interpretable. LightGBM: faster training, lower memory, similar accuracy. Both output fraud probability 0-1.' },
  // Device Risk
  'Attestation Fail Rate': { formula: 'Attestation Fail Rate = (Attestation FAILED + EXPIRED) / Total Device Transactions × 100%', desc: 'Percentage of transactions where device integrity attestation (Google Play Integrity / Apple DeviceCheck) failed or expired. High rate indicates compromised devices or SDK issues. Target: < 1%.' },
  'Geofence Trigger Rate': { formula: 'Geofence Trigger Rate = geo_distance(device, merchant) > radius Transactions / Total Transactions × 100%', desc: 'Percentage of transactions where device location exceeded the merchant geofence radius. Indicates potential device theft, location spoofing, or misconfigured geofence. Target: < 2%.' },
  'Root/Jailbreak': { formula: 'Root/Jailbreak Rate = Rooted or Jailbroken Devices / Total Devices in Category × 100%', desc: 'Devices with root/jailbreak bypass OS security controls, allowing key extraction, runtime tampering, and privilege escalation. Critical for COTS/Dedicated devices. Threshold: < 1%.' },
  'Debug Mode': { formula: 'Debug Mode Rate = Debug-Enabled Devices / Total Devices in Category × 100%', desc: 'Debug mode allows reverse engineering, memory inspection, and runtime injection. Should never be enabled in production. Threshold: < 1%.' },
  'Hook Framework': { formula: 'Hook Rate = Devices with Xposed/Frida/etc / Total Devices in Category × 100%', desc: 'Hook frameworks (Xposed, Frida, Substrate) enable runtime method interception and tampering. Indicates active attack tooling on device. Threshold: < 0.5%.' },
  'TEE Unavailable': { formula: 'TEE Unavailable Rate = Devices without TEE / Total Devices in Category × 100%', desc: 'Trusted Execution Environment is required for secure key storage in SoftPOS. Without TEE, cryptographic keys are exposed to OS-level attacks. Threshold: < 1%.' },
  'PTS Cert Expired': { formula: 'PTS Expired Rate = Devices with Expired PCI PTS Cert / Total POS Devices × 100%', desc: 'PCI PTS certification ensures hardware meets payment security standards. Expired certs mean the device no longer meets current security requirements. Threshold: < 1%.' },
  'Tamper Detected': { formula: 'Tamper Rate = Devices with Tamper Flag / Total POS Devices × 100%', desc: 'Hardware tamper detection triggered — device may have been physically compromised (skimmer installed, case opened). Any detection is critical.' },
  'Firmware Outdated': { formula: 'FW Outdated Rate = Devices below Min Firmware Version / Total POS Devices × 100%', desc: 'Outdated firmware may contain known vulnerabilities. Devices should be updated to the minimum required version. Threshold: < 2%.' },
  // Aliases for table short names
  'Attest Failed': { formula: 'Attestation Fail Rate = (FAILED + EXPIRED) / Total Verifications × 100%', desc: 'Device integrity attestation (Play Integrity / DeviceCheck) failed or expired. Indicates compromised device or SDK issue. Target: < 1%.' },
  'FW Outdated': { formula: 'FW Outdated Rate = Devices below Min Firmware Version / Total POS Devices × 100%', desc: 'Outdated firmware may contain known vulnerabilities. Devices should be updated to the minimum required version. Threshold: < 2%.' },
  'PTS Expired': { formula: 'PTS Expired Rate = Devices with Expired PCI PTS Cert / Total POS Devices × 100%', desc: 'PCI PTS certification ensures hardware meets payment security standards. Expired certs mean the device no longer meets current security requirements. Threshold: < 1%.' },
}

export default function MetricTooltip({ name, children }) {
  const [show, setShow] = useState(false)
  const info = metrics[name]
  if (!info) return children

  return (
    <span className="relative inline-flex items-center gap-1">
      {children}
      <button onClick={() => setShow(!show)} className="text-muted hover:text-primary text-[10px] border border-border/60 w-3.5 h-3.5 inline-flex items-center justify-center leading-none flex-shrink-0">?</button>
      {show && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShow(false)} />
          <div className="fixed z-50 bg-white border border-border p-3 w-[320px] shadow-lg text-[12px]"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium">{name}</div>
              <button onClick={() => setShow(false)} className="text-muted hover:text-black text-[14px]">✕</button>
            </div>
            <div className="font-mono text-[11px] bg-surface p-1.5 mb-2 text-primary whitespace-pre-wrap">{info.formula}</div>
            <div className="text-muted leading-relaxed">{info.desc}</div>
          </div>
        </>
      )}
    </span>
  )
}
