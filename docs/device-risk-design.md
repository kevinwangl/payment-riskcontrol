# 设备风控扩展方案

> 版本: v1.0
> 日期: 2026-04-07
> 状态: 方案设计阶段
> 基线: 基于 system-design-v3.md 扩展

---

## 目录

- 一、背景与目标
- 二、设计原则
- 三、设备分类模型
- 四、交易数据模型扩展
- 五、规则引擎扩展
- 六、Velocity 引擎扩展
- 七、默认设备风控规则集
- 八、前端扩展方案
- 九、数据库设计扩展
- 附录：设备条件字段完整清单

---

## 一、背景与目标

### 1.1 背景

当前风控系统（system-design-v3.md）聚焦于支付交易维度的风控决策，覆盖金额、频率、卡信息、商户属性等。随着 SoftPOS（Tap to Pay）在美国市场的普及，设备维度的风险成为新的攻击面：

- 消费级手机运行支付应用，设备环境不可控
- 设备地理位置与商户注册地址不一致
- 设备完整性被破坏（root/越狱、Hook 框架）
- 传统 POS 设备的固件篡改和物理攻击

### 1.2 目标

- 在现有交易风控基础上，增加设备维度的风险评估能力
- 消费支付平台已采集的设备数据，不重复管理设备生命周期
- 提供开箱即用的默认设备风控规则集
- 风控平台输出风险判定和建议，不直接执行交易决策

### 1.3 职责边界

```
支付平台（已有）                    风控平台（本方案扩展）
├── 设备注册与绑定                  ├── 消费设备上下文数据
├── 设备库存管理（TMS）             ├── 设备维度风险评估
├── 设备数据采集                    ├── 设备风控规则管理
├── 交易处理与授权                  ├── 风险判定输出（PASS/ALERT/WARNING/HIGH_RISK）
└── 根据风控输出执行决策             └── 记录、告警、模型优化
```

---

## 二、设计原则

### 2.1 风控平台输出模型

风控平台不直接做交易 APPROVE/DECLINE 决策，输出为风险判定级别：

| 输出类型 | 说明 | 支付平台典型处理 |
|---------|------|----------------|
| **PASS** | 未触发任何规则，风险正常 | 继续授权流程 |
| **ALERT** | 触发规则，记录 + 告警通知 | 通常放行，运营关注 |
| **WARNING** | 触发高风险规则，记录 + 告警 + 标记人工审核 | 可能进审核队列 |
| **HIGH_RISK** | 触发严重风险规则，记录 + 告警 + 强烈建议拒绝 | 通常拒绝 |

### 2.2 核心原则

- **记录**：每笔交易的设备风控决策日志完整留存
- **告警**：实时通知规则触发、阈值突破、异常模式
- **优化**：基于历史数据持续优化规则和模型（误报率、漏报率、规则效果分析）
- **决策权在支付平台**：风控平台是风险的眼睛和大脑，不是手

---

## 三、设备分类模型

### 3.1 设备类别

按硬件本质分为三类：

| 类别 | 代码 | 说明 | 典型设备 |
|------|------|------|---------|
| 认证金融终端 | `CERTIFIED_POS` | PCI PTS 认证的金融支付终端 | Ingenico APOS A8, Verifone VX520, PAX A920 |
| 专用商用设备 | `DEDICATED_DEVICE` | 非 PTS 认证的专用商用设备 | 扫码盒子、ECR、自助终端、商用平板 |
| 通用消费设备 | `COTS_DEVICE` | 通用消费级手机/平板 | iPhone, Samsung Galaxy, 普通 Android |

### 3.2 受理方式

SoftPOS 不是设备类别，而是交易的受理方式属性：

| 受理方式 | 代码 | 说明 |
|---------|------|------|
| 传统受理 | `TRADITIONAL` | 刷卡/插卡/挥卡，通过硬件终端 |
| SoftPOS | `SOFTPOS` | 通过设备上的支付软件受理 |
| 电商 | `ECOMMERCE` | 线上交易，无物理设备 |

