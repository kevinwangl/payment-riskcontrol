# 设备风控前端原型 — 实现变更日志

> 基于: device-risk-design.md 第八章前端扩展方案
> 实现日期: 2026-04-09
> 状态: 原型已实现，构建通过

---

## 一、变更概览

在现有 24 页风控原型基础上，完成设备风控维度的前端扩展。不新增独立页面，设备信息嵌入现有页面展示。

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/mock/devices.js` | 设备 Mock 数据层（202 行） |

### 修改文件（12 个）

| 文件 | 修改内容 |
|------|---------|
| `src/mock/transactions.js` | 每笔交易增加嵌套 `device` 对象 |
| `src/mock/rules.js` | `fieldOptions` 从字符串数组改为带分组/描述的对象数组 |
| `src/mock/dashboard.js` | 新增 4 组设备趋势数据 |
| `src/pages/RuleEditor.jsx` | 设备类别选择器 + FieldPicker 组件 + 条件说明 |
| `src/pages/VelocityConfig.jsx` | 设备维度计数器模板 + Platform 只读保护 |
| `src/pages/ReviewWorkbench.jsx` | 设备上下文卡片 + 触发规则详情高亮 |
| `src/pages/TransactionLedger.jsx` | 结构化 TxnInspector 面板（规则+设备+折叠JSON） |
| `src/pages/TransactionDetail.jsx` | 设备信息区块 + 规则详情卡片 + 分数公式 |
| `src/pages/MerchantDetail.jsx` | 关联设备列表（按 merchant_id 过滤） |
| `src/pages/Dashboard.jsx` | 设备风控 KPI + 4 个趋势图表 |
| `src/pages/Reports.jsx` | Device Risk 报表 Tab（完整报表） |
| `src/components/shared/StatusBadge.jsx` | 新增 8 个状态样式 |
| `src/components/shared/MetricTooltip.jsx` | 新增 4 个设备指标公式说明 |

---

## 二、Mock 数据层 — devices.js

### 导出清单

| 导出 | 类型 | 说明 |
|------|------|------|
| `deviceCategories` | Array(3) | CERTIFIED_POS / DEDICATED_DEVICE / COTS_DEVICE |
| `acceptanceMethods` | Array(3) | TRADITIONAL / SOFTPOS / ECOMMERCE |
| `deviceFieldsByCategory` | Object | 按设备类别映射可用条件字段，每个字段含 key + desc |
| `mockDevices` | Array(8) | 8 台模拟设备（2 POS + 2 Dedicated + 4 COTS），含问题设备 |
| `deviceRiskRules` | Array(30) | 30 条默认设备风控规则（完整覆盖设计方案第七章） |
| `deviceVelocityTemplates` | Array(4) | 设备维度 Velocity 计数器模板 |

### 30 条设备风控规则分布

| 类别 | 规则 ID | 数量 |
|------|---------|------|
| CERTIFIED_POS | DEV-POS-001 ~ 005 | 5 |
| DEDICATED_DEVICE | DEV-DED-001 ~ 007 | 7 |
| COTS_DEVICE | DEV-COTS-001 ~ 010 | 10 |
| ALL（跨类别通用） | DEV-ALL-001 ~ 008 | 8 |

### 交易设备数据结构

每笔交易的 `device` 对象采用嵌套结构，与设计方案第四章一致：

```
device: {
  device_id, device_category, acceptance_method, manufacturer, model,
  location: { lat, lng, accuracy_meters, source },
  // CERTIFIED_POS:
  firmware_version, pts_cert_expiry, tamper_detected,
  // DEDICATED_DEVICE / COTS_DEVICE:
  attestation: { status, provider, verified_at },
  security: { is_rooted, tee_available, debug_mode, is_emulator,
              hook_framework_detected, is_personal_device },
  os, os_version, app_version
}
```

---

## 三、页面扩展详情

### 3.1 Rule Editor（P0）

- 新增 Device Category 选择器（ALL / CERTIFIED_POS / DEDICATED_DEVICE / COTS_DEVICE）
- 条件字段下拉框改为 FieldPicker 自定义组件：
  - 按分组展示（Transaction / Card / Verification / Merchant / Velocity / Link Analysis / Lists / Geo / Device）
  - 每个字段显示完整 DSL 表达式 + 使用场景说明
  - 选中后条件行下方显示字段描述
  - 宽度 460px，支持滚动浏览
- 设备字段按 `device_category` 动态过滤（与设计方案 5.3 一致）
- Sandbox Test JSON 支持函数式字段（geo_distance / velocity 等）生成 stub 值

### 3.2 Velocity Config（P0）

- 自动加载 4 个设备维度计数器模板：
  - Device Txn Count（5m/1h/24h）
  - Device Txn Amount（1h/24h）
  - Device Distinct Cards（1h/24h）
  - Device Location Jump（30m/1h）
- Platform 级规则阈值设为只读（灰色背景 + cursor-not-allowed）

### 3.3 Review Workbench（P0）

- 触发规则区块：浅红色高亮背景，每条规则显示 ID + 名称 + 决策标签 + DSL 条件
- 设备规则带蓝色 DEVICE 标签
- 分数计算公式提示
- Device Context 卡片：设备 ID / 类别 / 型号 / 鉴证状态 / TEE / Root / 位置

### 3.4 Transaction Ledger（P0→P1）

- 右侧面板从 Raw JSON 改为结构化 TxnInspector：
  - 交易 ID 可点击跳转 TransactionDetail（`<Link>`）
  - 触发规则详情（ID + 名称 + 决策 + 条件）
  - 设备摘要（类别 + 型号 + 鉴证 + Root + TEE + 位置）
  - 可折叠 Raw JSON（默认收起）
- 点击同一行交易可关闭面板（toggle 交互）

### 3.5 Transaction Detail（P1）

- Risk Decision 区块：移除与头部重复的 Score/Decision，保留 Reason Code
- 触发规则展开为详情卡片（ID + 名称 + 决策标签 + DSL 条件 + 元信息）
- Device Information 区块：按设备类别条件展示字段
  - 通用：device_id / category / acceptance / model / location
  - POS：firmware / pts_cert_expiry
  - DEDICATED/COTS：attestation / tee / root / debug_mode / is_emulator / hook_framework

### 3.6 Merchant Detail（P1）

- Associated Devices 表格：按 merchant_id 精确过滤
- 无设备时隐藏整个区块
- 显示 Device ID / Category / Model / Status（StatusBadge）

### 3.7 Dashboard（P2）

- 新增 "Device Risk" 独立区块（border-t 分隔 + h2 标题）
- 4 个 KPI 数字卡片（从趋势数据动态计算）+ MetricTooltip 公式说明：
  - Attestation Fail Rate
  - Geofence Trigger Rate
  - COTS Device Share
  - POS Device Share
- 4 个趋势图表（2×2 网格）：
  - Attestation Fail Rate 30d 折线图（红线 + 绿色 1% 目标线）
  - Geofence Trigger Rate 30d 折线图（蓝线 + 黄色 2% 阈值线）
  - Device Category Volume 7d 堆叠面积图（COTS/Dedicated/POS）
  - Device Rule Triggers 7d 堆叠面积图（HIGH_RISK/WARNING/ALERT）

### 3.8 Reports — Device Risk Tab（P2）

- KPI 汇总：Total Devices / Active / Blocked / Suspended
- 双饼图：Device Category Distribution + Risk Level Distribution
- Attestation Status Trend 30d 堆叠柱状图
- Geofence Breaches 30d 折线图 + Top Breach Merchants 表格
- Top Triggered Device Rules 表格

---

## 四、通用组件扩展

### StatusBadge 新增状态

| 状态 | 样式 | 来源 |
|------|------|------|
| BLOCKED | 红色 | 设备状态 |
| SUSPENDED | 黄色 | 设备状态 |
| ACTIVE | 绿色 | 设备状态 |
| TRIAL | 蓝色 | 商户状态 |
| OBSERVATION | 黄色 | 商户状态 |
| FROZEN | 红色 | 商户状态 |
| ALERT | 蓝色 | 风控输出 |
| WARNING | 黄色 | 风控输出 |
| HIGH_RISK | 红底白字 | 风控输出 |

### MetricTooltip 新增指标

| 指标名 | 公式 |
|--------|------|
| Attestation Fail Rate | (FAILED + EXPIRED) / Total Device Txns × 100% |
| Geofence Trigger Rate | geo_distance > radius Txns / Total Txns × 100% |
| COTS Device Share | COTS_DEVICE Txns / Total Txns × 100% |
| POS Device Share | CERTIFIED_POS Txns / Total Txns × 100% |

---

## 五、质量检查记录

### 第一轮检查（数据层）

| 问题 | 修复 |
|------|------|
| transactions.js 设备数据用扁平结构 | 改为嵌套 attestation/security 对象 |
| MerchantDetail 用 Math.random() 随机显示设备 | 改为按 merchant_id 精确过滤 |
| RuleEditor testResult 颜色判断不匹配 | 改为 startsWith('HIT') |
| StatusBadge 缺少 BLOCKED/SUSPENDED 样式 | 补充 |
| Dashboard deviceStats 硬编码 | 改为从趋势数据动态计算 |
| deviceFingerprint 与 device.device_id 不关联 | 统一使用 dev.device_id |

### 第二轮检查（UX/逻辑）

| 问题 | 修复 |
|------|------|
| TransactionDetail Score+Decision 重复显示 | 移除 Risk Decision 区块中的重复行 |
| allRules 在 map 循环内重复创建 | 提升到模块级别 |
| Ledger 无法导航到 Detail 页 | TxnInspector ID 改为 Link |
| devices.js 鉴证状态 PASSED 与规范不一致 | 统一为 VERIFIED |
| Dashboard 设备区块缺少视觉分隔 | 加 border-t + h2 标题 |
| TransactionDetail 缺少安全字段 | 补充 debug_mode/is_emulator/hook_framework |
| IP/fingerprint 孤立在页面底部 | 移除（device_id 已在设备区块） |
| 分数公式提示文案不一致 | 三处统一 |
| VelocityConfig Platform 阈值可编辑 | 加 readOnly + 禁用样式 |
| StatusBadge 缺少 TRIAL/OBSERVATION/FROZEN | 补充 |

---

## 六、与设计方案对照

| 设计方案 8.1 扩展清单 | 优先级 | 实现状态 |
|----------------------|--------|---------|
| Rule Editor — device_category + 条件动态过滤 | P0 | ✅ 已实现 |
| Velocity Config — device 维度计数器模板 | P0 | ✅ 已实现 |
| Review Workbench — 设备信息卡片 | P0 | ✅ 已实现 |
| Transaction Detail — 设备信息区块 | P1 | ✅ 已实现 |
| Merchant Detail — Devices tab | P1 | ✅ 已实现 |
| Dashboard — 设备风控 KPI | P2 | ✅ 已实现（含趋势图表） |
| Merchant Detail — 地理围栏配置 | P2 | ⬜ 未实现（需商户风控参数 tab） |

### Mock 数据扩展对照

| 设计方案 8.3 | 实现状态 |
|-------------|---------|
| transactions.js 增加 device 对象 | ✅ 已实现 |
| rules.js 新增 30 条设备风控规则 | ✅ 已实现（在 devices.js） |
| merchants.js 增加关联设备和围栏配置 | ⬜ 围栏配置未实现 |

---

## 七、已知限制（原型阶段）

1. 所有数据为 Mock，Save/Delete 操作仅前端状态变更，刷新重置
2. 设备风控规则（deviceRiskRules）与交易规则（rules）分别存储在不同文件
3. Review Workbench 的 Approve/Reject 无确认对话框，无 undo
4. FieldPicker 无搜索过滤功能
5. Sandbox Test 对函数式字段（velocity/geo_distance）始终返回匹配
6. 商户地理围栏配置 UI 未实现
