# 🏥 Shanti Care — Offline-First Hospital & Nursing Home Management

> Clinical-grade hospital + nursing home management system built for tier-2/3 Indian healthcare. Works fully offline. Deterministic safety engines. Multi-tenant SaaS on Cloudflare edge.

[![Live](https://img.shields.io/badge/live-shanti--care.pages.dev-0a7e3a?style=flat-square)](https://shanti-care.pages.dev)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](./LICENSE)
[![PWA](https://img.shields.io/badge/PWA-installable-5546ff?style=flat-square)](https://shanti-care.pages.dev)
[![Stack](https://img.shields.io/badge/stack-React%2018%20%C2%B7%20Vite%205%20%C2%B7%20Cloudflare-orange?style=flat-square)](#-tech-stack)

**🌐 Live:** https://shanti-care.pages.dev

---

## 🎯 What It Is

Shanti Care is a **fully offline-capable** hospital, nursing home, and OPD management system designed for facilities where the internet is unreliable — exactly the reality in tier-2 and tier-3 Indian cities. It pairs a complete HMS with **6 deterministic clinical safety engines** built on published medical standards (AHA, WHO, ADA, FDA, JNC-8, KDIGO, NHS ISBAR, NABH).

Not AI healthcare. **Rule-based, reproducible, auditable, citation-backed.**

---

## ✨ Features

### Clinical Safety Layer (6 Engines)

- **Drug Interaction Engine** — 5-pass screening: FDA rules + CYP450 metabolism + membrane transporters + opposing-forces + QT-prolongation synergy. 144+ Indian brand-to-generic mappings (Glycomet, Ecosprin, Domstal, Azithral...).
- **Vitals Analysis Engine** — WHO / AHA / ADA / JNC-8 thresholds with linear regression trending and cross-vital pattern detection (sepsis triad, hypoglycemic tachycardia, fluid overload).
- **Risk Scoring** — NEWS2, qSOFA, CHA₂DS₂-VASc, Morse Fall Scale, Braden Scale, Cardiorenal Syndrome, AGS Beers Criteria 2023.
- **Diet Advisor Engine** — 15 condition-specific profiles (diabetes, CKD, HF, Parkinson's, stroke, dementia, COPD, gout, cirrhosis, etc.) with drug-diet conflict detection.
- **ISBAR Shift Handover** — auto-generated from 24h of care data. Zero manual typing.
- **Clinical Decision Pipeline** — orchestrates all engines with causal alert suppression, drug-vitals fusion, and unified clinical narrative output.

### Hospital Management

- Multi-tenant SaaS — many facilities, isolated data per tenant
- 10+ RBAC roles — SuperAdmin, HospitalAdmin, Doctor, Nurse, Receptionist, Dispensary, Lab, Radiology, HomeCare, Billing, Patient, FamilyMember
- OPD + IPD workflows, e-prescriptions with real-time interaction checks
- Lab + radiology orders with abnormal value flagging
- Drug register (Schedule H/H1/X compliance), inventory, expiry tracking
- GST billing, invoices, partial payments, insurance claims
- Maternity module (PCPNDT-aware)
- Audit logs, consent management, duty roster, salary, visitor log
- Home care notes with wound photo uploads, family update feed

### Tech Differentiators

- **Offline-first** — full operation without internet, anywhere
- **LAN mode** — Express + SQLite + WebSocket on a ₹3,000 mini-PC. Real-time sync across all tablets on the hospital WiFi
- **Auto-discovery** — `LAN → Cloud → Offline`. Silent failover.
- **AES-256 encrypted IndexedDB** on every device
- **Workbox BackgroundSync** — offline writes queue locally and replay on reconnect
- **PWA installable** on any Android tablet
- **12 Indian languages** — Hindi, English, Marathi, Tamil, Telugu, Kannada, Gujarati, Bengali, Punjabi, Malayalam, Urdu, Odia

---

## 🛠️ Tech Stack

**Frontend** — React 18 · Vite 5 · React Router · i18next · Workbox · idb (IndexedDB) · lucide-react

**Cloud Backend** — Cloudflare Workers · Cloudflare Pages · D1 (SQLite at edge) · R2 (object storage)

**LAN Backend** — Express · better-sqlite3 · ws (WebSocket) · Node 18+

**Build / Deploy** — Vite · gh-pages · Wrangler · sharp (image processing)

---

## 🚀 Quick Start

```bash
git clone https://github.com/Sumntpathak/care-home-portal.git
cd care-home-portal/care-home
npm install
npm run dev
```

App opens at `http://localhost:5173`.

### Run the LAN server

```bash
cd server
npm install
npm start
```

LAN server runs on `http://localhost:8787`. Configure tablets to point at it via `VITE_LAN_URL=http://192.168.1.100:8787`.

---

## 📦 Deployment

### Cloudflare Pages

```bash
npm run build
npm run deploy:cf
```

### GitHub Pages

```bash
npm run deploy
```

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────┐
│   Frontend (React PWA)                         │
│   31 pages · 6 clinical engines                │
│   IndexedDB + AES-256                          │
│   Service Worker + BackgroundSync              │
└──────────────┬─────────────────────────────────┘
               │
   ┌───────────┴────────────┐
   │   Auto-Discovery       │
   │   LAN → Cloud → Offline│
   └─┬──────────────────┬───┘
     │                  │
┌────▼─────────┐  ┌─────▼──────────────┐
│ LAN Server   │  │ Cloudflare Workers │
│ Express +    │  │ + D1 + R2          │
│ SQLite + WS  │  │ (production cloud) │
└──────────────┘  └────────────────────┘
```

---

## 📂 Project Structure

```
care-home/
├── src/
│   ├── pages/          # 31 application pages
│   ├── components/     # Shared UI components
│   ├── utils/          # Clinical engines (6 files, 9,300+ LOC)
│   ├── api/            # API client (cloud + LAN)
│   ├── i18n/           # 12 Indian language packs
│   └── service-worker/ # Workbox + BackgroundSync
├── server/             # Express + SQLite LAN server
├── workers/            # Cloudflare Worker functions
└── design-system/      # Shanti Care design tokens + components
```

---

## 🩺 Clinical Standards Cited

Every alert in Shanti Care traces back to a published guideline:

WHO · AHA · ADA 2024 · JNC-8 · KDIGO · FDA · OpenFDA · RxNorm · Royal College of Physicians 2017 (NEWS2) · Singer M, JAMA 2016 (qSOFA) · ESC 2020 (CHA₂DS₂-VASc) · Morse JM 1989 · Braden BJ 1987 · Ronco C, JACC 2008 · DASH · GOLD · NOF · ACR · APA · EASL · ICMR-NIN · Movement Disorders Society · Alzheimer's Association · NHS ISBAR · NABH · ABDM · PCPNDT Act · DPDP Act 2023

---

## 🤝 Contributing

PRs welcome. Especially appreciated:
- New clinical guidelines (with citation)
- Indian regional language translations
- Edge cases from real ward experience
- Bug reports from live deployments

Open an issue first for major changes.

---

## 📄 License

MIT — see [LICENSE](./LICENSE)

---

## 👤 Author

**Sumant Pathak** — [@Sumntpathak](https://github.com/Sumntpathak)

Built with [Claude Code](https://www.anthropic.com/claude-code) and a multi-agent ticketing workflow. Co-architected with two MBBS intern doctors.
