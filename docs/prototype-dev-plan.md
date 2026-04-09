# SUNBAY 风控原型 — 开发执行计划

> AI 执行开发的任务分解和自检清单。逐条对照 frontend-prd.md 全部页面。

---

## 页面路由总表（PRD 全量，共 24 个页面）

```
/login                          登录页
/dashboard                      风控总览看板
/merchants/onboarding           入网审核列表
/merchants/onboarding/:id       入网审核详情
/merchants                      商户列表
/merchants/:id                  商户详情
/rules                          规则列表
/rules/edit/:id                 规则编辑器
/rules/analytics                规则效果分析
/lists                          黑白名单
/velocity                       Velocity 配置
/review                         人工审核工作台
/transactions                   交易列表（Transaction Ledger）
/transactions/:id               交易详情
/chargebacks                    Chargeback 列表
/chargebacks/:id                Chargeback 详情
/chargebacks/monitoring         拒付率监控
/cases                          案件列表
/cases/:id                      案件详情
/models                         模型列表
/models/monitoring              模型监控
/models/comparison              Shadow/灰度对比
/reports                        风控报表
/settings/audit                 审计日志
```

---

## 执行顺序

### Step 1: 项目重置 + 依赖

- [ ] 清理 sunbay-risk-ui/src 现有代码
- [ ] 安装：tailwindcss, recharts, react-router-dom
- [ ] Tailwind 配置（Inter + JetBrains Mono, 0px radius, 参考设计 token）
- [ ] React Router 配置 24 个路由

自检：`npm run dev` 空白页无报错

### Step 2: Mock 数据层（全量）

- [ ] `mock/rules.js` — 30 条规则（P8 + I10 + M7 + 建议5），字段：id/name/tenant/tenantId/priority/entryMode/condition/action.decision/action.suggestions/enabled/version/createdAt/updatedAt
- [ ] `mock/transactions.js` — 生成 200 条，字段：id/amount/currency/merchantId/merchantName/mcc/country/entryMode/decision/score/triggeredRules/suggestions/reasonCode/avsResult/cvvResult/ip/deviceFingerprint/cardBin/cardBrand/cardType/cardIssuerCountry/timestamp/degraded
- [ ] `mock/merchants.js` — 15 个，字段：id/name/isoId/mcc/riskScore/riskLevel/status/kycStatus/ofacCheck/matchTmfCheck/trialPeriod/trialEndDate/settlementCycle/reserveRate/singleTxnLimit/dailyLimit/monthlyLimit/chargebackRate/nextReviewDate/createdAt/reviewHistory[]
- [ ] `mock/reviewQueue.js` — 20 条 REVIEW 交易 + velocity 快照 + 关联分析数据
- [ ] `mock/lists.js` — 20 条黑白灰名单（IP/Card/Device/Email/BIN 维度，含 TTL）
- [ ] `mock/chargebacks.js` — 12 条全状态 + 时间线事件
- [ ] `mock/cases.js` — 8 条 P0-P3 + 调查时间线
- [ ] `mock/models.js` — 5 个模型版本（v1.0 已下线 / v2.3 线上 / v2.4 Shadow / v2.5 训练中 / v2.6 灰度10%），每个含：version/algorithm/trainTime/dataSize/auc/precision/recall/status；监控指标 30 天趋势（PSI/精确率/召回率/REVIEW率/预测分布偏移）；Shadow 对比数据（双模型评分分布直方图、精确率召回率对比）
- [ ] `mock/dashboard.js` — KPI + 7 天交易量趋势 + 30 天拒付率趋势 + Top Breached Rules + Highest Risk Entities
- [ ] `mock/reports.js` — 平台总览/ISO 报告/商户报告/模型监控报告的指标数据
- [ ] `mock/auditLog.js` — 30 条（RULE_CHANGE/LIST_CHANGE/MERCHANT_STATUS_CHANGE/MODEL_DEPLOY/LOGIN）
- [ ] `mock/users.js` — 8 个用户（Platform Admin×2, Analyst×1, ISO Admin×2, ISO Agent×2, Merchant Admin×1）

自检：每个 mock import 无报错，字段与 PRD 定义一致

### Step 3: 布局 Shell + 通用组件

- [ ] `AppShell.jsx` — 顶部导航（参考 dashboard_1 风格），React Router Outlet
- [ ] `TopNav.jsx` — 左 SUNBAY logo，中间页面 tab（Dashboard/Merchants/Rules/Lists/Review/Transactions/Chargebacks/Cases/Models/Reports/Settings），右侧按钮区
- [ ] `DataTable.jsx` — 通用高密度表格（无竖线、#EAEAEA 横线、11px 大写表头、hover #FAFAFA、mono 数字列、排序、分页）
- [ ] `KPICard.jsx` — 大写 label + 32px mono 数字 + 趋势箭头
- [ ] `StatusBadge.jsx` — APPROVE/REVIEW/DECLINE/BLOCK + 风险等级 LOW/MEDIUM/HIGH
- [ ] `RiskScore.jsx` — 方框分数 + 色阶（绿→黄→红）
- [ ] `FilterBar.jsx` — inline tag 筛选
- [ ] `Timeline.jsx` — 通用时间线组件（Chargeback/案件/商户评级变更复用）

