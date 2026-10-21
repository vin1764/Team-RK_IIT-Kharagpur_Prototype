# Maker App Prototype — Build Plan for Claude Code

Team RK · Meesho DICE S3 (C2M) · maker-side prototype only
Updated 21 Oct 2026 with the team's Phase 4 answers (restock moved from D31 to D28; launch daily orders seeded).
Source of truth: the doc **"C2M Solution on Meesho Supplier Hub"** (verified 21 Oct 2026) + the final Round-2 deck.
Ops console: **out of scope for now.**

---

## 1. What we are building

A clickable replica of today's **Meesho Supplier Hub** (onboarding + seller panel) with our C2M features added exactly where the doc places them. Everything that exists today stays as it looks and works today. Synthetic data only.

**Two rules that decide every screen**

1. **Existing = replicate, don't redesign.** Same layout, sidebar, colours, copy, buttons, empty states. If a page has no C2M feature, it is a faithful static replica.
2. **New = native-looking insert.** Every addition uses the panel's own components (cards, pills, yellow info banners, green success banners, indigo buttons, (i) tooltips) and sits at the spot the doc names.

---

## 2. Non-negotiables (put these in `CLAUDE.md`)

- **Concept label on every page**: a thin strip "Concept prototype · Team RK · synthetic data · not affiliated with Meesho".
- **No real auth**: sign-up/OTP screens are mock-ups; inputs submit nowhere; no real phone, PAN, GSTIN or bank numbers anywhere (use obviously fake ones).
- **Logo and icons**: use Meesho's own logo and sidebar icons; their image URLs are in the `/reference/html/` snapshots, so save those images into `/public/brand/`. The concept-label strip and the non-working sign-up stay, so the prototype can't pass as the real panel.
- **Font**: the panel uses Mier (paid, licensed to Meesho). Use a free look-alike from Google Fonts at the same weights (Book 400, Demi 600, Bold 700). Default: **Figtree**. In Phase 0, render "Welcome Team RK", "Add Single Catalog" and a sidebar list in Figtree, Plus Jakarta Sans and DM Sans next to `/reference/html/meesho-home.html`, and keep whichever matches best. One CSS variable (`--font-sans`) so the swap is one line.
- **Benchmark B never appears as a number in the maker UI.** It exists only in the engine. The maker sees "Qualifies / Doesn't qualify" and a price position in thirds (Low / Mid / High).
- **Arithmetic must hold.** Every number on screen comes from the engine, never typed into a component. Each hero value in §8b has a test that recomputes it.
- **Deterministic data**: all synthetic data from seeded JSON; no randomness at runtime.
- **Deploy unlisted** (noindex), $0 hosting.

---

## 3. Recommended stack ($0)

| Need | Choice | Why |
| --- | --- | --- |
| App | React + Vite + TypeScript | Many screens, shared state, fast to iterate |
| Styling | Tailwind CSS with tokens sampled from the screenshots | Pixel-match the panel |
| Routing | React Router, routes mirroring the real panel URLs | Feels native; easy to demo |
| State | Zustand (one store: persona, day, maker data) | Simple, no backend |
| Data | `/src/data/*.json` seed files | Deterministic, editable |
| Logic | `/src/engine/*.ts` pure functions | Testable, no UI coupling |
| Tests | Vitest for every engine function | Numbers stay right |
| Deploy | Netlify (free), noindex | Shareable link |

---

## 4. Reference material Claude Code needs

Put in `/reference/`:

- `/reference/screens/` — every Supplier Hub screenshot you have, named by page:
  `signup.png`, `onb-business-details.png`, `onb-pickup.png`, `onb-bank.png`, `onb-supplier-details.png`, `onb-business-type-dropdown.png`, `home.png`, `notices-*.png`, `catalog-select-category.png`, `catalog-image-modal.png`, `catalog-product-details-*.png`, `catalog-price-table.png`, `catalog-other-attributes.png`, `bulk-upload-*.png`, `catalog-uploads.png`
