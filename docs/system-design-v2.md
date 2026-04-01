# 收单支付 SaaS 平台 — 风控系统整体方案

> 版本: v2.0  
> 日期: 2026-03-27  
> 状态: 方案设计阶段

---

## 目录

- 第一部分：业务全景
  - 一、项目概述
  - 二、事前风控 — 准入与预防
  - 三、事中风控 — 实时决策
  - 四、事后风控 — 监控与追溯
  - 五、三阶段联动机制
- 第二部分：系统核心能力
  - 六、规则引擎
  - 七、Velocity 引擎
  - 八、黑白名单引擎
  - 九、评分模型
  - 十、关联分析引擎
  - 十一、智能风控闭环（人机协同 + 自动训练）
  - 十二、通用能力（降级、幂等、事件总线 EventBridge）
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

面向美国本地市场，为 ISO（Independent Sales Organization）和 Partner 提供收单支付 SaaS 平台的交易风控能力。平台通过 Processor 对接卡组织（Visa / Mastercard / Amex / Discover），支持 Card Present（CP）和 Card Not Present（CNP）两种交易模式。

### 1.2 核心目标

- 实时交易风控决策，P99 延迟 < 50ms
- 多租户分层规则体系，ISO/Partner 可自助配置规则和表达式
- 完整的 Chargeback 争议管理流程
- 人机协同标注 + 模型自动训练的智能风控闭环
- 满足美国本地合规要求（PCI DSS、BSA/AML、OFAC）

### 1.3 业务规模

- 日交易量：10 万 ～ 50 万笔
- 租户层级：Platform → ISO → Partner → Merchant → Sub-merchant
- 卡组织对接：通过 Processor（非直连）

### 1.4 风控三阶段全景

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     事前风控      │    │     事中风控      │    │     事后风控      │
│  Pre-Transaction │    │ In-Transaction   │    │Post-Transaction  │
│                 │    │                 │    │                 │
│  准入 & 预防     │ →  │  实时决策        │ →  │  监控 & 追溯     │
│                 │    │                 │    │                 │
│ · KYC/KYB       │    │ · 前置校验       │    │ · 交易监控       │
│ · 入网评分       │    │ · 规则引擎决策   │    │ · 退款/资金监控  │
│ · MCC 准入       │    │ · Velocity 检查  │    │ · Chargeback    │
│ · 网站审核       │    │ · 黑白名单匹配   │    │ · 商户生命周期   │
│ · 试运营管控     │    │ · 评分模型打分   │    │ · 案件管理       │
│                 │    │ · 关联分析       │    │ · 合规报告       │
│                 │    │ · 智能建议       │    │ · 数据回流       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 二、事前风控 — 准入与预防

> 目标：在交易发生之前，通过商户准入审核和风控参数预设，把风险挡在门外。
> 调用的系统能力：规则引擎、黑白名单引擎

### 2.1 KYC/KYB 审核

- 营业执照验证、法人身份核验
- UBO（最终受益人）识别
- OFAC/SDN 制裁名单筛查
- MATCH/TMF 名单查询（卡组织行业黑名单）
- 第三方验证服务集成（如 Middesk/Persona）

### 2.2 商户网站/APP 内容审核（CNP 商户必须）

- 网站可访问性验证（URL 是否可正常打开）
- 商品/服务内容合规检查（是否售卖违禁品、虚假宣传）
- 退款/隐私政策页面是否完整
- 卡组织品牌标识展示是否合规
- 定期复查（每季度自动爬取检测变化）

### 2.3 MCC 准入策略

| MCC 分类 | 准入策略 | 额外要求 |
|----------|---------|---------|
| 低风险（5411 超市、5812 餐饮等） | 标准审核 | 无 |
| 中风险（5944 珠宝、7011 酒店等） | 增强审核 | 保证金 5% |
| 高风险（5966 直销、7995 博彩等） | 高级审批 + 合规委员会 | 保证金 10%，延迟结算 T+7 |
| 禁入（非法药品、未授权金融服务等） | 禁止入网 | — |

### 2.4 商户入网风险评分卡

| 评分维度 | 权重 | 评分标准 |
|---------|------|---------|
| MCC 行业风险 | 25% | 低风险 0 / 中风险 30 / 高风险 60 / 禁入 100 |
| 经营年限 | 15% | >3年 0 / 1-3年 20 / <1年 50 / 新注册 80 |
| 历史拒付记录 | 20% | 无记录 0 / <0.5% 20 / 0.5-1% 50 / >1% 90 |
| MATCH/TMF 命中 | 20% | 未命中 0 / 命中 100 |
| 预期月交易量 | 10% | <$50K 0 / $50K-$500K 20 / >$500K 40 |
| 法人/UBO 信用 | 10% | 良好 0 / 一般 30 / 差 70 |

评分结果映射：
- 0-25：低风险 → 标准限额，T+2 结算
- 26-50：中风险 → 降低限额，保证金 5%，T+3 结算
- 51-75：高风险 → 严格限额，保证金 10%，T+7 结算，标记强制 3DS（由支付业务侧执行）
- 76+：禁入 → 拒绝入网

### 2.5 商户协议 & 风控参数初始化

根据风险评级设置初始风控参数和合同条款：

| 风险等级 | 结算周期 | 保证金比例 | 拒付罚款 | 单笔限额 | 月限额 | 默认规则 |
|---------|---------|-----------|---------|---------|-------|---------|
| 低风险 | T+2 | 0% | $25/笔 | $10,000 | $500K | 标准规则模板 |
| 中风险 | T+3 | 5% | $25/笔 | $5,000 | $200K | 增强规则模板 |
| 高风险 | T+7 | 10% | $50/笔 | $2,000 | $50K | 严格规则模板 + 标记强制 3DS |

### 2.6 试运营期管控（新商户前 90 天）

- 限额为正式限额的 50%
- 强制开启所有风控规则（不允许豁免）
- 每日交易量监控，异常立即预警
- 第 30 天首次评估：表现良好可提升至 75% 限额
- 第 90 天正式评估：通过后切换为正式风控策略
- 试运营期内拒付率超标的自动处置见第五章 5.3 节自动化处置规则

### 2.7 终端/渠道安全

- POS 终端 P2PE 加密认证（CP）
- 网站/APP 安全扫描（CNP）
- API 密钥分发 & 权限控制

