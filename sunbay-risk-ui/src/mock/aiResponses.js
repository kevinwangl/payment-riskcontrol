// AI assistant mock responses, context-aware per page
const responses = {
  // Global queries
  '拒付率最高': { text: 'GameZone 拒付率 1.8%，已超过 Visa VDMP 阈值 0.9%。当前状态：已冻结。关联案件：C003。', links: [{ label: '查看商户', to: '/merchants/M_1012' }, { label: '查看案件', to: '/cases/C003' }] },
  'chargeback': { text: 'GameZone 拒付率 1.8%，已超过 Visa VDMP 阈值 0.9%。当前状态：已冻结。关联案件：C003。', links: [{ label: '查看商户', to: '/merchants/M_1012' }, { label: '查看案件', to: '/cases/C003' }] },
  '模型': { text: 'v2.3_xgb 线上运行中，AUC 0.941。\n⚠ PSI 近3天有上升趋势（0.12→0.16），接近 0.2 阈值。\nShadow 模型 v2.4_lgb AUC 0.948，建议考虑灰度切换。', links: [{ label: '模型监控', to: '/models/monitoring' }, { label: 'Shadow 对比', to: '/models/comparison' }] },
  '高风险商户': { text: '当前高风险商户 3 个：\n• GameZone — CB 1.8%，已冻结\n• TravelCo — CB 1.2%，观察期\n• JewelBox — CB 0.95%，接近阈值\n建议优先处理 GameZone 关停审查。', links: [{ label: '商户列表', to: '/merchants' }] },
  '今日': { text: '今日交易 34,250 笔，放行率 94.5%，拒绝率 4.2%，REVIEW 率 1.3%。\nP99 延迟 42ms，在 50ms 目标内。\n⚠ REVIEW 队列积压 342 笔，建议增加审核人力。', links: [{ label: '审核工作台', to: '/review' }] },
  '规则': { text: '当前生效规则 30 条（Platform 8 + ISO 10 + Merchant 7 + 建议 5）。\n命中最多的规则：P001（OFAC 制裁拦截）4,201 次。\n建议检查 I001（Card Velocity）阈值，近期命中率上升 23%。', links: [{ label: '规则列表', to: '/rules' }, { label: '规则分析', to: '/rules/analytics' }] },

  // Dashboard context
  'review率': { text: '今日 REVIEW 率 1.3%，较昨日下降 0.2%。\n主要触发规则：I001（Card Velocity）占 42%，I005（AVS Fail）占 18%。\n⚠ 商户 TechStore 的 REVIEW 占比异常偏高（35%），建议排查。', links: [{ label: '查看 TechStore', to: '/merchants/M_1002' }] },
  '异常': { text: '🔍 检测到以下异常：\n1. TechStore REVIEW 率突增 45%，集中在 I001 规则，疑似试卡攻击\n2. GameZone 拒付率 1.8%，已触发自动冻结\n3. PSI 指标 0.16，接近 0.2 阈值\n建议优先处理 #1。', links: [{ label: '查看 TechStore 交易', to: '/transactions' }, { label: '模型监控', to: '/models/monitoring' }] },

  // Rule engine context
  '写规则': { text: '已生成规则建议：\n\n条件: txn.entry_mode == \'CNP\' AND txn.amount > 3000 AND card.issuer_country != \'US\'\n决策: REVIEW\n建议: REQUIRE_3DS\n\n基于近 30 天数据，该规则预计命中率 2.3%，误杀率 < 0.5%。', links: [{ label: '在编辑器中打开', to: '/rules/edit/new' }] },
  'cnp': { text: '已生成规则建议：\n\n条件: txn.entry_mode == \'CNP\' AND txn.amount > 3000 AND card.issuer_country != \'US\'\n决策: REVIEW\n建议: REQUIRE_3DS\n\n基于近 30 天数据，该规则预计命中率 2.3%，误杀率 < 0.5%。', links: [{ label: '在编辑器中打开', to: '/rules/edit/new' }] },
  '阈值': { text: '基于近 30 天交易数据分析：\n• I001 Card Velocity 建议阈值：8 次/h（当前 5，误杀率偏高）\n• I005 AVS Fail 金额建议：$1,500（当前 $1,000）\n• I009 新商户金额建议：$800（当前 $1,000，可适当放宽）\n调整后预计 REVIEW 率下降 0.3%。', links: [{ label: '编辑 I001', to: '/rules/edit/I001' }] },
  '优化': { text: '规则优化建议：\n1. P008（High Risk BIN）命中 1,456 次但 0 笔最终确认欺诈 → 建议下调优先级或缩小 BIN 范围\n2. I007（Off-Hours Restaurant）命中仅 89 次 → 效果有限，建议合并到 I008\n3. M007（Repeated Same Amount）命中 12 次全部确认欺诈 → 高精度规则，建议提升优先级', links: [{ label: '规则分析', to: '/rules/analytics' }] },

  // Review context
  '这笔': { text: '🤖 AI 分析摘要：\n该交易风险评分 89，主要风险因素：\n• 同设备 1h 内使用 3 张不同卡（权重 35%）\n• AVS 不匹配（权重 25%）\n• 发卡国与商户国不一致（权重 20%）\n• IP 地址标记为 VPN（权重 12%）\n\n建议：REJECT — 置信度 92%\n历史相似案例中 87% 最终确认为欺诈。', links: [] },
  '分析': { text: '🤖 AI 分析摘要：\n该交易风险评分 89，主要风险因素：\n• 同设备 1h 内使用 3 张不同卡（权重 35%）\n• AVS 不匹配（权重 25%）\n• 发卡国与商户国不一致（权重 20%）\n• IP 地址标记为 VPN（权重 12%）\n\n建议：REJECT — 置信度 92%\n历史相似案例中 87% 最终确认为欺诈。', links: [] },
  '建议': { text: '基于当前队列分析：\n• 20 笔待审中，AI 建议 REJECT 8 笔（置信度 > 85%）\n• 建议 APPROVE 9 笔（置信度 > 90%）\n• 3 笔需要人工仔细判断（置信度 50-70%）\n\n如果信任 AI 高置信度判断，可批量处理 17 笔，节省约 85% 审核时间。', links: [] },
  '批量': { text: '基于当前队列分析：\n• 20 笔待审中，AI 建议 REJECT 8 笔（置信度 > 85%）\n• 建议 APPROVE 9 笔（置信度 > 90%）\n• 3 笔需要人工仔细判断（置信度 50-70%）\n\n如果信任 AI 高置信度判断，可批量处理 17 笔，节省约 85% 审核时间。', links: [] },

  // Model context
  '漂移': { text: 'PSI 分析：\n近 7 天 PSI 均值 0.14，趋势上升。\n主要漂移特征：\n• txn.amount 分布右移（大额交易占比增加 8%）\n• card.issuer_country 中 BR 占比从 3% 升至 7%\n• velocity 特征整体上移\n\n建议：触发模型重训练，或先将 v2.4_lgb 灰度上线 10% 观察。', links: [{ label: '部署 Shadow', to: '/models/comparison' }] },
  '对比': { text: 'v2.3 vs v2.4 对比：\n• AUC: 0.941 → 0.948 (+0.7%)\n• Precision: 0.89 → 0.91 (+2.2%)\n• Recall: 0.84 → 0.86 (+2.4%)\n• 预估 Decline Rate: 4.2% → 3.8% (-0.4%)\n\nv2.4 在所有指标上均优于 v2.3，建议灰度上线。风险点：训练数据中 BR 交易占比偏低，需关注该地区表现。', links: [{ label: 'Shadow 对比', to: '/models/comparison' }] },

  // Chargeback context
  '争议': { text: '当前 Chargeback 概况：\n• RECEIVED 待处理：3 笔\n• UNDER_REVIEW：2 笔\n• REPRESENTED 等待结果：2 笔\n• 本月胜诉率：60%\n\n⚠ CB006（JewelBox, $890）deadline 还剩 8 天，建议优先处理。\nCB009（TravelCo, $1,800）已进入 Arbitration，预计 5 月出结果。', links: [{ label: '处理 CB006', to: '/chargebacks/CB006' }] },
  '抗辩': { text: '针对 Visa 10.4（Fraud - Card Absent）的抗辩建议：\n\n必备证据：\n1. 3DS 验证记录（如有）\n2. AVS/CVV 匹配结果\n3. 发货证明 + 签收记录\n4. 客户历史交易记录\n5. IP/设备与持卡人关联证据\n\n胜诉概率评估：有 3DS 记录 → 75%，无 3DS → 30%。', links: [] },
}