- `/reference/html/` — the 21 HTML snapshots of the panel pages (see §4b); they replace screenshots for those pages.
- `/reference/C2M-solution-doc.pdf` — export of the doc (mock-ups included).
- `/reference/deck.pdf` — the Round-2 deck.

### 4b. Extract the live UI instead of only screenshotting

Screenshots show the look; the live page gives the exact values. Do both for every page.

1. **Already captured (21 Oct 2026):** 21 single-file HTML snapshots in your Downloads folder, each with the page's full CSS inlined, scripts removed, personal data replaced (phone, PAN, Enrolment ID, bank account, IFSC, email, address, name, supplier code), and checked for leaks. Move them to `/reference/html/`:
   `meesho-home`, `meesho-notices`, `meesho-manage-pricing`, `meesho-reduce-rto-returns`, `meesho-inventory`, `meesho-quality`, `meesho-payments`, `meesho-warehouse`, `meesho-orders`, `meesho-returns`, `meesho-claims`, `meesho-catalog-uploads`, `meesho-image-bulk-upload`, `meesho-catalog-add-single-category`, `meesho-catalog-bulk-category`, `meesho-influencer-marketing`, `meesho-promotions`, `meesho-sale-opt-in`, `meesho-offer-opt-in`, `meesho-instant-cash`, `meesho-business-dashboard` (all `.html`).
2. **Not capturable from a live account, so use the screenshots instead:** sign-up and the four onboarding steps (your account is already onboarded), and the Add Single Catalog product-details form and price table (they open only after a photo upload).
3. **Use them as reference, not as code.** Rebuild the pages with our own React components. Don't ship Meesho's bundled JS or font files; the logo and icons are fine (see §2). Images in the snapshots point to Meesho's servers, so save the ones you use locally.

**Design tokens already pulled from the live panel (21 Oct 2026)**

| Token | Value | Where |
| --- | --- | --- |
| Page background | `#F2F5FA` | body |
| Sidebar background | `#272829` | left nav |
| Sidebar item text | `#E6EBF2`, 13px | nav links |
| Sidebar active row | bg `#5A5E66`, text `#FFFFFF`, padding 8px 6px 8px 12px, 36px tall | Home row |
| Sidebar section label | `#8E96A3`, 12px | "Manage Business", "Boost Sales" |
| Primary (indigo) | `#3C29B7` | buttons, active step text, links |
| Primary button | bg `#3C29B7`, white text, radius 4px, 15px semibold | "Fix QC Error" |
| Heading text | `#272829`, bold 21px (page title), bold 15px (card title) | Home |
| Secondary text | `#5A5E66`, 15px | subtitles |
| Muted text | `#8E96A3`, 13px semibold | inactive stepper steps |
| Card | bg `#FFFFFF`, radius 4px, padding 16px | right-rail cards |
| Success pill | bg `#E7FBE0`, text `#43A92C`, border `#C2EAB4`, fully rounded, 11px | "Expert Led" |
| Fonts | Mier Book (400), Mier Demi (600), Mier Bold (700); DM Sans also loaded | whole panel |

**Font note:** see §2. Same sizes and weights as the table above either way.

---

## 5. Screen map: existing vs new

Routes follow the real panel (`/panel/v3/new/...`). **Bold = has C2M additions.**

