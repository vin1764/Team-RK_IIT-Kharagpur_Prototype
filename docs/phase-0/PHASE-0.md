# Phase 0: setup and gate

Status: **approved 21 Oct 2026.** Answers to Q1, Q3, Q7 and Q16 are folded in below; Phase 1 is under way.

## 0. Urgent: personal data in a public repo

`vin1764/Team-RK_IIT-Kharagpur_Prototype` is **public**, and five onboarding screenshots on `main` showed a mobile number, a PAN, an Enrolment ID, a home address, a bank account number and an IFSC.

- **Done on this branch:** those regions are blanked in `signup.png`, `onb-business-details.png`, `onb-pickup.png`, `onb-bank-filled.png` and `onb-supplier-details.png`.
- **Still exposed:** the originals are in `main`'s history (commit `63a535a`). Redacting files on a branch doesn't remove them from history.
- **Recommended, needs your OK:** make the repo private now, then rewrite history to drop the originals (force-push to `main`). Consider changing the exposed bank details with your bank too.
- The 21 HTML snapshots are clean. None of those values appear in them.

## 1. Stack, structure and $0 deploy

**§3 confirmed, with five changes:**

| Need | Plan §3 | Proposal | Why |
| --- | --- | --- | --- |
| App | React + Vite + TS | Same (current stable React + Vite, TS strict) | — |
| Styling | Tailwind + sampled tokens | **Tailwind v4 with the panel's own token names** | The live panel is itself Tailwind with semantic tokens (`bg-primary-text`, `text-brand-primary-text`, `bg-success-bg`…), so snapshot markup ports class-for-class |
| Font | Figtree via Google Fonts | **Figtree self-hosted (`@fontsource/figtree`)** | No runtime call to Google, so it works offline at the demo and stays deterministic |
| Routing | React Router | Same, `BrowserRouter` + Netlify `_redirects` | — |
| State | Zustand | Zustand, **mirrored into the URL** (`?persona=jasmeet&day=31&lang=hi`) | Any demo moment becomes a link; Reset clears it |
| Data / Logic / Tests | JSON / pure TS / Vitest | Same | — |
| Visual check | — | **Add Playwright** (already installed here) | Phase 1's check: renders each route at 125% beside its screenshot, saved to `docs/compare/` |
| Deploy | Netlify free | **Confirmed.** The Netlify connector is attached here, so I can deploy directly | Free tier covers this many times over |

**Deploy plan ($0, unlisted):**

- `<meta name="robots" content="noindex,nofollow">` on every page.
- `_headers` with `X-Robots-Tag: noindex, nofollow` on `/*`.
- `robots.txt` with `Disallow: /`.
- `_redirects` with `/* /index.html 200` for client routes.
- A site name without "meesho" in it (e.g. `team-rk-c2m-prototype.netlify.app`).
- Netlify password protection is a paid feature. If you want a real login gate at $0, the alternative is **Cloudflare Pages + Cloudflare Access** (free up to 50 users). Otherwise unlisted plus noindex is what §2 asks for.

**One challenge:** with Meesho's logo and icons committed to `/public/brand/` and panel screenshots in `/reference/`, a public repo is the bigger exposure than the site. I recommend keeping the repo private; deploys don't need it public.

**Repo structure:**

```
CLAUDE.md                 non-negotiables (§2) + conventions
maker-app-build-plan.md
reference/                inputs only, renamed to page names per §4
  C2M-solution-doc.pdf, deck.pdf, screens/*.png, html/*.html
docs/phase-0/             this file, font-comparison.png
public/brand/             Meesho logo + sidebar icons, saved locally      ← Phase 1
src/
  engine/                 *.ts + *.test.ts; ui.ts = only entry the UI may use
  data/                   productTypes.json, packPointModel.json, personas, days ← more in Phase 1
  styles/tokens.css       §3 tokens as CSS variables                      ← Phase 1
  components/             Button, Card, Pill, Banner, Tabs, Stepper, Tooltip, Field, Select, Table, EmptyState, Modal
  layout/                 PanelShell, Sidebar, ESignBanner, OnboardingShell, ConceptStrip, DemoControls
  pages/onboarding/       Signup, CostCheck, BusinessDetails, PickupAddress, BankDetails, SupplierDetails
  pages/panel/            one file per route in §4
  pages/outreach/         phone mock
  features/{fo,lb,lw,gl,pi,pp}/  C2M inserts, by doc ID group
  store/demo.ts           persona, day, language
  i18n/en.json, hi.json
```