// Fallback
const fallback = { text: '我可以帮你：\n• 查询风控数据（"今日交易概况"、"高风险商户"）\n• 分析异常（"REVIEW率为什么上升"）\n• 生成规则（"写一条拦截境外大额CNP的规则"）\n• 审核建议（"分析这笔交易"）\n• 模型诊断（"模型表现怎么样"、"PSI漂移分析"）\n\n试试问我吧 👆', links: [] }

export function getAIResponse(input) {
  const q = input.toLowerCase()
  for (const [key, resp] of Object.entries(responses)) {
    if (q.includes(key.toLowerCase())) return resp
  }
  return fallback
}

// Context-aware prompts per page
export const pagePrompts = {
  '/dashboard': ['今日交易概况', '有什么异常？', 'REVIEW率分析'],
  '/review': ['分析这笔交易', 'AI批量建议', '队列中有多少高风险？'],
  '/rules': ['帮我写一条规则', '规则优化建议', '阈值调整建议'],
  '/rules/analytics': ['哪些规则效果差？', '规则优化建议'],
  '/lists': ['最近加了哪些黑名单？', '高风险IP有哪些？'],
  '/transactions': ['最近有什么异常交易？', '拒绝最多的原因是什么？'],
  '/merchants': ['高风险商户有哪些？', '拒付率最高的商户？'],
  '/chargebacks': ['当前争议概况', '抗辩建议', '拒付率趋势'],
  '/chargebacks/monitoring': ['拒付率最高的商户？', '有哪些商户接近阈值？'],
  '/cases': ['有哪些P0案件？', '今日新增案件？'],
  '/models': ['模型表现怎么样？', 'PSI漂移分析', '要不要切换Shadow模型？'],
  '/models/monitoring': ['PSI漂移分析', '精确率下降了吗？'],
  '/models/comparison': ['两个模型对比分析', '建议灰度上线吗？'],
  '/reports': ['本周风控总结', '拒付率趋势分析'],
}
