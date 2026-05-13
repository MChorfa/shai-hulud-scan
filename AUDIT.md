# UI Rigor & Consistency Audit

**Date:** 2026-05-12  
**Scope:** All Next.js app pages, shared components, layout, and data sources  
**Source of Truth (DB):** 822 total packages | 798 shai-hulud-2 | 24 mini-shai-hulud | 100% critical risk level | 33 IOCs

---

## 1. Visual & Layout Consistency

| # | Issue | File(s) | Severity |
|---|-------|---------|----------|
| 1.1 | **Inconsistent max-width containers:** `page.tsx` uses `max-w-7xl`, `analyze` and `education` use `max-w-6xl`, `developers` uses `max-w-7xl`. | `page.tsx`, `analyze/page.tsx`, `education/page.tsx` | Medium |
| 1.2 | **Inconsistent card border radius:** `page.tsx` uses `rounded-sm`, `analyze/page.tsx` uses `rounded-lg` for result cards, `education/page.tsx` uses `rounded-sm`. | All pages | Low |
| 1.3 | **CRT overlay missing on Analyze & Education pages:** Only Home and Developers have the scanline/CRT effect. | `analyze/page.tsx`, `education/page.tsx` | Medium |
| 1.4 | **Footer uses emoji icons (🔬📚🔗) instead of lucide-react** — breaks icon consistency. | `Footer.tsx` | Medium |
| 1.5 | **Education page "Analysis Instructions" buttons are non-functional** — plain `<button>` with no `onClick` or `href`. | `education/page.tsx:356-379` | High |
| 1.6 | **Developers page heading has backwards responsive sizing:** `text-4xl md:text-2xl` makes text *smaller* on medium screens. | `developers/page.tsx:24` | Medium |
| 1.7 | **Deprecated `onKeyPress` event** on search input — should be `onKeyDown`. | `page.tsx:313` | Low |
| 1.8 | **Analyze page upload area uses `rounded-lg`** while all other cards use `rounded-sm`. | `analyze/page.tsx:238` | Low |

## 2. Data Accuracy & Completeness

| # | Issue | File(s) | Severity |
|---|-------|---------|----------|
| 2.1 | **Hardcoded fallback `795`** in hero stats and embeddings stats — DB has **822** packages. | `page.tsx:145-148, 161-165, 254, 283` | High |
| 2.2 | **`miniCount` and `shaiHulud2Count` never populated:** `PackageStats` interface expects them, but neither `getPackageStats()` nor `getPackageStatsStatic()` returns these fields. Hero counts work only by coincidence (`miniCount` undefined → 0, so shai-hulud-2 = total − 0 = total). | `page.tsx:30-39, 114` | High |
| 2.3 | **All 822 packages are "critical" risk** — static `stats.json` shows 822 critical, 0 high/medium/low. This is accurate per DB but may be surprising; verify this is intentional. | `public/data/stats.json` | Info |
| 2.4 | **Static-db rounds percentages to integers** (`Math.round`) while DB API returns 2 decimal places (`ROUND(..., 2)`). | `static-db.ts:134-153` | Low |
| 2.5 | **Developers page says "Next.js 15"** but project uses Next.js 16.1.2. | `developers/page.tsx:229` | Medium |
| 2.6 | **`checkPackageStatic()` does exact name+version match only** — won't catch compromised packages if version differs slightly. | `static-db.ts:184-187` | Medium |

## 3. Copy, Terminology & Messaging

| # | Issue | File(s) | Severity |
|---|-------|---------|----------|
| 3.1 | **Outdated Dagger CLI command:** `dagger call pipeline` — function was renamed to `Deploy` in `dagger/main.go`. | `developers/page.tsx:193` | High |
| 3.2 | **Nav link says "Analyze SBOM"** but page heading says "Dependency & SBOM Analysis" — mismatch. | `Navigation.tsx:37`, `analyze/page.tsx:222` | Low |
| 3.3 | **Hero "CRITICAL" risk level is hardcoded** — accurate (all packages are critical) but not dynamically derived from data. | `page.tsx:243` | Low |
| 3.4 | **Hero database dates:** "Nov 2025" and "May 2026" are approximations; should match actual CSV/source data. | `page.tsx:283` | Low |

## 4. Accessibility & Best Practices

| # | Issue | File(s) | Severity |
|---|-------|---------|----------|
| 4.1 | **Education page buttons are missing `type="button"`** — inside a form-like context they could trigger submission. | `education/page.tsx:356, 364, 372` | Low |
| 4.2 | **Result list uses `index` as React key** in search results and findings — should use unique IDs. | `page.tsx:371`, `analyze/page.tsx:381` | Low |

---

## Recommended Fix Order

1. **Fix data accuracy** (2.1, 2.2) — replace hardcoded 795 with 822 and derive campaign counts from `campaigns` array.
2. **Fix copy/terminology** (3.1, 3.2) — update Dagger command and nav label.
3. **Fix functional bugs** (1.5, 1.6, 1.7) — make education buttons work, fix responsive heading, replace deprecated event.
4. **Fix visual consistency** (1.1, 1.3, 1.4, 1.8, 2.5) — align max-widths, add CRT to missing pages, replace footer emojis with lucide icons, align border radius, fix Next.js version.
