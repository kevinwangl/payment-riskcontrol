# 收单支付 SaaS 平台 — 风控系统整体方案

> 版本: v4.1
> 日期: 2026-04-17
> 状态: 方案设计阶段

---

## 目录

- 第一部分：业务全景
  - 一、项目概述
  - 二、事中风控 — 实时决策
  - 三、事后风控 — 监控与数据回流
  - 四、阶段联动机制
- 第二部分：系统核心能力
  - 五、规则引擎
  - 六、Velocity 引擎
  - 七、黑白名单引擎
  - 八、评分模型
  - 九、关联分析引擎
  - 十、设备风控引擎（Device Risk）
  - 十一、智能风控闭环（自动训练）
  - 十二、通用能力（降级、幂等、配置广播、日志投递、AI 助手）
- 第三部分：技术实现
  - 十三、系统架构
  - 十四、技术栈
  - 十五、数据库设计
  - 十六、性能设计
- 第四部分：交付规划
  - 十七、资源预估
  - 十八、实施计划
- 附录：能力 × 阶段映射矩阵

---

# 第一部分：业务全景

## 一、项目概述

### 1.1 业务背景

面向美国本地市场，为 ISO（Independent Sales Organization）/ ISV（Independent Software Vendor）提供收单支付 SaaS 平台的交易风控能力。平台通过 Processor 对接卡组织（Visa / Mastercard / Amex / Discover），支持 Card Present（CP）和 Card Not Present（CNP）两种交易模式。

> 商户入网审核（KYC/KYB）、合规筛查（OFAC/MATCH）、案件管理由收单平台其他子系统负责，风控系统聚焦交易风控决策和风险监控。

### 1.2 核心目标

- 实时交易风控决策，P99 延迟 < 50ms
- 分层级规则体系，ISO/ISV 可自助配置规则
- Chargeback 数据导入与争议流程跟踪，驱动拒付率监控和模型标签回流
- 人机协同标注 + 模型自动训练的智能风控闭环
- 满足 PCI DSS 审计要求

### 1.3 业务规模

- 日交易量：10 万 ～ 50 万笔
- 层级结构：Platform → ISO/ISV → Merchant
- 卡组织对接：通过 Processor（非直连）

### 1.4 风控系统边界

```
┌─────────────────────────────────────────────────────────────────┐
│                     收单支付 SaaS 平台                           │
│                                                                 │
│  ┌──────────────┐   ┌──────────────────────────────────────┐   │
│  │ 商户管理系统  │   │         风控系统（本方案）              │   │
│  │              │   │                                      │   │
│  │ · KYC/KYB    │──→│ · 事中实时决策                        │   │
│  │ · 入网审核    │   │ · 事后监控 & 数据回流                 │   │
│  │ · 合规筛查    │   │ · Chargeback 管理（导入+争议跟踪）    │   │
│  │ · 案件管理    │   │                                      │   │
│  └──────────────┘   └──────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐                           │
│  │ 结算系统      │   │ Processor    │                           │
│  │ · 资金结算    │   │ · 卡组织对接  │                           │
│  │ · 保证金管理  │   │ · CB 数据推送 │                           │
│  └──────────────┘   └──────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

风控系统与外部系统的交互：
- **商户管理系统 → 风控系统**：通过 REST API 同步已入网商户信息和风控参数
- **Processor → 风控系统**：推送 Chargeback 数据（REST API 或批量文件导入）
- **风控系统 → 商户管理系统**：输出风控告警和建议（如拒付率超标、建议冻结商户）
- **风控系统 → 结算系统**：输出风控建议（如建议延迟结算、冻结结算）

---

## 二、事中风控 — 实时决策

> 目标：在交易授权链路中实时完成风控决策，P99 < 50ms。
> 调用的系统能力：规则引擎、Velocity 引擎、黑白名单引擎、评分模型、关联分析引擎

### 2.1 决策流程

```
交易请求进入
    │
    ▼
前置校验
    ├── 商户状态检查（是否冻结/关停）
    ├── 限额检查（单笔/日/月是否超限）
    └── 卡 BIN 校验（是否在允许范围）
    │
    ▼ (通过)
风控引擎决策 (<50ms)
    │
    │  ┌─────────────────────────────────────────────────────────┐
    │  │ 第一期: 规则引擎统一执行（无并行分支）                      │
    │  │                                                         │
    │  │   Step 1: 执行 ADD_SCORE 评分规则，累加 risk_score        │
    │  │           (复用规则引擎，详见第八章评分模型)                 │
    │  │   Step 2: risk_score 回填 TransactionContext              │
    │  │   Step 3: 执行决策规则 (APPROVE/REVIEW/DECLINE)                   │
    │  │           条件内部按需调用子引擎：                        │
    │  │           ├── velocity()  → Velocity 引擎 (第六章)        │
    │  │           ├── blacklist()/whitelist()/greylist()          │
    │  │           │   → 黑白名单引擎 (第七章, Bloom+Redis)        │
    │  │           └── link_count()                                │
    │  │               → 关联分析引擎 (第九章, Redis HyperLogLog)  │
    │  └─────────────────────────────────────────────────────────┘
    │
    │  ┌─────────────────────────────────────────────────────────┐
    │  │ 第二期: 规则引擎 + ML 模型并行执行                         │
    │  │                                                         │
    │  │   ├─ 并行分支 A: 规则引擎编排执行 (同上，去掉 ADD_SCORE)   │
    │  │   └─ 并行分支 B: SageMaker Endpoint 模型打分 (~15ms)     │
    │  │         打分结果回填 TransactionContext.risk_score         │
    │  │         ADD_SCORE 规则自然退役                             │
    │  └─────────────────────────────────────────────────────────┘
    │
    ▼
汇总决策: 合并规则命中结果 + risk_score → 返回 decision + suggestions (见 2.2 节)
    │
    ├── APPROVE → 返回授权通过 + suggestions (如 REQUIRE_3DS)
    ├── REVIEW  → 进入人工审核队列 + 原因码
    └── DECLINE → 返回拒绝 + 原因码
    │
    ▼ (异步)
