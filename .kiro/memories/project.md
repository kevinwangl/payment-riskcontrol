# SUNBAY Payment Risk Control — 项目记忆

> 最后更新: 2026-04-09

## 项目概况

美国市场收单支付 SaaS 平台的多租户风控系统，覆盖事前准入、事中决策、事后监控。当前处于前端原型阶段（纯 Mock 数据，无后端）。

## 技术栈

- React 18 + Vite + React Router
- Tailwind CSS（Inter + JetBrains Mono，0px border-radius）
- Recharts（图表）
- 纯前端 Mock 数据，无 API 调用
- 部署: Vercel（vercel.json 已配置）

## 项目结构

```
payment-riskcontrol/
├── docs/                              # 设计文档
│   ├── system-design-v3.md            # 后端系统设计（当前版本）
│   ├── device-risk-design.md          # 设备风控扩展方案
│   ├── device-risk-frontend-changelog.md  # 设备风控前端变更日志
│   ├── frontend-prd.md                # 前端 PRD（24 页面，5 角色）
│   └── prototype-dev-plan.md          # 原型开发计划（Step 1-16）
├── sunbay-risk-ui/                    # 前端原型
│   ├── src/pages/                     # 24 个页面组件
│   ├── src/components/shared/         # 共享组件（9 个）
│   ├── src/mock/                      # Mock 数据（13 个文件）
│   ├── src/utils/format.js            # 格式化工具
│   └── src/App.jsx                    # 路由配置
```

## 页面路由（24 个）

```
/login, /dashboard, /review, /rules, /rules/edit/:id, /rules/analytics,
/lists, /velocity, /transactions, /transactions/:id,
/merchants, /merchants/:id, /merchants/onboarding, /merchants/onboarding/:id,
/chargebacks, /chargebacks/:id, /chargebacks/monitoring,
/cases, /cases/:id, /models, /models/monitoring, /models/comparison,
/reports, /settings/audit
```

## Mock 数据文件

| 文件 | 内容 |
|------|------|
| transactions.js | 200 笔交易（含 device 嵌套对象） |
| rules.js | 30 条交易风控规则 + fieldOptions（对象数组，含分组/描述） |
| devices.js | 8 台设备 + 30 条设备风控规则 + 4 个 Velocity 模板 + 类别/字段映射 |
| merchants.js | 15 个商户 + 3 个入网审核 |
| reviewQueue.js | 从 transactions 派生的 REVIEW 队列 |
| dashboard.js | KPI + 趋势数据（含 4 组设备趋势） |
| lists.js | 20 条黑白灰名单 |
| chargebacks.js | 12 条拒付记录 |
| cases.js | 8 个案件 |
| models.js | 5 个模型版本 |
| auditLog.js | 30 条审计日志 |
| aiResponses.js | AI 助手响应 |

## 共享组件

| 组件 | 说明 |
|------|------|
| StatusBadge | 状态标签（支持 20+ 状态：APPROVE/DECLINE/REVIEW/BLOCKED/SUSPENDED/HIGH_RISK 等） |
| RiskScore | 风险分数方框（色阶：绿→黄→红） |
| KPICard | 大字 KPI 卡片（label + 数字 + 趋势） |
| DataTable | 通用高密度表格 |
| MetricTooltip | 指标公式弹窗（38 个指标定义，含 4 个设备指标） |
| AIAssistant | AI 助手面板 |
| HeartbeatLine | 心跳线动画 |
| LightningBorder / LightningSeam | 闪电边框/接缝动画 |

## 设备风控扩展（2026-04-09 完成）

基于 device-risk-design.md 实现，核心变更：

- 设备分类模型: CERTIFIED_POS / DEDICATED_DEVICE / COTS_DEVICE
- 受理方式: TRADITIONAL / SOFTPOS / ECOMMERCE
- 风控输出: PASS / ALERT / WARNING / HIGH_RISK
- 30 条默认设备规则: DEV-POS(5) + DEV-DED(7) + DEV-COTS(10) + DEV-ALL(8)
- 交易 device 对象采用嵌套结构: attestation.status / security.is_rooted 等
- 鉴证状态枚举: VERIFIED / DEGRADED / FAILED / EXPIRED

### 已实现页面扩展

| 页面 | 扩展 |
|------|------|
| RuleEditor | Device Category 选择器 + FieldPicker（分组/说明/460px 宽） |
| VelocityConfig | 4 个设备计数器模板 + Platform 只读 |
| ReviewWorkbench | 触发规则高亮卡片 + Device Context 面板 |
| TransactionLedger | 结构化 TxnInspector（规则+设备+折叠JSON）+ toggle 关闭 |
| TransactionDetail | 规则详情卡片 + 设备信息（含 debug/emulator/hook 字段） |
| MerchantDetail | 关联设备列表（按 merchant_id 过滤） |
| Dashboard | Device Risk 区块（4 KPI + 4 趋势图） |
| Reports | Device Risk Tab（KPI/饼图/鉴证/围栏/规则表） |

### 未实现

- 商户地理围栏配置 UI（Merchant Detail 风控参数 tab）
- FieldPicker 搜索过滤
- Review Workbench Approve/Reject 确认对话框

## 设计规范

- 字体: Inter（正文）+ JetBrains Mono（数据/代码）
- 圆角: 0px（全局方形）
- 表头: 11px 大写灰色
- 正文: 13px
- 行高: 紧凑（24-32px）
- 颜色: primary=#1890FF, success=#52C41A, danger=#FF4D4F, warning=#FAAD14, muted=#888
- 分数公式统一文案: `Score = Σ(Rule Weight × Match) · 0-40 APPROVE · 41-70 REVIEW · 71+ DECLINE`

## 开发注意事项

- fieldOptions 是对象数组 `{key, label, group, desc}`，不是字符串数组
- deviceFieldsByCategory 也是对象数组 `{key, desc}`
- 交易的 device 对象用嵌套结构（attestation.status 不是 attestation_status）
- deviceRiskRules 在 devices.js 中，交易规则在 rules.js 中，需要合并查找: `[...rules, ...deviceRiskRules]`
- Platform 级 Velocity 规则阈值应为 readOnly
- StatusBadge 已支持设备/商户/风控输出的所有状态值
