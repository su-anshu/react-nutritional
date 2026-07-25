# QA Report — Nutrition Label Generator

| | |
|---|---|
| **Date** | 2026-07-20 |
| **Target** | http://localhost:5177 (Vite dev) |
| **Mode** | Full, report-only (no fixes — user choice, not a git repo) |
| **Tier** | Standard |
| **Framework** | React 18 + Vite 5 SPA |
| **Pages** | 1 (single-page tool) |
| **Products swept** | 96/96 |
| **Health score** | **92 / 100** |

## Summary

The app works. All 96 products loaded from Google Sheets render a valid label:
serving grams parse correctly, the "Per N g" header resolves for every product
(zero fallbacks to "Per Serving"), and per-serving math is correct on all
spot-checks (Roasted Chana 370→111 kcal @30g; Makhana 350→70 @20g; Baking Soda
38→1.9 @5g, sodium 26000→1300mg = 65% RDA). Single PDF, single PNG, and batch
PDF (2 products, valid `%PDF-1.3`, 2 pages) all download. Error path (sheet
unreachable) fails safely: buttons disabled, red status shown.

**4 issues found. 4 fixed and verified (follow-up session, same day). Health score 92 → 100.**

## Fix log (2026-07-20 follow-up)

| Issue | Fix | Verified |
|---|---|---|
| ISSUE-001 | App.jsx: error placeholder "— Load failed —" + Retry button calling `loadSheet()` | ✅ blocked sheet → error UI shows; clicked Retry → 96 products recovered |
| ISSUE-002 | index.css: `.preview-panel { max-width:100%; overflow-x:auto }` | ✅ 375px viewport: page scrollWidth 360 (no page scroll); panel scrolls internally; label stays 420px for export |
| ISSUE-003 | index.html: inline SVG favicon | ✅ zero console errors on load |
| ISSUE-004 | App.jsx: PDF embeds JPEG q0.92 (single + batch) | ✅ single PDF 7.45MB → 260KB (28×); batch-of-2 16.3MB → 517KB (31×); valid %PDF-1.3 |

## Issues

### ISSUE-001 — No retry after failed sheet load; dropdown lies "Loading…" forever
- **Severity:** Medium | **Category:** UX / Functional | **Status:** deferred (report-only)
- **Repro:** Block `docs.google.com`, reload. Status shows "❌ Failed: Failed to fetch"
  (correct), but the disabled dropdown still reads "— Loading products… —" and never
  changes. No retry control; only a manual page refresh recovers.
- **Evidence:** route-abort test, status `{cls: "status-bar error", firstOption: "— Loading products… —"}`
- **Suggested fix:** on error, set the placeholder option to "— Load failed —" and
  render a Retry button that calls `loadSheet()` (it's already a `useCallback` in App.jsx).

### ISSUE-002 — Horizontal overflow on mobile (375px)
- **Severity:** Medium | **Category:** Visual / Responsive | **Status:** deferred
- **Repro:** viewport 375×812 → `document.scrollWidth` 444px vs 375 viewport;
  the fixed 420px label + body padding forces horizontal scroll.
- **Evidence:** screenshots/mobile-375.png; measured `{docScrollWidth: 444, labelRight: 444}`
- **Suggested fix:** wrap the preview panel in `overflow-x: auto`, or scale the label
  with `transform: scale()` under a 480px media query (keeps export size intact since
  html2canvas renders the DOM node, but verify export after).

### ISSUE-003 — Favicon 404 on every load
- **Severity:** Low | **Category:** Console | **Status:** deferred
- **Repro:** every page load logs `GET /favicon.ico 404`.
- **Suggested fix:** add any favicon to `index.html` (even inline SVG data URI).

### ISSUE-004 — Batch PDF file size is heavy (~8 MB/label)
- **Severity:** Low | **Category:** Performance | **Status:** deferred
- **Repro:** batch of 2 labels → 16.3 MB PDF. Cause: html2canvas `scale: 3` PNG
  embedded per page.
- **Suggested fix:** use JPEG at quality ~0.92 for the embedded image
  (`canvas.toDataURL('image/jpeg', 0.92)`) or drop scale to 2 — 45×45mm print
  target doesn't need 3× PNG.

## What passed

- ✅ Sheet auto-load: 96 products, status bar green
- ✅ Full product sweep (96/96): serving grams parse, per-serving header, no zero-energy anomalies
- ✅ Per-serving math: 3/3 spot-checks exact (`per100g × grams ÷ 100`)
- ✅ % RDA: correct per-serving basis; Total Sugar correctly shows `-` (no RDA)
- ✅ Single PDF download (`Baking Soda.pdf` pattern verified earlier; valid PDF header)
- ✅ Single PNG download (`Baking Soda.png`)
- ✅ Batch mode: 96 checkboxes, count in button label, disabled at 0 selected
- ✅ Batch PDF: 2 labels → valid multi-page `%PDF-1.3`
- ✅ Error path: fetch failure → red status, all download buttons disabled
- ✅ Console: zero JS errors across all interactions (only favicon 404 resource error)
- ✅ Typography/label render: tabular columns aligned, all 11 nutrient rows + footnotes

## Health score breakdown

| Category | Score | Weight | Notes |
|---|---|---|---|
| Console | 70 | 15% | 1 recurring resource 404 (favicon) |
| Links | 100 | 10% | no broken links |
| Visual | 92 | 10% | mobile overflow (medium) |
| Functional | 100 | 20% | all flows work |
| UX | 84 | 15% | error state unrecoverable + misleading "Loading…" (medium ×2 counted once as -8, misleading label -8) |
| Performance | 97 | 10% | heavy batch PDFs (low) |
| Content | 100 | 5% | copy correct |
| Accessibility | 100 | 15% | labeled controls, h1 present, lang set |
| **Weighted total** | **92** | | |

## Top 3 things to fix

1. **ISSUE-001** — add a Retry button + truthful "Load failed" placeholder (small change, App.jsx)
2. **ISSUE-002** — mobile overflow (CSS-only fix)
3. **ISSUE-004** — JPEG instead of PNG in PDFs, ~10× smaller files

> PR summary: QA found 4 issues (0 critical, 0 high, 2 medium, 2 low), fixed 0 (report-only), health score 92.
