# Architecture — Equus

Multi-client architecture rules and project structure.

## Project structure (Next.js layered)

```
app/api/v1/    → REST backend (thin HTTP adapters)
app/[locale]/  → web UI pages and layouts (API consumers)
components/    → UI (shadcn/ui + Tailwind)
hooks/         → TanStack Query hooks (web REST client)
lib/           → business logic: services, auth, validations, API helpers
models/        → Mongoose schemas and models
```

Tests are not a top-level app layer. Module tests live in a `__tests__/` folder next to the code they cover; shared harness/fixtures stay under `tests/`. See [testing.md](testing.md).

- **Route handlers are thin** — parse input, call `lib/` services, return `ok` / `fail` from `lib/api/response.ts`.
- **Business logic stays in `lib/`** — never in React components, pages, or layouts.
- **No custom architecture framework** — standard Next.js App Router layout with clear folder responsibilities.

## Multi-client architecture

The API lives in this Next.js app (`app/api/v1/`) so we do not run a second server for MVP. It is still a **separate backend**: the web UI must not call it “the Next.js way” (RSC → `lib/services` / `models`). Web and React Native both use REST.

- **Backend first** — domain logic lives in `lib/` (services, validations, auth). Only `app/api/v1/**/route.ts` may import services or models at runtime.
- **REST API is the contract** — new features that serve users must expose stable JSON endpoints under `app/api/v1/`. Design payloads and auth so a React Native app can call them without browser-only assumptions.
- **UI is an API consumer** — `app/[locale]/` pages, layouts, `components/`, and `hooks/` load and mutate data through `/api/v1` (TanStack Query + `fetchWithAuth` on the client). Do not call `lib/services` or `models` from UI code. `import type` from services is allowed.
- **Client-agnostic responses** — use `lib/api/response.ts` (`ok`, `fail`, `withRoute`). Return JSON with predictable `{ data }` / `{ error }` shapes; avoid coupling API behavior to Next.js pages or server-rendered UI state.
- **Auth for non-browser clients** — mobile and API clients use **JWT** from `/api/v1/auth/*` (`Authorization: Bearer`). The web app uses **httpOnly cookies** set by the same routes. NextAuth is **Google OAuth transport only**; web session truth is REST cookies via `ensureRestSession()` — see [equus/docs/engineering/auth.md](../engineering/auth.md). Do not rely on NextAuth `useSession()` alone for `isAuthenticated`.
- **No Server Actions as the product API** — they are not usable from React Native. Do not add them as a parallel write path.
- **Versioning** — keep breaking API changes behind new version prefixes (e.g. `v2`); existing mobile builds must keep working against `v1`.