Phase 0 adds only `package.json` (TypeScript + Vitest), `tsconfig.json`, `vitest.config.ts`, `src/engine/` and `src/data/`. The React app is scaffolded in Phase 1 after approval.

## 2. CLAUDE.md

Written at the repo root. It covers the §2 rules, the two screen rules, the B boundary (`engine/ui.ts` + guard test), the no-real-data rule (now covering reference images too) and conventions such as `data-c2m="<doc-id>"` on every insert.

## 3. Design tokens

The values come from the panel's own CSS variables in `reference/html/meesho-home.html`. Each was cross-checked by sampling pixels in the screenshots (all matched exactly). The screenshots are at 125% zoom (sidebar is 224px in CSS and 280px on screen).

**Colour**

| Token (panel name) | Value | Used for | Pixel check |
| --- | --- | --- | --- |
| `primary-text` | `#272829` | headings, body text, **sidebar background** | sidebar ✓ |
| `secondary-text` | `#5A5E66` | subtitles, **sidebar active row** | Home row ✓ |
| `tertiary-text` | `#8E96A3` | muted text, sidebar section labels, inactive steps | — |
| `primary-bg` | `#FFFFFF` | cards | ✓ |
| `secondary-bg` | `#F2F5FA` | page background, inactive step circle | ✓ |
| `tertiary-bg` | `#E6EBF2` | category breadcrumb panel, icon tiles | ✓ |
| `primary-border` | `#8E96A3` | strong borders | — |
| `secondary-border` | `#C3C9D4` | input borders, dividers | ✓ |
| `tertiary-border` | `#E6EBF2` | sidebar item text, light dividers | — |
| `brand-primary-bg` / `-text` / `-border` | `#3C29B7` | primary buttons, links, active tab underline, selected category | ✓ |
| `brand-secondary-bg` | `#EDEAFF` | active step circle, icon chips | ✓ |
| `brand-secondary-border` | `#CCC3FF` | outlined brand chips | — |
| `brand-foreground-text` | `#FFFFFF` | text on indigo | — |
| `success-text` / `-bg` / `-border` | `#43A92C` / `#E7FBE0` / `#C2EAB4` | green banners, ticks, "Expert Led" pill | ✓ |
| `info-text` / `-bg` / `-border` | `#F7BE00` / `#FFF7D6` / `#FFDB4C` | **yellow info banners** and their (i) icon | ✓ |
| `warning-text` / `-bg` / `-border` | `#EC7600` / `#FFEDDE` / `#FFD2AB` | orange alerts | — |
| `error-text` / `-bg` / `-border` | `#F44240` / `#FFEEED` / `#FFCBC9` | e-signature banner, field errors | ✓ |
| `pink` | `#F991C6` | — | — |
| Disabled button | `#8E96A3` at 50% on page = `#C0C5CE` | "Create Account", "Submit" before input | ✓ |

**Off-panel colours** (sampled only; these live outside the token set):

| Use | Value |
| --- | --- |
| Onboarding right half | `#F0F1FB` |
| "New!" badge | `#F43397` |
| Notice "Check Now!" button | `#FF9D00` |
| Meesho wordmark | `#570D48` (we use the SVG instead) |

**Type** (Mier → Figtree, same weights)

| Panel class | Size | Weight | Where |
| --- | --- | --- | --- |
| `text-4xl font-heading` | 21px | Bold 700 | page title ("Welcome Team RK") |
| `text-3xl` / `text-2xl` | 19 / 17px | Bold | section titles ("Quality check errors") |
| `text-xl font-heading` | 15px | Bold | card titles ("Complete your account setup") |
| `text-xl font-button` | 15px | Demi 600 | buttons |
| `text-lg font-body` | 13px | Book 400 | body, sidebar items (Demi when active) |
| `text-base` | 12px | Book / medium | sidebar section labels, sub-menu items |
| `text-sm` | 11px | — | pills |
| `text-xs` | 10px | — | captions |

**Font pick: Figtree.** Rendered at the same sizes and weights and measured against Mier in the screenshots, average width error was +6.5% for Figtree, +9.7% for DM Sans and +12.8% for Plus Jakarta Sans (`font-comparison.png`). Figtree is a little wide everywhere, so `letter-spacing: -0.01em` would close most of the gap if needed.

