// AI assistant mock responses, context-aware per page
const responses = {
  // Global queries
  '拒付率最高': { text: 'GameZone 拒付率 1.8%，已超过 Visa VDMP 阈值 0.9%。当前状态：已冻结。', links: [{ label: '查看商户', to: '/merchants/M_1012' }] },
  'chargeback': { text: 'GameZone 拒付率 1.8%，已超过 Visa VDMP 阈值 0.9%。当前状态：已冻结。', links: [{ label: '查看商户', to: '/merchants/M_1012' }] },
  '模型': { text: '当前采用规则加权评分方案，无 ML 模型。\n评分公式：risk_score = Σ(命中规则的 score_weight)\n当前 ISO 阈值：70 分（>= 70 → DECLINE）\n活跃评分规则 25 条，最大可能分数 145。', links: [{ label: '规则列表', to: '/rules' }] },
  '高风险商户': { text: '当前高风险商户 3 个：\n• GameZone — CB 1.8%，已冻结\n• TravelCo — CB 1.2%，观察期\n• JewelBox — CB 0.95%，接近阈值\n建议优先处理 GameZone 关停审查。', links: [{ label: '商户列表', to: '/merchants' }] },
  '今日': { text: '今日交易 34,250 笔，放行率 94.5%，拒绝率 5.5%。\nP99 延迟 42ms，在 50ms 目标内。\n命中最多规则：P001（OFAC 制裁拦截）412 次。', links: [{ label: '交易列表', to: '/transactions' }] },
  '规则': { text: '当前生效规则 25 条（Platform 8 + ISO 10 + Merchant 7）。\n命中最多的规则：P001（OFAC 制裁拦截）4,201 次。\n建议检查 I001（Card Velocity）阈值，近期命中率上升 23%。', links: [{ label: '规则列表', to: '/rules' }, { label: '规则分析', to: '/rules/analytics' }] },

  // Dashboard context
  '拒绝率': { text: '今日拒绝率 5.5%，较昨日上升 0.3%。\n主要触发规则：I001（Card Velocity）占 42%，I005（AVS Fail）占 18%。\n⚠ 商户 TechStore 拒绝占比异常偏高（35%），建议排查。', links: [{ label: '查看 TechStore', to: '/merchants/M_1002' }] },
  '异常': { text: '🔍 检测到以下异常：\n1. TechStore 拒绝率突增 45%，集中在 I001 规则，疑似试卡攻击\n2. GameZone 拒付率 1.8%，已触发自动冻结\n建议优先处理 #1。', links: [{ label: '查看 TechStore 交易', to: '/transactions' }] },

  // Rule engine context
  '写规则': { text: '已生成规则建议：\n\n条件: txn.entry_mode == \'CNP\' AND txn.amount > 3000 AND card.issuer_country != \'US\'\n决策: DECLINE\n建议: REQUIRE_3DS\n\n基于近 30 天数据，该规则预计命中率 2.3%，误杀率 < 0.5%。', links: [{ label: '在编辑器中打开', to: '/rules/edit/new' }] },
  '新规则': { text: '已生成规则建议：\n\n条件: txn.entry_mode == \'CNP\' AND txn.amount > 3000 AND card.issuer_country != \'US\'\n决策: DECLINE\n建议: REQUIRE_3DS\n\n基于近 30 天数据，该规则预计命中率 2.3%，误杀率 < 0.5%。', links: [] },
  '规则模板': { text: '常用规则模板：\n\n1. 境外大额拦截\n   条件: txn.amount > 5000 AND card.issuer_country != merchant.country\n   决策: REQUIRE_3DS\n\n2. 高频试卡拦截\n   条件: velocity(card.number, 1h) > 5\n   决策: DECLINE\n\n3. 高风险 MCC 限额\n   条件: merchant.mcc IN (7995,5967) AND txn.amount > 500\n   决策: DECLINE\n\n选择一个模板，我帮你填入编辑器。', links: [] },
  '缺少哪类': { text: '基于当前规则覆盖分析，建议补充：\n\n1. ⚠ 缺少 AVS 不匹配 + 大额组合规则（近 7 天此类欺诈 23 笔）\n2. ⚠ 缺少新卡首笔大额交易规则（card.age < 7d AND txn.amount > 2000）\n3. ⚠ 缺少跨境小额高频规则（velocity > 10/h AND txn.amount < 50）\n\n需要我帮你生成其中一条吗？', links: [] },
  'cnp': { text: '已生成规则建议：\n\n条件: txn.entry_mode == \'CNP\' AND txn.amount > 3000 AND card.issuer_country != \'US\'\n决策: DECLINE\n建议: REQUIRE_3DS\n\n基于近 30 天数据，该规则预计命中率 2.3%，误杀率 < 0.5%。', links: [{ label: '在编辑器中打开', to: '/rules/edit/new' }] },
  '阈值': { text: '基于近 30 天交易数据分析：\n• I001 Card Velocity 建议阈值：8 次/h（当前 5，误杀率偏高）\n• I005 AVS Fail 金额建议：$1,500（当前 $1,000）\n• I009 新商户金额建议：$800（当前 $1,000，可适当放宽）\n调整后预计拒绝率下降 0.3%。', links: [{ label: '编辑 I001', to: '/rules/edit/I001' }] },
  '优化': { text: '规则优化建议：\n1. P008（High Risk BIN）命中 1,456 次但 0 笔最终确认欺诈 → 建议下调优先级或缩小 BIN 范围\n2. I007（Off-Hours Restaurant）命中仅 89 次 → 效果有限，建议合并到 I008\n3. M007（Repeated Same Amount）命中 12 次全部确认欺诈 → 高精度规则，建议提升优先级', links: [{ label: '规则分析', to: '/rules/analytics' }] },

  // Transaction context
  '这笔': { text: '🤖 AI 分析摘要：\n该交易风险评分 89，主要风险因素：\n• 同设备 1h 内使用 3 张不同卡（权重 35%）\n• AVS 不匹配（权重 25%）\n• 发卡国与商户国不一致（权重 20%）\n• IP 地址标记为 VPN（权重 12%）\n\n建议：DECLINE — 置信度 92%\n历史相似案例中 87% 最终确认为欺诈。', links: [] },
  '分析': { text: '🤖 AI 分析摘要：\n该交易风险评分 89，主要风险因素：\n• 同设备 1h 内使用 3 张不同卡（权重 35%）\n• AVS 不匹配（权重 25%）\n• 发卡国与商户国不一致（权重 20%）\n• IP 地址标记为 VPN（权重 12%）\n\n建议：DECLINE — 置信度 92%\n历史相似案例中 87% 最终确认为欺诈。', links: [] },

  // Chargeback context
  '争议': { text: '当前 Chargeback 概况：\n• PENDING 待处理：8 笔\n• 本月已结案：4 笔（WON 2, LOST 2）\n• 本月胜诉率：50%\n\n⚠ CB006（JewelBox, $890）建议关注，该商户 CB 率接近 Visa 阈值。', links: [{ label: '查看 CB 记录', to: '/chargebacks' }] },
  '抗辩': { text: '针对 Visa 10.4（Fraud - Card Absent）的抗辩建议：\n\n必备证据：\n1. 3DS 验证记录（如有）\n2. AVS/CVV 匹配结果\n3. 发货证明 + 签收记录\n4. 客户历史交易记录\n5. IP/设备与持卡人关联证据\n\n胜诉概率评估：有 3DS 记录 → 75%，无 3DS → 30%。', links: [] },
}

