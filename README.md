# SUNBAY Payment Risk Control Platform

> Enterprise-grade payment risk SaaS platform for acquirers, ISOs, and merchants in the US market.

## Project Structure

```
payment-riskcontrol/
├── docs/
│   ├── system-design-v3.md          # Backend system design (current)
│   ├── system-design-v2.md          # Backend system design (previous)
│   ├── device-risk-design.md        # Device risk extension design
│   ├── device-risk-frontend-changelog.md  # Device risk frontend changelog
│   ├── frontend-prd.md              # Frontend PRD (24 pages, 5 roles)
│   └── prototype-dev-plan.md        # Prototype development plan
├── sunbay-risk-ui/                   # Frontend prototype (React)
│   ├── src/
│   │   ├── pages/                   # 24 page components
│   │   ├── components/              # Shared UI components
│   │   ├── mock/                    # Mock data (30+30 rules, 200 txns, 8 devices)
│   │   └── index.css                # 3 themes + animations
│   └── package.json
└── stitch_utilitarian_terminal_prd/  # Reference design assets
```

## System Design

Three-phase risk control architecture:

- **Pre-Transaction**: KYC/KYB, MCC admission, onboarding scorecard, trial period
- **In-Transaction**: Rule engine + Velocity + Blacklist + ML scoring + Link analysis, P99 < 50ms
- **Post-Transaction**: Chargeback management, merchant lifecycle, case management, compliance
- **Device Risk**: Device attestation, geofence, SoftPOS security (COTS/Dedicated/POS), 30 default rules

Key tech decisions:
- Event bus: Amazon EventBridge + SQS + Lambda
- Decision log ingestion: EventBridge → Data Firehose → Redshift
- Data sync: Aurora MySQL → Redshift via Zero-ETL
- Model hot-reload: Redis Pub/Sub broadcast to all EKS pods
- Estimated cost: ~$4,000-5,000/month for 100K-500K daily transactions

## Frontend Prototype

### Quick Start

```bash
cd sunbay-risk-ui
npm install
npm run dev
```

Open http://localhost:5173

### Features

**24 Pages** covering the full risk control workflow:

| Module | Pages |
|--------|-------|
| Dashboard | Real-time KPIs, transaction trends, chargeback rate, risk rankings |
| Review Workbench | Split-pane queue, keyboard shortcuts (A/R/↑↓), risk context |
| Rule Engine | Multi-tenant tree, visual condition builder, sandbox testing |
| List Management | Blocklist/Allowlist/Greylist CRUD with add/remove |
| Velocity Config | Counter threshold editing, add/delete custom counters |
| Transaction Ledger | High-density table, JSON inspector drawer |
| Merchant Management | Onboarding review, scorecard, lifecycle, risk parameters |
| Chargeback | Dispute workflow, timeline, CB rate monitoring with threshold lines |
| Case Management | P0-P3 priority, investigation timeline |
| Model Governance | Registry, monitoring (PSI/AUC/Precision/Recall), Shadow comparison |
| Reports | Platform/ISO/Merchant/Model reports with charts |
| Audit Log | Read-only log with JSON diff expansion |

**3 Themes** — click the theme button in the top nav to cycle:

| Theme | Style |
|-------|-------|
| ☀ Swiss | White background, Swiss rationalist, 0px radius, high-density |
| ◆ Cyber | Deep blue-black, cyan glow, glassmorphism |
| ⬡ Matrix | Pure black, green phosphor, scrolling scan lines |

**AI Assistant** — click the lightning seam on the right edge or press `⌘K`:

- Context-aware suggestions per page
- Typewriter response with data highlighting
- Fractal lightning border animation (Canvas 2D)
- Aurora flow prompt cards
- Covers: risk queries, rule suggestions, review assistance, anomaly analysis, model diagnostics

**28 Field Definitions** — click `?` next to any metric for formula and explanation (Risk Score, AUC, PSI, CB Rate, AVS, CVV, Priority, etc.)

**Animations** (all themes):
- Page fade-in, KPI card staggered pop, table row cascade
- Chart line draw-in, area fade, bar grow
- Danger value pulse, status dot breathing, timeline dot pulse
- KPI scan line, button hover lift, tooltip entrance

### Mock Data

| Data | Count | Coverage |
|------|-------|----------|
| Risk Rules | 30 | Platform 8 + ISO 10 + Merchant 7 + Suggestions 5 |
| Transactions | 200 | 85% APPROVE, 10% REVIEW, 5% DECLINE |
| Merchants | 15 | All risk levels, statuses, MCCs |
| Chargebacks | 12 | Full status lifecycle (Visa + MC) |
| Cases | 8 | P0-P3, all types |
| Models | 5 | Training → Shadow → Production → Retired |
| Blacklists | 20 | IP/Card/Device/Email/BIN dimensions |
| Audit Logs | 15 | Rule/list/merchant/model/login events |

### Tech Stack

- React 19 + React Router
- Tailwind CSS v4
- Recharts (charts)
- Lucide React (icons)
- Canvas 2D (fractal lightning)
- Vite 8

## License

Proprietary — SUNBAY Inc.
