# Color Token Centralization — Design Spec

**Date:** 2025-07-19
**Scope:** equus only (health and restaurant-pos are reference projects, not touched)
**Goal:** Make `app/globals.css` the single source of truth for all app colors. Components reference only semantic design tokens — never raw Tailwind color names or hex values.

---

## Problem

Raw Tailwind color names (`text-orange-700`, `bg-green-500/80`, `#914d21`) are scattered across 9 files in equus. Changing the app theme means hunting through every component for hardcoded colors. The CSS variable infrastructure already exists in `globals.css` — the gap is that components bypass it.

---

## Audit

**`components/ui/` is already clean** — zero raw colors. All shadcn-generated components use only semantic tokens.

The entire raw color surface is **9 files, 17 occurrences** (plus 2 skippable files):

| # | File | Line | Current | Replacement | Category |
|---|------|------|---------|-------------|----------|
| 1 | `shared/section.tsx` | 30 | `border-orange-200` | `border-primary/20` | brand accent |
| 2 | `shared/section.tsx` | 30 | `bg-orange-50/30` | `bg-primary/10` | brand accent |
| 3 | `shared/file-upload.tsx` | 285 | `bg-green-500/80` | `bg-success/80` | success |
| 4 | `shared/loading-overlay.tsx` | 12 | `"#914d21"` | `var(--primary)` | brand spinner |
| 5 | `shared/loading-overlay.tsx` | 20 | stale comment | remove comment | cleanup |
| 6 | `layout/incomplete-profile-banner.tsx` | 32 | `bg-orange-800` | `bg-primary` | brand banner |
| 7 | `layout/incomplete-profile-banner.tsx` | 33 | `text-gray-200` | `text-primary-foreground` | brand banner |
| 8 | `profile/profile-form.tsx` | 365 | `text-green-600 dark:text-green-500` | `text-success` | success |
| 9 | `profile/profile-form.tsx` | 368 | `text-green-600 dark:text-green-500` | `text-success` | success |
| 10 | `profile/profile-form.tsx` | 375 | `text-red-600 dark:text-red-500` | `text-destructive` | error |
| 11 | `profile/profile-form.tsx` | 378 | `text-red-600 dark:text-red-500` | `text-destructive` | error |
| 12 | `profile/profile-address-map.tsx` | 165 | `text-orange-800 dark:text-orange-200` | `text-muted-foreground` | brand accent |
| 13 | `billing/subscription-page-content.tsx` | 71 | `bg-gray-200` | `bg-muted` | skeleton |
| 14 | `billing/subscription-page-content.tsx` | 72 | `bg-gray-200` | `bg-muted` | skeleton |
| 15 | `billing/subscription-page-content.tsx` | 74 | `bg-gray-200` | `bg-muted` | skeleton |
| 16 | `billing/subscription-page-content.tsx` | 83 | `text-red-500` | `text-destructive` | error |
| 17 | `billing/subscription-page-content.tsx` | 105 | `bg-gray-200` | `bg-muted` | skeleton |
| 18 | `invites/workplaces-content.tsx` | 127 | `text-orange-700 dark:text-orange-400` | `text-primary` | brand accent |
| 19 | `invites/provider-invite-picker.tsx` | 121 | `text-orange-700 dark:text-orange-400` | `text-primary` | brand accent |
| 20 | `horses/planning/planning-calendar-section.tsx` | 109 | `"#3b82f6"` | `var(--info)` | info marker |

