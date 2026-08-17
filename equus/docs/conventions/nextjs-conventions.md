# Next.js — how to write App Router code

**Job:** App Router, server/client split, imports, env. Not which chrome files exist.  
**Also open (only if needed):** which shells/`loading.tsx` → [`../engineering/page-flow-blueprint.md`](../engineering/page-flow-blueprint.md). Entity file names → [`ui-layout-naming.md`](ui-layout-naming.md). UI importing services → [`architecture.md`](architecture.md).

- **App Router only** — pages and layouts in `app/` (`page.tsx`, `layout.tsx`). No `pages/` directory.
- **Route handlers** — product APIs are `app/api/v1/**/route.ts` exporting `GET` / `POST` / etc.
- **Server vs client** — default Server Components; `"use client"` only for browser APIs, hooks, or event handlers.
- **Chrome** — locale pages under `app/[locale]/` render inside `AppShell`. Do not add a second sidebar, top nav, or language switcher.
- **Imports** — `@/` alias. UI under `app/[locale]/`, `components/`, and `hooks/` must not runtime-import services or models (`import type` OK). Only `app/api/**/route.ts` may import them at runtime.
- **Env vars** — secrets and auth URLs in `lib/auth/config.ts` or other server `lib/` / route handlers. Never expose secrets to client components.
- **This Next.js version** — if unsure about an API, read `node_modules/next/dist/docs/` before guessing.
