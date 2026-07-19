# Color Token Centralization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all raw Tailwind color names and hex values in equus to semantic design tokens defined in `app/globals.css`, making the entire app themeable from one file.

**Architecture:** CSS variables in `app/globals.css` → `@theme inline` block mappings → semantic Tailwind classes in components. 3 new token families (success, warning, info) added alongside existing shadcn tokens. 9 files migrated across 6 phases.

**Tech Stack:** Next.js 16, TailwindCSS v4, shadcn/ui (base-nova), TypeScript, Vitest

## Global Constraints

- Equus only — do not touch health/ or restaurant-pos/
- Semantic tokens only in components — no raw Tailwind color names, no inline hex values
- All color definitions live in `app/globals.css` — nowhere else
- Each task ends with `npm test` — all tests must pass before committing
- Commit after each task with a descriptive message

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `equus/app/globals.css` | Modify | Add 6 new tokens to `@theme inline`, `:root`, `.theme-neutral`, `.dark` |
| `equus/components/shared/section.tsx` | Modify | Replace raw brand colors with semantic tokens |
| `equus/components/shared/file-upload.tsx` | Modify | Replace raw green with `bg-success/80` |
| `equus/components/shared/loading-overlay.tsx` | Modify | Replace hex spinner color with `var(--primary)` |
| `equus/components/layout/incomplete-profile-banner.tsx` | Modify | Replace raw orange/gray with `bg-primary` / `text-primary-foreground` |
| `equus/components/profile/profile-form.tsx` | Modify | Replace raw green/red with `text-success` / `text-destructive` |
| `equus/components/profile/profile-address-map.tsx` | Modify | Replace raw orange with `text-muted-foreground` |
| `equus/components/billing/subscription-page-content.tsx` | Modify | Replace raw red/gray with `text-destructive` / `bg-muted` |
| `equus/components/invites/workplaces-content.tsx` | Modify | Replace raw orange with `text-primary` |
| `equus/components/invites/provider-invite-picker.tsx` | Modify | Replace raw orange with `text-primary` |
| `equus/components/horses/planning/planning-calendar-section.tsx` | Modify | Replace hex blue with `var(--info)` |
| `equus/AGENTS.md` | Modify | Add color convention subsection to §9 |

---

### Task 1: Add success/warning/info tokens to globals.css (Phase 0)

**Files:**
- Modify: `equus/app/globals.css`

**Interfaces:**
- Produces: 6 new CSS variables available as Tailwind classes (`bg-success`, `text-success`, `bg-warning`, `text-warning-foreground`, `bg-info`, `text-info-foreground`, etc.)

- [ ] **Step 1: Add `@theme inline` mappings after `--color-destructive`**

Open `equus/app/globals.css` and insert after line 30 (`--color-destructive: var(--destructive);`):

```css
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
```

- [ ] **Step 2: Add `:root` values after `--destructive` (line 73)**

Insert after line 73 (`--destructive: oklch(0.577 0.245 27.325);`):

```css
  --info: #3b82f6;
  --info-foreground: #ffffff;
  --success: #22c55e;
  --success-foreground: #ffffff;
  --warning: #f59e0b;
  --warning-foreground: #451a03;
```

- [ ] **Step 3: Add `.theme-neutral` values after `--destructive` (line 109)**

Insert after line 109 (`--destructive: oklch(0.577 0.245 27.325);`):

```css
  --info: oklch(0.546 0.245 262.881);
  --info-foreground: oklch(1 0 0);
  --success: oklch(0.527 0.154 150.069);
  --success-foreground: oklch(1 0 0);
  --warning: oklch(0.795 0.184 85.964);
  --warning-foreground: oklch(0.145 0 0);
```

- [ ] **Step 4: Add `.dark` values after `--destructive` (line 145)**

Insert after line 145 (`--destructive: oklch(0.704 0.191 22.216);`):

