# 收单支付 SaaS 平台 — 风控系统技术设计

> 版本: v4.1
> 日期: 2026-05-07
> 受众: 后端开发、架构师

---

## 目录

- 一、核心处理流程
- 二、规则引擎技术实现
- 三、Velocity 引擎
- 四、黑白名单引擎
- 五、关联分析引擎
- 六、设备风控集成
- 七、通用能力（降级、幂等、配置广播、日志投递）
- 八、系统架构
- 九、技术栈
- 十、数据库设计
- 十一、性能设计

---

## 一、核心处理流程

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
│       │     ├── 名单引擎: Bloom+Redis 黑白名单检查             │   │
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
│       │       risk_score += rule.score_weight               │   │
│       │                                                     │   │
│       │       // 决策逻辑                                    │   │
│       │       IF rule.action.decision == DECLINE:           │   │
│       │         finalDecision = DECLINE                     │   │
│       │         reasonCode = rule.reasonCode                │   │
│       │         RETURN 短路终止 (L1/L2层强制)                │   │
│       │                                                     │   │
│       │       // NONE/APPROVE: 继续累积评分和建议            │   │
│       │                                                     │   │
│       │     ELSE: 规则未命中，继续下一条规则                  │   │
│       └─────────────────────────────────────────────────────┘   │
│                                                                 │
│   // 层级执行完毕后，检查评分阈值                                  │
│   IF risk_score >= tenant.decline_threshold:                    │
│     finalDecision = DECLINE                                     │
│     reasonCode = "SCORE_THRESHOLD_EXCEEDED"                     │
│                                                                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │ 汇总结果
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ ④ 决策汇总与输出                                                  │
│    ├── 合并触发规则列表: triggeredRules[]                         │
│    ├── 合并智能建议: suggestions[] (REQUIRE_3DS, REQUIRE_PIN...)  │
│    ├── 最终决策: APPROVE / DECLINE                               │
│    ├── 原因码: reason_code (首个DECLINE规则或阈值超限)            │
│    └── 风险评分: risk_score (规则加权累加)                          │
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
    int riskScore;               // 风险评分(0-100)
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
    VELOCITY, VELOCITY_AMOUNT, BLACKLIST, WHITELIST,
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
    "condition_groups": [
        {
            "logic": "AND",
            "conditions": [
                {"type": "txn.amount", "operator": ">", "value": 5000},
                {"type": "card.issuer_country", "operator": "!=", "value": "US"}
            ]
        }
    ],
    "group_logic": "AND",
    "action": {
        "decision": "DECLINE",
        "score_weight": 0,
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
            "logic": "AND",
            "conditions": [
                {"type": "txn.amount", "operator": ">", "value": 1000},
                {"type": "card.issuer_country", "operator": "!=", "value": "US"}
            ]
        },
        {
            "logic": "OR",
            "conditions": [
                {"type": "velocity.count", "params": {"dimension": "card_hash", "window": "1h"}, "operator": ">", "value": 5},
                {"type": "list.blacklist", "field": "ip"}
            ]
        }
    ],
    "group_logic": "OR"
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


---

## 三、Velocity 引擎

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


---

## 四、黑白名单引擎

> 贯穿事中（实时匹配）和事后（异常检测结论加入黑名单）。

### 7.1 名单维度与类型

- 维度：卡号 hash / IP（支持 CIDR）/ 邮箱 / 设备指纹 / 手机号 / 商户 ID
- 类型：
  - `BLACKLIST`：直接拒绝
  - `WHITELIST`：跳过规则检查
- 租户隔离：平台级（全局）+ ISO 级 + Merchant 级
- 支持过期时间（临时封禁场景）

### 7.2 性能优化

- Redis 缓存全量名单，查询延迟 < 1ms
- Bloom Filter 做一级过滤，减少 Redis 穿透
- 名单变更时 config_versions.LISTS version++，各 Pod 轮询发现后刷新缓存

---

---

## 五、关联分析引擎

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


---

## 六、设备风控集成

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


---

## 七、通用能力（降级、幂等、配置广播、日志投递）

### 11.1 降级策略

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

### 11.2 幂等性设计

- 每笔交易请求携带唯一 `request_id`
- Redis 记录 `idempotent:{request_id}` → 决策结果，TTL 24h
- 重复请求直接返回缓存的决策结果，不重复执行规则和更新 Velocity 计数器

### 11.3 配置变更广播（轮询 + 版本号）