### 3.3 组合场景与风险等级

| 设备类别 | 受理方式 | 场景 | 风险等级 |
|---------|---------|------|---------|
| CERTIFIED_POS | TRADITIONAL | 传统刷卡/插卡/挥卡 | 低 |
| DEDICATED_DEVICE | TRADITIONAL | 扫码盒子、ECR | 中低 |
| DEDICATED_DEVICE | SOFTPOS | 商用设备上跑 SoftPOS | 中 |
| COTS_DEVICE | SOFTPOS | 手机 Tap to Pay | 高 |

### 3.4 风险特征对比

| 风险维度 | CERTIFIED_POS | DEDICATED_DEVICE | COTS_DEVICE |
|---------|:---:|:---:|:---:|
| 硬件防篡改 | ✓ 物理防拆 | ✗ | ✗ |
| 环境可控性 | 高（封闭系统） | 中（可管控但开放） | 低（用户完全控制） |
| Root/越狱风险 | 无 | 低 | 高 |
| 设备共用风险 | 低（固定部署） | 低 | 高（个人手机） |
| 地理位置可信度 | 高（固定安装） | 中 | 低（随身移动） |

---

## 四、交易数据模型扩展

### 4.1 设备上下文字段

每笔交易从支付平台传入时，在现有 TransactionContext 基础上扩展设备字段：

```json
{
  "txn_id": "txn_20260407_xyz",
  "amount": 125.00,
  "currency": "USD",
  "merchant_id": "M_1001",
  "card_hash": "sha256_abc...",

  "device": {
    "device_id": "dev_a1b2c3",
    "device_category": "COTS_DEVICE",
    "acceptance_method": "SOFTPOS",
    "manufacturer": "Samsung",
    "model": "Galaxy S25",
    "os": "Android",
    "os_version": "16.0",
    "app_version": "2.3.1",
    "sdk_version": "1.8.0",

    "attestation": {
      "status": "VERIFIED",
      "provider": "PLAY_INTEGRITY",
      "verified_at": "2026-04-07T09:00:00Z",
      "integrity_token": "eyJ..."
    },

    "security": {
      "is_rooted": false,
      "tee_available": true,
      "debug_mode": false,
      "is_emulator": false,
      "hook_framework_detected": false,
      "is_personal_device": true
    },

    "location": {
      "lat": 37.7749,
      "lng": -122.4194,
      "accuracy_meters": 10,
      "source": "GPS"
    }
  }
}
```

### 4.2 CERTIFIED_POS 专有字段

```json
{
  "device": {
    "device_category": "CERTIFIED_POS",
    "firmware_version": "3.2.1",
    "pts_cert_expiry": "2027-06-30",
    "tamper_detected": false,
    "serial_number": "ING-A8-20240001"
  }
}
```

### 4.3 字段来源说明

| 字段 | 来源 | 说明 |
|------|------|------|
| device_id | 支付平台 TMS | 设备唯一标识 |
| device_category | 支付平台 TMS | 设备注册时确定 |
| acceptance_method | 支付平台交易路由 | 交易发起时确定 |
| attestation.* | 设备端 SDK 采集 | Google Play Integrity / Apple DeviceCheck |
| security.* | 设备端 SDK 采集 | 运行时环境检测 |
| location.* | 设备端 SDK 采集 | GPS/基站/WiFi 定位 |
| firmware_version | POS 终端上报 | 仅 CERTIFIED_POS |
| pts_cert_expiry | 支付平台 TMS | PCI PTS 认证有效期 |

---

## 五、规则引擎扩展

### 5.1 规则适用范围扩展

在现有 `tenant_type`（PLATFORM/ISO/MERCHANT）基础上，增加 `device_category` 维度：

```json
{
  "rule_id": "DEV-COTS-003",
  "name": "COTS设备Root检测",
  "tenant_type": "PLATFORM",
  "tenant_id": "PLATFORM",
  "device_category": "COTS_DEVICE",
  "condition": {
    "expr": "device.security.is_rooted == true"
  },
  "action": {
    "risk_level": "HIGH_RISK",
    "suggestions": ["BLOCK_DEVICE"]
  },
  "reason_code": "COTS_ROOTED"
}
```

