# Default theme palette (forest / warm accent)

Design reference for the Equus **`default`** product theme (`:root` in `app/globals.css`). Live web colors are CSS tokens in `globals.css`; non-CSS hex mirrors them in `lib/theme/nonCssColors.ts`. Coding rules: [`../conventions/ui-styling.md`](../conventions/ui-styling.md).

## Palette

- Base Dark: `#212226` (Main background canvas)
- Surface Dark: `#2a3b42` (Cards, panels, elevation layers)
- Brand Dark: `#445a4d` (Muted structural blocks, secondary focus)
- Accent Warm: `#b8520a` (Primary action, high-priority CTA, interactive highlights)
- Accent Light: `#779e7f` (Success states, secondary features, soft borders)

## HTML tag mapping

- `<body>`, `<main>`, `<app>`: Use `#212226` for the background. Text color must be white or light gray (`#f3f4f6`).
- `<header>`, `<nav>`, `<footer>`: Use `#2a3b42` for background to create a distinct structural anchoring from the main canvas.
- `<section>`, `<article>`, `<aside>`: Use `#2a3b42` for container cards, or keep transparent with `#445a4d` used for subtle 1px dividers.
- `<h1>`, `<h2>`, `<h3>`: Pure white (`#ffffff`) for maximum readability.
- `<h4>`, `<h5>`, `<h6>`, `<p>`, `<span>`: Soft white/silver (`#e5e7eb`) to prevent visual fatigue.
- `<a>` (Anchor links): Use `#779e7f` for inline body links. Use `#b8520a` only if it acts as a standalone call-to-action.

## Component mapping (semantic intent)

Primary buttons (high-priority CTAs)

- Background: `#b8520a`
- Text: white
- Hover: slightly darker orange (`#a04505`)
- Focus ring: `#b8520a`

Secondary buttons / navigation tabs

- Background: `#445a4d`
- Text: `#e5e7eb`
- Hover: `#779e7f` with text `#212226`

Cards, modals, & dropdown menus

- Background: `#2a3b42`
- Borders: `#445a4d` (1px solid)
- Shadow: dark (`#111215` at ~50% opacity)

Form inputs & textareas

- Background: `#212226`
- Border: `#445a4d`
- Focus: border/ring `#b8520a`
- Text entered: white
- Placeholder: gray-400 equivalent

Badges & status indicators

- Success/Active: `#779e7f` at low opacity background + text/border tint
- Warning/Attention: `#b8520a` at low opacity background + text/border tint

## Global UI policies

- Contrast: Do not overlay small white text directly onto `#779e7f` without checking readability. Use `#779e7f` as background only with dark text (`#212226`), or as text on dark backgrounds.
- Balance: The accent color (`#b8520a`) should appear on no more than 2 or 3 elements on any given viewport to preserve visual impact.

## Legacy Tailwind extend snippet (reference only)

Not used by the live Tailwind v4 setup — tokens live in `app/globals.css`.

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        app: {
          base: "#212226",
          surface: "#2a3b42",
          forest: "#445a4d",
          orange: "#b8520a",
          sage: "#779e7f",
        },
      },
    },
  },
};
```