---

## 三、事中风控 — 实时决策

> 目标：在交易授权链路中实时完成风控决策，P99 < 50ms。
> 调用的系统能力：规则引擎、Velocity 引擎、黑白名单引擎、评分模型、关联分析引擎

### 3.1 决策流程

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
风控引擎并行决策 (<50ms)
    ├── 黑白名单匹配 ──────── → 黑白名单引擎 (第八章)
    ├── Velocity 检查 ──────── → Velocity 引擎 (第七章)
    ├── 规则表达式求值 ─────── → 规则引擎 (第六章)
    ├── 关联分析 ────────────── → 关联分析引擎 (第十章)
    └── 评分模型打分 ────────── → 评分模型 (第九章)
    │
    ▼
汇总决策: APPROVE / REVIEW / DECLINE
    │
    ▼
智能建议映射 (独立规则集, 见 3.2 节)
    │
    ├── APPROVE → 返回授权通过 + suggestions
    ├── DECLINE → 返回拒绝 + 原因码
    └── REVIEW  → 返回通过 + suggestions + 进入人工审核队列
    │
    ▼ (异步)
决策日志写入 EventBridge → SQS → Redshift

REVIEW 人工审核后处置:
  - 判定正常 → 标记 LEGIT，标签回流训练数据
  - 判定欺诈 → 关联卡号/设备/IP 加入黑名单，标签回流训练数据
```

### 3.2 决策结果结构

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

风控决策产出后，经过独立的智能建议映射规则集生成建议，与风控规则解耦：

```
风控决策 (APPROVE/REVIEW/DECLINE)
    │
    ▼
智能建议映射（独立规则集，可单独配置）
    │
    ▼
最终输出 = decision + suggestions
```

建议映射规则：

| 条件 | 建议 | 说明 |
|------|------|------|
| `decision == 'APPROVE' AND entry_mode == 'CNP' AND risk_score > 60` | `REQUIRE_3DS` | CNP 高风险建议 3DS |
| `decision == 'APPROVE' AND entry_mode == 'CP' AND amount > 5000` | `REQUIRE_PIN` | CP 大额建议 PIN |
| `decision == 'REVIEW' AND entry_mode == 'CNP'` | `REQUIRE_3DS` | 审核交易也建议 3DS |
| `merchant.require_3ds == true AND entry_mode == 'CNP'` | `REQUIRE_3DS` | 商户级强制配置 |

建议映射规则与风控规则共用同一套 DSL 语法（第六章），但独立管理、独立版本控制。

当前支持的建议类型：

| Suggestion | 含义 | 支付侧处理 |
|--------|------|-----------|
| `REQUIRE_3DS` | 建议触发 3D Secure | CNP 交易插入 3DS 验证流程 |
| `REQUIRE_PIN` | 建议触发 PIN 验证 | CP 交易要求输入 PIN |
| `REQUIRE_OTP` | 建议触发 OTP 验证 | 发送短信验证码 |

### 3.3 多租户规则分层

```
执行链: Platform Rules (强制, 不可覆盖)
            → ISO Rules
            → Partner Rules
            → Merchant Rules

决策逻辑:
  - 任一层 DECLINE → 直接拒绝, 短路终止
  - 任一层 REVIEW  → 标记人工审核, 继续执行后续层
  - 全部 APPROVE   → 通过
```

### 3.4 试卡攻击防护

试卡攻击特征：短时间内大量小额（$0.01-$1.00）授权请求，用于验证盗取的卡号是否有效。

检测规则：
- 同商户 5 分钟内授权请求 > 20 笔 → 触发拦截
- 同商户小额交易（< $2）占比 > 50%（1 小时窗口）→ 告警
- 同 IP/设备 10 分钟内使用 > 5 张不同卡 → 拦截
- 授权失败率 > 30%（1 小时窗口）→ 通知商户管理系统临时冻结商户

处置：触发后风控系统输出智能建议（3DS/CAPTCHA），由支付业务侧执行；严重时通知商户管理系统临时冻结商户交易入口，通知 ISO/Partner。

### 3.5 交易上下文校验

| MCC 行业 | 合理单笔范围 | 合理时段 | 异常信号 |
|----------|-------------|---------|---------|
| 5411 超市 | $5 - $500 | 6:00-24:00 | 凌晨 3 点 $3,000 |
| 5812 餐饮 | $10 - $300 | 10:00-23:00 | $5,000 单笔 |
| 5999 零售 | $10 - $2,000 | 8:00-22:00 | 连续相同金额 |
| 7011 酒店 | $50 - $5,000 | 全天 | 同卡同日多次 |

超出合理范围的交易自动加分（提升风险评分），不直接拒绝但增加审核概率。

### 3.6 CP vs CNP 差异化策略

| 维度 | Card Present | Card Not Present |
|------|-------------|-----------------|
| 核心风险 | 伪卡、丢失/被盗卡 | 盗卡号、账户盗用 |
| 关键信号 | EMV 芯片结果、PIN 验证、终端位置 | AVS、CVV、3DS、IP 地理位置、设备指纹 |
| Velocity 重点 | 同终端短时间多笔、跨地域刷卡 | 同卡多商户、同 IP 多卡 |
| 3DS 触发 | 不适用 | 风险评分 > 阈值时触发 |

### 3.7 风控数据维度

| 维度 | 示例 |
|------|------|
| 交易 | 金额、币种、MCC、交易类型（CP/CNP） |
| 卡片 | BIN、发卡国、卡类型、AVS/CVV 结果 |
| 持卡人 | 地址、IP 地理位置、设备指纹 |
| 商户 | 历史拒付率、注册时长、行业风险等级 |
| 行为 | 同卡/同IP/同设备的交易频率和金额累计 |

---

## 四、事后风控 — 监控与追溯

> 目标：交易完成后持续监控、发现异常、处置风险、沉淀数据。
> 调用的系统能力：规则引擎、Velocity 引擎、黑白名单引擎、关联分析引擎、智能闭环

### 4.1 交易监控 & 异常检测

- 商户维度：日/周/月交易量突增、客单价异常波动、退款率异常、非营业时间交易占比突增
- 卡片维度：同卡跨商户异常消费模式、授权成功率骤降（试卡攻击信号）
- 网络维度：关联商户群体异常（团伙欺诈）

### 4.2 退款异常监控

退款不同于 Chargeback，是商户主动发起的。异常退款是洗钱和友好欺诈的重要信号。

| 监控指标 | 告警阈值 | 风险含义 |
|---------|---------|---------|
| 退款率 | > 10%（月度） | 商品/服务质量问题或友好欺诈 |
| 退款金额占比 | > 15%（月度） | 可能存在洗钱行为 |
| 全额退款占比 | > 80%（在所有退款中） | 异常模式，可能是虚假交易 |
| 退款时间间隔 | 交易后 < 1 小时退款 | 高度可疑，可能是测试或洗钱 |
| 同卡退款频率 | 同卡 30 天内退款 > 3 次 | 友好欺诈或串通退款 |

### 4.3 资金异常监控

| 监控指标 | 告警阈值 | 风险含义 |
|---------|---------|---------|
| 结算金额突变 | 周环比增长 > 200% | 异常交易量激增 |
| 频繁变更结算账户 | 90 天内变更 > 2 次 | 资金转移风险 |
| 结算账户与商户主体不一致 | — | 第三方代收风险 |
| 交易金额高度集中 | 单一金额占比 > 40% | 虚假交易信号 |
| 交易对手高度集中 | 单一卡号占比 > 30% | 自买自卖/关联交易 |

### 4.4 Chargeback 管理

```
Processor 推送 Chargeback 通知
        │
        ▼
  Chargeback 接收 & 解析 (Visa TC / MC reason code)
        │
        ▼
  自动分类 & 分派 (按 ISO/Merchant 路由)
        │
   ┌────┴────┐
   ▼         ▼