> 替代 EventBridge + SQS + Lambda 事件总线方案，用最简单的轮询机制实现配置同步。

版本号表：

```sql
CREATE TABLE config_versions (
    config_type VARCHAR(20) PRIMARY KEY,  -- RULES / LISTS
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

如果远端版本 > 本地版本 → 重新加载该类配置
如果相等 → 跳过
```

变更触发：
- 规则新增/编辑/删除 → `UPDATE config_versions SET version = version + 1 WHERE config_type = 'RULES'`
- 名单变更 → LISTS version++

设计优势：
- 零额外基础设施依赖（只用 Aurora，已有）
- 实现极简（一个定时任务 + 一张表）
- 5-10 秒配置生效延迟，对规则变更场景完全可接受
- 无消息丢失问题（轮询天然可靠）

### 11.4 决策日志投递（Firehose 直投）

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

---

## 八、系统架构

### 12.1 整体架构

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
│  Redis    │ │  MySQL   │              │ Serverless │  │ S3 (归档)         │
└───────────┘ └──────────┘              └────────────┘  └──────────────────┘

┌────────────────┐
│ Data Firehose  │  ← 决策日志直投 Redshift (第十一章 11.4)
└────────────────┘
```

与 v3 的关键差异：
- 去掉 Merchant Onboarding Service 和 Merchant Config Service（商户管理由外部系统负责）
- 新增 Device Risk Service（设备风控）
- 去掉 Case & Monitoring Service 中的案件管理 → 改为纯 Monitoring Service
- Chargeback Service 提供数据导入和争议流程跟踪（状态流转 + 拒付率监控）
- 去掉 EventBridge + SQS + Lambda 事件总线层 → 改为轮询 + 版本号 + Firehose 直投

### 12.2 数据流转全链路

```
交易请求
    │
    ▼
Transaction Service
    │
    ├──→ ElastiCache Redis (Velocity 查询/更新, 黑白名单缓存)
    ├──→ 内存 (规则求值, 规则从 Aurora 加载并缓存)
    │
    ▼
  决策结果返回 (<50ms)
    │
    ├──→ Firehose PutRecord (异步) → 自动攒批 → Redshift

审核完成 → Aurora (更新标签) → Redshift (每日回填 label)
```

### 12.3 数据存储分层

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

归档存储
  └── S3
      历史交易归档(Parquet)
```

---

## 九、技术栈

### 13.1 应用层

| 组件 | 选型 | 理由 |
|------|------|------|
| 后端语言 | Java 21 (Spring Boot 3) | 收单行业主流，生态成熟 |
| 规则引擎 | 原子条件组合 | 简洁高效 |
| API 协议 | REST | 对外对内统一 REST，简化技术栈 |

### 13.2 数据层

| 组件 | AWS 服务 | 用途 |
|------|---------|------|
| 热数据 | ElastiCache Redis Cluster | Velocity 计数器、黑白名单缓存、幂等 Key、关联分析计数器 |
| 业务主库 | Aurora MySQL | 规则配置、租户信息、Chargeback 争议记录、审计日志 |
| 分析仓库 | Redshift Serverless | 交易流水、风控决策日志、特征快照、统计报表 |
| 归档存储 | S3 | 历史交易归档(Parquet) |
| 流式导入 | Amazon Data Firehose | 决策日志直投 Redshift |
| 数据同步 | Aurora Zero-ETL | Aurora 业务数据近实时同步到 Redshift |
| 运维告警 | SNS | 告警通知推送 |

### 13.3 基础设施

| 组件 | AWS 服务 | 说明 |
|------|---------|------|
| 容器编排 | EKS (Kubernetes) | 服务部署、弹性伸缩 |
| CI/CD | CodePipeline + CodeBuild | 持续集成部署 |
| 监控 | CloudWatch + Prometheus + Grafana | 业务指标 + 系统指标 |
| 密钥管理 | Secrets Manager | PCI DSS 要求 |
| 网络 | VPC + PrivateLink | 数据库不暴露公网 |

---

## 十、数据库设计

### 14.1 Aurora MySQL

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
    condition_groups JSON NOT NULL            COMMENT '条件组合JSON: {condition_groups:[...], group_logic:"AND/OR"}',
    action          VARCHAR(20) NOT NULL     COMMENT 'NONE/APPROVE/DECLINE',
    score_weight    INT NOT NULL DEFAULT 0   COMMENT '规则命中时累加的评分权重(正整数)',
    suggestions     JSON                     COMMENT '["REQUIRE_3DS"]',
    reason_code     VARCHAR(64),
    enabled         TINYINT(1) DEFAULT 1,
    version         INT NOT NULL DEFAULT 1,
    created_at      DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 规则模板