`device_category` 取值：
- `CERTIFIED_POS` — 仅匹配认证金融终端
- `DEDICATED_DEVICE` — 仅匹配专用商用设备
- `COTS_DEVICE` — 仅匹配通用消费设备
- `ALL` — 匹配所有设备类别（默认）

### 5.2 DSL 表达式扩展

新增设备相关的字段引用和函数：

| 类型 | 示例 |
|------|------|
| 设备字段 | `device.security.is_rooted == true` |
| 鉴证字段 | `device.attestation.status == 'FAILED'` |
| 位置字段 | `device.location.lat`, `device.location.lng` |
| 地理围栏函数 | `geo_distance(device.location.lat, device.location.lng, merchant.lat, merchant.lng) > 50` |
| 鉴证过期计算 | `hours_since(device.attestation.verified_at) > 24` |

### 5.3 条件字段按设备类别动态过滤

前端规则编辑器根据 `device_category` 动态展示可用字段：

| 条件字段 | CERTIFIED_POS | DEDICATED_DEVICE | COTS_DEVICE |
|---------|:---:|:---:|:---:|
| firmware_version | ✓ | | |
| pts_cert_expiry | ✓ | | |
| tamper_detected | ✓ | | |
| attestation.status | | ✓ | ✓ |
| security.is_rooted | | ✓ | ✓ |
| security.tee_available | | ✓ | ✓ |
| security.debug_mode | | | ✓ |
| security.is_emulator | | | ✓ |
| security.hook_framework_detected | | | ✓ |
| security.is_personal_device | | | ✓ |
| os_version | | ✓ | ✓ |
| app_version | | ✓ | ✓ |
| app_integrity | | ✓ | ✓ |
| device_bindcheck | ✓ | ✓ | ✓ |
| location.* (geo_distance) | ✓ | ✓ | ✓ |
| manufacturer / model | ✓ | ✓ | ✓ |

---

## 六、Velocity 引擎扩展

### 6.1 新增设备维度计数器

在现有 Velocity 计数器（card/ip/device_fp/merchant）基础上，新增设备维度：

| 计数器 Key 模式 | 含义 |
|----------------|------|
| `vel:{device_id}:cnt:{window}` | 同设备交易次数 |
| `vel:{device_id}:amt:{window}` | 同设备交易累计金额 |
| `vel:{device_id}:distinct_card:{window}` | 同设备关联不同卡数 |
| `vel:{device_id}:distinct_merchant:{window}` | 同设备关联不同商户数 |

### 6.2 地理位置跳跃检测

```
Key: vel:{device_id}:last_location
Value: { lat, lng, timestamp }
```

每笔交易更新设备最后位置，计算与上一笔的距离和时间差：

```
distance = haversine(current_location, last_location)
time_diff = current_time - last_timestamp
speed = distance / time_diff

IF speed > 800 km/h THEN "不可能旅行"
```

### 6.3 DSL 函数扩展

| 函数 | 说明 | 示例 |
|------|------|------|
| `device_velocity(field, window)` | 设备维度频率查询 | `device_velocity('txn_count', '1h') > 50` |
| `device_distinct(field, window)` | 设备维度去重计数 | `device_distinct('card', '1h') > 10` |
| `device_location_jump(minutes)` | 设备位移距离(km) | `device_location_jump(30) > 500` |

---

## 七、默认设备风控规则集

> 平台预置规则，开箱即用。ISO/Merchant 可调整阈值，但不能关闭 HIGH_RISK 类规则。

### 7.1 CERTIFIED_POS 规则（5 条）

