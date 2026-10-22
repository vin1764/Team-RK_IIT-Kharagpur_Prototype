# Maker App Prototype · Team RK · Meesho DICE S3 (C2M)

> **Concept prototype · Team RK · synthetic data · not affiliated with Meesho.**
> This strip sits at the top of every page, modal and onboarding screen, and nothing in the app can hide it.

**Live (unlisted):** https://team-rk-c2m-prototype.netlify.app

This is a clickable replica of Meesho's Supplier Hub: the onboarding flow and the seller panel. We added Team RK's C2M (customer-to-manufacturer) features only where our solution doc puts them. You follow one factory maker, Jasmeet, from the first outreach message through cost check, eligibility, a listing created from photos, a Factory Launch commit, the live launch week, a restock and coaching, and a price edit that loses her launch slot. A second maker, Samar, sends his first lot to a Cluster Pack Point. Pages without a C2M feature are static replicas. Every number on screen is computed from seeded data by a tested engine, and nothing talks to a server.

---

## How to run

Needs Node 22.

```bash
npm install
npm run dev         # http://localhost:5173
npm test            # Vitest: engine + UI-wiring tests (all numbers below are asserted here)
npm run typecheck   # tsc --noEmit
npm run build       # type-check + production build into dist/
npm run compare [names…]   # render routes beside their reference screenshot/snapshot at 125% → docs/compare/
```

`npm run compare` uses Playwright. Its route list is in `scripts/compare/*.json`.

---

## How to demo (≈ 5 minutes)

Open **Prototype controls** (the black pill at the bottom right) and click **Demo guide · 8 steps**. Each step is a one-click jump that sets the persona, the demo day and the language (EN), then opens the right page. The controls fold away so the page is clear. Reopen them to see the guide again, with the current step marked.

| # | Day | Persona | Opens | What to show |
| --- | --- | --- | --- | --- |
| 1 | D1 · 25 Oct | Jasmeet | Outreach (+ links: sign-up teaser, cost check) | Jasmeet gets the outreach message → sign-up shows her teaser → cost check: "₹147 → ₹14 take-home, qualifies". |
| 2 | D1 | Jasmeet (+ link: as Reseller) | Onboarding → Business Details | GST + Udyam pass → eligible. Switch to Reseller: not eligible. |
| 3 | D3 · 27 Oct | Jasmeet | Home | Click **Create from photos** → three short screens: Meesho fills 21, she adds 14 → Price: list at ₹147 · take home ₹14, Qualifies → Go live. |
| 4 | D5 · 29 Oct | Jasmeet | Promotions → Factory Launch tab | Order book → commits 150 units → Commit. |
| 5 | D23 · 16 Nov | Jasmeet | Live launch view (+ link: Quality) | 11 orders today, expected 9–13, 33 of 150 sold. The listing score on Quality reads Building. |
| 6 | D28 · 21 Nov | Jasmeet | Inventory (+ link: Business Dashboard) | Restock "Start 230 by 21 Nov". Business Dashboard coach (lunch box): change the main photo. Sipper: what to make instead. |
| 7 | D40 · 3 Dec | Jasmeet | Manage Pricing → Price position | Price raised to ₹165 → "Doesn't qualify · slot removed", position Mid. |
| 8 | D50 · 13 Dec | Samar | Warehouse | Samar (Agra): Cluster Pack Point → first lot of 90 pairs in, every pair weighed. |

The step data and its wording live in `src/layout/demoGuide.ts`. Every number in it is computed from the engine and the seed, and `src/layout/demoGuide.test.ts` recomputes each one, so the script can't drift from the screens.

The demo state lives in the URL (`?persona=jasmeet&day=23&lang=en`), so any moment of the demo can be shared as a link. The controls also have a persona picker, a D0–D90 day slider with jump buttons (D1, D3, D5, D23, D28, D40, D50) and EN / हिंदी.

**Skipping ahead works.** If you jump straight to D23 without clicking through D3 and D5, Jasmeet's listing and her 150-unit commit come from the script (`src/store/timeline.ts`), and the D40 price edit to ₹165 does too. Anything you actually click wins over the script: a real go-live, a different commit or your own price edit.

### How to reset the demo

**Prototype controls → Reset demo** returns everything to the start:

| What | Where it lives | Reset clears it to |
| --- | --- | --- |
| Persona, day, language | `src/store/demo.ts` (mirrored in the URL) | Jasmeet · D1 · EN |
| Onboarding answers | `src/store/onboarding.ts` (in memory only) | empty |
| Listings put live from "Create from photos" | localStorage **`rk-catalog-v1`** (`src/store/catalog.ts`) | none |
| The in-progress bot draft | localStorage **`rk-draft-v1`** (`src/pages/panel/catalog/draftStore.ts`) | none |
| Factory Launch commits | localStorage **`rk-launch-v1`** (`src/store/timeline.ts`) | none |
| Price edits on Price position | localStorage **`rk-price-edit-v1`** (`src/store/priceEdits.ts`) | none |

Changing persona also starts onboarding over. To clear things by hand, open DevTools → Application → Local Storage and delete the four `rk-*` keys, or run this in the console:

```js
Object.keys(localStorage).filter((k) => k.startsWith('rk-')).forEach((k) => localStorage.removeItem(k));
```

Then open a URL without `?persona=&day=&lang=` to start from the defaults. If storage is blocked (private window, sandboxed iframe), the stores fall back to memory and a reload resets them.

---

## What's real and what's simulated

### Replicated: existing Meesho pages
- Layout, sidebar order, colours, copy, buttons and empty states are copied from the team's snapshots (`reference/html/*.html`) and screenshots (`reference/screens/*.png`, taken at 125% zoom). `npm run compare` puts each route beside its reference; the results are in `docs/compare/`.
- Routes mirror the real panel URLs (`/panel/v3/new/<area>/demo/…`), with the fake supplier code `demo`.
- **Font:** Mier is licensed to Meesho, so we use **Figtree** (self-hosted, 400/600/700). It is set by one variable, `--font-sans`. Most of the small pixel differences in the compares come from this.
- **Logo and icons:** Meesho's own logo and sidebar icons, saved into `public/brand/` (`scripts/fetch-brand.py`). Nothing is hot-linked (`src/app/brand.guard.test.ts`), and none of Meesho's JS or font files ship.
- Colours use the panel's own semantic token names (`src/styles/tokens.css`), so snapshot markup ports class for class.

### New: C2M inserts (every one carries `data-c2m="<doc-id>"`)
| Area | Doc IDs | Where |
| --- | --- | --- |
| Outreach, sign-up teaser, 5-minute cost check | FO-3, FO-4, FO-5 | `/outreach`, `/signup?ref=outreach`, `/cost-check` |
| Business Details eligibility checks; fulfilment choice at Pickup Address | FO-6, FO-7, FO-8 | onboarding steps 1–2 (the business-type question moves from step 4 to step 1) |
| "Create from photos" listing bot: three short screens, pre-fill, price table, go live, EN / हिंदी | LB-3, LB-4, LB-5, LB-6, LB-8, LB-10 | Home, Add Single Catalog |
| Factory Launch tab, order book, commit, Home card, live view, listing score | LW-2, LW-3, LW-4, LW-5, LW-6, LW-7, LW-8 | Promotions, Home, Quality |
| Growth loop: restock card, verdicts, what to make instead, SKU Health Coach, filled dashboard | GL-1 … GL-6 | Inventory, Business Dashboard, Home |
| Price position tab + price-hold breach | PI-2, PI-3 | Manage Pricing |
| Cluster Pack Point program, fee card, lot inbound | PP-3, PP-4, PP-5 | Warehouse |

### Simulated
- **No auth, no network.** Sign-up, OTP and every form are mock-ups whose inputs submit nowhere. The app makes no network calls at runtime.
- **Fake people and identifiers.** All personas are invented, and every phone number, PAN, GSTIN, Udyam number, bank account, IFSC, email and address is obviously fake (`+91 90000 0000x`, `AAAAA0000A`, `24AAAAA0000A1Z0`, `DEMO0000001`, `Plot 0, Demo Industrial Estate`). Pincodes only match a city's 3-digit postal prefix.
- **Demo calendar.** D0 = 24 Oct 2026 (`src/data/calendar.json`). The demo day (D0–D90) drives everything that changes over time, never the real clock.
- **Deterministic data.** All synthetic data is seeded JSON in `src/data/`, and each block carries a `_source` note. The app never calls `Math.random`, and `Date.now()` never drives content.
- Buttons with no reference screen (Support, account menu, Set Password, Raise Claim, downloads, video tutorials, …) show a "… isn't part of this prototype" toast.
- The buyer app, the ops console and the P2 items (Demand Gaps page, win-back card, Factory Launch notice, PP-10 providers page) are out of scope.