| Area | Page (existing) | C2M additions (doc ID) | Priority |
| --- | --- | --- | --- |
| Outreach | — (phone mock, new) | WhatsApp/IndiaMART teaser with links to sign-up and cost check (FO-3) | P1 |
| Onboarding | **Sign-up** | Right panel shows the demand teaser when opened from the outreach link (FO-4) | P1 |
| Onboarding | — (new page) | 5-minute cost check: product type + making cost → take-home, "a qualifying price exists" (FO-5) | P1 |
| Onboarding | **Business Details** | Business-type question moved here from step 4; GST nature of business + Udyam checks → eligible / pending / not eligible (FO-6, FO-7) | P1 |
| Onboarding | **Pickup Address** | "How will your orders ship?" Self-ship / Cluster Pack Point / waitlist (FO-8) | P1 |
| Onboarding | Bank Details | none | — |
| Onboarding | Supplier Details | business-type field removed (moved to step 1) | P1 |
| Panel | **Home** | 3rd upload path "Create from photos" (LB-3); step-3 card "Next Factory Launch" (LW-6); right rail "This week's one fix" coach card once live | P1 |
| Panel | Notices | Factory Launch notice (P2) | P2 |
| Catalog | **Add Single Catalog** | "Create from photos" mode: category auto-detected, image cleanup, field pre-fill per §7, EN / हिंदी toggle (LB-4, LB-10) | P1 |
| Catalog | **Price table** | Demand card, suggested Inventory, take-home, status chip, go-live checklist, fees locked at dispatch (LB-5, LB-6, LB-9) | P1 |
| Catalog | Catalog Uploads, Bulk, Image Bulk Upload | none | — |
| Pricing | **Manage Pricing** | New tab "Price position" (thirds, qualifies or not) + price-hold breach banner (PI-2, PI-3) | P1 |
| Pricing | Reduce RTO & Returns | none in P1 | — |
| Promotions | **Promotions / Sale Opt-in** | New tab "Factory Launch": order book, key dates, units to commit, Commit (LW-2 to LW-5) | P1 |
| Promotions | **Live launch view** (new, inside Factory Launch) | Orders today vs expected, reviews so far (LW-7) | P1 |
| Quality | **Quality** | Listing score "Building", based on this listing's own orders and returns (LW-8) | P1 |
| Inventory | **Inventory → Low Stock** | Restock card, make-to-demand verdicts, "What to make instead" (GL) | P1 |
| Performance | **Business Dashboard** | SKU Health Coach card above the funnel tiles (GL) | P1 |
| Warehouse | **Warehouse** | Second program card "Cluster Pack Point"; providers near you with rate cards; lot inbound (PP-3, PP-4, PP-5, PP-10) | P1 (PP-10 P2) |
| Orders, Returns, Claims, Payments, Instant Cash, Influencer Marketing, Offer Opt-in | | none in P1 | — |
| Buyer app | — (phone mock, optional) | Factory Launch section + "Direct from the maker" (LW-10) | P2 for this build |

---

## 6. Personas and demo controls

**Prototype controls** — a small floating panel (bottom-right, clearly labelled, hideable):

- **Persona**: Jasmeet Sharma (kitchenware maker, self-ship) · Samar Biswas (footwear maker, Pack Point) · Reseller (fails checks)
- **Day**: D0 → D90 slider with jump buttons: D1 onboarding · D3 listing · D5 commit · D23 live launch · D28 restock · D40 price edit · D50 Pack Point lot
- **Language**: EN / हिंदी (bot screens and coach card)
- **Reset demo**

The day drives what each page shows (empty states before go-live, launch view during D21–25, restock card from D28).

---

## 7. Listing fields (from the doc's "who fills what" table)

**Pre-filled by the bot (21 of 31 mandatory fields)**: Category · Product Name · Generic Name · Type · Color · Size (Free Size) · Net Quantity (pre-filled, **maker must confirm**) · Product / Volume / Weight units (as unit pickers beside their measurement fields) · Country of Origin · Manufacturer name, address, pincode (GST record) · Packer (set by fulfilment choice) · Importer (not applicable for India) · Inventory (suggested) · Meesho Price (computed) · plus Description and WDRP.

**Maker enters (14 values)**: Leak Proof · Capacity · Material · Add Ons · Length · Breadth · Height · Product Weight · Net Weight · MRP · Making cost · Margin · Minimum run · Lead time. Minimum run and Lead time get (i) tooltips; their placeholders show the type's typical value.

**Packer rule**: self-ship → same as manufacturer; Pack Point → manufacturer if units arrive retail-packed, else the Pack Point partner.

**Inventory rule**: 150 is a suggestion; the maker can commit any number.

---

## 8. Engine (pure functions, each with Vitest tests)