**Spacing and radii**

| Token | Value |
| --- | --- |
| Base unit | 4px (`--spacing: 0.25rem`) |
| Card | white, radius 4px, padding 16px; gaps between cards 10–12px |
| Main column | max width 1216px (`max-w-304`), centred |
| Sidebar | 224px wide. Header 80px. Item rows 36px (8px 6px 8px 16px; active 12px left plus a 4px `tertiary-text` bar). Sub-items 40px tall with 40px left indent, 12px. Section label 12px with 20px above and 12px below. Footer 40px with the "meesho Supplier Hub" logo |
| Button | height 36px, padding 0 16px, radius 4px, 15px Demi; outline variant has a 1px `brand-primary-border` |
| Input | height ~44px, 1px `secondary-border`, radius 4px, floating label 11px |
| Radii | 2 / 4 / 6 / 8 / 12 / 16px; pills fully rounded |

## 4. Routes

Real panel URLs from the team (21 Oct 2026). `{sid}` is always the fake supplier code **`demo`**. Rows marked *ours* are paths we chose, following the same pattern.

**Onboarding (outside the panel; paths are ours)**

| Route | Page | Reference | C2M |
| --- | --- | --- | --- |
| `/outreach` | Category-level invitation (phone mock) | ⚠ **none** (new) | FO-3 |
| `/signup` | Sign-up (Meesho's own right panel, also from the outreach link) | `signup.png` | — |
| `/onboarding/done` | Finish screen after Supplier Details: what do you make → demand teaser → cost check (verified manufacturers only) | ⚠ **none** (new); teaser and cost check: doc p.11 mock-ups | FO-7, FO-4, FO-5 |
| `/cost-check` | Redirects to `/onboarding/done` (the cost check now runs there) | — | FO-5 |
| `/onboarding/business-details` | Step 1 | `onb-business-details.png` (Enrolment ID, *after* fetch); checks: doc p.12 | FO-6, FO-7 |
| `/onboarding/pickup-address` | Step 2 | `onb-pickup.png` (*after* save); choice: doc p.12 | FO-8 |
| `/onboarding/bank-details` | Step 3 | `onb-bank.png`, `onb-bank-filled.png` | — |
| `/onboarding/supplier-details` | Step 4 | `onb-supplier-details.png`, `onb-business-type-dropdown.png` | business type removed |

⚠ Gaps in onboarding:

- No screenshot of the **GSTIN** variant of step 1 (Jasmeet and Samar use GSTIN), or of the entry form before the fetch.
- No screenshot of the pickup address **entry form**.

**Panel** (all under `/panel/v3/new/`, inside the shell: sidebar, Notices/Support, e-signature banner)

| Route | Page | Reference | C2M |
| --- | --- | --- | --- |
| `growth/demo/home` | Home | `home.png`, `home-2.png` (upload step); `meesho-home.html` (QC-error state) | LB-3, LW-6, coach card |
| `growth/demo/notices` *(ours; not captured)* | Notices | `notices-1..4.png`, `meesho-notices.html` | (Factory Launch notice, P2) |
| `fulfillment/demo/orders/pending` (other tabs: `/orders/:tab`, *ours*) | Orders | `meesho-orders.html` (empty only) | — |
| `fulfillment/demo/returns/overview` | Returns | `meesho-returns.html` (empty only) | — |
| `fulfillment/demo/claims` | Claims | `meesho-claims.html` | — |
| `fulfillment/demo/warehouse` | Warehouse | `meesho-warehouse.html`; Pack Point: doc p.20 | PP-3, PP-4, PP-5 |
| `fulfillment/demo/warehouse/pack-point/providers` *(ours)* | Providers near you | doc p.20 mock-up only | PP-10 (P2) |
| `services/demo/ipp/allproducts` | Manage Pricing | `meesho-manage-pricing.html` (empty only) | — |
| `services/demo/ipp/price-position` *(ours)* | Manage Pricing → Price position tab | doc p.7 | PI-2, PI-3 |
| `services/demo/ipp/reduce-rto-and-returns/discounts-applied` (and `/add-discount`, *ours*) | Reduce RTO & Returns | `meesho-reduce-rto-returns.html` | — |
| `services/demo/inventory` | Inventory | `meesho-inventory.html` (empty only) | GL-2, GL-5, GL-6 ⚠ doc mock-up is blank |
| `cataloging/demo/catalogs/bulk`, `/catalogs/single` | Catalog Uploads (Bulk / Single tabs) | `catalog-uploads.png`, `meesho-catalog-uploads.html` | LB-3 (3rd option) |
| `cataloging/demo/catalogs/single/select-category` | Add Single Catalog: category | `catalog-select-category*.png`, `catalog-image-modal.png`, snapshot | LB-4 |
| `cataloging/demo/catalogs/single/add-product-details` *(ours)* | Add Single Catalog: details + price table | `catalog-product-details-1..3.png`, `catalog-other-attributes.png`, `catalog-price-table*.png`; doc pp.14–15 | LB-4, LB-5, LB-6, LB-8, LB-10 |
| `cataloging/demo/catalogs/bulk/add` | Bulk Catalog Upload | `bulk-upload-*.png`, snapshot | — |
| `cataloging/demo/images-bulk-upload` | Image Bulk Upload | `meesho-image-bulk-upload.html` | — |
| `cataloging/demo/product-optimiser` | Quality | `meesho-quality.html` (no-score state) | LW-8 |
| `payouts/demo/payments` | Payments | `meesho-payments.html` (empty only) | — |
| `livecommerce/demo/influencer-marketing` | Influencer Marketing | snapshot | — |
| `promotions/demo/list?tab=SALE&status=UPCOMING` | Promotions (Sale Events / Deals / Flash Events) | `meesho-promotions.html` | — |
| `promotions/demo/list?tab=FACTORY_LAUNCH` | **Factory Launch tab** | ⚠ **none**; doc mock-up is blank | LW-2, LW-3, LW-4, LW-5 |
| `promotions/demo/factory-launch/:id/live` *(ours)* | Live launch view | ⚠ **none**; doc mock-up is blank | LW-7 |
| `promotions/demo/sale/list?tab=SALE&status=UPCOMING` | Sale Opt-in | `meesho-sale-opt-in.html` | LW-2 tab |
| `promotions/demo/offer/list?tab=DEAL` | Offer Opt-in | `meesho-offer-opt-in.html` | — |
| `finance/demo/home` | Instant Cash | snapshot | — |
| `insights/demo/business-dashboard` | Business Dashboard | `meesho-business-dashboard.html` (zero state) | GL-3, GL-4 ⚠ doc mock-up is blank |

⚠ Other gaps:

- **No reference at all** for Support, the "Team RK" profile menu, Add Signature, Set Password, Fix QC Error, the post-submit QC screen or the buyer app (P2). These will open a small "not in this prototype" toast.
- **Populated states never seen.** Orders, Inventory, Business Dashboard, Payments and Manage Pricing exist only as empty states. The D23–D50 views need their populated tables, so I'll build those from the panel's own table and tile components, following the doc's note that "screens 12 and 14 will use mock data in the same layout".
- **Four doc mock-ups are blank placeholders.** The Factory Launch order book, the live launch view, the Inventory restock card and the Business Dashboard coach card have no drawn mock-up, so the Phase 4–5 checks ("matches the doc mock-ups") have nothing to match yet. I'll design them from panel components and they'll need your sign-off.

## 5. Engine

All §8 functions are written as typed signatures in `src/engine/` with tests carrying the hero numbers. Bodies throw `NotImplemented` until Phase 3, so `npm test` currently shows **50 red, 3 green (the B guard and the N = 30 seed check), 2 to-do**.

To check the tests themselves, I ran them against a throwaway implementation in the scratchpad (not committed): **53/53 passed** (after folding in the 21 Oct answers), so every hero number in §8/§8b is consistent with the formulas.

| Function | File | Hero test |
| --- | --- | --- |
| `costStack(type, makingCost, marginPct, mode, makersPooled = 40)` + `takeHomeAt` | `costStack.ts` | self-ship: fees 6/32/8/7 → break-even ₹133; 17.5% × ₹80 = ₹14; list ₹147. Pack Point: −₹6 packaging, +₹30 fee → break-even ₹157, list ₹171 (doesn't qualify, so Jasmeet self-ships) |
| `slots(type)` | `demand.ts` | 300÷60 = 450÷90 = 5 |
| `priceCheck(price, breakEven, B)` | `benchmark.ts` | ₹147 qualifies, ₹165 `aboveCap`, ₹133 and ₹160 both qualify, ₹132 `belowCost` |
| `benchmarkB(comparables, N)` *(engine-only)* | `benchmark.ts` | N = 30; 250th of 1,000 orders → ₹160; deck rows A/B/C excluded |
| `pricePosition(price, comparables, N)` | `benchmark.ts` | ₹147 → low, ₹165 → mid |
| `priceDrop(price, B)` *(ops-only)* | `benchmark.ts` | ₹13 = 8.1% of B, meets ≥ 8% |
| `demandForType(type)` | `demand.ts` | 300–450/wk, ₹150–170, High, 600 committed |
| `likelyShare(type)` | `demand.ts` | 20% → 60–90/wk → 9–13/day |
| `suggestedLot(type, makingCost)` | `demand.ts` | 11 × 14 = 154 → 150 units, ₹12,000 |
| `restock({…})` | `restock.ts` | 7.6 days, reorder 77, next 230, ₹18,400, start 24 Nov, land 29 Nov; never below min run |
| `verdict(sku)` | `verdict.ts` | bottle → Make more; lunch box → Fix; sipper → Stop (Q5, answered) |
| `switchSuggestions(line, current)` | `demand.ts` | casserole ~200 High, then flask ~120 Medium |
| `coachFix(funnel, bands)` | `coach.ts` | 2,400 views, 38 clicks → 1.6% vs 4.2% → change the main photo; trigger never returned |
| `eligibility(maker)` | `eligibility.ts` | Jasmeet eligible; reseller not (seller type, GST nature, Udyam); no Udyam → pending; Enrolment ID → not factory-track |
| `packPointFee(makers)` | `packPoint.ts` | built bottom-up from the deck's cost model: 20→₹44, 40→₹30, 60→₹26, 80→₹23; opens at 40 |
| `dayToDate(day)` | `calendar.ts` | D0 = 24 Oct 2026; D21–25 = 14–18 Nov; D31 = 24 Nov |
| `qualifyingPriceExists`, `checkListingPrice`, `listingPricePosition` | `ui.ts` | UI-safe wrappers: same results, B computed inside |

**Where a threshold is missing**, the tests don't invent one; they check the plan's result holds across the whole range the plan allows. For example, the coach's CTR cut-off is tested at both 1.6% and 4.2%. N was handled the same way until the team set it to 30.

## 6. Where the sources disagree

The plan wins in each case below, as instructed; these are flagged so the deck or doc can be fixed.

1. **Benchmark B rows.** The deck appendix has D = ₹150 × **250** orders, which makes the 25th percentile ₹150, not ₹160. The plan's ₹150 × **200** gives ₹160. I used the plan; the deck slide is internally inconsistent.
2. **Restock rounding.** The deck says "rounded up to the minimum run" (231 → 300); the plan says nearest 10 (→ 230). I used the plan.
3. **Slots.** The deck appendix says "≈ 5 6 slots"; the plan says 5. I used the plan.
4. **"Make more" vs the restock numbers.** The deck rule is "days of cover below lead time + safety", but 7.6 days isn't below 5 + 2 = 7, so the bottle wouldn't be "Make more". I proposed "restock should start today" instead (Q6).
5. **Stock at D31.** A 150-unit lot selling ~11 a day from D21 leaves ~30 units by D31, not 84. 84 on hand implies about 200 units committed, or fewer sales (Q2).
6. **Priorities.** The doc lists GL-3 (coach) and LB-8 (checklist) as P1 in their rows but P2 in its closing list. The plan cites "LB-9", which the doc doesn't define (I read it as LB-8). The doc marks LW-10 (buyer app) as P1, while the plan makes it P2 for this build. I'm following the plan: coach and checklist P1, buyer app P2.

## 7. Questions

**None of these block Phase 1** (shell + existing pages). Only the repo-privacy decision in §0 is urgent. Open questions will be raised as they become blocking.

| # | Needed by | Question |
| --- | --- | --- |
| Q1 | ✅ answered | D0 = 24 Oct 2026, so the launch is live 14–18 Nov and restock starts D31 = 24 Nov. |
| Q2 | Phase 4–5 | **Answered:** Jasmeet commits 150 at D5; daily orders D21–D30 = 12, 10, 11, 11, 12, 11, 10, 11, 11, 11; restock moved to D28 (73 on hand). |
| Q3 | ✅ answered | Pack Point drops packaging ₹6 and adds the ₹30 fee (GST included, at 40 makers); ₹32 / ₹8 / ₹7 unchanged. Bottle break-even ₹157, which is why Jasmeet self-ships. Storage shows only on the Warehouse page. Samar's footwear is the Pack Point demo. |
| Q4 | Phase 6 | **Answered:** men's casual slip-on sneakers (Men Fashion → Footwear → Casual Shoes), Agra (live Pack Point, 40 makers), making ₹200, margin 15% → ₹30; break-even ₹305, list ₹336 (GST ₹16); hidden B ₹370; 5–8 orders a day → lot 90 pairs (≈ ₹18,000), sizes 6–10 = 10/20/25/20/15; D50 inbound 90/90, ~650 g ±5%, storage free 30 days then ₹0.29/unit/day. |
| Q5 | Phase 5 | **Answered:** chip + one-line reason, no numbers. Lunch box is "Fix" (coach card); sipper is "Stop", reason "Sell-through low for 2+ weeks". |
| Q6 | Phase 3 | **Resolved:** "Make more" uses the deck rule (cover < lead + safety days); "start by" = today + whole days until on-hand reaches the reorder point. D28 data: start 21 Nov. |
| Q7 | ✅ answered | N = 30: a listing needs at least 30 delivered orders to count toward B. |
| Q8 | Phase 3 | **Answered (Phase 6 review):** share of comparable orders priced below: < 1/3 Low, 1/3–2/3 Mid, > 2/3 High; ₹165–190 split ₹165×150, ₹170×100, ₹175×100, ₹180×80, ₹190×70. |
| Q9 | Phase 4 | **Answered:** 5 slots, 4 taken → "1 slot left", not crowded; after Jasmeet commits, 5/5 and crowded for others. |
| Q10 | Phase 5 | **Answered:** 4.2% is the median click rate of similar listings (shown). Trigger: click rate below 2.5% (bottom quarter), internal, never shown. No views floor. |
| Q11 | ✅ answered | Only the two "I have a manufacturing unit…" options pass; every other type sells normally but isn't eligible for Factory Launch. Was: Which business types pass the seller-type check: just the two "manufacturing unit" options, or also "handcrafted products at home"? |
| Q12 | Phase 4 | **Answered:** use the D21–D30 series (see Q2). |
| Q13 | Phase 5 | **Answered:** bottle, last 7 days at D28: 19,250 views, 770 clicks (4.0%), 77 orders, 10.0% conversion, ₹11,319 sales, 1 return (1.3%). The 2,400 / 38 funnel is the lunch box's. |
| Q14 | Phase 4 | **Answered:** label only ("Building"). |
| Q15 | ✅ answered | Claude drafts the Hindi copy; the team reviews it. Was: Hindi copy for the bot screens and coach card: should I draft it for your review, or will you supply it? |
| Q16 | ✅ answered | Real panel URLs, with `{sid}` = `demo`; see §4. |
| Q17 | ✅ answered | Adapt existing layouts; Jasmeet sees the GSTIN version with fake values. Was: Can you capture Business Details with a **GSTIN**, and the pickup address entry form? Otherwise I'll adapt the existing layouts. |
| Q18 | ✅ answered | GST = 5% of the selling price, included in it (HSN 7323): GST = price × 5/105; break-even ⌈126 × 1.05⌉ = ₹133, list (126+14) × 1.05 = ₹147, Pack Point break-even ₹158. Was: GST ₹7: fixed per type, or 5% of price (₹7.35 at ₹147)? It changes "take-home at every price" on the cost check. |
| Q19 | ✅ answered | No first-lot cap; each maker's own minimum run, soft warning if they commit below it. Was: Is there a first-lot cap ("capped at the standard first-lot limit", deck)? 150 is under any cap you'd pick, but the engine needs the number. |
| Q20 | ✅ answered | Keep ₹30 in every calculation. The seller sees “₹30 + GST per delivered order” with an (i): “18% GST on this service. GST-registered sellers claim it back as input credit, so it isn’t counted in your cost.” (The deck’s × 1.18 is the partner margin.) |
| Q21 | ✅ answered | Only Pack Points within 150 km of the pickup pincode are listed; none within 150 km → “No Pack Point near you yet. You’ll be notified when one opens.” Samar’s self-ship packaging (shoe-box mailer) ₹10: 270 → ₹284 / ₹315, take-home ₹30, qualifies. No-Pack-Point pincode: greyed-out option with the message. |
