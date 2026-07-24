# Color Token Centralization Completion — Design Spec

**Date:** 2026-07-24  
**Scope:** equus only (`health/` and other reference apps are not touched)  
**Status:** Approved  
**Supersedes:** `docs/superpowers/specs/2025-07-19-color-token-centralization-design.md` and `docs/superpowers/plans/2025-07-19-color-token-centralization.md`

**Goal:** Make every user-visible Equus color themeable from one place, cover the full product surface (UI + email + meta + table badges + exports that carry color), and harden the repo so raw colors cannot creep back.

---

## Problem

The 2025-07-19 centralization pass largely migrated React UI to semantic tokens in `app/globals.css`, and `AGENTS.md` already documents the convention. The job is **not finished**:

1. Table badge bands still embed raw hex in `components/table/utils.ts`.
2. Transactional email HTML uses a separate olive-green brand and scattered gray hex — not the orange Equus theme.
3. Feature and shadcn surfaces still use `bg-black/*`, `text-white`, `bg-white` for overlays, destructive buttons, and chrome.
4. Browser meta `theme-color` / `msapplication-TileColor` still use purple `#8B5CF6`.
5. `.dark` is missing `--success` / `--warning` / `--info` (present in `:root` and `.theme-neutral`).
6. There is no automated audit — regressions can land silently.
7. The old plan’s checkboxes were never closed; tracking is stale.

Partial theme work is unacceptable: the next pass must finish the full product surface and lock it with tests/lint.

---

## Architecture (Approach 1 — CSS-first SSOT + thin non-CSS adapters)

```
equus/app/globals.css
  (:root / .theme-neutral / .dark + @theme inline)
        │
        ├─ Tailwind semantic classes  →  React UI
        ├─ CSS var() in inline styles →  badge bands, calendar markers (browser)
        └─ mirrored hex map           →  equus/lib/theme/nonCssColors.ts
                ├─ email layout + templates
                ├─ Excel / export ARGB helpers that need concrete hex
                └─ app/layout.tsx theme-color / tile color
```

**Web source of truth:** `equus/app/globals.css` only. No other file defines web theme color values.

**Non-CSS contexts** (HTML email, some Excel fills, meta tags) cannot reliably consume CSS variables. They import named hex from `equus/lib/theme/nonCssColors.ts`, which **must** match `:root` values in `globals.css`. A Vitest sync test parses `globals.css` and asserts equality — drift fails CI/`npm test`.

**Allowlist (never migrated to theme tokens):**

| File / pattern | Reason |
|----------------|--------|
| `equus/components/icons/google-icon.tsx` | Google brand identity SVG fills |
| `equus/app/globals.css` | Canonical token definitions |

Everything else that paints product UI or branded email chrome goes through tokens or `nonCssColors`.

---

## Current state (baseline audit)

### Already done (do not re-migrate)

- Semantic token infrastructure in `globals.css` (`@theme inline`, `:root` orange theme, `.theme-neutral`, `.dark`).
- `success` / `warning` / `info` tokens on `:root` and `.theme-neutral`.
- AGENTS.md §9 “Color convention — semantic tokens only”.
- No raw Tailwind palette utilities (`text-orange-700`, `bg-gray-200`, …) left in typical feature components from the 2025 pass.
- Planning calendar already uses `var(--info)`.

### Remaining gaps (in scope)

| Surface | Location | Issue |
|---------|----------|--------|
| Badge bands | `components/table/utils.ts` (`COLOR_BAND_CONFIGS`) | Nine palettes with inline `#hex` |
| Badge CSS | `badge-band-*` class names | Referenced but not defined as token-backed rules in CSS |
| Email brand | `lib/email/layout.ts` | Olive gradient `#3d4a2c` / `#6b7c4e` — wrong brand |
| Email body | `lib/email/templates/*.ts` | Hardcoded gray text hex |
| Meta theme | `app/layout.tsx` | Purple `#8B5CF6` |
| Dark status | `globals.css` `.dark` | Missing `--success`, `--warning`, `--info` (+ foregrounds) |
| Overlays | media, file-upload, profile-photo, lightbox | `bg-black/*` + `text-white` |
| Destructive CTAs | confirm dialogs, ownership, etc. | `text-white` instead of `text-destructive-foreground` |
| Banner link | `incomplete-profile-banner.tsx` | `text-white` instead of `text-primary-foreground` |
| shadcn overlays | `ui/dialog`, `ui/sheet`, `ui/alert-dialog` | `bg-black/10` — fragile under `ui:sync` |
| Slider thumb | `ui/slider.tsx` | `bg-white` |
| Harden | eslint / tests | No forbidden-color gate |

---

## Token additions

### 1. Complete `.dark` status tokens

Add to `.dark` (values from the 2025 design; still missing in the file):