| Function | Input → output | Hero check |
| --- | --- | --- |
| `costStack(type, makingCost, marginPct, mode)` | fees + break-even + list price + take-home | packaging ₹6, shipping + fixed ₹32, returns ₹8, GST ₹7 → break-even ₹133; margin 17.5% of making cost → take-home ₹14 → list ₹147 |
| `slots(type)` | open gap ÷ expected orders per listing | 300–450 ÷ 60–90 a week = 5 |
| `priceCheck(price, breakEven, B)` | `qualifies` / `aboveCap` / `belowCost`; B never returned to UI | ₹147 qualifies; ₹165 doesn't |
| `pricePosition(price, comparables)` | `low` / `mid` / `high` third | ₹147 → low; ₹165 → mid |
| `demandForType(type)` | gap range, price band, confidence, committed | 300–450/wk, ₹150–170, High, 600 committed |
| `likelyShare(type)` | share + orders/day range | ~20% → 9–13/day |
| `suggestedLot(type)` | units ≈ 14 days of expected sales | 150 (≈ ₹12,000 at cost) |
| `restock(runRate, onHand, lead, safety)` | cover, reorder point, next batch (21 days, rounded to nearest 10), dates | 11/day, 73 → 6.6 days, reorder 77, next 230 (≈ ₹18,400), start 21 Nov, land 26 Nov |
| `verdict(sku)` | Make more / Keep / Fix / Stop / Switch | bottle Make more, lunch box Keep, sipper Stop |
| `switchSuggestions(line)` | open-gap products for the same line | 1.5 L casserole ~200/wk High; 500 ml flask ~120/wk Medium |
| `coachFix(funnel, categoryBands)` | one fix (trigger stays internal) | 2,400 views, 38 clicks, 1.6% vs 4.2% → "change the main photo" |
| `eligibility(maker)` | eligible / pending / not eligible + failed checks | Jasmeet eligible; reseller not |
| `packPointFee(makersPooled)` | fee per delivered order | 20→₹44, 40→₹30, 60→₹26, 80→₹23 |

---

### 8b. Arithmetic checks (each one is a test)

| Value | Calculation | Result |
| --- | --- | --- |
| Break-even | 80 making + 6 packaging + 32 shipping and fixed fee + 8 returns buffer + 7 GST | ₹133 |
| Take-home | 17.5% × ₹80 | ₹14 |
| List price | ₹133 + ₹14 | ₹147 |
| Benchmark B (hidden) | 25th percentile of 1,000 qualifying orders: ₹150 × 200, ₹160 × 300, ₹165–190 × 500; the 250th order is at ₹160 | ₹160 |
| Price check | ₹133 ≤ ₹147 ≤ ₹160 → qualifies; ₹165 > ₹160 → doesn't | ✓ |
| Hero's price drop | ₹160 − ₹147 = ₹13 = 8.1% of B, meets the deck's ≥ 8% target | ₹13 |
| Orders per listing | 20% × 300–450 a week = 60–90 a week = 8.6–12.9 a day | 9–13 a day |
| Slots | 300 ÷ 60 = 5; 450 ÷ 90 = 5 | 5 |
| Suggested lot | ~11 a day × 14 days = 154, rounded to nearest 10 | 150 units, ₹12,000 at cost |
| Restock (D28, 21 Nov) | run-rate D21–27 = 77 ÷ 7 = 11/day; cover 73 ÷ 11 = 6.6 days; reorder point 11 × (5 + 2) = 77 (73 < 77 → start today); next batch 11 × 21 = 231 → 230; 230 × ₹80 = ₹18,400; 21 Nov + 5 days; 73 − 11 × 5 = 18 left on landing | lands 26 Nov |
| Launch sales (lot 150, committed D5) | daily orders D21–D30 = 12, 10, 11, 11, 12, 11, 10, 11, 11, 11 | D23: 11 today, 33 sold, 117 left · D27: 77 sold, 73 left · D30: 110 sold = 73% sell-through |
| Coach | 38 ÷ 2,400 clicks per view | 1.6% vs 4.2% |
| Pack Point fee | (monthly cost ÷ orders) × 1.18 ÷ (1 − 0.178): ₹1,26,444 ÷ 6,000 = ₹21.07 → ₹24.87 → ₹30.3 | ₹30 at 40 makers (₹44 at 20, ₹26 at 60, ₹23 at 80) |