| 规则 ID | 规则名称 | 条件 | 风险级别 | 说明 |
|---------|---------|------|---------|------|
| DEV-POS-001 | PTS 认证过期 | `pts_cert_expiry < today` | HIGH_RISK | PCI PTS 过期设备 |
| DEV-POS-002 | 固件版本过低 | `firmware_version < min_required` | ALERT | 厂商已发布安全补丁未更新 |
| DEV-POS-003 | 设备防篡改告警 | `tamper_detected == true` | HIGH_RISK | 物理防拆机制触发 |
| DEV-POS-004 | 设备绑定不匹配 | `device_bindcheck == 'MISMATCH'` | HIGH_RISK | 设备不属于该商户 |
| DEV-POS-005 | 固定设备位置异常 | `geo_distance > 50km` | WARNING | POS 通常固定部署 |

### 7.2 DEDICATED_DEVICE 规则（7 条）

| 规则 ID | 规则名称 | 条件 | 风险级别 | 说明 |
|---------|---------|------|---------|------|
| DEV-DED-001 | 设备鉴证失败 | `attestation.status == 'FAILED'` | HIGH_RISK | 设备完整性校验未通过 |
| DEV-DED-002 | 设备鉴证过期 | `attestation.status == 'EXPIRED' AND hours_since(verified_at) > 24` | HIGH_RISK | 鉴证超 24h 未刷新 |
| DEV-DED-003 | Root/越狱检测 | `security.is_rooted == true` | HIGH_RISK | 设备已被 root |
| DEV-DED-004 | TEE 不可用(SoftPOS) | `security.tee_available == false AND acceptance_method == 'SOFTPOS'` | HIGH_RISK | SoftPOS 要求 TEE |
| DEV-DED-005 | 应用完整性异常 | `app_integrity == 'TAMPERED'` | HIGH_RISK | 支付应用被篡改 |
| DEV-DED-006 | OS 版本不支持 | `os_version < min_supported` | WARNING | 操作系统版本过低 |
| DEV-DED-007 | 设备绑定不匹配 | `device_bindcheck == 'MISMATCH'` | HIGH_RISK | 设备不属于该商户 |

### 7.3 COTS_DEVICE 规则（10 条，最严格）

| 规则 ID | 规则名称 | 条件 | 风险级别 | 说明 |
|---------|---------|------|---------|------|
| DEV-COTS-001 | 设备鉴证失败 | `attestation.status == 'FAILED'` | HIGH_RISK | 设备完整性校验未通过 |
| DEV-COTS-002 | 设备鉴证过期 | `attestation.status == 'EXPIRED' AND hours_since(verified_at) > 12` | HIGH_RISK | COTS 更严格，12h |
| DEV-COTS-003 | Root/越狱检测 | `security.is_rooted == true` | HIGH_RISK | |
| DEV-COTS-004 | TEE 不可用 | `security.tee_available == false` | HIGH_RISK | COTS 必须有 TEE |
| DEV-COTS-005 | 应用完整性异常 | `app_integrity == 'TAMPERED'` | HIGH_RISK | |
| DEV-COTS-006 | OS 版本不支持 | `os_version < min_supported` | HIGH_RISK | COTS 直接 HIGH_RISK |
| DEV-COTS-007 | 调试模式开启 | `security.debug_mode == true` | HIGH_RISK | 开发者模式/USB 调试 |
| DEV-COTS-008 | 模拟器检测 | `security.is_emulator == true` | HIGH_RISK | 非真实物理设备 |
| DEV-COTS-009 | Hook 框架检测 | `security.hook_framework_detected == true` | HIGH_RISK | Xposed/Frida 等 |
| DEV-COTS-010 | 设备绑定不匹配 | `device_bindcheck == 'MISMATCH'` | HIGH_RISK | |

### 7.4 跨类别通用规则（8 条，所有设备）