自检：组件独立渲染无报错

### Step 4: 登录页

- [ ] `/login` — 全屏背景 + 居中登录卡片（用户名/密码/登录按钮）
- [ ] 登录成功跳转 `/dashboard`，登录失败显示错误提示
- [ ] 简单 mock 验证（任意用户名密码均可登录，存 localStorage）

自检：登录→跳转→刷新不丢状态

### Step 5: Dashboard

- [ ] 4 个 KPI 卡片（Total Transactions / Fraud Rate / Automated Blocks / Review Queue）
- [ ] 交易量趋势 Recharts 面积图（蓝线 + 10% opacity 填充）
- [ ] 底部双列：Top Breached Rules + Highest Risk Entities
- [ ] "● Live updating" 状态指示

自检：数据从 mock 读取，图表渲染正常

### Step 6: Review Workbench

- [ ] 30/70 左右分栏
- [ ] 左栏 Priority Queue（txn_id + 时间 + 金额 + 风险分 + 触发标签）
- [ ] 右栏详情（金额大字 + 风险分方框 + 触发规则标签 + Network & Device + Payment Method + Identity & Location）
- [ ] 底部固定操作栏 [R] Reject + [A] Approve
- [ ] 键盘事件 A/R/↑↓
- [ ] 操作后队列移除 + 自动选中下一条

自检：键盘操作流畅，队列切换正常

### Step 7: Rule Engine（列表 + 编辑器 + 效果分析）

- [ ] Rule List：左侧租户树 + 右侧表格，Platform 规则灰色只读
- [ ] Rule Editor：名称/状态/ACTION 下拉/Suggestions 多选/CONDITIONS 条件行（字段+运算符+值）/+ Add Condition/+ Add Group (OR)/Save Rule
- [ ] 沙箱测试：输入 JSON → 显示命中/未命中
- [ ] Rule Analytics（/rules/analytics）：每条规则命中次数趋势图 + 命中率排行表

自检：30 条规则按租户分组正确，编辑器增删条件正常，沙箱测试匹配逻辑正确

### Step 8: List Management + Velocity

- [ ] `/lists` — Tab（Blocklist/Allowlist/Greylist）+ 搜索 + 表格 + 添加弹窗 + 批量导入按钮
- [ ] `/velocity` — Velocity 计数器表格（名称/Key 模式/时间窗口/阈值输入框/租户层级）+ 新增/删除操作

自检：Tab 切换过滤正确，Velocity 阈值编辑保存正常

### Step 9: Transaction Ledger + Detail

- [ ] `/transactions` — 筛选标签栏 + 高密度表格（24px 行高）+ 点击行右侧 JSON 抽屉
- [ ] `/transactions/:id` — 三区布局（交易信息 + 决策详情含评分明细/命中规则/Velocity 快照/关联分析 + 后续状态含审核结果/Chargeback/案件链接）

自检：200 条渲染无卡顿，JSON 抽屉滑入正常

### Step 10: Merchant 页面（列表 + 详情 + 入网审核）

- [ ] `/merchants` — 表格（名称/ISO/风险等级/状态/拒付率/试运营天数/复审日期）+ 筛选
- [ ] `/merchants/:id` — 基本信息 + 风控参数 + 评级变更时间线 + 复审记录 + 关联 Chargeback
- [ ] `/merchants/onboarding` — 待审核列表（商户名/ISO/MCC/风险评分/KYC 状态/OFAC/MATCH）
- [ ] `/merchants/onboarding/:id` — 分区详情（基本信息 + KYC/KYB 结果 + 网站审核 + 评分卡明细 + 建议参数）+ 通过/拒绝/退回按钮

自检：15 个商户筛选正确，入网审核操作后状态更新

### Step 11: Chargeback（列表 + 详情 + 拒付率监控）

- [ ] `/chargebacks` — 表格 + 状态筛选 + Deadline 倒计时（<7 天标红）
- [ ] `/chargebacks/:id` — 基本信息 + 时间线 + 操作按钮（按状态显示不同操作）
- [ ] `/chargebacks/monitoring` — 商户拒付率排行表 + 拒付率趋势图（标注 0.9%/1.5% 阈值线）+ 预警列表

自检：时间线渲染正确，拒付率图表阈值线显示