```css
--info: oklch(0.623 0.214 259.815);
--info-foreground: oklch(0.145 0 0);
--success: oklch(0.623 0.214 142.495);
--success-foreground: oklch(0.145 0 0);
--warning: oklch(0.795 0.184 85.964);
--warning-foreground: oklch(0.145 0 0);
```

### 2. Overlay / scrim tokens

| CSS variable | `:root` intent | Tailwind mapping |
|--------------|----------------|------------------|
| `--overlay` | Semi-opaque dark scrim on media | `--color-overlay` → `bg-overlay` |
| `--overlay-foreground` | Icon/text on scrim | `--color-overlay-foreground` → `text-overlay-foreground` |
| `--overlay-heavy` | Near-opaque lightbox backdrop | `--color-overlay-heavy` → `bg-overlay-heavy` |

`:root` examples (exact values set in implementation to match current visuals):

- `--overlay: rgb(0 0 0 / 0.5);`
- `--overlay-foreground: #ffffff;`
- `--overlay-heavy: rgb(0 0 0 / 0.95);`

Also define readable values under `.theme-neutral` and `.dark`.

**shadcn dialog/sheet/alert-dialog overlays:** do **not** rely only on editing `components/ui/*` (overwritten by `npm run ui:sync`). Prefer durable rules in `globals.css` that target the overlay slot/attributes those primitives render, using `bg-overlay` / token values. After sync, visuals stay correct without re-patching generated files. Feature-level `text-white` / `bg-black/*` in non-`ui/` files are migrated in TSX to semantic classes.

### 3. Badge band tokens

For each palette key `gray | yellow | green | red | orange | blue | purple | pink | neutral`:

- `--badge-band-{key}` (background / border swatch)
- `--badge-band-{key}-foreground` (label text)

Wire through `@theme inline` **or** `@layer` utility classes named `badge-band-{key}` / `badge-band-swatch-{key}` that set `background-color`, `color`, and `border-color` from those variables.

`COLOR_BAND_CONFIGS` must stop storing raw hex. Browser paths use `var(--badge-band-*)` (or class-only styling). Excel/export paths that need concrete ARGB read hex from `nonCssColors` (or a dedicated badge export helper fed by the same map).

### 4. Email palette (via `nonCssColors`, aligned to Equus orange)

Email must use the **same brand as the app**, not the legacy olive health-port colors.

Minimum keys in `lib/theme/nonCssColors.ts` (names mirror CSS tokens):

| Key | Maps to `:root` | Email use |
|-----|-----------------|-----------|
| `primary` | `--primary` (`#f97316`) | Header background and CTA fill |
| `primaryForeground` | `--primary-foreground` | Header / CTA text |
| `muted` | `--muted` | Body panel background |
| `border` | `--border` | Panel / hr borders |
| `foreground` | `--foreground` | Headings |
| `mutedForeground` | `--muted-foreground` | Body / footer copy |
| `link` | `--primary` | Fallback URL links |

Email CTAs use a **solid** `primary` fill (not a multi-stop gradient) for client reliability. All colors come only from `nonCssColors`.

Templates (`relationshipInvite`, `staffInvite`, `passwordReset`, `emailConfirmation`) replace inline `#374151` / `#6b7280` with values from the shared layout helpers or `nonCssColors` — no hex literals left in template files.

### 5. Meta theme color

`app/layout.tsx` `theme-color` and `msapplication-TileColor` import `primary` (or an explicit `browserThemeColor` alias) from `nonCssColors` — never a hardcoded purple.

---

## Component & module migrations

### Phase A — Foundation (`globals.css` + `nonCssColors` + dark tokens)

1. Add overlay and badge-band variables to `@theme inline` / `:root` / `.theme-neutral` / `.dark`.
2. Fill missing `.dark` success/warning/info tokens.
3. Add `badge-band-*` CSS rules.
4. Create `equus/lib/theme/nonCssColors.ts` with `:root`-matching hex (and any email-only derived strings built from those keys).
5. Add Vitest sync test: parse listed custom properties from `globals.css` `:root` and assert match against `nonCssColors`.

### Phase B — Table badges

1. Rewrite `COLOR_BAND_CONFIGS` to use `var(--badge-band-*)` / foreground vars (no `#`).
2. Ensure swatch helpers and Excel ARGB conversion use the token map where concrete hex is required.
3. Visually verify color-range editor and badge cells.

### Phase C — Feature UI overlays & semantic foregrounds

Migrate (non-exhaustive checklist for the plan; audit will catch stragglers):

- `components/shared/file-upload.tsx`
- `components/shared/profile-photo-field.tsx`
- `components/shared/confirm-action-dialog.tsx`
- `components/horses/media/media-gallery-section.tsx`
- `components/horses/media/lightbox-dialog.tsx`
- `components/horses/ownership/ownership-management-section.tsx`
- `components/layout/incomplete-profile-banner.tsx`

Rules:

- Scrims → `bg-overlay` / `bg-overlay-heavy` / opacity modifiers on those tokens as needed.
- Text/icons on scrims → `text-overlay-foreground`.
- Destructive buttons → `text-destructive-foreground` (not `text-white`).
- Banner on `bg-primary` → `text-primary-foreground`.

### Phase D — Durable shadcn overlay + slider

1. `globals.css` overrides for dialog/sheet/alert-dialog overlay backdrops → tokenized overlay (survives `ui:sync`).
2. Slider thumb: prefer `bg-background` (or `bg-card`) instead of `bg-white`; if `ui/slider.tsx` is edited, document in AGENTS that post-`ui:sync` the thumb class must remain semantic — or override via CSS if a stable slot exists.

### Phase E — Email + meta

1. Refactor `lib/email/layout.ts` to import only from `nonCssColors`.
2. Refactor all four templates to remove hex.
3. Point `app/layout.tsx` meta colors at `nonCssColors`.

### Phase F — Audit & harden

1. **Vitest color audit** (`equus/tests/theme/colorCentralization.test.ts`):

   - Scan `equus/components/**` and `equus/app/**` (excluding `globals.css`) for:
     - Raw Tailwind palette classes: `(bg|text|border|ring|from|to|via|fill|stroke)-{orange|amber|red|green|blue|yellow|purple|pink|gray|slate|zinc|neutral|stone|rose|emerald|sky|indigo|violet|fuchsia|lime|teal|cyan}-[0-9]{2,3}`
     - Raw hex in TS/TSX: `#[0-9A-Fa-f]{3,8}`
     - Disallowed `bg-black`, `text-white`, `bg-white`, `text-black` (except allowlisted files if any remain after migration — target: **zero** in feature code; Google icon allowlisted for hex only)
   - Fail the test on any hit outside the allowlist.

2. **Vitest email audit:** no `#` hex in `lib/email/**` except inside `nonCssColors.ts` (if email constants live only there) or assert templates/layout import colors exclusively from that module.

3. **ESLint:** add low-cost restrictions where practical (e.g. ban hex literals in `components/` via `no-restricted-syntax` or a small custom check). Vitest remains the primary gate and must run in `npm test`.

4. **Docs:**

   - Expand `equus/AGENTS.md` color convention: overlay/badge tokens; email/`nonCssColors`; sync test; shadcn overlay durability; allowlist.
   - Mark 2025-07-19 spec/plan as superseded at the top of those files (pointer to this document).

5. **Tracking:** implementation plan with checkboxes at  
   `docs/superpowers/plans/2026-07-24-color-token-centralization-completion.md`.

---

## Verification

After each phase:

```bash
cd equus && npm test
```

Manual / visual:

- Change `:root --primary` temporarily → Section accents, banner, email CTA (after Phase E), meta theme color all follow.
- Color-range badges and swatches render correctly.
- Media lightbox / upload overlays readable.
- Destructive confirm buttons use destructive foreground.
- Dark mode: success/warning/info text and fills remain readable.
- Revert experimental `--primary` change before commit.

Final gate: audit tests pass with zero allowlist exceptions beyond Google icon (+ `globals.css` as definition file).

---

## Non-goals

- Not creating a shared theme package for `health/` or other apps.
- Not adding a user-facing runtime theme picker (token/`theme-neutral`/`dark` structure already supports themes).
- Not changing Google logo SVG fills.
- Not introducing a CSS codegen / Tailwind plugin pipeline (Approach 2 rejected).
- Not re-auditing every historical commit — only current tree + harden going forward.

---

## Success criteria

1. **Single web SSOT:** all web theme colors defined only in `equus/app/globals.css`.
2. **Full product surface:** UI, email HTML, browser theme meta, badge bands, and color-carrying exports use tokens or `nonCssColors` — no stray product hex/palette classes.
3. **Brand consistency:** email chrome matches Equus orange theme tokens (legacy olive removed).
4. **Dark completeness:** `.dark` defines success, warning, and info pairs.
5. **Hardened:** Vitest sync + centralization audits fail on drift or new raw colors; docs and superseded 2025 artifacts updated.
6. **Theme lever:** changing `:root` brand tokens updates the product without hunting through components for hex or `orange-*` classes.
7. **Trackable completion:** implementation plan checkboxes reflect done work; no “mostly done” leftover.

---

## Relationship to prior work

| Document | Disposition |
|----------|-------------|
| `docs/superpowers/specs/2025-07-19-color-token-centralization-design.md` | Superseded — historical baseline only |
| `docs/superpowers/plans/2025-07-19-color-token-centralization.md` | Superseded — do not execute; use 2026-07-24 plan |
| `equus/AGENTS.md` color section | Keep and extend per this spec |

The 2025 migration’s completed component replacements stay; this spec only adds missing surfaces, fixes brand/email/meta/dark gaps, and adds enforcement.
