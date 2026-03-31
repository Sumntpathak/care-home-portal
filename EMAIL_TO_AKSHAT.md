**Subject:** Shanti Care v3.0 — Clinical Intelligence Platform (Ready for Technical Review)

---

Hey Akshat,

Sharing the complete codebase for Shanti Care. This is the clinical intelligence platform we've been building — not just an HMS, but a deterministic clinical decision engine layered on a hospital management system.

**What to look at first:**

1. **Live product:** https://shanti-care.pages.dev
   - Landing page has 19 test cases running LIVE in your browser (scroll down)
   - Click any demo login button (Admin recommended) to explore the full app
   - Try the interactive drug checker: type "Warfarin" + "Aspirin" and watch the 5-pass engine fire

2. **GitHub repo:** https://github.com/Sumntpathak/care-home-portal
   - Clone and run locally: `npm install && npm run dev`
   - LAN server: `cd server && npm install && npm start`

---

### What's inside (the technical meat)

**6 Clinical Engines — 9,315 lines of deterministic logic:**

| Engine | Lines | What it does |
|--------|-------|-------------|
| Drug Interaction (5-pass) | 2,444 | CYP450 + P-glycoprotein + QT prolongation + opposing forces + FDA rules. 144+ Indian brand mappings. |
| Vitals Analysis | 1,060 | WHO/AHA/ADA standards + qSOFA sepsis + NEWS2 + cardiorenal syndrome + over-medication (Beers 2023) |
| Health/Diet Advisor | 1,850 | 15 condition-specific diet profiles + 7 drug-diet conflict rules + personalization hooks |
| Shift Handover (ISBAR) | 1,308 | Auto-generates NHS ISBAR handover from actual care data — zero manual input |
| Clinical Pipeline | 955 | Central brain: chains all engines with causal suppression, drug-vital fusion, temporal trends, theme detection |
| FDA/RxNorm Integration | 656 | Live API enrichment with 30-min cache and offline fallback |

**The "brain" architecture (clinicalPipeline.js):**
```
Patient → Vitals → Risk Scores → Temporal Trends → Cross-Vital Patterns
→ Drug-Vitals Fusion → Causal Alert Suppression → Theme Detection
→ Unified Narrative → Confidence Score → Simulation Preview
```

This is NOT a list of alerts. It's unified reasoning — "Tachycardia is caused by hypoglycemia, treat glucose first" instead of "Alert 1: Tachycardia. Alert 2: Hypoglycemia."

**Simulation engine (`simulateAddDrug`):**
Doctor types a drug name → engine predicts what will happen BEFORE prescribing. Runs the full 5-pass drug interaction check + Beers criteria + polypharmacy threshold on the simulated medication list.

---

### Architecture worth reviewing

| Layer | Tech | Files |
|-------|------|-------|
| Frontend | React 18 + Vite 5 (PWA) | 31 pages, 15 components |
| Offline | IndexedDB (19 stores, 14 AES-256-GCM encrypted) + sync queue + BackgroundSync | `src/lib/` |
| LAN Server | Express + SQLite + WebSocket | `server/` (JWT auth, double-dose protection, conflict detection) |
| Cloud | Cloudflare Workers + D1 | Deployed on Pages |
| Clinical | 6 engines in `src/utils/` | ~10K lines of clinical logic |

**Key files to start with:**
- `src/utils/drugInteractions.js` — the 5-pass engine (start here)
- `src/utils/clinicalPipeline.js` — the brain orchestrator
- `src/utils/vitalsEngine.js` — qSOFA, NEWS2, cardiorenal, Beers
- `src/lib/dataLayer.js` — offline-first cache + sync
- `server/index.js` — LAN server with JWT + WebSocket
- `PRODUCT_AUDIT.md` — complete audit document (paste into any LLM for independent review)

---

### What 3 AI auditors said (we submitted the full codebase)

**Gemini 2.5:** *"Your 5-pass architecture is a feature typically reserved for million-dollar enterprise systems like Epic or Cerner."* — Scored 9.5/10 clinical accuracy.

**Claude Opus:** *"P-glycoprotein transporter logic — almost no commercial HMS has this. This is a clinically serious product."*

**GPT-4:** *"You are already ahead of 90-95% of Indian HMS startups technically."* — Scored 5/5 engineering.

---

### How to test locally

```bash
git clone https://github.com/Sumntpathak/care-home-portal.git
cd care-home-portal
npm install
npm run dev          # Frontend at localhost:5173

# Optional: LAN server
cd server
npm install
npm start            # API at localhost:8787
```

**Demo login credentials (built-in):**
- Admin: `pathaksumnt4u@gmail.com` / `admin123`
- Doctor: `dr.meena` / `doc123`
- Nurse: `sunita` / `staff123`
- Reception: `neeta` / `staff123`
- Pharmacy: `amit` / `staff123`

---

### What I need from you

1. **Code review** — especially `drugInteractions.js` and `clinicalPipeline.js`. Is the 5-pass architecture sound? Any edge cases I'm missing?
2. **Architecture feedback** — the offline-first + LAN server + cloud fallback chain. Is this production-viable?
3. **Honest opinion** — is this worth building a company around, or should we pivot the clinical engine into an API product?

The `PRODUCT_AUDIT.md` file in the repo has the complete specification with exact line counts, test cases, and known limitations. It's designed to be copy-pasted into any LLM for independent audit.

Let me know when you've had a chance to look. Happy to do a screen share walkthrough.

— Sumant