### Intentional differences from the reference
- **E-signature banner removed** (team decision, commit `a00f246`): our makers have completed e-signature, so the red "Your E-Signature is missing!" strip is gone everywhere. The screenshot compares for home, notices and catalog uploads differ by that strip.
- **Figtree instead of Mier** (above).
- **Concept strip** on every page (20px, black).
- Business Dashboard shows `0%` where the live panel printed `null%` (a live-panel bug).
- The "Introducing Mega Combo Offer" popover is not shown over the Factory Launch tab, where it would cover the order book.
- The bot reads the demo photo's colour as Navy Blue (team, Phase 3), replacing the doc mock-up's Silver.
- Onboarding step 1 uses the GSTIN variant with fake values; only the Enrolment-ID variant was captured (team answer Q17).

---

## Every seeded number and where it comes from

Key: **plan** = `maker-app-build-plan.md` · **doc** = `reference/C2M-solution-doc.pdf` (doc IDs) · **deck** = `reference/deck.pdf` (Round 2, final) · **Q*n*** = team answers recorded in `docs/phase-0/PHASE-0.md` §7 and in the `_source` notes of `src/data/*.json`. Engine files are in `src/engine/`. Every value below is asserted by the test named, and all of them pass with `npm test`.

### Jasmeet's 1 L steel bottle: cost stack (self-ship)
| Value | Source | Computed in | Test |
| --- | --- | --- | --- |
| Making cost ₹80, margin 17.5% | plan §8b; `personas.json` | — (seed) | `costStack.test.ts` |
| Packaging ₹6 · shipping + fixed ₹32 · returns buffer ₹8 | plan §8 / doc LB-6; `productTypes.json` | `costStack.ts` | `costStack.test.ts` |
| GST 5% of the selling price, included in it (HSN 7323) → ₹7 at ₹147 | Q18 | `costStack.ts` (`gstInPrice`) | `costStack.test.ts` |
| Cost before GST 80 + 6 + 32 + 8 = ₹126 → **break-even ⌈126 × 1.05⌉ = ₹133** | plan §8b, Q18 | `costStack.ts` | `costStack.test.ts` |
| **Take-home** 17.5% × ₹80 = **₹14** | plan §8b | `costStack.ts` | `costStack.test.ts` |
| **List price** (126 + 14) × 1.05 = **₹147** | plan §8b, Q18 | `costStack.ts` | `costStack.test.ts`, `demoGuide.test.ts` |
| Via Pack Point instead: no packaging, + ₹30 fee → break-even **₹158**, list **₹172** (172.2 rounds to the nearest rupee; doesn't qualify, so she self-ships) | Q3, Q18 | `costStack.ts` | `costStack.test.ts`, `ui.test.ts`, `warehouse/offer.test.ts` |

### Hidden benchmark B (bottle)
| Value | Source | Computed in | Test |
| --- | --- | --- | --- |
| Comparables: ₹150 × 200, ₹160 × 300 orders; the ₹165–190 orders split as ₹165 × 150, ₹170 × 100, ₹175 × 100, ₹180 × 80, ₹190 × 70 (1,000 in total) | plan §8b; split: team, Phase 6 review | `productTypes.json` | `benchmark.test.ts` |
| A listing counts only with ≥ 30 delivered orders, above the quality floor, not the maker's own | Q7 | `benchmark.ts` | `benchmark.test.ts` |
| **B = ₹160** (the 25th percentile: the 250th of 1,000 orders) | plan §8b | `benchmark.ts`, computed internally | `benchmark.test.ts` |
| **B is never shown.** The maker sees only Qualifies / Doesn't qualify and a third. Only `src/engine/` may import `benchmark.ts`, and `ui.ts` never returns B. | CLAUDE.md | `ui.ts` | `benchmark.guard.test.ts`, `bot.test.ts`, `factory-launch/launch.test.ts` |
| Price check: ₹133 ≤ ₹147 ≤ ₹160 → qualifies; ₹165 > ₹160 → doesn't | plan §8b | `benchmark.ts` (`priceCheck`) | `benchmark.test.ts`, `ui.test.ts` |
| Price thirds by share of comparable orders priced below: ₹147 → 0% **Low** · ₹165 → 50% **Mid** · ₹170 → 65% Mid · ₹175 → 75% High | plan §8b | `benchmark.ts` (`pricePosition`) | `benchmark.test.ts`, `manage-pricing/phase6.test.ts` |
| The maker's price drop: ₹160 − ₹147 = ₹13 = 8.1% of B, meeting the deck's ≥ 8% target (ops-side only) | plan §8b, deck | `benchmark.ts` (`priceDrop`) | `benchmark.test.ts` |

### Demand, launch slots and first lot (bottle)
| Value | Source | Computed in | Test |
| --- | --- | --- | --- |
| Gap **300–450 a week** unserved at **₹150–170**, confidence **High**, **600** units committed by others | plan §8 / doc FO-4, LB-5 | `demand.ts` | `demand.test.ts` |
| Likely share **20%** → 60–90 a week → **9–13 a day** | plan §8, §8b | `demand.ts` | `demand.test.ts`, `demoGuide.test.ts` |
| **5 slots**: 300 ÷ 60 = 450 ÷ 90 = 5 | plan §8b | `demand.ts` (`slots`) | `demand.test.ts` |
| Slots taken before Jasmeet: 600 ÷ 150 = 4 (4 of 5; 5 of 5 after her) | Q9 | `factory-launch/launch.ts` | `factory-launch/launch.test.ts` |
| **Suggested lot 150** (11 a day × 14 = 154 → 150), **₹12,000** at cost; no first-lot cap, soft warning below her own minimum run | plan §8b, Q19 | `demand.ts` (`suggestedLot`) | `demand.test.ts`, `bot.test.ts` |
| Typical minimum run 100, lead time 5 days (placeholder hints only) | doc price-table mock-up | `productTypes.json` | `growth-ui.test.ts` |
| Bot fills **21** of 31 mandatory fields; the maker adds **14** values; today's form = 31 + 4 images = 35 | plan §7, doc pp.15–18; team Phase 3 redesign | `pages/panel/catalog/bot.ts` | `bot.test.ts` |

### Launch calendar and sales (Factory Launch Week 1)
| Value | Source | Computed in | Test |
| --- | --- | --- | --- |
| D0 = 24 Oct 2026; commitments close D7; stock at the node D18; **live D21–D25 = 14–18 Nov** | Q1, deck order book; `calendar.json` | `calendar.ts` | `calendar.test.ts`, `factory-launch/launch.test.ts` |
| Jump days D1 onboarding · D3 listing · D5 commit · D23 live · D28 restock · D40 price edit · D50 Pack Point lot | plan §6 (restock moved to D28: team, Phase 4) | `calendar.json` | `demoGuide.test.ts` |
| Jasmeet commits **150** units at D5 | Q2 | `launch.json` | `factory-launch/launch.test.ts` |
| Daily orders D21–D30 = **12, 10, 11, 11, 12, 11, 10, 11, 11, 11** | Q12 | `launch.json` | `launch.test.ts` |
| D23: **11 today, 33 sold, 117 left**, day 3 of 5 · D27: 77 sold, 73 left · D30: 110 sold = 73% sell-through | plan §8b, Q12 | `launch.ts` | `launch.test.ts`, `factory-launch/launch.test.ts` |
| Listing score label "**Building**" (label only, no counts) | Q14 | `launch.json` | (seed) |

### Restock at D28 (21 Nov)
| Value | Source | Computed in | Test |
| --- | --- | --- | --- |
| Run-rate D21–D27 = 77 ÷ 7 = **11/day**; on hand **73** | plan §8b, Q12 | `launch.ts` (`trailingRunRate`) | `launch.test.ts` |
| Cover 73 ÷ 11 = **6.6 days**; reorder point 11 × (5 lead + 2 safety) = **77** → start today | plan §8b | `restock.ts` | `restock.test.ts` |
| Next batch 11 × 21 = 231 → **230** (≈ **₹18,400**); **start 21 Nov**, lands **26 Nov**, 18 left on landing | plan §8b | `restock.ts` | `restock.test.ts`, `growth.test.ts`, `growth-ui.test.ts` |

### Growth loop at D28
| Value | Source | Computed in | Test |
| --- | --- | --- | --- |
| Verdicts: bottle **Make more** (6.6 days < 5 + 2), lunch box **Fix**, sipper **Stop** ("Sell-through low for 2+ weeks", no numbers shown) | team Phase 5, Q5 | `verdict.ts`, `growth.ts` | `verdict.test.ts`, `growth.test.ts` |
| What to make instead (sipper): 1.5 L casserole ~200/wk High; 500 ml flask ~120/wk Medium | plan §8 / doc DE-3 | `demand.ts` (`switchSuggestions`) | `demand.test.ts`, `growth.test.ts` |
| Coach (lunch box, last 7 days): 2,400 views, 38 clicks → **1.6%** vs **4.2%** (median of similar listings) → "change the main photo"; 3 orders → 7.9% conversion | plan §8b, Q10 | `coach.ts` | `coach.test.ts`, `growth.test.ts` |
| Coach trigger: click rate below **2.5%** (bottom quarter). This is an **internal threshold and is never shown** in the UI. | Q10 | `coach.ts` | `coach.test.ts`, `growth-ui.test.ts` |
| Business Dashboard (bottle, D21–D27): 19,250 views · 770 clicks (**4.0%**) · 77 orders (**10.0%**) · 77 × ₹147 = **₹11,319** sales · 1 return (**1.3%**) | Q13 | `growth.ts`, `funnel.ts` | `growth.test.ts`, `manage-pricing/phase6.test.ts` |

### Price edit at D40
| Value | Source | Computed in | Test |
| --- | --- | --- | --- |
| Jasmeet raises ₹147 → **₹165** → "Doesn't qualify · slot removed", position **Mid**; the price-hold banner shows | plan §10 step 7; `launch.json` | `benchmark.ts` via `ui.ts`; `manage-pricing/priceHold.ts` | `manage-pricing/phase6.test.ts`, `ui.test.ts`, `demoGuide.test.ts` |

### Cluster Pack Point fee model
| Value | Source | Computed in | Test |
| --- | --- | --- | --- |
| Inputs: 150 orders/maker/month; 50 units on hand per maker at 3 per sq ft + 500 sq ft ops at ₹15/sq ft; packer ₹14,000, handler ₹14,000, supervisor ₹22,000; ₹5 consumables/order; equipment ₹2,50,000 over 36 months; utilities ₹8,000/month; staff by pool size 20/40/60/80 | deck appendix "Cluster Pack Point · Cost breakdown"; `packPointModel.json` | `packPoint.ts` | `packPoint.test.ts` |
| 40 makers: ₹1,26,444 ÷ 6,000 = ₹21.07 → × 1.18 partner margin = ₹24.87 → ÷ (1 − 17.8% RTO) = ₹30.3 → **₹30** | plan §8b, deck | `packPoint.ts` | `packPoint.test.ts` |
| Fee ladder: **₹44** at 20 makers (below the 40-maker density floor, so no node opens) · **₹30** at 40 · **₹26** at 60 · **₹23** at 80 | plan §8, deck | `packPoint.ts` | `packPoint.test.ts`, `manage-pricing/phase6.test.ts` |
| Storage free for 30 days, then ₹0.29 per unit per day (shown on Warehouse, not in the per-order stack) | deck PP-4; team answer 21 Oct | `packPointModel.json`, `lot.ts` | `samar.test.ts` |
| Clusters: Agra live (40 makers), Rajkot live (40), Moradabad opening at 40, matched by 3-digit pincode prefix | doc PP-4 mock-up; Q4; team Phase 6 | `lot.ts` (`clusterForPincode`) | `samar.test.ts`, `warehouse/offer.test.ts` |

### Samar: men's casual slip-on sneakers, Agra Pack Point
| Value | Source | Computed in | Test |
| --- | --- | --- | --- |
| Making **₹200**, margin **15%** → take-home **₹30**; fee ₹30 + shipping and fixed **₹40** + returns **₹20** (no self-ship packaging given) | Q4 | `costStack.ts` | `samar.test.ts` |
| 200 + 30 + 40 + 20 = 290 → break-even ⌈290 × 1.05⌉ = **₹305**; list (290 + 30) × 1.05 = **₹336**; GST **₹16** | plan §8b, Q4 | `costStack.ts` | `samar.test.ts`, `manage-pricing/phase6.test.ts` |
| Hidden B **₹370** (never shown) → ₹336 qualifies; drop ₹34 = 9.2% of B | Q4 | `benchmark.ts` | `samar.test.ts` |
| Demand **175–280 a week** at **₹350–400**, **Medium**, 0 committed; 20% → 35–56 a week = **5–8 a day**; 5 slots | team, Phase 6 review | `demand.ts` | `samar.test.ts` |
| First lot (5 + 8) ÷ 2 = 6.5 × 14 = 91 → **90 pairs** (≈ ₹18,000); sizes UK 6/7/8/9/10 = **10/20/25/20/15** | plan §8b, Q4 | `demand.ts`, `lot.ts` | `samar.test.ts` |
| D50 inbound at Agra: 90 expected, **90 received**, every pair weighed at ~650 g ± 5% (617.5–682.5 g); storage free to D80, then 90 × ₹0.29 = **₹26.10 a day** | Q4 | `lot.ts` (`lotInbound`) | `samar.test.ts` |

### Personas (all fake)
| Persona | Facts used | Source |
| --- | --- | --- |
| **Jasmeet Sharma**, "Sharma Steelware", Rajkot (Gujarat) | Kitchenware manufacturer, self-ships; GSTIN with GST nature "Factory / Manufacturing" and Udyam "Manufacturing" → eligible | plan §6, doc personas; city and records are ours |
| **Samar Biswas**, "Biswas Footwear", Agra (UP) | Footwear manufacturer, Cluster Pack Point → eligible | Q4; records are ours |
| **Demo Reseller**, "Demo Traders", Rajkot | Buys and resells; GST nature Retail / Wholesale, Udyam "Services" → not eligible, with every failed check listed | plan §6; Q11 |

Eligibility: only the two "I have a manufacturing unit…" business types pass the seller-type check (Q11). See `eligibility.ts` and `eligibility.test.ts`.

---

## Project structure

```
src/
  engine/    pure functions + Vitest tests; ui.ts is the only entry UI code may import (never returns B)
  data/      seeded JSON, each block tagged with its _source
  styles/    tokens.css (the panel's semantic tokens), fonts
  components/ panel primitives (Button, Pill, Banner, InfoTip, Toast…)
  layout/    PanelShell, Sidebar, ConceptStrip, DemoControls, DemoGuide (+ demoGuide.ts step data)
  pages/     onboarding/*, panel/* (replicas, with C2M inserts in per-feature folders)
  store/     Zustand: demo (persona/day/lang), onboarding, catalog, timeline (launch), priceEdits
  i18n/      en.json, hi.json (maker-facing copy)
reference/   inputs only (screenshots, HTML snapshots, doc, deck); never imported by the app
docs/        phase write-ups, open questions (phase-0/PHASE-0.md §7), comparison images
scripts/     compare (Playwright side-by-sides), html2jsx, brand fetch
```

## Non-negotiables (summary of `CLAUDE.md`)
- The concept strip is on every route and can't be hidden.
- No real auth and no real personal data anywhere (code, seeds, tests, commits, images).
- Meesho's logo and icons are saved locally; no Meesho JS or fonts ship; Figtree stands in for Mier.
- **B never appears in the maker UI.** It lives only in `src/engine/benchmark.ts`, and a guard test enforces this.
- Arithmetic holds: every number comes from the engine or the seed, and each hero value has a test.
- Deterministic: no `Math.random`, no clock-driven content, no runtime network.
- Existing pages are replicated, not redesigned. New features are native-looking inserts tagged with `data-c2m`.

## Deploy
Netlify (free tier), from `netlify.toml`: `npx vite build` → `dist/`, Node 22. The site is unlisted and never indexed. Every page sends `<meta name="robots" content="noindex, nofollow">` (`index.html`) and the header `X-Robots-Tag: noindex, nofollow` (`public/_headers`), `public/robots.txt` disallows crawlers, and `public/_redirects` serves the SPA. `vercel.json` holds an equivalent config if we ever need a fallback host. Cost: $0.
