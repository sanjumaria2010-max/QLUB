# Market Intelligence Dashboard — Prompt Template

> Copy this template, fill in every `{{PLACEHOLDER}}`, then paste as your first message to E1 (or any full-stack coding agent). Everything in `{{ }}` is variable; everything outside is the working scaffold that produced the Qlub LA dashboard.

---

## 1. The one-line brief
Build a **{{PRODUCT_TYPE — e.g., market intelligence dashboard / lead-gen tool / competitive-analysis app}}** for **{{COMPANY_NAME}}** (a **{{COMPANY_ONE_LINER — e.g., instant restaurant bill-pay platform}}**). The dashboard is used by **{{PRIMARY_USER — e.g., SDRs, GTM analysts, founders}}** to **{{PRIMARY_JOB_TO_BE_DONE — e.g., qualify accounts, generate outreach, size the opportunity}}** in **{{TARGET_MARKET — e.g., Los Angeles restaurants}}**.

## 2. Design & tone
- **Stack**: React 19 + Tailwind + FastAPI + MongoDB (Emergent default).
- **Aesthetic**: {{DESIGN_VIBE — e.g., "soft, editorial, off-white paper with a purple accent"}}. Avoid AI-slop gradients. Use `soft-card` panels, generous spacing, one accent color.
- **Reference screenshots**: `{{ATTACH_ANY_MOCKS_OR_INSPO_URLS}}` — mimic layout, not colors.
- **Fonts**: {{FONT_STACK — default: heavy display font for H1, sans-serif body}}.
- **Icons**: `lucide-react` only. No emoji icons.

## 3. Pages (fill in / remove as needed)
1. **Overview** — one-page executive briefing. Key KPI tiles with **hover tooltips** giving a 1-line plain-English explanation of every metric. Include a density/geo map of `{{GEO_UNIT — e.g., LA neighborhoods, US states, categories}}`.
2. **ICP / Positioning** — six honest, generic target attributes + a hard **Anti-ICP** list. No fake scoring, no invented percentiles.
3. **{{PROSPECT_LIST_PAGE_NAME — e.g., Restaurant Expo / Company Directory / Deal Board}}** — a real, filterable table of prospects with these columns: `{{COLUMNS — e.g., Name, Region, Category, Valuation, Tech Stack, Segment}}`. Filters: `{{FILTER_1}}`, `{{FILTER_2}}`, `{{FILTER_3}}`, `{{FILTER_4}}`. Row-click opens a detail modal with source-cited evidence.
4. **Voice of Customer** — static grid of real, cited quotes about the prospects. Three nested filters: **Location → Prospect → Issue category**. Static snapshot — not live polling. Each quote card shows source, date, severity, prospect name, and a **VIEW** link to the origin URL.
5. **{{INSIGHTS_PAGE_NAME — e.g., Marketing Insights / Opportunity Sizing}}** — quantify the opportunity. Include a **Recovery / Opportunity Calculator** where the user slides `{{INPUT_1}}`, `{{INPUT_2}}`, `{{INPUT_3}}` and sees an annual dollar impact.

## 4. Data rules (strict — do NOT skip)
- **NO HALLUCINATIONS.** Every data point on every page must be either:
  (a) sourced from a real, citable URL, OR
  (b) explicitly labeled "not detected" / "unverified".