可抗辩     不可抗辩
   │         │
   ▼         ▼
证据收集   直接受理
& 组装     扣款结算
   │
   ▼
Representment 提交 (在时限内提交给 Processor)
   │
   ┌────┴────┐
   ▼         ▼
 胜诉      败诉
   │         │
 资金回转  Pre-Arb / Arb 或结案
```

关键设计：
- 时效管理：Visa 和 MC dispute 时限不同，系统自动跟踪 deadline 并预警
- 拒付率监控：实时计算 Merchant 的 chargeback ratio（Visa VDMP 阈值 0.9%，MC ECP 阈值 1.5%）
- 超标预警：接近阈值时自动通知 ISO/Partner，触发商户风控升级
- 风控联动：高拒付商户自动收紧风控规则（通知商户管理系统降低单笔限额、标记强制 3DS 等）
- 标签回流：Chargeback 结果作为最可靠的欺诈标签回流到模型训练数据集

### 4.5 批量交易回溯分析

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
输出可疑交易列表
    │
    ├── 已结算交易 → 标记商户风险，调整后续策略
    ├── 未结算交易 → 通知结算系统冻结结算，人工审核
    └── 关联商户/卡号 → 加入灰名单或黑名单
```

支持的回溯维度：按卡 BIN 范围、IP 段/设备指纹、商户群组、交易模式（金额/频率/时间）、自定义 SQL 查询（仅限风控分析师角色）。

### 4.6 商户生命周期管理

```
入网 → 试运营(90天) → 正式运营 → 定期复审 → 续约/退出
                                    │
                          ┌─────────┴─────────┐
                          ▼                   ▼
                      表现良好              表现不佳
                      提升限额              收紧策略
                      降低保证金            ↓
                                    ┌───────┴───────┐
                                    ▼               ▼
                                 观察期          严重违规
                                 (30天)          立即关停
                                    │
                               ┌────┴────┐
                               ▼         ▼
                            改善       未改善
                            恢复       关停
```

定期复审机制：
- 季度复审：交易数据分析、拒付率检查、合规状态确认
- 年度复审：重新 KYC/KYB、网站内容复查、风险评级重新评估
- 触发式复审：拒付率突破阈值、收到卡组织警告、行业政策变化

风险评级动态调整规则：

| 触发条件 | 动作 |
|---------|------|
| 连续 3 个月拒付率 < 0.3% | 升级为低风险，提升限额 |
| 拒付率 0.3% - 0.5% | 维持当前评级，常规监控 |
| 拒付率 0.5% - 0.9% | 降级为中风险，启用增强监控 |
| 拒付率 > 0.9%（Visa VDMP 阈值） | 降级为高风险，标记强制 3DS，延迟结算 |
| 拒付率 > 1.5%（MC ECP 阈值） | 通知结算系统冻结结算，发起关停审查 |
| MATCH/TMF 名单新增命中 | 通知商户管理系统立即冻结，人工审查 |

### 4.7 案件管理工作流

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  发现     │ →  │  立案     │ →  │  调查     │ →  │  处置     │ →  │  结案     │
│          │    │          │    │          │    │          │    │          │
│ 系统告警  │    │ 分配调查员│    │ 证据收集  │    │ 执行处罚  │    │ 归档记录  │
│ 人工举报  │    │ 设定优先级│    │ 关联分析  │    │ 通知相关方│    │ 经验沉淀  │
│ 外部通报  │    │ 设定时限  │    │ 商户沟通  │    │ 规则更新  │    │ 规则优化  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

案件类型与优先级：

| 类型 | 示例 | 优先级 | 响应时限 |
|------|------|--------|---------|
| 欺诈交易 | 盗卡、账户盗用、大规模盗刷 | P0 | 4 小时 |
| 合规案件 | OFAC 命中、SAR 触发 | P0 | 4 小时 |
| 拒付超标 | 触发 Visa VDMP / MC ECP | P1 | 24 小时 |
| 商户违规 | 虚假交易、洗钱嫌疑 | P1 | 24 小时 |
| 退款异常 | 退款率超标、可疑模式 | P2 | 72 小时 |
| 常规复审 | 定期复审、优化建议 | P3 | 7 天 |

### 4.8 风控报表 & 合规报告

| 报表 | 受众 | 频率 | 核心指标 |
|------|------|------|---------|
| 平台风控总览 | 平台风控团队 | 实时仪表盘 | 全局拒绝率、REVIEW 率、拒付率、模型准确率 |
| ISO 风控报告 | ISO 管理员 | 日报/周报 | 旗下商户拒付率排名、风险事件汇总、限额使用率 |
| 商户风控报告 | Partner/Merchant | 日报 | 交易通过率、拒绝原因分布、拒付详情 |
| 模型监控报告 | 数据团队 | 周报 | 模型 AUC、精确率/召回率、特征漂移、预测分布 |