**Skipped** (legitimate non-theme colors — no migration needed):
- `app/layout.tsx:43-44` — browser meta `theme-color` and `msapplication-TileColor` (#8B5CF6). Not a component style; standard meta tag.
- `components/icons/google-icon.tsx:24-36` — Google G logo SVG fills (#FFC107, #FF3D00, #4CAF50, #1976D2). Google brand identity, must not be changed.

---

## New Tokens

Three semantic color families added to `globals.css`: **success**, **warning**, **info**. Each has a `--name` and `--name-foreground` pair. The existing `destructive` token already covers red/error states.

### `@theme inline` block additions

```css
--color-success: var(--success);
--color-success-foreground: var(--success-foreground);
--color-warning: var(--warning);
--color-warning-foreground: var(--warning-foreground);
--color-info: var(--info);
--color-info-foreground: var(--info-foreground);
```

### `:root` (orange theme — default)

```css
--success: #22c55e;
--success-foreground: #ffffff;
--warning: #f59e0b;
--warning-foreground: #451a03;
--info: #3b82f6;
--info-foreground: #ffffff;
```

### `.theme-neutral` (opt-in neutral theme)

```css
--success: oklch(0.527 0.154 150.069);
--success-foreground: oklch(1 0 0);
--warning: oklch(0.795 0.184 85.964);
--warning-foreground: oklch(0.145 0 0);
--info: oklch(0.546 0.245 262.881);
--info-foreground: oklch(1 0 0);
```

### `.dark` (dark mode)

```css
--success: oklch(0.623 0.214 142.495);
--success-foreground: oklch(0.145 0 0);
--warning: oklch(0.795 0.184 85.964);
--warning-foreground: oklch(0.145 0 0);
--info: oklch(0.623 0.214 259.815);
--info-foreground: oklch(0.145 0 0);
```

**Design rationale:**
- Status colors (success, warning, info, destructive) are **semantically universal** — they don't change meaning when the brand changes. They use the same names across all three themes, only adjusted for dark mode readability.
- Hex values in `:root` match the existing pattern (all `:root` colors use hex).
- oklch values in `.theme-neutral` and `.dark` match the existing pattern (those theme blocks already use oklch).

---

## Component Migrations

### Phase 0 — Foundation: `app/globals.css`

Add the 6 new tokens to `@theme inline`, `:root`, `.theme-neutral`, and `.dark` blocks. No component changes in this phase.

### Phase 1 — Foundational: `components/shared/`

Three files used across the entire app.

**`shared/section.tsx:30`**
```diff
- className={cn("flex min-h-0 flex-col gap-4 border border-orange-200 rounded-lg p-4 bg-orange-50/30", className)}
+ className={cn("flex min-h-0 flex-col gap-4 border border-primary/20 rounded-lg p-4 bg-primary/10", className)}
```

**`shared/file-upload.tsx:285`**
```diff
- <div className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-green-500/80">
+ <div className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-success/80">
```

**`shared/loading-overlay.tsx:12`**
```diff
- const DEFAULT_SPINNER_COLOR = "#914d21";
+ const DEFAULT_SPINNER_COLOR = "var(--primary)";
```
Also remove the stale comment on line 20:
```diff
- /** PulseLoader color — matches `--primary` in `globals.css` (`#914d21`). */
+ /** PulseLoader color — matches `--primary` design token. */
```

### Phase 2 — Layout: `components/layout/`

**`layout/incomplete-profile-banner.tsx:32-33`**
```diff
- <Alert className="flex justify-center rounded-none p-4 bg-orange-800 w-full h-[56px]">
-   <AlertDescription className="text-gray-200 flex flex-wrap items-center gap-4">
+ <Alert className="flex justify-center rounded-none p-4 bg-primary w-full h-[56px]">
+   <AlertDescription className="text-primary-foreground flex flex-wrap items-center gap-4">
```

### Phase 3 — Profile: `components/profile/`

**`profile/profile-form.tsx:365,368`**
```diff
- className="size-4 shrink-0 text-green-600 dark:text-green-500"
+ className="size-4 shrink-0 text-success"
```
```diff
- <span className="text-green-600 dark:text-green-500">
+ <span className="text-success">
```

**`profile/profile-form.tsx:375,378`**
```diff
- className="size-4 shrink-0 text-red-600 dark:text-red-500"
+ className="size-4 shrink-0 text-destructive"
```
```diff
- <span className="text-red-600 dark:text-red-500">
+ <span className="text-destructive">
```

**`profile/profile-address-map.tsx:165`**
```diff
- <p className="text-xs text-orange-800 dark:text-orange-200" role="status">
+ <p className="text-xs text-muted-foreground" role="status">
```

### Phase 4 — Billing: `components/billing/`

**`billing/subscription-page-content.tsx:71-74,83,105`**
```diff
- <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
+ <div className="h-8 bg-muted rounded w-48 mb-4" />
```
```diff
- <div className="h-4 bg-gray-200 rounded w-96 mb-8" />
+ <div className="h-4 bg-muted rounded w-96 mb-8" />
```
```diff
- <div key={i} className="h-24 bg-gray-200 rounded mb-4" />
+ <div key={i} className="h-24 bg-muted rounded mb-4" />
```
```diff
- <p className="text-red-500">Failed to load subscription info.</p>
+ <p className="text-destructive">Failed to load subscription info.</p>
```
```diff
- <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
+ <div className="w-full bg-muted rounded-full h-3 mb-4">
```

### Phase 5 — Invites: `components/invites/`

**`invites/workplaces-content.tsx:127`**
```diff
- <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
+ <p className="text-sm font-medium text-primary">
```

**`invites/provider-invite-picker.tsx:121`**
```diff
- <p className="text-sm font-medium text-orange-700 dark:text-orange-400">{t("pending")}</p>
+ <p className="text-sm font-medium text-primary">{t("pending")}</p>
```

### Phase 6 — Planning: `components/horses/planning/`

**`planning-calendar-section.tsx:109`**
```diff
- return { ...e, backgroundColor: isProviderLinked ? "#3b82f6" : undefined };
+ return { ...e, backgroundColor: isProviderLinked ? "var(--info)" : undefined };
```

---

## Token Removal Analysis

No existing tokens are removed. The new `success`, `warning`, and `info` tokens are purely additive — they extend the existing shadcn token set without changing its semantics.

The mapping for `--muted-foreground` in phase 3 (`text-orange-800` → `text-muted-foreground`) works because in the current orange theme `--muted-foreground: #9a3412` (orange-800 equivalent). In other themes it adapts accordingly.

---

## Documentation Update

Add to `AGENTS.md` §9 (UI and Styling) after the existing `components/ui/` subsection:

```markdown
#### Color convention — semantic tokens only

- **Definitions**: all app colors are defined in `app/globals.css` via CSS custom properties
  mapped through Tailwind v4's `@theme inline` block. No other file defines color values.
- **Usage**: components, pages, and layouts reference colors exclusively through
  semantic design tokens — `text-primary`, `bg-muted`, `text-success`, `bg-card`,
  `text-destructive`, etc. Never use raw Tailwind color names (`text-orange-500`,
  `bg-gray-200`, `text-red-600`) or inline hex values (`#ff0000`, `"#3b82f6"`).
- **Adding a color**: if a needed semantic category lacks a token, add the CSS variable
  in `app/globals.css` (to `@theme inline`, `:root`, `.theme-neutral`, and `.dark`)
  before using it in any component. Do NOT inline raw colors in JSX.
- **Opacity via modifiers**: use Tailwind's opacity modifier syntax on the semantic
  class (`bg-primary/10`, `text-muted-foreground/70`) — not on the variable definition.
```

---

## Verification

After each phase, run:

```bash
npm test
```

And visually verify on the affected pages:
- **Phase 1**: any page using `<Section>` or `<FileUpload>` (horse media, horse creation)
- **Phase 2**: sign in with an incomplete profile to trigger the banner
- **Phase 3**: `/profile` page — email verification status, address geolocation hint
- **Phase 4**: `/subscription` page — skeleton loading, error state, progress bar
- **Phase 5**: workplace invitations page
- **Phase 6**: horse planning tab with linked provider events

---

## Non-Goals

- Not creating a shared theme package (health, restaurant-pos are reference-only)
- Not changing visual appearance in most cases — tokens resolve to equivalent or near-equivalent colors. The one deliberate shift is `incomplete-profile-banner.tsx` (`bg-orange-800` → `bg-primary`): the banner was using a dark orange-brown that differed from the brand primary; it will now follow the brand color, which is the correct behavior for a theme-sensitive component
- Not migrating `ui/` shadcn components (already clean)
- Not touching Google icon SVG fills or browser meta theme-color

---

## Success Criteria

1. Zero raw Tailwind color names (`text-<color>-\d{3}`, `bg-<color>-\d{3}`, `border-<color>-\d{3}`) anywhere in equus `components/` and `app/` TSX files (excluding Google icon and layout meta tags)
2. Zero inline hex values (`#"XXXXXX"`, `"#XXXXXX"`) in component code (excluding `loading-overlay.tsx` which uses CSS variable reference)
3. Changing `--primary` in `globals.css:65` from `#f97316` to any other color updates all brand-colored components without touching any TSX file
4. All existing tests pass
