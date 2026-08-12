# Color Token Centralization Completion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Finish full-product color centralization (UI + email + meta + badges) with Vitest/ESLint hardening so theme changes live only in `globals.css` (+ `nonCssColors` mirror).

**Architecture:** CSS variables in `app/globals.css` are the web SSOT; `lib/theme/nonCssColors.ts` mirrors `:root` hex for email/meta/Excel; components use only semantic Tailwind tokens / `var(--*)`.

**Tech Stack:** Next.js 16, Tailwind v4, Vitest, ESLint flat config

**Spec:** `equus/docs/superpowers/specs/2026-07-24-color-token-centralization-completion-design.md`

## Global Constraints

- Equus only — do not touch `health/`
- Semantic tokens only in components — no raw Tailwind palette names, no inline hex (except Google icon allowlist)
- All web color definitions live in `app/globals.css`
- `nonCssColors.ts` must stay in sync with `:root` (enforced by test)
- Each task ends with `cd equus && npm test` passing before commit

---

## File Structure

| File | Action |
|------|--------|
| `equus/app/globals.css` | Add overlay, badge-band, dark status tokens; badge classes; dialog overlay overrides |
| `equus/lib/theme/nonCssColors.ts` | Create — mirrored hex + badge band hex for exports |
| `equus/tests/theme/nonCssColorsSync.test.ts` | Create — sync gate |
| `equus/tests/theme/colorCentralization.test.ts` | Create — audit gate |
| `equus/components/table/utils.ts` | Badge configs → CSS vars / nonCssColors for ARGB |
| Feature overlay TSX files (list in Task 3) | Migrate black/white → overlay / foreground tokens |
| `equus/components/ui/slider.tsx` | `bg-white` → `bg-background` |
| `equus/lib/email/layout.ts` + templates | Use `nonCssColors` only |
| `equus/app/layout.tsx` | Meta colors from `nonCssColors` |
| `equus/eslint.config.mjs` | Restrict hex in components |
| `equus/AGENTS.md` | Expand color convention |

---

### Task 1: Foundation — tokens, nonCssColors, sync test

**Files:** Create `equus/lib/theme/nonCssColors.ts`, `equus/tests/theme/nonCssColorsSync.test.ts`; Modify `equus/app/globals.css`

- [x] **Step 1:** Add to `@theme inline`: `--color-overlay`, `--color-overlay-foreground`, `--color-overlay-heavy`, and badge-band color mappings as needed.
- [x] **Step 2:** Add `:root` / `.theme-neutral` / `.dark` values for overlay + all nine badge-band pairs; add missing `.dark` success/warning/info.
- [x] **Step 3:** Add `@layer` rules for `.badge-band-*` and `.badge-band-swatch-*`.
- [x] **Step 4:** Create `nonCssColors.ts` exporting hex for primary, primaryForeground, muted, border, foreground, mutedForeground, link (=primary), browserThemeColor (=primary), and `badgeBands` record with bg/fg hex matching `:root`.
- [x] **Step 5:** Write sync test that reads `app/globals.css`, extracts `:root` `--primary`, `--primary-foreground`, `--muted`, `--border`, `--foreground`, `--muted-foreground`, and each `--badge-band-*` / `-foreground`, asserts equality with `nonCssColors`.
- [x] **Step 6:** `cd equus && npm test` — pass. Commit.

### Task 2: Table badge bands

**Files:** Modify `equus/components/table/utils.ts` (and Excel helpers if they read hex from configs)

- [x] **Step 1:** Change `COLOR_BAND_CONFIGS` styles to `var(--badge-band-X)` / `var(--badge-band-X-foreground)`.
- [x] **Step 2:** Any Excel ARGB that used config hex must use `nonCssColors.badgeBands` instead.
- [x] **Step 3:** `npm test` — pass. Commit.

### Task 3: Feature overlays & foregrounds

**Files:**  
`file-upload.tsx`, `profile-photo-field.tsx`, `confirm-action-dialog.tsx`, `media-gallery-section.tsx`, `lightbox-dialog.tsx`, `ownership-management-section.tsx`, `incomplete-profile-banner.tsx`

- [x] **Step 1:** Replace `bg-black/*` → `bg-overlay` / opacity variants / `bg-overlay-heavy`; `text-white` on scrims → `text-overlay-foreground`; destructive `text-white` → `text-destructive-foreground`; banner link → `text-primary-foreground`; `border-white` → `border-overlay-foreground` where appropriate.
- [x] **Step 2:** `npm test` — pass. Commit.

### Task 4: Durable shadcn overlays + slider

**Files:** `globals.css`, `components/ui/slider.tsx`

- [x] **Step 1:** In `globals.css`, override dialog/sheet/alert-dialog overlay backdrops to use overlay token (inspect `data-slot` in those components).
- [x] **Step 2:** Slider thumb `bg-white` → `bg-background`.
- [x] **Step 3:** `npm test` — pass. Commit.

### Task 5: Email + meta

**Files:** `lib/email/layout.ts`, four templates, `app/layout.tsx`

- [x] **Step 1:** Refactor email layout to solid primary CTA/header from `nonCssColors`; body/border/text from tokens.
- [x] **Step 2:** Remove all hex from templates — use helpers or imported colors.
- [x] **Step 3:** Meta theme-color / tile from `nonCssColors.browserThemeColor`.
- [x] **Step 4:** `npm test` — pass. Commit.

### Task 6: Audit, ESLint, docs

**Files:** `tests/theme/colorCentralization.test.ts`, `eslint.config.mjs`, `AGENTS.md`; mark plan checkboxes done

- [x] **Step 1:** Write color centralization audit (components + app TS/TSX; email lib hex ban except via nonCssColors).
- [x] **Step 2:** ESLint restrict hex string literals under `components/` (allow `icons/google-icon.tsx`).
- [x] **Step 3:** Expand AGENTS.md color section.
- [x] **Step 4:** Full `npm test` + fix any audit hits. Commit. Mark all plan steps `[x]`.

---

## Final verification

- [x] Brand lever: changing `--primary` in `:root` would update UI/email/meta consumers without component hex.
- [x] Zero raw palette / disallowed black-white / hex outside allowlist (Google icon + globals.css + nonCssColors definitions).