合规报告（合规团队，月报）：
- SAR 可疑活动报告自动生成草稿，合规团队审核后提交 FinCEN
- CTR 大额交易报告（单笔或累计 > $10,000）
- OFAC 筛查结果汇总
- 卡组织合规报告（Visa VDMP / MC ECP 月度报告）
- 定期合规审计报告（审计日志摘要）

### 4.9 合规模块

| 合规要求 | 实现方式 |
|---------|---------|
| PCI DSS | 卡号 tokenization，密钥存 Secrets Manager，VPC 网络隔离 |
| OFAC/SDN 筛查 | 商户入网时全量筛查，交易时按风险等级抽查 |
| BSA/AML | 可疑交易自动标记，SAR 报告草稿生成供合规团队审核 |
| CTR | 单笔或累计超 $10,000 现金等价交易自动上报 |
| 审计日志 | 所有规则变更、决策结果、人工操作完整记录，不可篡改 |

### 4.10 数据回流

- 人工审核标注 + Chargeback 结果 → 标签数据集 → 触发模型自动训练（详见第十一章）
- 规则效果分析 → 规则优化建议
- 案件调查结论 → 新规则/新特征的输入来源

---

## 五、三阶段联动机制

### 5.1 联动关系

```
事前                    事中                    事后
 │                       │                       │
 │  商户风险评级 ────────→│  决定初始规则严格度     │
 │  限额配置 ───────────→│  限额校验              │
 │  MCC准入策略 ────────→│  行业上下文校验         │
 │                       │  决策日志 ───────────→│  交易监控分析
 │                       │  REVIEW 交易 ────────→│  人工审核标注
 │  ←── 动态调整限额 ────│←── Chargeback 结果 ───│
 │  ←── 商户降级/关停 ───│                       │
 │  ←── 定期复审触发 ────│                       │
 │                       │  ←── 模型更新 ────────│  模型训练完成
 │                       │  ←── 规则优化 ────────│  规则效果分析
 │                       │  ←── 黑名单更新 ──────│  案件调查结论
```

### 5.2 风控事件总线

三阶段之间通过统一的事件总线通信，基于 Amazon EventBridge 实现（详见第十二章）：

| Event Pattern (detail-type) | 方向 | 内容 |
|-------|------|------|
| `risk.merchant.onboarding` | 事前 → 事中 | 商户入网完成，携带风险评级和初始限额配置 |
| `risk.transaction.decision` | 事中 → 事后 | 每笔交易的风控决策结果和特征快照 |
| `risk.alert.triggered` | 事后 → 事前/事中 | 异常检测告警，触发策略调整 |
| `risk.model.updated` | 事后 → 事中 | 模型训练完成，通知引擎热加载 |
| `risk.merchant.status` | 事后 → 事前/事中 | 商户状态变更（降级/冻结/关停） |
| `risk.list.updated` | 事后 → 事中 | 黑白名单变更，通知缓存刷新 |
| `risk.case.created` | 事后内部 | 案件创建，分配调查员 |

### 5.3 自动化处置规则

| 触发事件 | 自动处置动作 | 影响阶段 |
|---------|-------------|---------|
| 商户拒付率 > 0.9% | 标记强制 3DS，通知商户管理系统降低单笔限额至 $1,000 | 事中 |
| 商户拒付率 > 1.5% | 通知结算系统冻结结算，发起关停审查 | 事前 + 事中 |
| 检测到试卡攻击 | 通知商户管理系统临时冻结 30 分钟，加入灰名单 | 事中 |
| 同一 BIN 段欺诈率 > 5% | 该 BIN 段加入全局灰名单，强制 REVIEW | 事中 |
| 商户退款率 > 15% | 通知结算系统延迟结算升级为 T+14，启动调查 | 事前 + 事后 |
| 模型精确率下降 > 5% | 自动触发模型重训练，告警数据团队 | 事后 → 事中 |
| OFAC 名单更新 | 全量商户重新筛查 | 事前 |
| 案件调查确认欺诈 | 关联卡号/设备/IP 加入黑名单 | 事中 |
| 新商户试运营期拒付 > 0.5% | 通知商户管理系统立即冻结，人工审查 | 事前 + 事中 |

---

# 第二部分：系统核心能力

## 六、规则引擎

> 贯穿三个阶段的核心能力：事前（入网评分规则）、事中（交易风控规则）、事后（监控告警规则、规则效果分析）。

### 6.1 表达式 DSL

支持 ISO/Partner 自助配置规则和表达式。基于 ANTLR4 自研轻量级表达式解析器。

规则配置示例：

```json
{
  "rule_id": "R1001",
  "name": "高额CNP交易拦截",
  "tenant_type": "ISO",
  "tenant_id": "ISO_2001",
  "priority": 10,
  "entry_mode": "CNP",
  "condition": {
    "expr": "txn.amount > 5000 AND card.issuer_country != 'US'"
  },
  "action": "DECLINE",
  "reason_code": "HIGH_AMOUNT_FOREIGN_CNP"
}
```

表达式语法：

| 类型 | 示例 |
|------|------|
| 比较 | `txn.amount > 1000`, `card.bin IN ['601100','601101']` |
| 逻辑 | `AND`, `OR`, `NOT` |
| 函数 | `velocity('card_number', '1h') > 5`, `geo_distance(txn.ip, merchant.address) > 500` |
| 集合 | `card.brand IN ['VISA','MC']`, `merchant.mcc NOT IN [7995,5966]` |
| 关联 | `link_count('device', 'card', '1h') > 3` |

### 6.2 规则生命周期

```
创建/编辑 → 语法校验 → 沙箱测试 → 审批 → 发布 → 生效 → 监控 → 优化/下线
                                    │
                              版本快照（支持回滚）
```

### 6.3 安全约束

- 表达式沙箱执行，禁止任意代码
- 平台级规则 ISO/Partner 不可修改或覆盖
- 规则变更需审计日志，支持版本回滚
- 规则编译后缓存，变更时热加载

---

## 七、Velocity 引擎

> 主要服务事中（实时频率/金额检测）和事后（异常检测的基础数据）。

### 7.1 计数器设计

基于 ElastiCache Redis 滑动窗口实现：

