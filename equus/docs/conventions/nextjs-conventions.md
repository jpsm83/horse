# Next.js conventions in this repo

- **App Router only** — pages and layouts live in `app/` (`page.tsx`, `layout.tsx`). No `pages/` directory.
- **Route Handlers** — REST endpoints are `app/api/**/route.ts` files exporting HTTP method functions (`GET`, `POST`, etc.). Prefer `app/api/v1/` for product APIs consumed by web and mobile.
- **Server vs client** — default to Server Components; add `"use client"` only when the component needs browser APIs, hooks, or event handlers.
- **Global chrome** — all locale UI pages under `app/[locale]/` render inside `AppShell` (`components/layout/app-shell.tsx`): a **discover sidebar icon rail** on desktop (`DiscoverSidebar`, expands on hover; Equus brand in sidebar header) plus a separate sticky `AppHeader` (user menu; `DiscoverMobileMenu` on small screens). New screens should not add duplicate side nav, top nav, or language switchers.
- **Imports** — use the `@/` path alias for project modules (e.g. `@/lib/services/authService.ts`).
- **Env vars** — auth secrets and URLs are read in `lib/auth/config.ts` (`AUTH_SECRET`, `REFRESH_SECRET`, `AUTH_URL`, Google OAuth). Other server-only vars are read in route handlers or `lib/`. Never expose secrets to client components.
- **Docs** — when unsure about a Next.js API for this version, check `node_modules/next/dist/docs/` before guessing.