```css
  --info: oklch(0.623 0.214 259.815);
  --info-foreground: oklch(0.145 0 0);
  --success: oklch(0.623 0.214 142.495);
  --success-foreground: oklch(0.145 0 0);
  --warning: oklch(0.795 0.184 85.964);
  --warning-foreground: oklch(0.145 0 0);
```

- [ ] **Step 5: Run tests**

```bash
npm test
```

Expected: all existing tests pass.

- [ ] **Step 6: Commit**

```bash
git add equus/app/globals.css
git commit -m "feat: add success, warning, info design tokens to globals.css"
```

---

### Task 2: Migrate shared/ components (Phase 1)

**Files:**
- Modify: `equus/components/shared/section.tsx:30`
- Modify: `equus/components/shared/file-upload.tsx:285`
- Modify: `equus/components/shared/loading-overlay.tsx:12,20`

**Interfaces:**
- Consumes: `--color-primary`, `--color-success`, CSS variable `--primary` (from Task 1)
- Produces: No new interfaces — these components are consumers of existing tokens

- [ ] **Step 1: Replace raw colors in section.tsx**

Find line 30 in `equus/components/shared/section.tsx`:
```tsx
    <section className={cn("flex min-h-0 flex-col gap-4 border border-orange-200 rounded-lg p-4 bg-orange-50/30", className)}>
```
Replace with:
```tsx
    <section className={cn("flex min-h-0 flex-col gap-4 border border-primary/20 rounded-lg p-4 bg-primary/5", className)}>
```

- [ ] **Step 2: Replace raw color in file-upload.tsx**

Find line 285 in `equus/components/shared/file-upload.tsx`:
```tsx
                  <div className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-green-500/80">
```
Replace with:
```tsx
                  <div className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-success/80">
```

- [ ] **Step 3: Replace hex color and comment in loading-overlay.tsx**

Find line 12 in `equus/components/shared/loading-overlay.tsx`:
```ts
const DEFAULT_SPINNER_COLOR = "#914d21";
```
Replace with:
```ts
const DEFAULT_SPINNER_COLOR = "var(--primary)";
```

Find line 20 (stale comment):
```ts
/** PulseLoader color — matches `--primary` in `globals.css` (`#914d21`). */
```
Replace with:
```ts
/** PulseLoader color — matches `--primary` design token. */
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add equus/components/shared/section.tsx equus/components/shared/file-upload.tsx equus/components/shared/loading-overlay.tsx
git commit -m "refactor: migrate shared/ components to semantic color tokens"
```

---

### Task 3: Migrate layout/ incomplete-profile-banner (Phase 2)

**Files:**
- Modify: `equus/components/layout/incomplete-profile-banner.tsx:32-33`

**Interfaces:**
- Consumes: `--color-primary`, `--color-primary-foreground` (existing tokens)

- [ ] **Step 1: Replace raw colors in incomplete-profile-banner.tsx**

Find lines 32-33 in `equus/components/layout/incomplete-profile-banner.tsx`:
```tsx
      <Alert className="flex justify-center rounded-none p-4 bg-orange-800 w-full h-[56px]">
        <AlertDescription className="text-gray-200 flex flex-wrap items-center gap-4">
```
Replace with:
```tsx
      <Alert className="flex justify-center rounded-none p-4 bg-primary w-full h-[56px]">
        <AlertDescription className="text-primary-foreground flex flex-wrap items-center gap-4">
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add equus/components/layout/incomplete-profile-banner.tsx
git commit -m "refactor: migrate incomplete-profile-banner to semantic color tokens"
```

---

### Task 4: Migrate profile/ components (Phase 3)

**Files:**
- Modify: `equus/components/profile/profile-form.tsx:365,368,375,378`
- Modify: `equus/components/profile/profile-address-map.tsx:165`

**Interfaces:**
- Consumes: `--color-success`, `--color-destructive`, `--color-muted-foreground` (Task 1 + existing)

- [ ] **Step 1: Replace green/red in profile-form.tsx — icon className (line 365)**

Find line 365 in `equus/components/profile/profile-form.tsx`:
```tsx
                        className="size-4 shrink-0 text-green-600 dark:text-green-500"
