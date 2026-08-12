# UI and styling conventions

## `components/ui/` (shadcn only)

* **`components/ui/`** holds **shadcn/ui primitives only** — install or refresh via `npm run ui:sync` or `npx shadcn add <name> --overwrite --yes`, never hand-written copies.
* Project style: **`base-nova`** (see `components.json`).
* Do **not** use native HTML form controls (`<select>`, `<textarea>`, `<input>`) in pages or feature components — use shadcn primitives (wrapped with RHF `Controller` + `Field` when needed). RHF adapters in `components/forms/` are allowed when reused across screens; prefer inline `Controller` + shadcn for one-off fields.
* **Overlays:** blocking UI uses shadcn **`Dialog`** (via `ConfirmActionDialog` / `ConfirmDeleteDialog` / `PendingDialog`) with blur + focus trap; every dialog closes on outside click + Escape when idle and blocks dismissal while a mutation is pending (`blockDismiss`). Anchored pickers use **`Popover`**; mobile nav uses **`Sheet`**; section `titleAddon` actions use **`SectionTitleAction`**. Never invent a custom blur modal. Full rules: [equus/docs/engineering/page-flow-blueprint.md](../engineering/page-flow-blueprint.md) §5.5.1.

## Color convention — semantic tokens only

- **Definitions**: all web app colors are defined in `app/globals.css` via CSS custom properties mapped through Tailwind v4's `@theme inline` block. No other file defines web theme color values.
- **Product themes** (color only): `default` (`:root`, palette brief [`../engineering/theme-default-palette.md`](../engineering/theme-default-palette.md)) and `onyx` (`html.theme-onyx`). Guests and missing prefs always use `default`. Signed-in users store `personalDetails.preferredTheme` (`default` | `onyx`); cookie `EQUUS_THEME` + root layout class avoid flash; `AppThemeSync` keeps class aligned with auth. Entity tab chrome uses `bg-nav-tab-background` / `text-nav-tab-foreground` (never `text-secondary` for text — that token is a background color).
- **Usage**: components, pages, and layouts reference colors exclusively through semantic design tokens — `text-primary`, `bg-muted`, `text-success`, `bg-card`, `text-destructive`, `bg-overlay`, `text-overlay-foreground`, etc. Never use raw Tailwind color names, raw `bg-black` / `text-white` / `bg-white`, or inline hex values.
- **Overlays / scrims**: use `bg-overlay` (with opacity modifiers), `bg-overlay-heavy`, and `text-overlay-foreground`. Dialog/sheet backdrops are forced via `[data-slot="*-overlay"]` rules in `globals.css` so they survive `npm run ui:sync`.
- **Badge bands**: table color-range badges use `--badge-band-*` tokens and `.badge-band-*` classes.
- **Non-CSS contexts** (HTML email, Excel ARGB, browser `theme-color`): import hex from `lib/theme/nonCssColors.ts` only (mirrors **default** `:root`, not onyx). Sync is enforced by `tests/theme/nonCssColorsSync.test.ts`.
- **Adding a color**: add the CSS variable in `app/globals.css` (`@theme inline`, `:root`, `.theme-onyx`) before using it; add to `nonCssColors.ts` + extend the sync test if email/meta/export need it. Do NOT inline raw colors in JSX.
- **Opacity via modifiers**: use Tailwind's opacity modifier syntax on semantic classes (`bg-primary/5`) — not on the variable definition.
- **Allowlist**: Google brand fills in `components/icons/google-icon.tsx` only.
- **Enforcement**: `tests/theme/colorCentralization.test.ts` + ESLint `no-restricted-syntax` on hex in `components/` / `app/` (except the Google icon).

## Toasts (mutation feedback)

* Sonner (`components/ui/sonner.tsx`) is the shadcn primitive; mount `<Toaster />` once in `AppProviders`.
* **All feature code** uses `useAppToast()` from `hooks/use-app-toast.ts` (or `appToast` from `lib/ui/toast.ts`) — never import `sonner` in pages or feature components.
* Pass translated strings from the caller; use `toast.actionFailed()` as a generic fallback. Use toasts for completed async actions (save, accept, decline); keep **Alert** for persistent banners and form-context errors.

## Forms (web UI)

* Use **React Hook Form** + **Zod** (`zodResolver`) + shadcn **Field** primitives per [shadcn React Hook Form](https://ui.shadcn.com/docs/forms/react-hook-form).
* Each input: `Controller` → `Field` + `FieldLabel` + control + `FieldError` under the input when invalid; set `data-invalid` and `aria-invalid` on errors.
* Client schemas live in `lib/validations/*Forms.ts` (or shared `lib/validations/`); do not rely on native HTML `required` for Zod-managed fields (use `noValidate` on `<form>`).
* **Field-level** messages for validation; **top Alert** (or `form.setError` when API returns `error.fields`) for server/auth failures.
* Reuse [`components/forms/text-field.tsx`](../../components/forms/text-field.tsx) for simple text inputs when it fits.
* **Profile PATCH** — only dirty fields; optional clears send `""` → `$unset` in MongoDB. See [equus/docs/engineering/profile.md](../engineering/profile.md).