| 规则 ID | 规则名称 | 条件 | 风险级别 | 说明 |
|---------|---------|------|---------|------|
| DEV-ALL-001 | 设备黑名单 | `device_id IN device_blocklist` | HIGH_RISK | 已知欺诈/被盗设备 |
| DEV-ALL-002 | 地理围栏突破 | `geo_distance > merchant_geofence_radius` | WARNING | 超出商户围栏 |
| DEV-ALL-003 | 不可能旅行 | `device_location_jump(30) > 500` | HIGH_RISK | 30 分钟内位移不合理 |
| DEV-ALL-004 | 设备高频交易 | `device_velocity('txn_count', '1h') > 50` | WARNING | 单设备每小时交易过多 |
| DEV-ALL-005 | 设备多卡交易 | `device_distinct('card', '1h') > 10` | WARNING | 短时间刷太多不同卡 |
| DEV-ALL-006 | 设备多商户交易 | `device_distinct('merchant', '24h') > 3` | WARNING | 同一设备关联多商户 |
| DEV-ALL-007 | 制裁区域交易 | `geo_location IN sanctioned_regions` | HIGH_RISK | OFAC 制裁区域 |
| DEV-ALL-008 | 高风险区域交易 | `geo_location IN high_risk_regions` | ALERT | 已知欺诈高发区 |

### 7.5 规则汇总

| 类别 | 规则数 | HIGH_RISK | WARNING | ALERT |
|------|--------|-----------|---------|-------|
| CERTIFIED_POS | 5 | 3 | 1 | 1 |
| DEDICATED_DEVICE | 7 | 5 | 1 | 0 |（不含 ALERT 1 条）
| COTS_DEVICE | 10 | 9 | 0 | 0 |（不含 ALERT 1 条）
| 通用 | 8 | 3 | 3 | 1 |（不含 ALERT 1 条）
| **合计** | **30** | | | |

### 7.6 规则层级与覆盖

```
Platform 规则（本方案 30 条默认设备风控规则）
  └── ISO 规则（可调整 WARNING/ALERT 规则的阈值）
       └── Merchant 规则（可调整 WARNING/ALERT 规则的阈值）

HIGH_RISK 类规则：仅 Platform Admin 可修改，ISO/Merchant 不可覆盖
WARNING/ALERT 类规则：ISO/Merchant 可覆盖阈值（如围栏半径、频率上限）
```

---

## 八、前端扩展方案

> 不新增独立页面，设备信息嵌入现有页面展示。设备生命周期管理由支付平台 TMS 负责。

### 8.1 扩展清单

| 页面 | 扩展内容 | 优先级 |
|------|---------|--------|
| Rule Engine - 规则编辑器 | 新增 `device_category` 适用范围选择；条件构建器增加设备字段，按类别动态过滤 | P0 |
| Velocity Config | 增加 device 维度计数器模板（设备交易频率、设备多卡、位置跳跃） | P0 |
| Review Workbench | 风控上下文面板增加设备信息卡片（设备类型、鉴证状态、位置、安全环境） | P0 |
| Transaction Detail | 增加设备信息区块（设备基本信息 + 鉴证 + 安全 + 位置） | P1 |
| Merchant Detail | 增加 Devices tab，展示该商户关联设备列表和状态概览 | P1 |
| Dashboard | 增加设备风控 KPI（鉴证失败率、围栏触发率、设备风险分布） | P2 |
| Merchant Detail - 风控参数 | 增加地理围栏配置（中心点 + 半径），嵌入商户风控参数 tab | P2 |

### 8.2 Review Workbench 设备信息卡片

```
┌─ Device Context ──────────────────────────┐
│ Device ID:    dev_a1b2c3                  │
│ Category:     COTS_DEVICE                 │
│ Method:       SOFTPOS                     │
│ Model:        Samsung Galaxy S25          │
│                                           │
│ Attestation:  ● VERIFIED (2h ago)         │
│ TEE:          ● Available                 │
│ Root:         ● Not Detected              │
│ Debug:        ● Off                       │
│                                           │
│ Location:     37.7749, -122.4194 (GPS)    │
│ Geofence:     ● Within range (2.3 km)     │
└───────────────────────────────────────────┘
```

### 8.3 Mock 数据扩展

在现有 Mock 交易数据中扩展设备字段：

| 数据 | 扩展内容 |
|------|---------|
| transactions.js | 每笔交易增加 device 对象（覆盖三种设备类别） |
| rules.js | 新增 30 条设备风控规则 |
| merchants.js | 每个商户增加关联设备列表和围栏配置 |