| 计数器 Key 模式 | 含义 |
|----------------|------|
| `vel:{card_hash}:cnt:{window}` | 同卡交易次数 |
| `vel:{card_hash}:amt:{window}` | 同卡交易累计金额 |
| `vel:{ip}:cnt:{window}` | 同 IP 交易次数 |
| `vel:{device_fp}:cnt:{window}` | 同设备交易次数 |
| `vel:{merchant}:{card_hash}:cnt:{window}` | 同商户同卡次数 |

### 7.2 时间窗口

支持 `5m` / `1h` / `24h` / `7d`，可配置。每个计数器 Key 设置对应 TTL 自动过期。

### 7.3 在规则引擎中的调用

通过 DSL 函数调用：`velocity('card_number', '1h') > 5`，规则引擎执行时实时查询 Redis。

---

## 八、黑白名单引擎

> 贯穿三个阶段：事前（MATCH/TMF 名单）、事中（实时匹配）、事后（案件结论加入黑名单）。

### 8.1 名单维度与类型

- 维度：卡号 hash / BIN 范围 / IP（支持 CIDR）/ 设备指纹 / 邮箱 / 手机号
- 类型：
  - `BLACKLIST`：直接拒绝
  - `WHITELIST`：跳过规则检查
  - `GREYLIST`：强制进入 REVIEW
- 租户隔离：平台级（全局）+ ISO 级 + Merchant 级
- 支持过期时间（临时封禁场景）

### 8.2 性能优化

- Redis 缓存全量名单，查询延迟 < 1ms
- Bloom Filter 做一级过滤，减少 Redis 穿透
- 名单变更通过事件总线（`risk.list.updated`）通知所有节点刷新缓存

---

## 九、评分模型

> 主要服务事中（实时打分），数据来源依赖事后（标签回流）。

### 9.1 演进路径

```
第一期 (MVP)          第二期
规则加权评分     →   XGBoost / LightGBM 模型
人工配置权重     →   历史数据训练
100% 可解释     →   特征重要性可解释
无需训练数据     →   需要 3-6 个月数据
```

### 9.2 第一期：规则加权评分

```
风险分 = 0
IF txn.amount > 3000           THEN +20
IF card.issuer_country != 'US' THEN +15
IF avs_result == 'N'          THEN +25
IF cvv_result == 'N'          THEN +30
IF velocity(card, 1h) > 3     THEN +20
IF txn.entry_mode == 'CNP'    THEN +10
IF merchant.age_days < 90     THEN +15

阈值: 0-40 APPROVE / 41-70 REVIEW / 71+ DECLINE
```

### 9.3 第二期：ML 模型

- 算法：XGBoost / LightGBM
- 特征：交易金额、时间、频率、地理距离、AVS/CVV 结果、商户行业、历史拒付率等
- 标签：该笔交易最终是否产生了 chargeback / fraud
- 输出：0-1 之间的欺诈概率
- 训练管道：SageMaker Pipeline（详见第十一章）

### 9.4 模型监控

| 指标 | 告警阈值 | 含义 |
|------|---------|------|
| 特征分布漂移 (PSI) | > 0.2 | 输入数据分布变化，模型可能失效 |
| 预测分布偏移 | 平均分偏移 > 15% | 打分整体偏高或偏低 |
| 精确率 | 下降 > 5% | 误杀增多 |
| 召回率 | 下降 > 5% | 漏放增多 |
| REVIEW 率 | 突增 > 50% | 审核压力异常 |

---

## 十、关联分析引擎

> 主要服务事中（实时关联检测）和事后（团伙欺诈发现）。

### 10.1 实时关联维度

| 关联维度 | 检测逻辑 | 风险信号 |
|---------|---------|---------|
| 同设备多卡 | 同 device_fingerprint 1h 内使用 > 3 张不同卡 | 盗卡批量消费 |
| 同卡多商户 | 同 card_hash 1h 内在 > 5 个不同商户交易 | 盗卡扫货 |
| 同 IP 多卡 | 同 IP 1h 内使用 > 10 张不同卡 | 欺诈工厂 |
| 同地址多商户 | 同注册地址关联 > 3 个商户 | 壳商户/团伙 |
| 同法人多商户 | 同法人名下商户拒付率均偏高 | 系统性欺诈 |

### 10.2 实现方式

- 实时关联：Redis 维护关联计数器（如 `link:{device_fp}:cards:{window}` 用 HyperLogLog 计数）
- 规则引擎调用：`link_count('device', 'card', '1h') > 3`
- 离线关联（事后）：Redshift 中通过 SQL 关联查询（多表 JOIN + 聚合），发现跨商户的可疑关联模式

---

## 十一、智能风控闭环（人机协同 + 自动训练）

> 连接事中（决策）和事后（标注、训练），形成风控系统的自我进化能力。

### 11.1 闭环流程

```
交易 → 风控引擎决策 → APPROVE / REVIEW / DECLINE
              │              │
              ▼              ▼
        特征+决策结果    REVIEW 进入审核队列
        写入特征仓库          │
              │          审核员标注 (✓正常 / ✗欺诈)
              │               │
              ▼               ▼
        标注数据集 (Feature Store)  ←── Chargeback 结果回填
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
| 人工审核标注 | 实时 ~ 24h | 高（审核员判断） |
| Chargeback 回传 | 30-120 天 | 最高（实际结果） |
| 规则自动标注 | 实时 | 中（辅助补充） |

### 11.3 自动训练管道（SageMaker）

触发条件（满足任一）：
- 新增标注数据 > 5,000 条
- 距上次训练 > 7 天
- 模型监控指标下降（精确率/召回率偏移）

流程：
1. 数据准备：从 Redshift 导出到 S3，正负样本平衡（SMOTE/加权）
2. 模型训练：SageMaker Pipeline，XGBoost / LightGBM
3. 离线评估：AUC-ROC、精确率@固定召回率、KS 统计量
4. Shadow 模式：新模型并行打分不参与决策，对比 3-7 天
5. 灰度上线：通过评估后 10% → 50% → 100% 流量切换

### 11.4 模型热更新

```
风控引擎进程 (EKS)
    ├── 当前模型 (v1.2) ← 正在服务
    ├── 模型加载器
    │     ├── 接收通知 (EventBridge → SQS → Lambda → 调用引擎 API /model/reload)
    │     ├── 从 S3 / SageMaker Registry 拉取新版本 v1.3
    │     ├── 加载到内存，健康检查
    │     └── 原子切换: v1.2 → v1.3
    └── 回滚能力: 一键切回 v1.2