```
Replace with:
```tsx
                        className="size-4 shrink-0 text-success"
```

- [ ] **Step 2: Replace green/red in profile-form.tsx — span text (line 368)**

Find line 368 in `equus/components/profile/profile-form.tsx`:
```tsx
                      <span className="text-green-600 dark:text-green-500">
```
Replace with:
```tsx
                      <span className="text-success">
```

- [ ] **Step 3: Replace green/red in profile-form.tsx — error icon (line 375)**

Find line 375 in `equus/components/profile/profile-form.tsx`:
```tsx
                        className="size-4 shrink-0 text-red-600 dark:text-red-500"
```
Replace with:
```tsx
                        className="size-4 shrink-0 text-destructive"
```

- [ ] **Step 4: Replace green/red in profile-form.tsx — error span (line 378)**

Find line 378 in `equus/components/profile/profile-form.tsx`:
```tsx
                      <span className="text-red-600 dark:text-red-500">
```
Replace with:
```tsx
                      <span className="text-destructive">
```

- [ ] **Step 5: Replace orange in profile-address-map.tsx (line 165)**

Find line 165 in `equus/components/profile/profile-address-map.tsx`:
```tsx
        <p className="text-xs text-orange-800 dark:text-orange-200" role="status">
```
Replace with:
```tsx
        <p className="text-xs text-muted-foreground" role="status">
```

- [ ] **Step 6: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add equus/components/profile/profile-form.tsx equus/components/profile/profile-address-map.tsx
git commit -m "refactor: migrate profile/ components to semantic color tokens"
```

---

### Task 5: Migrate billing/ subscription-page-content (Phase 4)

**Files:**
- Modify: `equus/components/billing/subscription-page-content.tsx:71,72,74,83,105`

**Interfaces:**
- Consumes: `--color-destructive`, `--color-muted` (existing tokens)

- [ ] **Step 1: Replace skeleton bg-gray-200 — line 71**

Find line 71 in `equus/components/billing/subscription-page-content.tsx`:
```tsx
        <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
```
Replace with:
```tsx
        <div className="h-8 bg-muted rounded w-48 mb-4" />
```

- [ ] **Step 2: Replace skeleton bg-gray-200 — line 72**

Find:
```tsx
        <div className="h-4 bg-gray-200 rounded w-96 mb-8" />
```
Replace with:
```tsx
        <div className="h-4 bg-muted rounded w-96 mb-8" />
```

- [ ] **Step 3: Replace skeleton bg-gray-200 — line 74**

Find:
```tsx
          <div key={i} className="h-24 bg-gray-200 rounded mb-4" />
```
Replace with:
```tsx
          <div key={i} className="h-24 bg-muted rounded mb-4" />
```

- [ ] **Step 4: Replace error text-red-500 — line 83**

Find:
```tsx
        <p className="text-red-500">Failed to load subscription info.</p>
```
Replace with:
```tsx
        <p className="text-destructive">Failed to load subscription info.</p>
```

- [ ] **Step 5: Replace progress bar bg-gray-200 — line 105**

Find:
```tsx
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
```
Replace with:
```tsx
          <div className="w-full bg-muted rounded-full h-3 mb-4">
```

- [ ] **Step 6: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add equus/components/billing/subscription-page-content.tsx
git commit -m "refactor: migrate billing/ subscription-page-content to semantic color tokens"
```

---

### Task 6: Migrate invites/ components (Phase 5)

**Files:**
- Modify: `equus/components/invites/workplaces-content.tsx:127`
- Modify: `equus/components/invites/provider-invite-picker.tsx:121`

**Interfaces:**
- Consumes: `--color-primary` (existing token)

- [ ] **Step 1: Replace orange in workplaces-content.tsx**

Find line 127 in `equus/components/invites/workplaces-content.tsx`:
```tsx
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
```
Replace with:
```tsx
                    <p className="text-sm font-medium text-primary">