// Fallback
const fallback = { text: '我可以帮你：\n• 查询风控数据（"今日交易概况"、"高风险商户"）\n• 分析异常（"拒绝率为什么上升"）\n• 生成规则（"写一条拦截境外大额CNP的规则"）\n• 评分分析（"当前评分公式"、"阈值建议"）\n\n试试问我吧 👆', links: [] }

export function getAIResponse(input) {
  const q = input.toLowerCase()
  for (const [key, resp] of Object.entries(responses)) {
    if (q.includes(key.toLowerCase())) return resp
  }
  return fallback
}

// Context-aware prompts per page
// Static routes use exact path; dynamic routes use pattern prefix
export const pagePrompts = {
  '/dashboard': ['今日交易概况', '有什么异常？', '拒绝率分析'],
  '/rules': ['帮我写一条规则', '规则优化建议', '阈值调整建议'],
  '/rules/edit/new': ['帮我写一条新规则', '推荐常用的规则模板', '当前缺少哪类规则？'],
  '/rules/edit': ['帮我优化这条规则的条件', '这个阈值设多少合理？', '预估这条规则的影响范围'],
  '/rules/analytics': ['哪些规则效果差？', '规则优化建议'],
  '/lists': ['最近加了哪些黑名单？', '高风险IP有哪些？'],
  '/velocity': ['当前限速配置合理吗？', '哪些限速规则触发最多？'],
  '/transactions': ['最近有什么异常交易？', '拒绝最多的原因是什么？'],
  '/transactions/': ['这笔交易为什么被拒？', '分析这笔交易的风险因素', '有类似的可疑交易吗？'],
  '/merchants': ['高风险商户有哪些？', '拒付率最高的商户？'],
  '/merchants/': ['这个商户的风险概况', '该商户拒付率趋势', '建议调整商户风控策略吗？'],
  '/chargebacks': ['当前争议概况', '抗辩建议', '拒付率趋势'],
  '/chargebacks/monitoring': ['拒付率最高的商户？', '有哪些商户接近阈值？'],
  '/reports': ['本周风控总结', '拒付率趋势分析'],
  '/settings/audit': ['最近有哪些敏感操作？', '谁修改了规则配置？'],
}

// Match pathname to prompts, supporting dynamic routes like /rules/edit/:id
export function getPagePrompts(pathname) {
  if (pagePrompts[pathname]) return pagePrompts[pathname]
  // Try matching by prefix: longest prefix wins (e.g. /rules/edit before /rules)
  const candidates = Object.keys(pagePrompts).filter(k => k !== pathname && pathname.startsWith(k))
  if (candidates.length) {
    candidates.sort((a, b) => b.length - a.length)
    return pagePrompts[candidates[0]]
  }
  return pagePrompts['/dashboard']
}