```

---

## 十二、通用能力

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
    │     → 超过 $1,000 的 CNP 交易一律 REVIEW
    │
    └── 完全不可用
          → 所有交易拒绝（保护优先）
          → 立即触发 P0 告警
          → 运维介入恢复后，对降级期间拒绝的交易通知商户重试
```

降级期间所有交易标记降级标识，事后批量回溯分析。

### 12.2 幂等性设计

- 每笔交易请求携带唯一 `request_id`
- Redis 记录 `idempotent:{request_id}` → 决策结果，TTL 24h
- 重复请求直接返回缓存的决策结果，不重复执行规则和更新 Velocity 计数器
- 防止 Processor 重试导致的重复计数和不一致决策

### 12.3 风控事件总线

基于 Amazon EventBridge + SQS + Lambda 实现三阶段之间的异步通信（事件定义见 5.2 节）。

架构模式：

```
生产者 (各服务)
    │
    ▼
EventBridge Custom Event Bus: risk-event-bus
    │
    ├── Rule: risk.transaction.decision
    │     ├──→ SQS: redshift-loader-queue → Lambda: RedshiftBatchLoader (批量写 Redshift)
    │     └──→ SQS: review-task-queue → Lambda: ReviewTaskCreator (REVIEW 交易入审核队列)
    │
    ├── Rule: risk.model.updated
    │     └──→ SQS: model-update-queue → Lambda: ModelUpdateNotifier (通知引擎热加载)
    │
    ├── Rule: risk.list.updated
    │     └──→ SQS: list-refresh-queue → Lambda: CacheRefresher (刷新 Redis 缓存)
    │
    ├── Rule: risk.merchant.status
    │     └──→ SQS: merchant-status-queue → Lambda: MerchantStatusHandler
    │
    ├── Rule: risk.alert.triggered
    │     ├──→ SQS: alert-handler-queue → Lambda: AlertProcessor (策略调整)
    │     └──→ SNS: ops-notification (运维告警通知)
    │
    ├── Rule: risk.merchant.onboarding
    │     └──→ SQS: onboarding-queue → Lambda: OnboardingProcessor
    │
    └── Rule: risk.case.created
          └──→ SQS: case-assignment-queue → Lambda: CaseAssigner (分配调查员)
```

设计原则：
- 事件驱动，松耦合：各阶段通过 EventBridge 事件通信，不直接调用
- SQS 作为缓冲层，保证消息不丢失，Lambda 消费失败自动重试
- 消费端幂等：Lambda 处理逻辑基于事件 ID 去重
- 事件 Schema 版本化（EventBridge Schema Registry），向后兼容
- 死信队列（DLQ）：每个 SQS 队列配置 DLQ，处理失败的消息进入 DLQ 供人工排查

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
│Merchant  │ │Transaction│ │Risk Admin │ │Chargeback │ │Case & Monitoring │
│Onboarding│ │ Service   │ │ Service   │ │ Service   │ │ Service          │
│Service   │ │(风控决策)  │ │(规则/名单)│ │(拒付管理) │ │(案件/监控/报表)   │
│(商户入网) │ │          │ │          │ │          │ │                  │
└──┬───────┘ └────┬──────┘ └──────────┘ └──────────┘ └──────────────────┘
   │  事前         │  事中       管理服务        事后            事后
   │              ▼
   │     ┌──────────────────────────────────────────────────────────┐
   │     │                     Risk Engine Core                     │
   │     ├──────────┬──────────┬───────────┬───────────┬───────────┤
   │     │ Rule     │ Velocity │ List      │ Score     │ Link     │
   │     │ Engine   │ Engine   │ Engine    │ Model     │ Analysis │
   │     │ (第六章)  │ (第七章)  │ (第八章)   │ (第九章)   │ (第十章)  │
   │     └──────────┴────┬─────┴───────────┴───────────┴───────────┘
   │                     │
   │    ┌────────────────┼──────────────┬──────────────────┐
   │    │                │              │                  │
   ▼    ▼                ▼              ▼                  ▼
┌───────────┐ ┌──────────┐ ┌────────────┐  ┌──────────────────┐
│ElastiCache│ │ Aurora   │ │ Redshift   │  │ S3               │
│  Redis    │ │PostgreSQL│ │ Serverless │  │ (模型/归档)       │
└───────────┘ └──────────┘ └────────────┘  └──────────────────┘

┌────────────────┐
│  EventBridge   │  ← 风控事件总线 (第十二章), 各服务直接发送事件
│  + SQS + Lambda│
└────────────────┘
```

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
    ├──→ EventBridge Event: risk.transaction.decision
    │       ├──→ Rule → SQS (BatchWindow=300s) → Lambda: RedshiftBatchLoader (批量写 Redshift)
    │       └──→ Rule → SQS → Lambda: ReviewTaskCreator (REVIEW 交易入审核队列)
    │
    └──→ REVIEW → 推送审核工作台 (WebSocket)

审核完成 → Aurora (更新标签) → Redshift (每日回填 label)
    → 触发条件满足 → SageMaker Pipeline (自动训练)
```

### 13.3 数据存储分层

```
热数据 (实时读写, <10ms)
  └── ElastiCache Redis Cluster
      Velocity 计数器、黑白名单缓存、规则编译缓存、幂等 Key

温数据 (业务主库, <50ms)
  └── Aurora PostgreSQL
      规则配置、租户信息、Chargeback 案件、审核标注、审计日志

冷数据 (分析/报表, 秒级)
  └── Redshift Serverless
      交易流水、风控决策日志、特征快照、统计报表

归档 & 模型存储
  └── S3
      历史交易归档(Parquet)、模型文件、Chargeback 证据
```

---

## 十四、技术栈

### 14.1 应用层

| 组件 | 选型 | 理由 |
|------|------|------|
| 后端语言 | Java 21 (Spring Boot 3) | 收单行业主流，生态成熟 |
| 规则引擎 | 自研表达式引擎 (ANTLR4) | 轻量可控 |
| API 协议 | REST | 对外对内统一 REST，简化技术栈 |
| 审核工作台前端 | React + Ant Design | 快速搭建后台管理界面 |

### 14.2 数据层（AWS 体系）