---

## 9. Build phases (each ends with a check before the next)

**Phase 0 — Setup and gate**
Repo, stack, `CLAUDE.md` with §2 rules, `/reference` loaded, design tokens sampled from screenshots (sidebar dark, indigo primary, banners, pills), $0 deploy plan. **Stop for your approval.**

**Phase 1 — Panel shell + existing pages**
Sidebar (exact order and sub-menus), header (Notices, Support, e-signature banner), and every existing page as a faithful replica with empty or synthetic states.
*Check:* each page side by side with its screenshot.

**Phase 2 — Onboarding**
Sign-up (+ teaser when `?ref=outreach`), cost check page, Business Details with checks, Pickup Address with fulfilment choice, Bank Details, Supplier Details; outreach phone mock-up.
*Check:* Jasmeet → eligible; reseller → not eligible; Samar → Pack Point.

**Phase 3 — Engine + listing flow**
All §8 functions with tests. Home "Create from photos" → Add Single Catalog with pre-fill per §7 → price table additions → go-live.
*Check:* hero numbers in §8 appear exactly; B never rendered.

**Phase 4 — Factory Launch**
Promotions tab, order book, units to commit, Commit; Home step-3 card; live launch view; Quality listing score.
*Check:* D5 commit flow, D23 live view.

**Phase 5 — Growth loop**
Inventory restock card, verdicts, switch suggestions; Business Dashboard and Home coach card (EN / हिंदी).
*Check:* D28 view matches the doc mock-ups.

**Phase 6 — Pricing and Warehouse**
Manage Pricing "Price position" tab and price-hold breach (D40, price edit to ₹165); Warehouse Pack Point card, providers near you, lot inbound (Samar, D50).
*Check:* breach removes the launch slot; Pack Point fee card shows ₹30 at 40 makers.

**Phase 7 — Polish and ship**
Demo controls, concept label, responsive check, README (what's real vs simulated, seeded deck values), deploy unlisted, full test run, then git history (your style: commit everything at the end, grouped by component, after a secret audit).

**Later (P2)**: Demand Gaps page, win-back card for churned makers, Factory Launch notice, buyer-app launch section, spec-policing flag.

---

## 10. Demo script (≈ 5 minutes)

1. D1 · Jasmeet gets the outreach message → sign-up shows her teaser → cost check: "₹147 → ₹14 take-home, qualifies".
2. D1 · Business Details: GST + Udyam pass → eligible. (Switch to Reseller: not eligible.)
3. D3 · Create from photos → 21 fields pre-filled → enters the 14 → price table: Qualifies, 150 suggested → Go live.
4. D5 · Promotions → Factory Launch → commits units → Commit.
5. D23 · Live launch: 11 orders today, expected 9–13, 33 of 150 sold; listing score building.
6. D28 · Inventory: "Start 230 by 21 Nov"; coach: "change the main photo"; what to make instead.
7. D40 · Raises price to ₹165 → "Doesn't qualify · slot removed", position Mid.
8. D50 · Samar: Warehouse → Cluster Pack Point → sends first lot, every unit weighed.

---

## 11. First prompt to paste into Claude Code

```
Read /maker-app-build-plan.md fully, then /reference (screenshots, the C2M solution doc PDF, the deck).

Goal: a clickable replica of Meesho's Supplier Hub with our C2M features added only where the plan's §5 says. Existing pages must look and behave exactly like the screenshots; new features must use the panel's own components.

Start with Phase 0 only:
1. Propose the repo structure, stack and $0 deploy plan (confirm or challenge §3).
2. Create CLAUDE.md with the non-negotiables in §2.
3. Sample design tokens (colours, fonts, spacing, radii) from the screenshots and list them.
4. List every route you will build, mapped to its screenshot, and flag pages with no screenshot.
5. Write the engine function signatures from §8 with test cases using the hero numbers.

Then stop and wait for my approval before Phase 1. Don't invent numbers: use the plan's values, and ask if one is missing.
```