### Step 12: Case + Audit

- [ ] `/cases` — 表格 + 优先级色标 P0 红/P1 橙/P2 黄/P3 灰
- [ ] `/cases/:id` — 案件信息 + 关联数据 + 调查时间线 + 操作按钮
- [ ] `/settings/audit` — 只读表格 + 筛选 + 展开行 JSON diff

自检：案件优先级颜色正确，审计日志不可编辑

### Step 13: 模型治理（列表 + 监控 + Shadow 对比）

- [ ] `/models` — 模型版本表格（版本/算法/训练时间/数据量/AUC/状态）+ 操作按钮（部署 Shadow/灰度切流/回滚）
- [ ] `/models/monitoring` — 4 个 KPI 卡片（当前版本/AUC/精确率/召回率）+ 4 个趋势图（PSI/预测偏移/精确率召回率/REVIEW 率），阈值线标注，超阈值顶部告警条
- [ ] `/models/comparison` — 双模型评分分布直方图叠加 + 精确率/召回率对比表 + 预估 DECLINE 率变化 + 灰度上线按钮（10%→50%→100%）

自检：5 个模型版本状态正确，监控图表 4 条趋势线渲染正常，Shadow 对比直方图叠加显示

### Step 14: 报表

- [ ] `/reports` — 报表类型选择（平台总览/ISO 报告/商户报告/模型监控）+ 时间范围选择 + 在线预览区（根据类型显示对应指标和图表）+ 导出按钮

自检：4 种报表切换内容正确

### Step 15: 页面间跳转联通 + 最终自检

- [ ] 交易详情 → 商户名跳转商户详情
- [ ] 交易详情 → Chargeback ID 跳转 Chargeback 详情
- [ ] Chargeback 详情 → 交易 ID 跳转交易详情
- [ ] 案件详情 → 关联交易/商户可点击跳转
- [ ] Dashboard 商户排行 → 商户名跳转商户详情
- [ ] Review Workbench 审核完成 → 队列计数更新
- [ ] 模型监控告警 → 可跳转模型列表

最终自检清单：
- [ ] 24 个页面路由全部可访问，无白屏
- [ ] 所有表格数据渲染正确，无 undefined/NaN
- [ ] 所有跳转链接指向正确页面
- [ ] Rule Editor 条件增删改 + 沙箱测试正常
- [ ] Review Workbench 键盘操作正常
- [ ] Transaction Ledger JSON 抽屉正常
- [ ] 模型监控 4 个趋势图 + 阈值线正常
- [ ] Shadow 对比直方图叠加正常
- [ ] 拒付率监控阈值线正常
- [ ] 30 条规则覆盖 V3 全部风控场景
- [ ] 5 个模型版本覆盖全状态（训练中/Shadow/灰度/线上/已下线）
- [ ] `npm run build` 无报错

---

### Step 16: 设备风控前端扩展（基于 device-risk-design.md）

> 完成日期: 2026-04-09 | 详细变更日志: device-risk-frontend-changelog.md

- [x] `mock/devices.js` — 设备类别/受理方式/字段映射/8台设备/30条规则/4个Velocity模板
- [x] `mock/transactions.js` — 每笔交易增加嵌套 device 对象（attestation/security/location）
- [x] `mock/rules.js` — fieldOptions 改为带分组/描述的对象数组（24个基础字段）
- [x] `mock/dashboard.js` — 新增 4 组设备趋势数据（鉴证/围栏/类别/规则触发）
- [x] Rule Editor — Device Category 选择器 + FieldPicker 自定义下拉（分组+说明）
- [x] Velocity Config — 4 个设备计数器模板 + Platform 只读保护
- [x] Review Workbench — 触发规则高亮卡片 + Device Context 面板
- [x] Transaction Ledger — 结构化 TxnInspector（规则+设备+折叠JSON）+ Link 跳转
- [x] Transaction Detail — 规则详情卡片 + 设备信息区块（含安全字段）+ 分数公式
- [x] Merchant Detail — 关联设备列表（按 merchant_id 过滤，无设备时隐藏）
- [x] Dashboard — Device Risk 独立区块（4 KPI + 4 趋势图 + MetricTooltip）
- [x] Reports — Device Risk Tab（KPI/饼图/鉴证趋势/围栏趋势+表格/规则表格）
- [x] StatusBadge — 新增 BLOCKED/SUSPENDED/ACTIVE/TRIAL/OBSERVATION/FROZEN/ALERT/WARNING/HIGH_RISK
- [x] MetricTooltip — 新增 4 个设备指标公式说明
- [x] 两轮系统性质量检查 + 修复（数据结构/UX/信息层级/交互逻辑）

自检：`npm run build` 通过，所有设备相关页面渲染正常，数据结构与设计方案一致