决策日志 → Amazon Data Firehose → 自动攒批 → Redshift
```

### 2.2 决策结果结构

风控系统返回给支付业务侧的完整决策结果：

```json
{
  "request_id": "req_20260330_abc123",
  "decision": "APPROVE",
  "risk_score": 55,
  "triggered_rules": ["R1001", "R2003"],
  "suggestions": ["REQUIRE_3DS"],
  "reason_code": "HIGH_RISK_CNP",
  "degraded": false
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `request_id` | String | 请求唯一标识，用于幂等 |
| `decision` | Enum | `APPROVE` / `REVIEW` / `DECLINE` |
| `risk_score` | Int | 风险评分（0-100） |
| `triggered_rules` | Array | 命中的规则 ID 列表 |
| `suggestions` | Array | 智能建议，支付业务侧读取执行 |
| `reason_code` | String | 拒绝/审核原因码 |
| `degraded` | Boolean | 是否处于降级模式 |

`suggestions` 来源：

风控建议与主决策规则直接绑定，在规则命中时，Action 属性中直接携带 suggestions：

典型规则与建议绑定示例：

```json
{
  "rule_id": "R3001",
  "name": "CNP高风险评分建议3DS",
  "conditions": [
    {"type": "ENTRY_MODE", "operator": "==", "value": "CNP"},
    {"type": "RISK_SCORE", "operator": ">", "value": 60}
  ],
  "logic": "AND",
  "action": {
    "decision": "APPROVE",
    "suggestions": ["REQUIRE_3DS"]
  },
  "reason_code": "HIGH_RISK_CNP"
}
```

常见建议绑定场景：

| 规则条件 | decision | suggestions | 说明 |
|---------|----------|-------------|------|
| `ENTRY_MODE == CNP AND RISK_SCORE > 60` | APPROVE | `REQUIRE_3DS` | CNP 高风险建议 3DS |
| `ENTRY_MODE == CNP AND RISK_SCORE > 50 AND RISK_SCORE <= 70` | REVIEW | `REQUIRE_3DS` | 中风险人工审核 |
| `ENTRY_MODE == CP AND AMOUNT > 5000` | APPROVE | `REQUIRE_PIN` | CP 大额建议 PIN |
| `MERCHANT.require_3ds == true AND ENTRY_MODE == CNP` | APPROVE | `REQUIRE_3DS` | 商户级强制配置 |

当前支持的建议类型：

| Suggestion | 含义 | 支付侧处理 |
|--------|------|-----------|
| `REQUIRE_3DS` | 建议触发 3D Secure | CNP 交易插入 3DS 验证流程 |
| `REQUIRE_PIN` | 建议触发 PIN 验证 | CP 交易要求输入 PIN |
| `REQUIRE_OTP` | 建议触发 OTP 验证 | 发送短信验证码 |

### 2.3 规则分层级逻辑

```
执行链: L1 Platform Rules (强制基础规则)
            → L2 ISO/ISV Rules (租户自定义规则)
            → L3 Merchant Rules (商户个性化规则)

分层级决策逻辑:
  - L1 DECLINE → 直接拒绝, 短路终止 (平台强制风控)
  - L1 REVIEW/APPROVE → 继续执行 L2
  - L2 DECLINE → 直接拒绝, 短路终止 (租户风控)
  - L2 REVIEW → 标记待审核, 继续执行 L3 (可能升级为 DECLINE)
  - L2 APPROVE → 继续执行 L3
  - L3 决策为最终结果 (商户个性化调整)

优先级: L1 > L2 > L3 (高层级可强制覆盖低层级决策)
```

### 2.4 试卡攻击防护

试卡攻击特征：短时间内大量小额（$0.01-$1.00）授权请求，用于验证盗取的卡号是否有效。

检测规则：
- 同商户 5 分钟内授权请求 > 20 笔 → 触发拦截
- 同商户小额交易（< $2）占比 > 50%（1 小时窗口）→ 告警
- 同 IP/设备 10 分钟内使用 > 5 张不同卡 → 拦截
- 授权失败率 > 30%（1 小时窗口）→ 输出建议通知商户管理系统临时冻结商户

### 2.5 交易上下文校验

| MCC 行业 | 合理单笔范围 | 合理时段 | 异常信号 |
|----------|-------------|---------|---------|
| 5411 超市 | $5 - $500 | 6:00-24:00 | 凌晨 3 点 $3,000 |
| 5812 餐饮 | $10 - $300 | 10:00-23:00 | $5,000 单笔 |
| 5999 零售 | $10 - $2,000 | 8:00-22:00 | 连续相同金额 |
| 7011 酒店 | $50 - $5,000 | 全天 | 同卡同日多次 |

超出合理范围的交易自动加分（提升风险评分），不直接拒绝但增加审核概率。

### 2.6 CP vs CNP 差异化策略

| 维度 | Card Present | Card Not Present |
|------|-------------|-----------------|
| 核心风险 | 伪卡、丢失/被盗卡 | 盗卡号、账户盗用 |
| 关键信号 | EMV 芯片结果、PIN 验证、终端位置 | AVS、CVV、3DS、IP 地理位置、设备指纹 |
| Velocity 重点 | 同终端短时间多笔、跨地域刷卡 | 同卡多商户、同 IP 多卡 |
| 3DS 触发 | 不适用 | 风险评分 > 阈值时触发 |

### 2.7 风控数据维度

| 维度 | 示例 |
|------|------|
| 交易 | 金额、币种、MCC、交易类型（CP/CNP） |
| 卡片 | BIN、发卡国、卡类型、AVS/CVV 结果 |
| 持卡人 | 地址、IP 地理位置、设备指纹 |
| 商户 | 历史拒付率、注册时长、行业风险等级 |
| 行为 | 同卡/同IP/同设备的交易频率和金额累计 |

---

## 三、事后风控 — 监控与数据回流

> 目标：交易完成后持续监控、发现异常、沉淀数据驱动模型进化。
> 调用的系统能力：规则引擎、Velocity 引擎、黑白名单引擎、关联分析引擎、智能闭环

### 3.1 交易监控 & 异常检测

- 商户维度：日/周/月交易量突增、客单价异常波动、退款率异常、非营业时间交易占比突增
- 卡片维度：同卡跨商户异常消费模式、授权成功率骤降（试卡攻击信号）
- 网络维度：关联商户群体异常（团伙欺诈）

### 3.2 退款异常监控

退款不同于 Chargeback，是商户主动发起的。异常退款是洗钱和友好欺诈的重要信号。

| 监控指标 | 告警阈值 | 风险含义 |
|---------|---------|---------|
| 退款率 | > 10%（月度） | 商品/服务质量问题或友好欺诈 |
| 退款金额占比 | > 15%（月度） | 可能存在洗钱行为 |
| 全额退款占比 | > 80%（在所有退款中） | 异常模式，可能是虚假交易 |
| 退款时间间隔 | 交易后 < 1 小时退款 | 高度可疑，可能是测试或洗钱 |
| 同卡退款频率 | 同卡 30 天内退款 > 3 次 | 友好欺诈或串通退款 |

### 3.3 Chargeback 管理

> 风控系统接收 Processor 推送的 Chargeback 数据，提供争议流程跟踪和拒付率监控。

**数据来源：** Processor 推送或批量文件导入（CSV）。

**争议状态流转：**

```
RECEIVED → UNDER_REVIEW → REPRESENTED → WON / LOST
                                    └→ ARBITRATION → WON / LOST
```

| 状态 | 含义 | 可执行操作 |
|------|------|-----------|
| RECEIVED | 新收到的 Chargeback 通知 | 分类：标记"可抗辩"或"不可抗辩" |
| UNDER_REVIEW | 正在审查证据和交易记录 | 收集证据、关联原始交易 |
| REPRESENTED | 已提交 Representment 抗辩 | 等待卡组织裁决 |
| WON | 抗辩成功，资金归还 | 结案 |
| LOST | 抗辩失败，确认扣款 | 结案，标签回流模型 |
| ARBITRATION | 进入卡组织仲裁阶段 | 等待最终裁决 |

**数据字段：**

| 字段 | 说明 |
|------|------|
| txn_id | 原始交易 ID |
| merchant_id | 商户 ID |
| iso_id | ISO ID |
| card_brand | 卡组织（Visa/MC/Amex/Discover） |
| reason_code | 拒付原因码（卡组织定义） |
| amount | 拒付金额 |
| currency | 币种 |
| status | 当前状态（RECEIVED/UNDER_REVIEW/REPRESENTED/WON/LOST/ARBITRATION） |
| deadline | 抗辩截止日期（< 7 天标红预警） |
| received_at | 拒付接收时间 |
| outcome | 最终结果（WON/LOST/PENDING） |

**前端页面：**
- `/chargebacks` — Chargeback 列表：状态筛选、Deadline 倒计时（< 7 天标红）、操作按钮
- `/chargebacks/:id` — Chargeback 详情：基本信息 + 时间线（每步操作记录）+ 按状态显示操作按钮
- `/chargebacks/monitoring` — 拒付率监控：商户排行表 + 趋势图（0.9%/1.5% 阈值线）+ 预警列表

数据用途：
- **拒付率计算**：实时计算商户 chargeback ratio（Visa VDMP 阈值 0.9%，MC ECP 阈值 1.5%），超标时输出告警
- **模型标签回流**：CB 结果是最可靠的欺诈标签，回流到模型训练数据集
- **规则效果分析**：关联 CB 与原始交易的风控决策，评估规则有效性
- **商户风控联动**：高拒付商户自动收紧风控规则（降低限额、标记强制 3DS 等）

### 3.4 商户生命周期风控联动

> 商户入网/关停由商户管理系统负责，风控系统只关注运营期间的风险信号。

风险评级动态调整规则：

| 触发条件 | 风控系统动作 |
|---------|-------------|
| 连续 3 个月拒付率 < 0.3% | 升级为低风险，提升限额 |
| 拒付率 0.5% - 0.9% | 降级为中风险，启用增强监控 |
| 拒付率 > 0.9%（Visa VDMP 阈值） | 降级为高风险，标记强制 3DS，通知商户管理系统 |
| 拒付率 > 1.5%（MC ECP 阈值） | 通知商户管理系统和结算系统冻结结算 |
| 检测到试卡攻击 | 通知商户管理系统临时冻结，关联 IP/设备加入灰名单 |

### 3.5 批量交易回溯分析

当发现新的欺诈模式时，回溯历史交易识别同类风险：

```
新欺诈模式发现（人工/模型）
    │
    ▼
定义回溯规则（特征组合）
    │
    ▼
Redshift 全量扫描历史交易（按特征匹配）
    │
    ▼
输出可疑交易列表 → 通知商户管理系统处置
```

### 3.6 风控报表

| 报表 | 受众 | 频率 | 核心指标 |
|------|------|------|---------|
| 平台风控总览 | 平台风控团队 | 实时仪表盘 | 全局拒绝率、REVIEW 率、拒付率、模型准确率 |
| ISO 风控报告 | ISO 管理员 | 日报/周报 | 旗下商户拒付率排名、风险事件汇总、限额使用率 |
| 商户风控报告 | ISO/ISV/Merchant | 日报 | 交易通过率、拒绝原因分布、拒付详情 |
| 模型监控报告 | 数据团队 | 周报 | 模型 AUC、精确率/召回率、特征漂移、预测分布 |
| 设备风控报告 | 平台风控团队 | 日报/周报 | 设备类别分布、Attestation 失败率、Geofence 触发率、设备规则命中排行 |

### 3.7 数据回流

- Chargeback 结果 → 标签数据集 → 触发模型自动训练（详见第十一章）
- 规则效果分析 → 规则优化建议

---

## 四、阶段联动机制

### 4.1 联动关系

```
商户管理系统                事中风控                    事后风控
     │                       │                          │
     │  商户信息+限额 ──────→│  前置校验+规则决策         │
     │                       │  决策日志 ──────────────→│  交易监控分析
     │  ←── 风控告警 ────────│                          │
     │  ←── 建议冻结/降级 ──│←── Chargeback 数据 ──────│
     │                       │←── 拒付率超标告警 ────────│
     │                       │  ←── 模型更新 ───────────│  模型训练完成
     │                       │  ←── 规则优化 ───────────│  规则效果分析
     │                       │  ←── 黑名单更新 ─────────│  异常检测结论
```

### 4.2 自动化处置规则

| 触发事件 | 风控系统自动动作 |
|---------|-----------------|
| 商户拒付率 > 0.9% | 标记强制 3DS，降低单笔限额至 $1,000，通知商户管理系统 |
| 商户拒付率 > 1.5% | 通知商户管理系统和结算系统冻结结算 |
| 检测到试卡攻击 | 通知商户管理系统临时冻结 30 分钟，关联 IP/设备加入灰名单 |
| 同一 BIN 段欺诈率 > 5% | 该 BIN 段加入全局灰名单，强制拦截 |
| 模型精确率下降 > 5% | 自动触发模型重训练，告警数据团队 |

---

# 第二部分：系统核心能力

## 风控系统核心处理流程

> 每笔交易从进入风控系统到输出最终决策的完整处理链路。

### 核心处理流程图

```
交易请求 (TransactionRequest)
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ ① 交易上下文构建 (TransactionContext)                              │
│    ├── 基础字段映射: amount, entry_mode, mcc, card_hash...        │
│    ├── 商户信息查询: merchant_status, age_days, limits...         │
│    ├── 卡片信息解析: bin, issuer_country, card_type...            │
│    └── 运行时字段: ip, device_fingerprint, geo_location...        │
└──────────────────────┬──────────────────────────────────────────┘
                       │ TransactionContext
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ ② 规则筛选与编排                                                  │
│    ├── 按层级链筛选: L1(Platform) → L2(ISO) → L3(Merchant) 规则   │
│    ├── 按交易模式过滤: CP/CNP/ALL                                 │
│    ├── 分层级排序: L1(Platform) → L2(ISO) → L3(Merchant)         │
│    └── 白名单前置检查: 命中则直接 APPROVE                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │ 排序后规则列表
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ ③ 规则引擎逐层执行                                                │
│                                                                 │
│   // 多规则击中处理逻辑                                            │
│   finalDecision = APPROVE                                       │
│   triggeredRules = []                                           │
│   allSuggestions = []                                           │
│   reasonCode = null                                             │
│                                                                 │
│   FOR each Layer (L1 → L2 → L3):                               │
│     FOR each Rule in Layer:                                     │
│       ┌─────────────────────────────────────────────────────┐   │
│       │ ③.1 条件组合执行                                     │   │
│       │     ├── 原子条件: AMOUNT > 5000                     │   │
│       │     ├── 原子条件: COUNTRY != 'US'                   │   │
│       │     ├── 逻辑组合: AND / OR                          │   │
│       │     └── 外部函数: velocity() / blacklist() / ...    │   │
│       └─────────────────┬───────────────────────────────────┘   │
│                         │                                       │
│       ┌─────────────────▼───────────────────────────────────┐   │
│       │ ③.2 外部引擎调度 (按需调用)                          │   │
│       │     ├── Velocity引擎: Redis滑动窗口计数              │   │
│       │     ├── 名单引擎: Bloom+Redis 黑白灰名单检查         │   │
│       │     ├── 关联分析: Redis HyperLogLog 关联计数         │   │
│       │     ├── 地理引擎: 距离计算、不可能旅行检测            │   │
│       │     └── 设备引擎: 设备指纹、鉴证状态检查              │   │
│       └─────────────────┬───────────────────────────────────┘   │
│                         │ 条件结果                               │
│                         ▼                                       │
│       ┌─────────────────────────────────────────────────────┐   │
│       │ ③.3 条件组合求值与决策升级                            │   │
│       │                                                     │   │
│       │     // 条件组合逻辑                                  │   │
│       │     IF rule.logic == AND:                           │   │
│       │       ruleHit = conditions.stream().allMatch(...)   │   │
│       │     ELSE IF rule.logic == OR:                       │   │
│       │       ruleHit = conditions.stream().anyMatch(...)   │   │
│       │                                                     │   │
│       │     IF ruleHit == true (规则命中):                   │   │
│       │       triggeredRules.add(rule.ruleId)               │   │
│       │       allSuggestions.addAll(rule.suggestions)       │   │
│       │                                                     │   │
│       │       // 决策升级逻辑 (严格优先级)                    │   │
│       │       IF rule.action.decision == DECLINE:           │   │
│       │         finalDecision = DECLINE                     │   │
│       │         reasonCode = rule.reasonCode                │   │
│       │         RETURN 短路终止 (L1/L2层强制)                │   │
│       │                                                     │   │
│       │       IF rule.action.decision == REVIEW:            │   │
│       │         IF finalDecision != DECLINE:                │   │
│       │           finalDecision = REVIEW                    │   │
│       │           IF reasonCode == null:                    │   │
│       │             reasonCode = rule.reasonCode            │   │
│       │         // 继续执行后续规则 (可能升级为DECLINE)        │   │
│       │                                                     │   │
│       │       // APPROVE不改变finalDecision，继续累积建议     │   │
│       │                                                     │   │
│       │     ELSE: 规则未命中，继续下一条规则                  │   │
│       └─────────────────────────────────────────────────────┘   │
│                                                                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │ 汇总结果
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ ④ 决策汇总与输出                                                  │
│    ├── 合并触发规则列表: triggeredRules[]                         │
│    ├── 合并智能建议: suggestions[] (REQUIRE_3DS, REQUIRE_PIN...)  │
│    ├── 最终决策: APPROVE / REVIEW / DECLINE                      │
│    ├── 原因码: reason_code (首个DECLINE/REVIEW规则)               │
│    └── 风险评分: risk_score (模型输出或规则累加)                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ RiskDecisionResponse
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ ⑤ 异步日志投递                                                    │
│    ├── 决策日志: EventBridge → Firehose → Redshift              │
│    ├── 审计日志: 规则命中详情、执行耗时                            │
│    └── 监控指标: 决策分布、规则命中率、引擎耗时                    │
└─────────────────────────────────────────────────────────────────┘
```

### 关键性能指标

| 阶段 | 目标耗时 | 降级策略 |
|------|---------|---------|
| 上下文构建 | < 5ms | 缓存商户信息 |
| 规则筛选 | < 2ms | 本地缓存 + 索引 |
| 条件执行 | < 8ms | 原子条件 + 短路求值 |
| 外部引擎 | < 30ms | Redis集群 + 降级逻辑 |
| **总计** | **< 45ms (P99)** | **简化规则集兜底** |

### 并发处理能力

- **无状态设计**: 每个Pod可独立处理请求
- **本地缓存**: 规则条件、商户信息、配置热加载
- **连接池**: Redis连接复用，避免连接开销
- **批量优化**: Velocity查询支持pipeline批量执行

### TransactionContext 构建与字段映射

每笔交易进入风控系统时，首先构建完整的交易上下文作为规则执行的数据源：

```java
class TransactionContext {
    // === 交易基础维度 ===
    BigDecimal amount;           // 交易金额
    String entryMode;            // CP / CNP
    String currency;             // USD / EUR
    int hour;                    // 交易时间(0-23)
    String terminalId;           // CP终端ID
    
    // === 卡片维度 ===
    String cardHash;             // 脱敏卡号hash
    String bin;                  // 卡BIN(前6位)
    String issuerCountry;        // 发卡国
    String cardType;             // CREDIT/DEBIT/PREPAID
    String cardBrand;            // VISA/MC/AMEX/DISCOVER
    
    // === 验证结果维度 ===
    String avsResult;            // Y/N/U (地址验证)
    String cvvResult;            // M/N/U (CVV验证)
    
    // === 商户维度 ===
    String merchantId;
    String mcc;                  // 商户类别码
    String merchantStatus;       // ACTIVE/FROZEN/SUSPENDED
    int merchantAgeDays;         // 商户注册天数
    BigDecimal singleTxnLimit;   // 单笔限额
    
    // === 地理/设备维度 ===
    String ip;
    String deviceFingerprint;
    String email;
    Double locationLat;
    Double locationLng;
    
    // === 运行时计算维度 ===
    int riskScore;               // 模型评分(0-100)
    Map<String, Object> velocityCache;  // Velocity查询缓存
}
```

### 规则HIT判定核心机制

规则命中判定基于**原子条件组合**，避免复杂的AST解析，提供简洁高效的执行方式：

#### 1. 原子条件库设计

```java
// 核心条件接口
interface Condition {
    boolean evaluate(TransactionContext ctx);
}

// 20+原子条件覆盖90%风控场景
enum ConditionType {
    // 数值比较
    AMOUNT, RISK_SCORE, MERCHANT_AGE, SINGLE_LIMIT,
    // 字符串匹配  
    COUNTRY, MCC, CARD_TYPE, CARD_BRAND, MERCHANT_STATUS,
    // 集合操作
    COUNTRY_IN, MCC_IN, CARD_TYPE_IN,
    // 时间相关
    TIME_RANGE, HOUR_RANGE,
    // 外部引擎
    VELOCITY, VELOCITY_AMOUNT, BLACKLIST, WHITELIST, GREYLIST,
    LINK_COUNT, GEO_DISTANCE,
    // 验证结果
    AVS_RESULT, CVV_RESULT,
    // 设备相关（第十章）
    DEVICE_STRING,      // 字符串字段: attestation.status, category, status
    DEVICE_BOOLEAN,     // 布尔字段: is_rooted, tee_available, tamper_detected
    DEVICE_DATE,        // 日期比较: pts_cert_expiry < now()
    DEVICE_VERSION,     // 版本比较: firmware_version < min_version
    DEVICE_HOURS_SINCE, // 时间差: hours_since(attestation.verified_at) > 24
    DEVICE_NULL         // 空值检测: location == null
}

// 条件配置结构
class ConditionConfig {
    ConditionType type;
    String field;           // txn.amount, card.country
    String operator;        // >, <, ==, !=, IN, NOT_IN
    Object value;           // 5000, "US", ["VISA","MC"]
    Map<String, Object> params; // velocity专用: {dimension, window}
}
```

#### 2. 原子条件实现示例

```java
class AmountCondition implements Condition {
    private String operator;
    private BigDecimal threshold;
    
    public boolean evaluate(TransactionContext ctx) {
        switch (operator) {
            case ">": return ctx.amount.compareTo(threshold) > 0;
            case ">=": return ctx.amount.compareTo(threshold) >= 0;
            case "<": return ctx.amount.compareTo(threshold) < 0;
            case "<=": return ctx.amount.compareTo(threshold) <= 0;
            case "==": return ctx.amount.compareTo(threshold) == 0;
            default: throw new UnsupportedOperatorException(operator);
        }
    }
}

class VelocityCondition implements Condition {
    private String dimension;   // "card_hash"
    private String window;      // "1h"
    private String operator;    // ">"
    private int threshold;      // 5
    
    public boolean evaluate(TransactionContext ctx) {
        String key = resolveField(dimension, ctx); // ctx.cardHash
        int count = velocityEngine.count(key, window);
        return compareInt(count, operator, threshold);
    }
}

class BlacklistCondition implements Condition {
    private String field; // "card_hash", "ip", "email"
    
    public boolean evaluate(TransactionContext ctx) {
        String value = resolveField(field, ctx);
        return listEngine.checkBlacklist(value);
    }
}

class CountryInCondition implements Condition {
    private List<String> countries;
    
    public boolean evaluate(TransactionContext ctx) {
        return countries.contains(ctx.issuerCountry);
    }
}
```

#### 3. 规则配置简化

```json
{
    "rule_id": "R1001",
    "name": "高额CNP交易拦截",
    "layer": "L1_PLATFORM",
    "priority": 10,
    "entry_mode": "CNP",
    "conditions": [
        {
            "type": "AMOUNT",
            "field": "txn.amount",
            "operator": ">",
            "value": 5000
        },
        {
            "type": "COUNTRY",
            "field": "card.issuer_country", 
            "operator": "!=",
            "value": "US"
        }
    ],
    "logic": "AND",
    "action": {
        "decision": "DECLINE",
        "suggestions": []
    },
    "reason_code": "HIGH_AMOUNT_FOREIGN_CNP"
}
```

#### 4. 规则执行引擎

```java
class RuleEngine {
    private Map<ConditionType, ConditionFactory> conditionFactories;
    
    public boolean evaluateRule(Rule rule, TransactionContext ctx) {
        // 构建条件实例
        List<Condition> conditions = rule.conditions.stream()
            .map(config -> conditionFactories.get(config.type).create(config))
            .collect(toList());
        
        // 执行条件组合逻辑
        if (rule.logic == LogicType.AND) {
            return conditions.stream().allMatch(cond -> cond.evaluate(ctx));
        } else if (rule.logic == LogicType.OR) {
            return conditions.stream().anyMatch(cond -> cond.evaluate(ctx));
        }
        
        return false;
    }
}

// 条件工厂
interface ConditionFactory {
    Condition create(ConditionConfig config);
}

class AmountConditionFactory implements ConditionFactory {
    public Condition create(ConditionConfig config) {
        return new AmountCondition(config.operator, (BigDecimal) config.value);
    }
}
```

#### 5. 复杂规则支持

对于需要嵌套逻辑的复杂规则，支持条件组：

```json
{
    "rule_id": "R2001", 
    "name": "复合风险规则",
    "condition_groups": [
        {
            "conditions": [
                {"type": "AMOUNT", "operator": ">", "value": 1000},
                {"type": "COUNTRY", "operator": "!=", "value": "US"}
            ],
            "logic": "AND"
        },
        {
            "conditions": [
                {"type": "VELOCITY", "params": {"dimension": "card_hash", "window": "1h"}, "operator": ">", "value": 5},
                {"type": "BLACKLIST", "field": "ip"}
            ],
            "logic": "OR"
        }
    ],
    "group_logic": "OR"  // 组间逻辑
}
```

#### 6. 典型规则HIT判定示例

**规则1**: 高额外卡交易
```
条件1: txn.amount > 5000 → ctx.amount = 6000 → true
条件2: card.issuer_country != 'US' → ctx.issuerCountry = "CA" → true
逻辑: AND → true AND true → HIT
```

**规则2**: Velocity + 黑名单
```
条件1: velocity(card_hash, 1h) > 5 → Redis查询 → count = 3 → false
条件2: blacklist(ip) → Bloom+Redis → true
逻辑: OR → false OR true → HIT
```

**规则3**: MCC白名单
```
条件1: merchant.mcc IN ['5411','5812'] → ctx.mcc = "5411" → true
条件2: risk_score > 60 → ctx.riskScore = 75 → true  
逻辑: AND → true AND true → HIT
```

### 方案优势

| 维度 | AST方案 | 条件组合方案 |
|------|---------|-------------|
| **开发周期** | 2个月 | 2周 |
| **执行性能** | 中等(AST解析) | 高(直接调用) |
| **内存占用** | 高(AST缓存) | 低(轻量对象) |
| **学习成本** | 高(DSL语法) | 低(JSON配置) |
| **扩展性** | 极高 | 中等(原子条件库) |
| **维护成本** | 高 | 低 |

---

## 五、规则引擎

> 贯穿事中（交易风控规则）和事后（监控告警规则、规则效果分析）的核心能力。

### 5.1 条件组合配置

支持 ISO/ISV 自助配置规则，基于**原子条件组合**的简化方案，避免复杂DSL解析。

规则配置示例：

```json
{
  "rule_id": "R1001",
  "name": "高额CNP交易拦截",
  "layer": "L2_ISO",
  "tenant_id": "ISO_2001",
  "priority": 10,
  "entry_mode": "CNP",
  "conditions": [
    {
      "type": "AMOUNT",
      "field": "txn.amount",
      "operator": ">",
      "value": 5000
    },
    {
      "type": "COUNTRY",
      "field": "card.issuer_country",
      "operator": "!=", 
      "value": "US"
    }
  ],
  "logic": "AND",
  "action": {
    "decision": "DECLINE",
    "suggestions": []
  },
  "reason_code": "HIGH_AMOUNT_FOREIGN_CNP"
}
```

支持的条件类型：

| 类型 | 示例配置 |
|------|----------|
| 数值比较 | `{"type": "AMOUNT", "operator": ">", "value": 1000}` |
| 字符串匹配 | `{"type": "COUNTRY", "operator": "!=", "value": "US"}` |
| 集合操作 | `{"type": "MCC_IN", "value": ["5411","5812"]}` |
| Velocity | `{"type": "VELOCITY", "params": {"dimension": "card_hash", "window": "1h"}, "operator": ">", "value": 5}` |
| 名单检查 | `{"type": "BLACKLIST", "field": "ip"}` |
| 关联分析 | `{"type": "LINK_COUNT", "params": {"from": "device_id", "to": "card_hash", "window": "1h"}, "operator": ">", "value": 3}` |

### 5.2 规则生命周期

```
创建/编辑 → 语法校验 → 沙箱测试 → 审批 → 发布 → 生效 → 监控 → 优化/下线
                                    │
                              版本快照（支持回滚）
```

### 5.3 安全约束

- 表达式沙箱执行，禁止任意代码
- 平台级规则 ISO/ISV 不可修改或覆盖
- 规则变更需审计日志，支持版本回滚
- 规则编译后缓存，变更时热加载

## 六、Velocity 引擎

> 主要服务事中（实时频率/金额检测）和事后（异常检测的基础数据）。

### 6.1 计数器设计

基于 ElastiCache Redis 滑动窗口实现：

| 计数器 Key 模式 | 含义 |
|----------------|------|
| `vel:{card_hash}:cnt:{window}` | 同卡交易次数 |
| `vel:{card_hash}:amt:{window}` | 同卡交易累计金额 |
| `vel:{ip}:cnt:{window}` | 同 IP 交易次数 |
| `vel:{device_fp}:cnt:{window}` | 同设备交易次数 |
| `vel:{merchant}:{card_hash}:cnt:{window}` | 同商户同卡次数 |

### 6.2 时间窗口

支持 `5m` / `1h` / `24h` / `7d`，可配置。每个计数器 Key 设置对应 TTL 自动过期。

### 6.3 在规则引擎中的调用

通过条件组合配置调用：`{"type": "VELOCITY", "params": {"dimension": "card_hash", "window": "1h"}, "operator": ">", "value": 5}`，规则引擎执行时实时查询 Redis。

---

## 七、黑白名单引擎

> 贯穿事中（实时匹配）和事后（异常检测结论加入黑名单）。

### 7.1 名单维度与类型

- 维度：卡号 hash / BIN 范围 / IP（支持 CIDR）/ 设备指纹 / 邮箱 / 手机号
- 类型：
  - `BLACKLIST`：直接拒绝
  - `WHITELIST`：跳过规则检查
  - `GREYLIST`：加分（提升风险评分），增加拦截概率
- 租户隔离：平台级（全局）+ ISO 级 + Merchant 级
- 支持过期时间（临时封禁场景）

### 7.2 性能优化

- Redis 缓存全量名单，查询延迟 < 1ms
- Bloom Filter 做一级过滤，减少 Redis 穿透
- 名单变更时 config_versions.LISTS version++，各 Pod 轮询发现后刷新缓存

---

## 八、评分模型

> 主要服务事中（实时打分），数据来源依赖事后（标签回流）。

### 8.1 演进路径

```
第一期 (MVP)          第二期
规则加权评分     →   XGBoost / LightGBM 模型
人工配置权重     →   历史数据训练
100% 可解释     →   特征重要性可解释
无需训练数据     →   需要 3-6 个月数据
```

### 8.2 第一期：规则加权评分

> 第一期不单独实现评分引擎，直接复用规则引擎（第五章）。通过新增 `ADD_SCORE` action 类型，每条评分规则命中时累加分数，最终汇总为 risk_score。

评分规则配置示例：

```json
{
  "rule_id": "S001",
  "name": "高额交易加分",
  "tenant_type": "PLATFORM",
  "condition": { "expr": "txn.amount > 3000" },
  "action": { "decision": "ADD_SCORE", "score_delta": 20, "suggestions": [] },
  "reason_code": "HIGH_AMOUNT"
}
```

执行流程：

```
Step 1: 执行所有 ADD_SCORE 规则，累加 risk_score
    risk_score = 0
    IF txn.amount > 3000           THEN risk_score += 20
    IF card.issuer_country != 'US' THEN risk_score += 15
    IF avs_result == 'N'          THEN risk_score += 25
    IF cvv_result == 'N'          THEN risk_score += 30
    IF velocity(card, 1h) > 3     THEN risk_score += 20
    IF txn.entry_mode == 'CNP'    THEN risk_score += 10
    IF merchant.age_days < 90     THEN risk_score += 15

Step 2: risk_score 回填 TransactionContext.riskScore

Step 3: 执行决策类规则 (APPROVE/REVIEW/DECLINE)
    后续规则可引用 risk_score，如: risk_score > 70 → DECLINE

阈值: 0-49 APPROVE / 50-70 REVIEW / 71+ DECLINE
```

优势：无需两套执行路径，评分规则和决策规则共享同一套条件组合执行框架、缓存、多租户编排能力。第二期切换为 ML 模型后，`ADD_SCORE` 规则自然退役，risk_score 改由 SageMaker Endpoint 提供。

### 8.3 第二期：ML 模型

- 算法：XGBoost / LightGBM
- 特征：交易金额、时间、频率、地理距离、AVS/CVV 结果、商户行业、历史拒付率等
- 标签：该笔交易最终是否产生了 chargeback / fraud
- 输出：0-1 之间的欺诈概率
- 训练管道：SageMaker Pipeline（详见第十一章）

### 8.4 模型监控

| 指标 | 告警阈值 | 含义 |
|------|---------|------|
| 特征分布漂移 (PSI) | > 0.2 | 输入数据分布变化，模型可能失效 |
| 预测分布偏移 | 平均分偏移 > 15% | 打分整体偏高或偏低 |
| 精确率 | 下降 > 5% | 误杀增多 |
| 召回率 | 下降 > 5% | 漏放增多 |

---

## 九、关联分析引擎

> 主要服务事中（实时关联检测）和事后（团伙欺诈发现）。

### 9.1 实时关联维度

| 关联维度 | 检测逻辑 | 风险信号 |
|---------|---------|---------|
| 同设备多卡 | 同 device_fingerprint 1h 内使用 > 3 张不同卡 | 盗卡批量消费 |
| 同卡多商户 | 同 card_hash 1h 内在 > 5 个不同商户交易 | 盗卡扫货 |
| 同 IP 多卡 | 同 IP 1h 内使用 > 10 张不同卡 | 欺诈工厂 |

### 9.2 实现方式

- 实时关联：Redis 维护关联计数器（如 `link:{device_fp}:cards:{window}` 用 HyperLogLog 计数）
- 规则引擎调用：`link_count('device', 'card', '1h') > 3`
- 离线关联（事后）：Redshift 中通过 SQL 关联查询，发现跨商户的可疑关联模式

---

## 十、设备风控引擎（Device Risk）

> 针对 Card Present 场景下的受理终端进行设备级风险评估。覆盖 Certified POS、Dedicated Device（SoftPOS 专用设备）、COTS Device（消费者手机 Tap-to-Phone）三类设备。

### 10.1 设备分类与风险差异

| 设备类别 | 典型设备 | 受理方式 | 核心风险 |
|---------|---------|---------|---------|
| CERTIFIED_POS | Ingenico APOS A8, PAX A920 | 芯片/刷卡/NFC | PTS 证书过期、固件漏洞、物理篡改 |
| DEDICATED_DEVICE | Sunmi V2s, Galaxy Tab Active | SoftPOS | 设备完整性、Root/越狱、TEE 不可用 |
| COTS_DEVICE | iPhone 15 Pro, Galaxy S25 | SoftPOS (Tap-to-Phone) | 个人设备、Root/越狱、Hook 框架、模拟器 |

风险等级递增：CERTIFIED_POS < DEDICATED_DEVICE < COTS_DEVICE

### 10.2 设备风控数据维度

交易请求中携带的设备上下文字段，按设备类别差异化采集：

| 字段 | POS | Dedicated | COTS | 说明 |
|------|-----|-----------|------|------|
| device_id | ✓ | ✓ | ✓ | 设备唯一标识 |
| device_category | ✓ | ✓ | ✓ | 设备分类 |
| manufacturer / model | ✓ | ✓ | ✓ | 厂商型号 |
| location (lat/lng) | ✓ | ✓ | ✓ | GPS/WiFi/基站定位 |
| firmware_version | ✓ | — | — | POS 固件版本 |
| pts_cert_expiry | ✓ | — | — | PCI PTS 证书到期日 |
| tamper_detected | ✓ | — | — | 硬件防篡改触发 |
| serial_number | ✓ | — | — | 序列号（白名单校验） |
| attestation.status | — | ✓ | ✓ | 设备完整性证明：VERIFIED / FAILED / EXPIRED |
| attestation.provider | — | ✓ | ✓ | Play Integrity / Device Check |
| security.is_rooted | — | ✓ | ✓ | Root/越狱检测 |
| security.tee_available | — | ✓ | ✓ | TEE 可用性（SoftPOS 密钥存储必需） |
| security.debug_mode | — | ✓ | ✓ | 调试模式检测 |
| security.is_emulator | — | ✓ | ✓ | 模拟器检测 |
| security.hook_framework | — | ✓ | ✓ | Xposed/Frida 等 Hook 框架检测 |

### 10.3 设备风控规则

设备风控规则复用规则引擎（第五章）的原子条件组合执行框架，通过 `device.*` 字段路径访问设备上下文。

按设备类别分组的核心规则（条件列为简写，实际存储为条件组合 JSON）：

**Certified POS：**

| 规则 | 条件 | 风险等级 | 说明 |
|------|------|---------|------|
| PTS 证书过期 | `DEVICE_DATE < now()` · field: pts_cert_expiry | HIGH_RISK | 不再满足安全标准 |
| 物理篡改触发 | `DEVICE_BOOLEAN == true` · field: tamper_detected | HIGH_RISK | 可能被安装窃取器 |
| 固件版本过低 | `DEVICE_VERSION < min_version` · field: firmware_version | WARNING | 存在已知漏洞 |
| 未知序列号 | `WHITELIST(serial_number)` · 取反 | HIGH_RISK | 非注册设备 |

条件组合 JSON 示例（PTS 证书过期）：

```json
{
  "conditions": [
    {"type": "DEVICE_DATE", "field": "device.pts_cert_expiry", "operator": "<", "value": "now()"}
  ],
  "logic": "AND"
}
```

**COTS / Dedicated Device：**

| 规则 | 条件 | 风险等级 | 说明 |
|------|------|---------|------|
| 完整性证明失败 | `DEVICE_STRING == 'FAILED'` · field: attestation.status | HIGH_RISK | 设备可能被篡改 |
| Root/越狱 | `DEVICE_BOOLEAN == true` · field: is_rooted | HIGH_RISK | 安全控制可被绕过 |
| TEE 不可用 | `DEVICE_BOOLEAN == false` · field: tee_available | HIGH_RISK (COTS) / WARNING (Dedicated) | SoftPOS 密钥存储依赖 TEE |
| 模拟器检测 | `DEVICE_BOOLEAN == true` · field: is_emulator | HIGH_RISK | 虚拟设备欺诈 |
| Hook 框架 | `DEVICE_BOOLEAN == true` · field: hook_framework | HIGH_RISK | 运行时篡改 |
| 调试模式 | `DEVICE_BOOLEAN == true` · field: debug_mode | WARNING | 生产环境不应开启 |
| 证明过期 | `DEVICE_HOURS_SINCE > 24` · field: attestation.verified_at | WARNING | 需要刷新证明 |

**通用规则（所有设备类别）：**

| 规则 | 条件 | 风险等级 | 说明 |
|------|------|---------|------|
| 设备已封禁 | `DEVICE_STRING == 'BLOCKED'` · field: status | HIGH_RISK | 直接拒绝 |
| 不可能旅行 | `GEO_DISTANCE > 500` · params: {from: prev_location, minutes: 30} | HIGH_RISK | 30 分钟内移动 500km+ |
| 设备交易频率 | `VELOCITY > 50` · params: {dimension: device_id, window: 1h} | HIGH_RISK | 异常高频 |
| 设备多卡 | `LINK_COUNT > 10` · params: {from: device_id, to: card, window: 1h} | HIGH_RISK | 同设备大量不同卡 |
| 定位缺失 | `DEVICE_NULL == true` · field: location | WARNING | 无法做地理围栏校验 |

### 10.4 设备风控与规则引擎集成

设备风控规则作为规则引擎的一个子集，在 TransactionContext 中扩展 `device` 命名空间：

```java
class TransactionContext {
    // ... 原有字段 ...

    // === 设备维度 ===
    String deviceId;
    String deviceCategory;       // CERTIFIED_POS / DEDICATED_DEVICE / COTS_DEVICE
    String deviceStatus;         // ACTIVE / SUSPENDED / BLOCKED
    String manufacturer;
    String model;
    // POS 专有
    String firmwareVersion;
    String ptsCertExpiry;
    Boolean tamperDetected;
    String serialNumber;
    // COTS/Dedicated 专有
    String attestationStatus;    // VERIFIED / FAILED / EXPIRED
    String attestationProvider;
    Boolean isRooted;
    Boolean teeAvailable;
    Boolean debugMode;
    Boolean isEmulator;
    Boolean hookFrameworkDetected;
    // 定位
    Double locationLat;
    Double locationLng;
    Integer locationAccuracy;
}
```

条件字段映射扩展：

| 条件字段路径 | Context 属性 | 条件类型 | 适用设备 |
|-------------|-------------|---------|---------|
| `device.category` | `deviceCategory` | DEVICE_STRING | ALL |
| `device.status` | `deviceStatus` | DEVICE_STRING | ALL |
| `device.firmware_version` | `firmwareVersion` | DEVICE_VERSION | POS |
| `device.pts_cert_expiry` | `ptsCertExpiry` | DEVICE_DATE | POS |
| `device.tamper_detected` | `tamperDetected` | DEVICE_BOOLEAN | POS |
| `device.serial_number` | `serialNumber` | WHITELIST | POS |
| `device.attestation.status` | `attestationStatus` | DEVICE_STRING | COTS / Dedicated |
| `device.security.is_rooted` | `isRooted` | DEVICE_BOOLEAN | COTS / Dedicated |
| `device.security.tee_available` | `teeAvailable` | DEVICE_BOOLEAN | COTS / Dedicated |
| `device.security.debug_mode` | `debugMode` | DEVICE_BOOLEAN | COTS / Dedicated |
| `device.security.is_emulator` | `isEmulator` | DEVICE_BOOLEAN | COTS / Dedicated |
| `device.security.hook_framework` | `hookFrameworkDetected` | DEVICE_BOOLEAN | COTS / Dedicated |
| `device.location.lat` | `locationLat` | GEO_DISTANCE | ALL |
| `device.location.lng` | `locationLng` | GEO_DISTANCE | ALL |

### 10.5 设备监控指标

| 指标 | 计算方式 | 告警阈值 |
|------|---------|---------|
| Attestation 失败率 | 失败次数 / 总验证次数（30 天滚动） | > 2% |
| Geofence 触发率 | 地理围栏违规次数 / 总交易次数（30 天滚动） | > 2% |
| COTS 设备占比 | COTS 交易量 / CP 总交易量 | 监控趋势，无固定阈值 |
| 设备规则命中趋势 | 按 HIGH_RISK / WARNING 分类的每日命中数 | 突增 > 50% |

### 10.6 设备风控前端集成

> 原型已实现。设备风控信息嵌入现有页面展示，不新增独立页面。

**Dashboard — 设备风控区块：**
- 4 个设备 KPI 卡片（Attestation 失败率、Geofence 触发率、COTS 设备占比、设备规则命中数）
- 4 个趋势图（鉴证趋势、围栏趋势、设备类别分布、规则触发趋势）

**Rule Editor — 设备字段支持：**
- Device Category 选择器（ALL / CERTIFIED_POS / DEDICATED_DEVICE / COTS_DEVICE）
- 条件字段下拉按分组展示（Transaction / Card / Verification / Merchant / Velocity / Link Analysis / Lists / Geo / Device）
- 设备字段按 `device_category` 动态过滤

**Velocity Config — 设备维度计数器：**
- 4 个设备维度计数器模板：Device Txn Count、Device Txn Amount、Device Distinct Cards、Device Location Jump
- Platform 级计数器只读保护

**Review Workbench — 设备上下文：**
- 触发规则高亮卡片 + Device Context 面板（设备类别、鉴证状态、安全检测结果）

**Transaction Detail — 设备信息区块：**
- 设备基本信息 + 安全字段（attestation/security）+ 规则详情卡片 + 分数公式

**Merchant Detail — 关联设备列表：**
- 按 merchant_id 过滤关联设备，无设备时隐藏

**Reports — Device Risk Tab：**
- 设备 KPI 汇总 + 设备类别饼图 + 鉴证趋势 + 围栏趋势表格 + 规则命中排行表

---

## 十一、智能风控闭环（自动训练）

> 连接事中（决策）和事后（标注、训练），形成风控系统的自我进化能力。

### 11.1 闭环流程

```
交易 → 风控引擎决策 → APPROVE / REVIEW / DECLINE
              │
              ▼
        特征+决策结果
        写入特征仓库
              │
              ▼
        标注数据集 (Feature Store)  ←── Chargeback 数据导入回填
                    │
          ┌─────────▼──────────┐
          │   模型自动训练管道   │  ← 定期/数据量触发
          └─────────┬──────────┘
                    │
          ┌─────────▼──────────┐
          │  模型评估 & Shadow  │  ← 新旧模型对比 3-7 天
          └─────────┬──────────┘
                    │
              通过评估 → 灰度上线 (10%→50%→100%)
                    │
              风控引擎热加载新模型
```

### 11.2 标签来源

| 来源 | 时效 | 可靠度 |
|------|------|--------|
| Chargeback 数据导入 | 30-180 天 | 最高（实际结果） |
| 规则自动标注 | 实时 | 中（辅助补充） |

### 11.3 自动训练管道（SageMaker）

触发条件（满足任一）：
- 新增标注数据 > 5,000 条
- 距上次训练 > 7 天
- 模型监控指标下降（精确率/召回率偏移）

流程：
1. 数据准备：从 Redshift 导出到 S3，正负样本平衡
2. 模型训练：SageMaker Pipeline，XGBoost / LightGBM
3. 离线评估：AUC-ROC、精确率@固定召回率、KS 统计量
4. Shadow 模式：新模型并行打分不参与决策，对比 3-7 天
5. 灰度上线：通过评估后 10% → 50% → 100% 流量切换

### 11.4 模型热更新

```
模型训练完成 → config_versions.MODEL version++
    │
    ▼
各 Pod 轮询发现版本变化
    │
    ▼
从 S3 / SageMaker Registry 拉取新版本
    │
    ▼
加载到内存，健康检查 → 原子切换
    │
    └── 回滚能力: 一键切回上一版本
```

---

## 十二、通用能力（降级、幂等、配置广播、日志投递、AI 助手）

### 12.1 降级策略

```
风控引擎状态检测
    │
    ├── 正常 → 完整风控决策流程
    │
    ├── 部分降级（如 Redis 不可用）
    │     → 跳过 Velocity 检查
    │     → 仅执行规则引擎 + 黑白名单（从 Aurora 直查）
    │     → 决策结果标记 "DEGRADED"
    │
    ├── 严重降级（规则引擎超时）
    │     → 执行简化规则集（硬编码的核心规则）
    │     → 仅检查：黑名单 + 单笔限额 + 商户状态
    │     → 超过 $1,000 的 CNP 交易一律拒绝
    │
    └── 完全不可用
          → 所有交易拒绝（保护优先）
          → 立即触发 P0 告警
```

降级期间所有交易标记降级标识，事后批量回溯分析。

### 12.2 幂等性设计

- 每笔交易请求携带唯一 `request_id`
- Redis 记录 `idempotent:{request_id}` → 决策结果，TTL 24h
- 重复请求直接返回缓存的决策结果，不重复执行规则和更新 Velocity 计数器

### 12.3 配置变更广播（轮询 + 版本号）

> 替代 EventBridge + SQS + Lambda 事件总线方案，用最简单的轮询机制实现配置同步。

版本号表：

```sql
CREATE TABLE config_versions (
    config_type VARCHAR(20) PRIMARY KEY,  -- RULES / LISTS / MODEL
    version     INT NOT NULL DEFAULT 0,
    updated_at  DATETIME(3)
);
```

工作机制：

```
每个 Pod 每 5-10 秒轮询 Aurora:
  SELECT config_type, version FROM config_versions

本地缓存记录当前版本号:
  rules_version = 42
  lists_version = 18
  model_version = 3

如果远端版本 > 本地版本 → 重新加载该类配置
如果相等 → 跳过
```

变更触发：
- 规则新增/编辑/删除 → `UPDATE config_versions SET version = version + 1 WHERE config_type = 'RULES'`
- 名单变更 → LISTS version++
- 模型部署 → MODEL version++

设计优势：
- 零额外基础设施依赖（只用 Aurora，已有）
- 实现极简（一个定时任务 + 一张表）
- 5-10 秒配置生效延迟，对规则变更场景完全可接受
- 无消息丢失问题（轮询天然可靠）

### 12.4 决策日志投递（Firehose 直投）

> 决策日志是高吞吐写入场景，使用 Amazon Data Firehose 直接投递到 Redshift，不经过事件总线。

```
风控决策完成
    │
    ▼ (异步，不阻塞响应)
决策服务直接调用 Firehose PutRecord API
    │
    ▼
Amazon Data Firehose
    ├── 自动攒批（60秒或1MB）
    ├── 自动转换为 Parquet 格式
    └── 写入 Redshift risk_decision_log 表
```

---

### 12.5 AI 风控助手

> 原型已实现。嵌入前端操作台的上下文感知 AI 助手，辅助风控运营决策。

**交互方式：**
- 右侧滑出面板（420px 宽），快捷键 `⌘K` 唤起 / `Esc` 关闭
- 打字机效果逐字输出，数据引用（金额、百分比、规则 ID、模型版本）高亮显示
- 回复中可包含页面跳转链接（如"查看商户"→ `/merchants/M_1012`）

**上下文感知：**

AI 助手根据当前页面路由自动切换上下文和推荐提问：

| 页面 | 推荐提问示例 | 能力 |
|------|-------------|------|
| Dashboard | "今日交易概况"、"有什么异常？" | 汇总 KPI、检测异常指标 |
| Rules / Rule Editor | "帮我写一条规则"、"规则优化建议"、"阈值调整建议" | 规则生成、模板推荐、效果预估 |
| Transactions | "这笔交易为什么被拒？"、"分析风险因素" | 单笔交易风险归因分析 |
| Models | "模型表现怎么样？"、"PSI 漂移分析" | 模型健康诊断、版本对比 |
| Chargebacks | "当前争议概况"、"抗辩建议" | CB 统计汇总、抗辩策略建议 |
| Merchants | "高风险商户有哪些？"、"拒付率最高的商户？" | 商户风险排查 |

**核心能力：**
- 风控数据查询：交易概况、拒绝率分析、高风险商户识别
- 规则辅助：根据历史数据生成规则建议（条件 + 决策 + 预估命中率/误杀率）、推荐常用模板、阈值优化建议
- 交易分析：单笔交易风险因素归因（各维度权重占比）、相似案例匹配
- 模型诊断：PSI 漂移特征分析、版本对比、灰度上线建议
- 异常检测：主动发现拒绝率突增、商户异常、模型指标偏移

**技术实现（第二期）：**
- 后端：LLM API（如 Amazon Bedrock）+ RAG（检索增强生成），知识库包含规则配置、历史决策日志、模型指标
- 前端：当前原型使用关键词匹配 mock 响应，后续替换为实时 API 调用 + 流式输出

---

# 第三部分：技术实现

## 十三、系统架构

### 13.1 整体架构

```
                        ┌─────────────────┐
                        │   API Gateway   │  ← 平台层 WAF 已前置
                        │   (Kong / ALB)  │
                        └────────┬────────┘
                                 │
   ┌──────────────┬──────────────┼──────────────┬──────────────────┐
   │              │              │              │                  │
┌──▼───────┐ ┌────▼──────┐ ┌────▼──────┐ ┌────▼──────┐ ┌─────────▼────────┐
│Transaction│ │Risk Admin │ │Chargeback │ │Monitoring │ │  Device Risk     │
│ Service   │ │ Service   │ │ Service   │ │ Service   │ │  Service         │
│(风控决策)  │ │(规则/名单)│ │(争议管理) │ │(监控/报表) │ │(设备风控)         │
└────┬──────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────────┘
     │
     │     ┌──────────────────────────────────────────────────────────┐
     │     │                     Risk Engine Core                     │
     │     ├──────────┬──────────┬───────────┬───────────┬───────────┤
     │     │ Rule     │ Velocity │ List      │ Score     │ Link     │
     │     │ Engine   │ Engine   │ Engine    │ Model     │ Analysis │
     │     │ (第五章)  │ (第六章)  │ (第七章)   │ (第八章)   │ (第九章)  │
     │     └──────────┴────┬─────┴───────────┴───────────┴───────────┘
     │                     │
     │    ┌────────────────┼──────────────┬──────────────────┐
     │    │                │              │                  │
     ▼    ▼                ▼              ▼                  ▼
┌───────────┐ ┌──────────┐   Zero-ETL   ┌────────────┐  ┌──────────────────┐
│ElastiCache│ │ Aurora   ├─────────────►│ Redshift   │  │ S3               │
│  Redis    │ │  MySQL   │              │ Serverless │  │ (模型/归档)       │
└───────────┘ └──────────┘              └────────────┘  └──────────────────┘

┌────────────────┐
│ Data Firehose  │  ← 决策日志直投 Redshift (第十二章 12.4)
└────────────────┘
```

与 v3 的关键差异：
- 去掉 Merchant Onboarding Service 和 Merchant Config Service（商户管理由外部系统负责）
- 新增 Device Risk Service（设备风控）
- 去掉 Case & Monitoring Service 中的案件管理 → 改为纯 Monitoring Service
- Chargeback Service 提供数据导入和争议流程跟踪（状态流转 + 拒付率监控）
- 去掉 EventBridge + SQS + Lambda 事件总线层 → 改为轮询 + 版本号 + Firehose 直投

### 13.2 数据流转全链路

```
交易请求
    │
    ▼
Transaction Service
    │
    ├──→ ElastiCache Redis (Velocity 查询/更新, 黑白名单缓存)
    ├──→ 内存 (规则求值, 规则从 Aurora 加载并缓存)
    ├──→ SageMaker Endpoint (模型打分, 第二期)
    │
    ▼
  决策结果返回 (<50ms)
    │
    ├──→ Firehose PutRecord (异步) → 自动攒批 → Redshift

审核完成 → Aurora (更新标签) → Redshift (每日回填 label)
    → 触发条件满足 → SageMaker Pipeline (自动训练)
```

### 13.3 数据存储分层

```
热数据 (实时读写, <10ms)
  └── ElastiCache Redis Cluster
      Velocity 计数器、黑白名单缓存、关联分析计数器、幂等 Key

温数据 (业务主库, <50ms)
  └── Aurora MySQL
      规则配置、租户信息、Chargeback 争议记录、
      审计日志、配置版本号

温冷数据同步 (联机分析支撑)
  └── Aurora MySQL 通过 AWS Zero-ETL 近实时同步业务数据到 Redshift

冷数据 (分析/报表, 秒级)
  └── Redshift Serverless
      交易流水、风控决策日志、特征快照、统计报表

归档 & 模型存储
  └── S3
      历史交易归档(Parquet)、模型文件
```

---

## 十四、技术栈

### 14.1 应用层

| 组件 | 选型 | 理由 |
|------|------|------|
| 后端语言 | Java 21 (Spring Boot 3) | 收单行业主流，生态成熟 |
| 规则引擎 | 原子条件组合 | 简洁高效 |
| API 协议 | REST | 对外对内统一 REST，简化技术栈 |

### 14.2 数据层

| 组件 | AWS 服务 | 用途 |
|------|---------|------|
| 热数据 | ElastiCache Redis Cluster | Velocity 计数器、黑白名单缓存、幂等 Key、关联分析计数器 |
| 业务主库 | Aurora MySQL | 规则配置、租户信息、Chargeback 争议记录、审计日志 |
| 分析仓库 | Redshift Serverless | 交易流水、风控决策日志、特征快照、统计报表 |
| 归档存储 | S3 | 历史交易归档(Parquet)、模型文件 |
| 流式导入 | Amazon Data Firehose | 决策日志直投 Redshift |
| 数据同步 | Aurora Zero-ETL | Aurora 业务数据近实时同步到 Redshift |
| 运维告警 | SNS | 告警通知推送 |

### 14.3 ML 管道

| 组件 | AWS 服务 | 用途 |
|------|---------|------|
| 模型训练 | SageMaker Pipeline | 自动化训练流程 |
| 模型注册 | SageMaker Model Registry | 模型版本管理 |
| 实时推理 | SageMaker Endpoint | 风控引擎调用模型打分 |

### 14.4 基础设施

| 组件 | AWS 服务 | 说明 |
|------|---------|------|
| 容器编排 | EKS (Kubernetes) | 服务部署、弹性伸缩 |
| CI/CD | CodePipeline + CodeBuild | 持续集成部署 |
| 监控 | CloudWatch + Prometheus + Grafana | 业务指标 + 系统指标 |
| 密钥管理 | Secrets Manager | PCI DSS 要求 |
| 网络 | VPC + PrivateLink | 数据库不暴露公网 |

---

## 十五、数据库设计

### 15.1 Aurora MySQL

```sql
-- ========== 事中风控 ==========

-- 多租户规则配置
CREATE TABLE risk_rules (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_type     VARCHAR(20) NOT NULL     COMMENT 'PLATFORM/ISO/MERCHANT',
    tenant_id       VARCHAR(64) NOT NULL,
    rule_name       VARCHAR(128) NOT NULL,
    priority        INT NOT NULL DEFAULT 100,
    entry_mode      VARCHAR(10)              COMMENT 'CP/CNP/ALL',
    condition_expr  TEXT NOT NULL             COMMENT '条件组合JSON: {conditions:[...], logic:"AND/OR"}',
    action          VARCHAR(20) NOT NULL     COMMENT 'APPROVE/REVIEW/DECLINE/ADD_SCORE',
    score_delta     INT                      COMMENT 'ADD_SCORE 时的加分值',
    suggestions     JSON                     COMMENT '["REQUIRE_3DS"]',
    reason_code     VARCHAR(64),
    enabled         TINYINT(1) DEFAULT 1,
    version         INT NOT NULL DEFAULT 1,
    created_at      DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 黑白名单
CREATE TABLE risk_lists (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_type     VARCHAR(20) NOT NULL     COMMENT 'PLATFORM/ISO/MERCHANT',
    tenant_id       VARCHAR(64) NOT NULL,
    list_type       VARCHAR(20) NOT NULL     COMMENT 'BLACKLIST/WHITELIST/GREYLIST',
    dimension       VARCHAR(20) NOT NULL     COMMENT 'CARD_HASH/BIN/IP/DEVICE/EMAIL',
    value           VARCHAR(256) NOT NULL,
    enabled         TINYINT(1) DEFAULT 1,
    expires_at      DATETIME(3),
    reason          VARCHAR(256),
    created_at      DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 配置版本号（轮询广播机制）
CREATE TABLE config_versions (
    config_type VARCHAR(20) PRIMARY KEY      COMMENT 'RULES/LISTS/MODEL',
    version     INT NOT NULL DEFAULT 0,
    updated_at  DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== 设备风控 ==========

-- 设备注册表
CREATE TABLE device_registry (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id       VARCHAR(64) NOT NULL UNIQUE,
    merchant_id     VARCHAR(64) NOT NULL,
    device_category VARCHAR(20) NOT NULL     COMMENT 'CERTIFIED_POS/DEDICATED_DEVICE/COTS_DEVICE',
    acceptance_method VARCHAR(20) NOT NULL   COMMENT 'TRADITIONAL/SOFTPOS',
    manufacturer    VARCHAR(64),
    model           VARCHAR(64),
    os              VARCHAR(20),
    os_version      VARCHAR(20),
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE/SUSPENDED/BLOCKED',
    -- POS 专有
    firmware_version VARCHAR(20),
    pts_cert_expiry DATE,
    serial_number   VARCHAR(64),
    -- COTS/Dedicated 专有
    attestation_status VARCHAR(20)           COMMENT 'VERIFIED/FAILED/EXPIRED',
    attestation_provider VARCHAR(20)         COMMENT 'PLAY_INTEGRITY/DEVICE_CHECK',
    attestation_verified_at DATETIME(3),
    last_location_lat DECIMAL(9,6),
    last_location_lng DECIMAL(9,6),
    created_at      DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_device_merchant ON device_registry(merchant_id);
CREATE INDEX idx_device_category ON device_registry(device_category, status);

-- ========== 事后风控 ==========

-- Chargeback 记录
CREATE TABLE chargeback_records (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    txn_id          VARCHAR(64) NOT NULL,
    merchant_id     VARCHAR(64) NOT NULL,
    iso_id          VARCHAR(64) NOT NULL,
    card_brand      VARCHAR(10) NOT NULL,
    reason_code     VARCHAR(10) NOT NULL,
    reason_desc     VARCHAR(256),
    amount          DECIMAL(12,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'USD',
    status          VARCHAR(20) NOT NULL DEFAULT 'RECEIVED' COMMENT 'RECEIVED/UNDER_REVIEW/REPRESENTED/WON/LOST/ARBITRATION',
    outcome         VARCHAR(20) DEFAULT 'PENDING' COMMENT 'WON/LOST/PENDING',
    deadline        DATE                     COMMENT '抗辩截止日期',
    received_at     DATETIME(3) NOT NULL,
    created_at      DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== 审计日志（PCI DSS，仅 INSERT） ==========

CREATE TABLE audit_log (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type      VARCHAR(64) NOT NULL     COMMENT 'RULE_CHANGE/LIST_CHANGE/MERCHANT_CONFIG_CHANGE/LOGIN/...',
    actor_type      VARCHAR(20) NOT NULL     COMMENT 'USER/SYSTEM/API',
    actor_id        VARCHAR(64) NOT NULL,
    tenant_type     VARCHAR(20),
    tenant_id       VARCHAR(64),
    resource_type   VARCHAR(64),
    resource_id     VARCHAR(128),
    action          VARCHAR(20) NOT NULL     COMMENT 'CREATE/UPDATE/DELETE/READ/LOGIN/LOGOUT',
    detail          JSON                     COMMENT '变更前后的完整快照',
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    created_at      DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_audit_log_time ON audit_log(created_at);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id, created_at);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id, created_at);

-- ========== 业务索引 ==========

CREATE INDEX idx_risk_rules_tenant ON risk_rules(tenant_type, tenant_id, enabled);
CREATE INDEX idx_risk_lists_lookup ON risk_lists(list_type, dimension, value, tenant_type, tenant_id);
CREATE INDEX idx_risk_lists_expiry ON risk_lists(enabled, expires_at);
CREATE INDEX idx_chargeback_txn ON chargeback_records(txn_id);
CREATE INDEX idx_chargeback_merchant ON chargeback_records(merchant_id, received_at);
```

### 15.2 Redshift

```sql
-- 交易风控决策日志（Firehose 直投目标表）
CREATE TABLE risk_decision_log (
    txn_id          VARCHAR(64),
    txn_time        TIMESTAMP,
    merchant_id     VARCHAR(64),
    iso_id          VARCHAR(64),
    amount          DECIMAL(12,2),
    entry_mode      VARCHAR(10),
    risk_score      INT,
    decision        VARCHAR(20),
    triggered_rules VARCHAR(1024),
    model_version   VARCHAR(32),
    features        SUPER,
    label           VARCHAR(20),
    label_source    VARCHAR(20),
    event_date      DATE
)
DISTSTYLE KEY DISTKEY(merchant_id) SORTKEY(event_date, txn_time);

-- 模型训练数据视图
CREATE VIEW v_training_dataset AS
SELECT features, label, label_source, txn_time
FROM risk_decision_log
WHERE label IS NOT NULL
  AND event_date >= DATEADD(month, -6, CURRENT_DATE);

-- 商户风控指标日聚合视图
CREATE VIEW v_merchant_daily_metrics AS
SELECT
    merchant_id, iso_id, event_date,
    COUNT(*) AS txn_count,
    SUM(amount) AS txn_amount,
    AVG(amount) AS avg_amount,
    SUM(CASE WHEN decision = 'DECLINE' THEN 1 ELSE 0 END) AS decline_count,
    SUM(CASE WHEN decision = 'REVIEW' THEN 1 ELSE 0 END) AS review_count,
    ROUND(SUM(CASE WHEN decision = 'DECLINE' THEN 1 ELSE 0 END)::DECIMAL
          / NULLIF(COUNT(*), 0) * 100, 2) AS decline_rate,
    ROUND(SUM(CASE WHEN decision = 'REVIEW' THEN 1 ELSE 0 END)::DECIMAL
          / NULLIF(COUNT(*), 0) * 100, 2) AS review_rate
FROM risk_decision_log
GROUP BY merchant_id, iso_id, event_date;

-- 商户拒付率滚动视图
CREATE VIEW v_merchant_chargeback_rate AS
SELECT
    m.merchant_id, m.iso_id, m.txn_month,
    m.txn_count,
    COALESCE(c.cb_count, 0) AS chargeback_count,
    ROUND(COALESCE(c.cb_count, 0)::DECIMAL / NULLIF(m.txn_count, 0) * 100, 4) AS chargeback_rate
FROM (
    SELECT merchant_id, iso_id,
           DATE_TRUNC('month', event_date) AS txn_month,
           COUNT(*) AS txn_count
    FROM risk_decision_log WHERE decision = 'APPROVE'
    GROUP BY merchant_id, iso_id, DATE_TRUNC('month', event_date)
) m
LEFT JOIN (
    SELECT merchant_id, DATE_TRUNC('month', received_at) AS cb_month, COUNT(*) AS cb_count
    FROM chargeback_records GROUP BY merchant_id, DATE_TRUNC('month', received_at)
) c ON m.merchant_id = c.merchant_id AND m.txn_month = c.cb_month;
```

---

## 十六、性能设计

### 16.1 性能目标与延迟分解

目标：风控决策 P99 < 50ms

```
交易请求进入
    │
    ├─ 并行分支 A: 规则引擎编排执行 (~10ms)
    │     逐条求值原子条件组合 (内存, ~1ms/条)
    │     表达式内部按需调用子引擎:
    │     ├── 黑白名单查询 (Bloom Filter + Redis, ~1ms)
    │     ├── Velocity 查询 & 更新 (Redis, ~2ms)
    │     └── 关联分析查询 (Redis HyperLogLog, ~2ms)
    │     同一规则内多个函数调用通过 Redis Pipeline 并行
    │
    └─ 并行分支 B: 评分模型打分 (SageMaker Endpoint, ~15ms, 第二期)
          打分结果回填 TransactionContext.risk_score
    │
    ▼
  汇总决策 (~1ms)
    │
    ▼
  异步写日志 (Firehose PutRecord, 不阻塞响应)
```

关键优化：
- 规则编译后缓存，轮询版本号触发热加载
- 黑白名单 Bloom Filter 一级过滤
- 决策日志异步写入 Firehose → Redshift
- 模型推理走 SageMaker Endpoint，P99 < 20ms
- 幂等缓存避免重复计算

---

# 第四部分：交付规划

## 十七、资源预估

### 17.1 云资源明细表

| AWS 服务 | 规格 | 预估月成本 |
|---------|------|-----------|
| Aurora MySQL | db.r6g.xlarge, 1写+2读 | ~$1,500 |
| ElastiCache Redis | cache.r6g.large, 3节点 | ~$800 |
| Redshift Serverless | 8 RPU 基础 | ~$500-1,500 |
| Data Firehose | 决策日志流式导入 Redshift | ~$15 |
| EKS | 3-5 × m6i.xlarge | ~$800 |
| SageMaker | 训练按需 + 推理 ml.m5.large | ~$300 |
| S3 | 标准存储 | ~$50 |
| SNS | 告警通知 | ~$5 |
| **合计** | | **~$3,500-4,500/月** |

与 v3 对比：去掉 EventBridge (~$15) + SQS 9队列+9DLQ (~$5) + Lambda 7函数 (~$20)，节省约 $40/月基础设施成本，更重要的是减少了运维复杂度。

随交易量弹性伸缩。

---

## 十八、实施计划

### 18.1 第一期 MVP（第 1-3 月）

**事中风控：**
- 风控引擎核心：规则引擎 + Velocity + 黑白名单
- 规则加权评分（非 ML）
- 降级策略 + 幂等性
- 配置变更轮询广播机制

**事后风控：**
- Chargeback 数据导入 + 争议状态流转 + 拒付率计算
- 决策日志 Firehose 直投 Redshift
- 特征采集存储（为后续模型训练积累数据）

**前端原型：**
- 风控操作台全量页面（24 个路由）
- 设备风控前端集成（嵌入现有页面）
- AI 风控助手原型（mock 响应，验证交互模式）

**基础设施：**
- 审计日志
- Aurora + Redis + Redshift + Firehose 部署

### 18.2 第二期 智能化（第 4-6 月）

**事中增强：**
- 试卡攻击防护、关联分析引擎、交易上下文校验

**评分模型：**
- XGBoost/LightGBM 模型上线
- SageMaker 自动训练管道
- 模型 Shadow 模式 & 灰度发布

**AI 风控助手：**
- LLM + RAG 后端接入（Amazon Bedrock）
- 替换原型 mock 响应为实时 API 调用
- 知识库构建：规则配置、决策日志、模型指标

**事后增强：**
- 拒付率实时监控 & 自动预警
- 退款异常监控

### 18.3 第三期 深度演进（第 7-12 月）

**模型演进：**
- XGBoost / LightGBM 持续优化（特征工程迭代、A/B 测试）

**事后深化：**
- 批量交易回溯分析能力

**平台能力：**
- 多维度报表 & BI 仪表盘

---

# 附录：能力 × 阶段映射矩阵

```
                        事中           事后
                     (实时决策)     (监控回流)
                    ──────────    ──────────
规则引擎              ✓             ✓
(第五章)           交易风控规则    监控告警规则
                                 规则效果分析

Velocity 引擎        ✓             ✓
(第六章)          实时频率检测    异常检测基础数据

黑白名单引擎          ✓             ✓
(第七章)          实时匹配拦截   异常检测→加黑名单

评分模型              ✓
(第八章)          实时风险打分
                 (数据来源依赖事后标签)

关联分析引擎          ✓             ✓
(第九章)          实时关联检测    团伙欺诈发现

设备风控引擎          ✓             ✓
(第十章)          设备完整性校验  设备监控指标

智能闭环              ✓             ✓
(第十一章)        模型热加载     标注→训练→更新

降级/幂等/轮询广播/Firehose       ✓             ✓
(第十二章)        降级+幂等      配置广播+日志投递

AI 风控助手                       ✓             ✓
(12.5)           规则生成辅助     数据查询+异常检测
                 交易风险归因     模型诊断+报表解读
```