| 组件 | AWS 服务 | 用途 |
|------|---------|------|
| 热数据 | ElastiCache Redis Cluster | Velocity 计数器、黑白名单缓存、规则编译缓存 |
| 业务主库 | Aurora PostgreSQL | 规则配置、租户信息、Chargeback 案件、审核标注、审计日志 |
| 分析仓库 | Redshift Serverless | 交易流水、风控决策日志、特征快照、统计报表 |
| 归档存储 | S3 | 历史交易归档(Parquet)、模型文件、Chargeback 证据 |
| 事件总线 | EventBridge + SQS + Lambda | 风控事件总线、决策日志异步写入 |
| 运维告警 | SNS | 告警事件通知推送 |

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

### 15.1 Aurora PostgreSQL

```sql
-- ========== 事前风控 ==========

-- 商户入网风险评估
CREATE TABLE merchant_risk_assessment (
    id              BIGSERIAL PRIMARY KEY,
    merchant_id     VARCHAR(64) NOT NULL,
    iso_id          VARCHAR(64) NOT NULL,
    mcc             VARCHAR(10) NOT NULL,
    risk_score      INT NOT NULL,
    risk_level      VARCHAR(20) NOT NULL,    -- LOW/MEDIUM/HIGH/PROHIBITED
    kyc_status      VARCHAR(20) NOT NULL,    -- PENDING/APPROVED/REJECTED
    ofac_check      VARCHAR(20) NOT NULL,    -- CLEAR/HIT/PENDING
    match_tmf_check VARCHAR(20) NOT NULL,    -- CLEAR/HIT/PENDING
    website_review  VARCHAR(20),             -- APPROVED/REJECTED/NA
    trial_period    BOOLEAN DEFAULT true,
    trial_end_date  DATE,
    settlement_cycle VARCHAR(10) NOT NULL,   -- T+2/T+3/T+7/T+14
    reserve_rate    DECIMAL(5,2) DEFAULT 0,
    single_txn_limit DECIMAL(12,2),
    daily_limit     DECIMAL(12,2),
    monthly_limit   DECIMAL(12,2),
    next_review_date DATE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 商户复审记录
CREATE TABLE merchant_review_log (
    id              BIGSERIAL PRIMARY KEY,
    merchant_id     VARCHAR(64) NOT NULL,
    review_type     VARCHAR(20) NOT NULL,    -- QUARTERLY/ANNUAL/TRIGGERED
    trigger_reason  VARCHAR(256),
    previous_level  VARCHAR(20),
    new_level       VARCHAR(20),
    reviewer        VARCHAR(64),
    review_note     TEXT,
    reviewed_at     TIMESTAMPTZ DEFAULT now()
);

-- ========== 事中风控 ==========

-- 多租户规则配置
CREATE TABLE risk_rules (
    id              BIGSERIAL PRIMARY KEY,
    tenant_type     VARCHAR(20) NOT NULL,   -- PLATFORM/ISO/PARTNER/MERCHANT
    tenant_id       VARCHAR(64) NOT NULL,
    rule_name       VARCHAR(128) NOT NULL,
    priority        INT NOT NULL DEFAULT 100,
    entry_mode      VARCHAR(10),            -- CP/CNP/ALL
    condition_expr  TEXT NOT NULL,
    action          VARCHAR(20) NOT NULL,    -- APPROVE/REVIEW/DECLINE
    reason_code     VARCHAR(64),
    enabled         BOOLEAN DEFAULT true,
    version         INT NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 黑白名单
CREATE TABLE risk_lists (
    id              BIGSERIAL PRIMARY KEY,
    tenant_type     VARCHAR(20) NOT NULL,
    tenant_id       VARCHAR(64) NOT NULL,
    list_type       VARCHAR(20) NOT NULL,    -- BLACKLIST/WHITELIST/GREYLIST
    dimension       VARCHAR(20) NOT NULL,    -- CARD_HASH/BIN/IP/DEVICE/EMAIL
    value           VARCHAR(256) NOT NULL,
    enabled         BOOLEAN DEFAULT true,
    expires_at      TIMESTAMPTZ,
    reason          VARCHAR(256),
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ========== 事后风控 ==========

-- Chargeback 案件
CREATE TABLE chargeback_cases (
    id              BIGSERIAL PRIMARY KEY,
    txn_id          VARCHAR(64) NOT NULL,
    merchant_id     VARCHAR(64) NOT NULL,
    iso_id          VARCHAR(64) NOT NULL,
    card_brand      VARCHAR(10) NOT NULL,
    reason_code     VARCHAR(10) NOT NULL,
    amount          DECIMAL(12,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'USD',
    status          VARCHAR(20) NOT NULL,    -- RECEIVED/UNDER_REVIEW/REPRESENTED/WON/LOST/ARBITRATION
    deadline        TIMESTAMPTZ NOT NULL,
    received_at     TIMESTAMPTZ NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 人工审核标注
CREATE TABLE review_tasks (
    id              BIGSERIAL PRIMARY KEY,
    txn_id          VARCHAR(64) NOT NULL,
    risk_score      INT NOT NULL,
    triggered_rules JSONB,
    assigned_to     VARCHAR(64),
    status          VARCHAR(20) DEFAULT 'PENDING',
    label           VARCHAR(20),             -- LEGIT/FRAUD/SUSPICIOUS
    fraud_type      VARCHAR(64),
    reviewer_note   TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    reviewed_at     TIMESTAMPTZ
);

-- 风控案件管理
CREATE TABLE risk_cases (
    id              BIGSERIAL PRIMARY KEY,
    case_type       VARCHAR(30) NOT NULL,    -- FRAUD_TXN/MERCHANT_VIOLATION/CHARGEBACK_EXCEED/COMPLIANCE
    priority        VARCHAR(5) NOT NULL,     -- P0/P1/P2/P3
    merchant_id     VARCHAR(64),
    iso_id          VARCHAR(64),
    title           VARCHAR(256) NOT NULL,
    description     TEXT,
    status          VARCHAR(20) DEFAULT 'OPEN',
    assigned_to     VARCHAR(64),
    deadline        TIMESTAMPTZ,
    resolution      TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    closed_at       TIMESTAMPTZ
);

-- 自动化处置执行记录
CREATE TABLE auto_action_log (
    id              BIGSERIAL PRIMARY KEY,
    trigger_event   VARCHAR(64) NOT NULL,
    target_type     VARCHAR(20) NOT NULL,    -- MERCHANT/BIN/IP/CARD
    target_id       VARCHAR(128) NOT NULL,
    action_taken    VARCHAR(64) NOT NULL,
    previous_value  TEXT,
    new_value       TEXT,
    auto_revert_at  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ========== 审计日志（PCI DSS，仅 INSERT，禁止 UPDATE/DELETE） ==========

CREATE TABLE audit_log (
    id              BIGSERIAL PRIMARY KEY,
    event_type      VARCHAR(64) NOT NULL,    -- RULE_CHANGE/LIST_CHANGE/MERCHANT_STATUS_CHANGE/LOGIN/DECISION/...
    actor_type      VARCHAR(20) NOT NULL,    -- USER/SYSTEM/API
    actor_id        VARCHAR(64) NOT NULL,
    tenant_type     VARCHAR(20),
    tenant_id       VARCHAR(64),
    resource_type   VARCHAR(64),
    resource_id     VARCHAR(128),
    action          VARCHAR(20) NOT NULL,    -- CREATE/UPDATE/DELETE/READ/LOGIN/LOGOUT
    detail          JSONB,                   -- 变更前后的完整快照
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_log_time ON audit_log(created_at);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id, created_at);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id, created_at);
-- REVOKE UPDATE, DELETE ON audit_log FROM app_user;
```

