# Maker App Prototype: Team RK · Meesho DICE S3 (C2M)

A clickable replica of Meesho's Supplier Hub (onboarding + seller panel) with Team RK's C2M features added only where `maker-app-build-plan.md` §5 says. Maker side only; the ops console is out of scope.

## Sources of truth (in this order)

1. `maker-app-build-plan.md`: scope, screens, engine, numbers.
2. `reference/C2M-solution-doc.pdf`: where each feature sits, with mock-ups.
3. `reference/deck.pdf`: the Round-2 deck. Its numbers are final.
4. `reference/screens/*.png` and `reference/html/*.html`: how existing pages look. Screenshots are at **125% browser zoom**, so divide pixel sizes by 1.25.

If a number isn't in 1–3, **don't make one up.** Add it to the open questions in `docs/phase-0/PHASE-0.md` §7 and ask.

## Non-negotiables

- **Concept label on every page**: a thin strip that reads "Concept prototype · Team RK · synthetic data · not affiliated with Meesho". It stays on every route, including onboarding and modals, and can't be hidden by the demo controls.
- **No real auth.** Sign-up and OTP screens are mock-ups and their inputs submit nowhere. No real phone, PAN, GSTIN, Enrolment ID, Udyam, bank account, IFSC, email or address may appear anywhere, including code, seed data, tests, commits and reference images. Use obviously fake values (e.g. `+91 90000 00000`, `ABCDE1234F`, `00AAAAA0000A1Z0`).
- **Logo and icons**: use Meesho's own logo and sidebar icons. Save them into `/public/brand/` from the URLs in `reference/html/` and never hot-link Meesho's servers. Don't ship Meesho's JS or font files. The concept strip and the non-working sign-up mean the prototype can't pass as the real panel.
- **Font**: Mier is licensed to Meesho, so we use **Figtree** (self-hosted, weights 400/600/700) for Mier Book/Demi/Bold. It is set by one variable, `--font-sans`, so swapping it is a one-line change. See `docs/phase-0/font-comparison.png`.
- **Benchmark B never appears as a number in the maker UI.** It lives only in `src/engine/benchmark.ts`. UI code imports the engine only through `src/engine/ui.ts`, which never returns B. The maker sees "Qualifies / Doesn't qualify" and a price position in thirds (Low / Mid / High). `benchmark.guard.test.ts` enforces this.
- **Arithmetic must hold.** Every number on screen comes from the engine or the seed JSON, never typed into a component. Each hero value in plan §8b has a test that recomputes it.
- **Deterministic data**: all synthetic data comes from seeded JSON in `src/data/`. No `Math.random`, no `Date.now()` driving content, no network calls at runtime. The demo "day" (D0–D90) drives everything that changes over time.
- **Deploy unlisted** (noindex everywhere), at $0.

## Two rules that decide every screen

1. **Existing = replicate, don't redesign.** Copy the layout, sidebar order, colours, copy, buttons and empty states from the screenshot or HTML snapshot. A page with no C2M feature is a faithful static replica.
2. **New = native-looking insert.** Every addition uses the panel's own components (white cards, pills, yellow info banners, green success banners, indigo buttons, (i) tooltips) and sits exactly where the doc places it. Don't add new colours, shadows or component styles.

## Layout

```
src/
  engine/      pure functions + Vitest tests; ui.ts is the only public entry
  data/        seeded JSON (each block tagged with its source)
  styles/      tokens.css (the panel's semantic tokens)       ← Phase 1
  components/  panel primitives: Button, Card, Pill, Banner…  ← Phase 1
  layout/      PanelShell, Sidebar, OnboardingShell, ConceptStrip, DemoControls
  pages/       onboarding/*, panel/*, outreach
  features/    C2M inserts, one folder per doc ID group (fo, lb, lw, gl, pi, pp)
  store/       Zustand demo store (persona, day, language)
  i18n/        en.json, hi.json
reference/     inputs only; never imported by the app
docs/          phase write-ups and comparison images
```

## Commands

- `npm test` runs all engine tests (Vitest).
- `npm run typecheck` runs `tsc --noEmit`.
- `npm run dev` starts the app; `npm run build` type-checks and builds.
- `npm run compare [names…]` renders routes beside their reference at 125% into `docs/compare/` (entries in `scripts/compare/*.json`). Use it for every page change.
- `python3 -I scripts/html2jsx.py <snapshot> [--tag div --from "text"]` ports snapshot markup to JSX with local image paths.

## Conventions

- Routes mirror the real panel URLs (`/panel/v3/new/<area>/{sid}/…`) with the fake supplier code **`demo`**. The full list is in `docs/phase-0/PHASE-0.md` §4 and `src/app/paths.ts`.
- Demo calendar: D0 = 24 Oct 2026 (`src/data/calendar.json`). Launch live D21–D25 = 14–18 Nov; restock starts D31 = 24 Nov.
- Tokens use the panel's own names (`primary-text`, `secondary-bg`, `brand-primary-bg`, `success-bg`…), so markup from `reference/html/` ports class-for-class.
- Sizes follow the panel's scale: 10/11/12/13/15/17/19/21px. Body text is 13px, buttons and card titles 15px, page titles 21px.
- C2M inserts carry a `data-c2m="<doc-id>"` attribute (e.g. `data-c2m="LB-6"`) so reviewers can find every addition.
- Copy shown to makers is in `i18n/`; hard-coded strings are only for replicated Meesho copy.
- Before any commit, check that no real personal data is in the diff, including image regions.