---

## 九、数据库设计扩展

### 9.1 risk_rules 表扩展

在现有 `risk_rules` 表增加字段：

```sql
ALTER TABLE risk_rules
  ADD COLUMN device_category VARCHAR(20) DEFAULT 'ALL'
    COMMENT 'CERTIFIED_POS/DEDICATED_DEVICE/COTS_DEVICE/ALL',
  ADD COLUMN risk_level VARCHAR(20)
    COMMENT 'PASS/ALERT/WARNING/HIGH_RISK';
```

### 9.2 Velocity 计数器扩展

新增 Redis Key 模式（无需 MySQL 表变更）：

```
vel:{device_id}:cnt:{window}
vel:{device_id}:amt:{window}
vel:{device_id}:distinct_card:{window}
vel:{device_id}:distinct_merchant:{window}
vel:{device_id}:last_location → { lat, lng, ts }
```

### 9.3 决策日志扩展

决策日志（写入 Redshift）增加设备上下文字段：

```sql
-- Redshift 决策日志表扩展
ALTER TABLE decision_log
  ADD COLUMN device_id VARCHAR(64),
  ADD COLUMN device_category VARCHAR(20),
  ADD COLUMN acceptance_method VARCHAR(20),
  ADD COLUMN attestation_status VARCHAR(20),
  ADD COLUMN device_lat DECIMAL(10,6),
  ADD COLUMN device_lng DECIMAL(10,6),
  ADD COLUMN geo_distance_km DECIMAL(10,2),
  ADD COLUMN device_risk_flags JSON;
```

---

## 附录：设备条件字段完整清单

| 字段路径 | 类型 | 说明 | 适用设备类别 |
|---------|------|------|-------------|
| `device.device_id` | String | 设备唯一标识 | ALL |
| `device.device_category` | Enum | 设备类别 | ALL |
| `device.acceptance_method` | Enum | 受理方式 | ALL |
| `device.manufacturer` | String | 设备厂商 | ALL |
| `device.model` | String | 设备型号 | ALL |
| `device.os` | String | 操作系统 | DEDICATED / COTS |
| `device.os_version` | String | OS 版本 | DEDICATED / COTS |
| `device.app_version` | String | 支付应用版本 | DEDICATED / COTS |
| `device.sdk_version` | String | SDK 版本 | DEDICATED / COTS |
| `device.firmware_version` | String | 固件版本 | CERTIFIED_POS |
| `device.pts_cert_expiry` | Date | PTS 认证到期日 | CERTIFIED_POS |
| `device.serial_number` | String | 设备序列号 | CERTIFIED_POS |
| `device.tamper_detected` | Boolean | 防篡改告警 | CERTIFIED_POS |
| `device.attestation.status` | Enum | 鉴证状态（VERIFIED/DEGRADED/FAILED/EXPIRED） | DEDICATED / COTS |
| `device.attestation.provider` | String | 鉴证提供方（PLAY_INTEGRITY/DEVICE_CHECK） | DEDICATED / COTS |
| `device.attestation.verified_at` | DateTime | 最后鉴证时间 | DEDICATED / COTS |
| `device.security.is_rooted` | Boolean | Root/越狱检测 | DEDICATED / COTS |
| `device.security.tee_available` | Boolean | TEE 可用性 | DEDICATED / COTS |
| `device.security.debug_mode` | Boolean | 调试模式 | COTS |
| `device.security.is_emulator` | Boolean | 模拟器检测 | COTS |
| `device.security.hook_framework_detected` | Boolean | Hook 框架检测 | COTS |
| `device.security.is_personal_device` | Boolean | 是否个人设备 | COTS |
| `device.location.lat` | Decimal | 纬度 | ALL |
| `device.location.lng` | Decimal | 经度 | ALL |
| `device.location.accuracy_meters` | Int | 定位精度 | ALL |
| `device.location.source` | String | 定位来源（GPS/CELL/WIFI） | ALL |
