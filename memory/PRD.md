# Qlub · LA Market Intelligence Dashboard — PRD

## Original Problem
Port the Market Intelligence Dashboard for Qlub (instant restaurant bill-pay) from Google AI Studio to Emergent. Real LA restaurant data, zero hallucinations, Voice of Customer dashboard with citeable real quotes, Restaurant Expo with filters (region, cuisine, POS, valuation).

## Product Requirements
- React 19 + Tailwind + FastAPI + Mongo
- Gated login (email + password) — `la@qlub.com / qlub2026`
- Pages: Overview (with 1-liner tooltips), ICP (generic attributes only), Voice of Customer (static data, 3 nested filters, export to CSV/PDF/XLSX, Pitch Generator only when 1 restaurant selected), Restaurant Expo (POS + valuation filter + source panel + "How we classify a Qlub Prospect" explainer), Marketing Insights
- All VoC / Expo data sourced via Gemini googleSearch grounding baked into static JSON (no runtime hallucination)
- Only show POS system when a real public citation was found — otherwise "POS not detected"

## Qlub Prospect Logic (exposed in Expo source panel)
A venue is a Qlub Prospect when it meets ALL three:
1. Sit-down / full-service restaurant (Qlub is pay-at-table)
2. Modern POS that exposes an integration (Toast, Micros, Square, Clover, Aloha, TouchBistro) OR venue format fits + POS unverified (SDR can verify in a 2-min call)
3. Public reviews show ≥1 close-out / billing / wait-time pain point (the exact friction Qlub removes)

Cash-only / food-truck / pop-up venues are marked "Anti-Segment".

## Implemented
- **2026-01** — Initial MVP + Overview with tooltips, ICP refactor, Gemini-grounded voc_dataset.json (25 restaurants)
- **2026-02-22** — Voice of Customer UI redesign (ReviewCard grid + Outreach Agent sidebar)
- **2026-02-23** — User-requested changes:
  - Login now requires **email + password** (`la@qlub.com / qlub2026`); backend accepts optional email for backward compat
  - **Restaurant Expo** — added **Valuation** column (from curated public revenue estimates), shown in table + detail modal + exports
  - **Expo source panel** — added collapsible "How we classify a Qlub Prospect" explainer
  - **VoC dataset expanded** 25 → 52 restaurants, 92 → 211 real cited quotes across 6 LA regions (DTLA, Westside, Hollywood, Midtown & Wilshire, Eastside, Valley & Pasadena)
  - **VoC filters now only expose restaurants with ≥1 real quote** so every combination shows data
  - **VoC Pitch Generator locked unless a specific restaurant is selected** (button shows "Select a Restaurant" + lock icon when on "All")
  - **VoC exports**: added **PDF** and **XLSX** alongside existing CSV
  - Build script (`scripts/build_voc_dataset.py`) now saves incrementally + skips cached entries so Gemini quota isn't re-burned

## Backlog
- Broader geo expansion into Orange County / San Diego
- Add cuisine/segment × valuation cross-tab on Marketing Insights
- Send outreach email directly via Gmail/Resend rather than copy-paste

## Key files
- `/app/backend/server.py`
- `/app/backend/data/voc_dataset.json` — 52 restaurants, 211 real cited quotes
- `/app/backend/data/no_pos_segment.json` — 15 cash-only / truck venues
- `/app/backend/scripts/build_voc_dataset.py` — idempotent, incremental Gemini hydrator
- `/app/frontend/src/pages/VoiceOfCustomer.jsx`
- `/app/frontend/src/pages/RestaurantExpo.jsx`
- `/app/frontend/src/components/Login.jsx`

## Credentials
See `/app/memory/test_credentials.md`.