CREATE TABLE rule_templates (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    template_name   VARCHAR(128) NOT NULL,
    source          VARCHAR(20) NOT NULL     COMMENT 'PLATFORM/ISO',
    source_id       VARCHAR(64)              COMMENT 'ISO ID, PLATFORM则为null',
    description     VARCHAR(512),
    mcc_scope       VARCHAR(20) DEFAULT 'ALL' COMMENT 'ALL/HIGH_RISK/LOW_RISK/CUSTOM',
    rules_snapshot  JSON NOT NULL            COMMENT '规则集快照',
    version         INT NOT NULL DEFAULT 1,
    created_at      DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_template_source ON rule_templates(source, source_id);

-- 租户风控配置（阈值等）
CREATE TABLE tenant_risk_config (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_type     VARCHAR(20) NOT NULL     COMMENT 'PLATFORM/ISO',
    tenant_id       VARCHAR(64) NOT NULL,
    decline_threshold INT NOT NULL DEFAULT 70 COMMENT 'risk_score >= 此值则DECLINE',
    created_at      DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_tenant (tenant_type, tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 黑白名单
CREATE TABLE risk_lists (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_type     VARCHAR(20) NOT NULL     COMMENT 'PLATFORM/ISO/MERCHANT',
    tenant_id       VARCHAR(64) NOT NULL,
    list_type       VARCHAR(20) NOT NULL     COMMENT 'BLACKLIST/WHITELIST',
    dimension       VARCHAR(20) NOT NULL     COMMENT 'CARD_HASH/IP/EMAIL/DEVICE_ID/PHONE/MERCHANT_ID',
    value           VARCHAR(256) NOT NULL,
    enabled         TINYINT(1) DEFAULT 1,
    expires_at      DATETIME(3),
    reason          VARCHAR(256),
    created_at      DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 配置版本号（轮询广播机制）
CREATE TABLE config_versions (
    config_type VARCHAR(20) PRIMARY KEY      COMMENT 'RULES/LISTS',
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

-- 规则豁免（商户×规则）
CREATE TABLE rule_exemptions (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    merchant_id     VARCHAR(64) NOT NULL,
    rule_id         BIGINT NOT NULL,
    reason          VARCHAR(256),
    created_by      VARCHAR(64) NOT NULL,
    expires_at      DATETIME(3),
    created_at      DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_merchant_rule (merchant_id, rule_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_exemption_merchant ON rule_exemptions(merchant_id);
CREATE INDEX idx_chargeback_txn ON chargeback_records(txn_id);
CREATE INDEX idx_chargeback_merchant ON chargeback_records(merchant_id, received_at);
```

### 14.2 Redshift

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
    features        SUPER,
    label           VARCHAR(20),
    label_source    VARCHAR(20),
    event_date      DATE
)
DISTSTYLE KEY DISTKEY(merchant_id) SORTKEY(event_date, txn_time);

-- 商户风控指标日聚合视图
CREATE VIEW v_merchant_daily_metrics AS
SELECT
    merchant_id, iso_id, event_date,
    COUNT(*) AS txn_count,
    SUM(amount) AS txn_amount,
    AVG(amount) AS avg_amount,
    SUM(CASE WHEN decision = 'DECLINE' THEN 1 ELSE 0 END) AS decline_count,
    ROUND(SUM(CASE WHEN decision = 'DECLINE' THEN 1 ELSE 0 END)::DECIMAL
          / NULLIF(COUNT(*), 0) * 100, 2) AS decline_rate
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

## 十一、性能设计

### 15.1 性能目标与延迟分解

目标：风控决策 P99 < 50ms

```
交易请求进入
    │
    ├─ 规则引擎编排执行 (~10ms)
    │     逐条求值原子条件组合 (内存, ~1ms/条)
    │     表达式内部按需调用子引擎:
    │     ├── 黑白名单查询 (Bloom Filter + Redis, ~1ms)
    │     ├── Velocity 查询 & 更新 (Redis, ~2ms)
    │     └── 关联分析查询 (Redis HyperLogLog, ~2ms)
    │     同一规则内多个函数调用通过 Redis Pipeline 并行
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
- 幂等缓存避免重复计算

---