```

- [ ] **Step 2: Replace orange in provider-invite-picker.tsx**

Find line 121 in `equus/components/invites/provider-invite-picker.tsx`:
```tsx
      <p className="text-sm font-medium text-orange-700 dark:text-orange-400">{t("pending")}</p>
```
Replace with:
```tsx
      <p className="text-sm font-medium text-primary">{t("pending")}</p>
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add equus/components/invites/workplaces-content.tsx equus/components/invites/provider-invite-picker.tsx
git commit -m "refactor: migrate invites/ components to semantic color tokens"
```

---

### Task 7: Migrate horses/planning/ calendar section (Phase 6)

**Files:**
- Modify: `equus/components/horses/planning/planning-calendar-section.tsx:109`

**Interfaces:**
- Consumes: `var(--info)` (from Task 1)

- [ ] **Step 1: Replace hex blue in planning-calendar-section.tsx**

Find line 109 in `equus/components/horses/planning/planning-calendar-section.tsx`:
```ts
        return { ...e, backgroundColor: isProviderLinked ? "#3b82f6" : undefined };
```
Replace with:
```ts
        return { ...e, backgroundColor: isProviderLinked ? "var(--info)" : undefined };
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add equus/components/horses/planning/planning-calendar-section.tsx
git commit -m "refactor: migrate planning-calendar-section to semantic color token"
```

---

### Task 8: Update AGENTS.md documentation

**Files:**
- Modify: `equus/AGENTS.md`

**Interfaces:**
- Produces: Color convention rule that all future component work must follow

- [ ] **Step 1: Locate §9 section in AGENTS.md**

Find the `#### \`components/ui/\` (shadcn only)\`` subsection. The new subsection will be added after that block ends and before the `#### Toasts` subsection.

- [ ] **Step 2: Insert color convention subsection**

Insert the following block after the `components/ui/` subsection (before `#### Toasts (mutation feedback)`):

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
  class (`bg-primary/5`, `text-muted-foreground/70`) — not on the variable definition.
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all tests pass (docs change, no code impact).

- [ ] **Step 4: Commit**

```bash
git add equus/AGENTS.md
git commit -m "docs: add color convention — semantic tokens only — to AGENTS.md"
```

---

### Task 9: Final verification — audit + full test run

**Files:**
- No modifications — verification only

**Interfaces:**
- None

- [ ] **Step 1: Audit — confirm zero raw colors remain**

Run grep for any raw Tailwind color names in equus TSX files:
```bash
rg "(text|bg|border)-(red|blue|green|yellow|orange|purple|pink|gray|slate|zinc|neutral|stone|amber|lime|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose)-\d{1,3}" equus/components equus/app --include "*.tsx"
```
Expected: no matches (excluding known skips: google-icon.tsx, app/layout.tsx meta tags).

- [ ] **Step 2: Audit — confirm zero inline hex values**

```bash
rg '"#[0-9a-fA-F]{3,8}"' equus/components --include "*.tsx"
```

Expected: only `loading-overlay.tsx` with `"var(--primary)"` (no hex values), and `google-icon.tsx` (skipped).

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit (if anything left, else move on)**

```bash
# No code changes in this task — skip commit if clean
```

---

## Verification Checklist (Post-Implementation)

After all tasks complete, verify manually:

- [ ] **Brand theme change test**: Change `--primary` in `app/globals.css:65` from `#f97316` to `#2563eb` (blue). After restart, Section borders, profile banner, and invite text should all render blue — no orange remains in components.
- [ ] **Revert**: Change `--primary` back to `#f97316`.
- [ ] **Success states**: File upload checkmark and email verified text use green (`--success`).
- [ ] **Dark mode**: Toggle dark mode — all tokens resolve to dark-mode values.