- **{{KEY_ATTRIBUTE — e.g., POS system, funding round, tech stack}}** must ONLY show a value when a real public citation exists. Otherwise: `"{{KEY_ATTRIBUTE}} not detected"`. No guessing.
- Bake the dataset into a **static JSON file** at `/app/backend/data/{{DATASET_NAME}}.json`, hydrated once via **Gemini googleSearch grounding**. The frontend reads the baked file — no live LLM calls except the per-click pitch generator.
- Create a build script at `/app/backend/scripts/build_{{DATASET_NAME}}.py` that:
  - iterates a curated list of ~50 real `{{PROSPECT_ENTITY — e.g., restaurants, SaaS companies, restaurants}}`
  - asks Gemini (with googleSearch tool) to return **structured JSON only**
  - **saves incrementally** and **skips cached entries** on re-runs (idempotent, doesn't re-burn quota)
- **Prospect classification logic** — expose the rule to the user in an expandable "How we classify a Prospect" panel. A prospect must meet all of: `{{RULE_1}}`, `{{RULE_2}}`, `{{RULE_3}}`. Anything else is "Anti-Segment".

## 5. Authentication
- **Gated login** with email + password. Backend `.env` holds `{{APP_PREFIX}}_LOGIN_EMAIL` and `{{APP_PREFIX}}_LOGIN_PASSWORD`.
- Save credentials to `/app/memory/test_credentials.md` immediately after seeding.

## 6. Outreach / Pitch Generator (feature)
- Live Gemini call (no grounding) that drafts a **subject + 120-word cold email** for one specific prospect.
- **LOCK the button** until the user narrows the filter to a **single prospect**. When locked, show "Select a {{PROSPECT_ENTITY}}" with a lock icon. When unlocked, show a personalized "Ready to draft for {{PROSPECT_NAME}}" panel.
- Email tone: `{{TONE — e.g., "confident-friendly", "warm", "direct"}}`.
- Copy-to-clipboard button in the modal.

## 7. Import / Export
- **Import Excel** on the prospect-list page — accept `.xlsx`, `.xls`, `.csv`. Map columns loosely: `{{IMPORT_COLUMNS}}`. Show a green "Imported N rows from filename" banner. "Clear Import" button reverts to the live dataset.
- **Exports** on every data view: **CSV + PDF + XLSX**. Use `jspdf` + `jspdf-autotable` for PDF, `xlsx` for spreadsheets.
- Icon semantics: **Upload** icon = arrow-out (exports); **Download** icon = arrow-in (imports). Enforce this everywhere.

## 8. Overall UX rules
- Every interactive element must have a **`data-testid`** in kebab-case describing its function.
- Every truncated text must have a native `title=` tooltip so hover reveals the full string.
- Sidebar contains: brand + nav pills + "How to Use" links (HTML + PDF) + Sign Out.
- No AI-generated stock photos. Use only real screenshots or icons.

## 9. Product deck (deliverable at the end)
Once the app is working, generate a **"How to Use" product side deck** with:
- Screenshots of every page and every major feature
- Rendered as a viewable HTML file at `/app/frontend/public/how-to-use.html`
- Rendered as a downloadable PDF at `/app/frontend/public/qlub-how-to-use.pdf` via Playwright's `page.pdf()`
- Linked from the sidebar

## 10. Integrations
- **Gemini API** via user-provided Google AI Studio key (stored in `backend/.env` as `GEMINI_API_KEY`). Uses `google-genai` SDK with `googleSearch` grounding tool. Model cascade: `gemini-2.5-flash → gemini-2.5-flash-lite → gemini-flash-latest` with 503/429 retry + backoff.
- {{ANY_OTHER_INTEGRATIONS — e.g., Stripe, Resend, Twilio, fal.ai}}

## 11. Testing & finish
- After every major feature block, run the testing subagent (frontend + backend).
- Curl-test all `/api/*` endpoints.
- Take one smoke screenshot per page.
- Update `/app/memory/PRD.md` and `/app/memory/test_credentials.md` before calling `finish`.

---

## Example — filled in for Qlub (reference)

- **PRODUCT_TYPE**: market intelligence dashboard
- **COMPANY_NAME**: Qlub
- **COMPANY_ONE_LINER**: instant, app-free restaurant bill-pay platform
- **PRIMARY_USER**: LA SDR team
- **PRIMARY_JOB_TO_BE_DONE**: qualify sit-down LA restaurants and send grounded cold emails
- **TARGET_MARKET**: Los Angeles restaurants (DTLA, Westside, Hollywood, Midtown, Eastside, Valley)
- **DESIGN_VIBE**: soft cream paper + purple #7d00b5 accent
- **GEO_UNIT**: LA neighborhoods (with lat/lng)
- **PROSPECT_LIST_PAGE_NAME**: Restaurant Expo
- **COLUMNS**: Name, Neighborhood, Region, Cuisine, Valuation, POS, Segment
- **FILTERS**: Region, Cuisine, POS, Segment
- **KEY_ATTRIBUTE**: POS system
- **PROSPECT_ENTITY**: restaurant
- **RULE_1**: sit-down / full-service
- **RULE_2**: modern POS with integration path OR unverified but format fits
- **RULE_3**: ≥1 close-out / billing / wait-time pain point in public reviews
- **INSIGHTS_PAGE_NAME**: Marketing Insights
- **INPUT_1**: total tables, **INPUT_2**: avg check, **INPUT_3**: check-drop delay minutes
- **APP_PREFIX**: QLUB
- **TONE**: confident-friendly
- **DATASET_NAME**: voc_dataset

---

## Reusability tips
- Swap `Restaurant / POS / Neighborhood` for your entity/attribute/geo trio and this template drops onto any B2B GTM app (real-estate agents, dental clinics, HVAC contractors, SaaS competitors, VC portfolios).
- Keep the **"no hallucinations, cite or say so"** rule in **bold** at the top — it's what separated Qlub from generic AI slop.
- Always ask for **the deck at the end** — clients love it and it forces you to think about UX narrative.