### 15.2 Redshift

```sql
-- 交易风控决策日志
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
    ROUND(SUM(CASE WHEN decision = 'DECLINE' THEN 1 ELSE 0 END)::DECIMAL
          / NULLIF(COUNT(*), 0) * 100, 2) AS decline_rate,
    SUM(CASE WHEN decision = 'REVIEW' THEN 1 ELSE 0 END) AS review_count
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
    FROM chargeback_cases GROUP BY merchant_id, DATE_TRUNC('month', received_at)
) c ON m.merchant_id = c.merchant_id AND m.txn_month = c.cb_month;
```

---

## 十六、性能设计

目标：风控决策 P99 < 50ms

```
交易请求进入
    │
    ├─ 并行执行 ──┬── 黑白名单查询 (Redis, ~1ms)
    │             ├── Velocity 查询 & 更新 (Redis, ~2ms)
    │             ├── 关联分析查询 (Redis, ~2ms)
    │             └── 规则表达式求值 (内存, ~5ms)
    │
    ▼
  汇总决策 (~1ms)
    │
    ▼
  智能建议映射 (内存, ~1ms)
    │
    ▼
  异步写日志 (EventBridge, 不阻塞响应)
```

关键优化：
- 规则编译后缓存，变更时热加载
- 黑白名单 Bloom Filter 一级过滤
- 决策日志异步写入 EventBridge → SQS → Lambda → Redshift
- 模型推理走 SageMaker Endpoint，P99 < 20ms
- 幂等缓存避免重复计算

---

# 第四部分：交付规划

## 十七、资源预估

| AWS 服务 | 规格 | 预估月成本 |
|---------|------|-----------|
| Aurora PostgreSQL | db.r6g.xlarge, 1写+2读 | ~$1,500 |
| ElastiCache Redis | cache.r6g.large, 3节点 | ~$800 |
| Redshift Serverless | 8 RPU 基础 | ~$500-1,500 |
| EventBridge | Custom Event Bus, 7 Rules | ~$15 |
| SQS | 标准队列 × 9 + DLQ × 9 | ~$5 |
| Lambda | 事件处理函数 × 8 | ~$30 |
| EKS | 3-5 × m6i.xlarge | ~$800 |
| SageMaker | 训练按需 + 推理 ml.m5.large | ~$300 |
| S3 | 标准存储 | ~$50 |
| **合计** | | **~$4,000-5,000/月** |

随交易量弹性伸缩。

---

## 十八、实施计划

### 第一期 MVP（第 1-3 月）

**事前风控：**
- 商户入网 KYC/KYB 流程、入网风险评分卡
- MCC 准入策略、商户协议风控条款
- 试运营期管控

**事中风控：**
- 风控引擎核心：规则引擎 + Velocity + 黑白名单
- 规则加权评分（非 ML）
- 降级策略 + 幂等性

**事后风控：**
- 人工审核工作台
- 基础 Chargeback 接收 & 管理流程
- 特征采集存储（为后续模型训练积累数据）

**合规：**
- OFAC 筛查、审计日志

### 第二期 智能化（第 4-6 月）

**事中增强：**
- 试卡攻击防护、关联分析引擎、交易上下文校验

**评分模型：**
- XGBoost/LightGBM 模型上线
- SageMaker 自动训练管道
- 模型 Shadow 模式 & 灰度发布

**事后增强：**
- Chargeback 完整争议流程（Representment、Pre-Arb）
- 拒付率实时监控 & 自动预警
- 退款/资金异常监控
- 案件管理工作流

### 第三期 深度演进（第 7-12 月）

**模型演进：**
- XGBoost / LightGBM 持续优化（特征工程迭代、模型调参、A/B 测试）

**事后深化：**
- 批量交易回溯分析能力
- 商户定期复审自动化（季度/年度）

**平台能力：**
- 高级合规：SAR 自动生成、CTR 上报
- 多维度报表 & BI 仪表盘（QuickSight / Grafana 嵌入）

---

# 附录：能力 × 阶段映射矩阵

```
                        事前           事中           事后
                     (准入预防)     (实时决策)     (监控追溯)
                    ──────────    ──────────    ──────────
规则引擎              ✓             ✓             ✓
(第六章)           入网评分规则    交易风控规则    监控告警规则
                                               规则效果分析

Velocity 引擎                      ✓             ✓
(第七章)                        实时频率检测    异常检测基础数据

黑白名单引擎          ✓             ✓             ✓
(第八章)           MATCH/TMF     实时匹配拦截   案件结论→加黑名单

评分模型                           ✓
(第九章)                        实时风险打分
                               (数据来源依赖事后标签)

关联分析引擎                       ✓             ✓
(第十章)                        实时关联检测    团伙欺诈发现

智能闭环                           ✓             ✓
(第十一章)                      模型热加载     标注→训练→更新

降级/幂等/事件总线(EventBridge)     ✓             ✓
(第十二章)                      降级+幂等      事件驱动联动
```
