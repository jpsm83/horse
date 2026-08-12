# Architecture — Equus

Multi-client architecture rules and project structure.

## Project structure (Next.js layered)

```
app/           → pages, layouts, route handlers (thin HTTP layer)
components/    → UI (shadcn/ui + Tailwind)
lib/           → business logic: services, auth, validations, API helpers
models/        → Mongoose schemas and models
tests/         → Vitest tests mirroring lib/
```

- **Route handlers are thin** — parse input, call `lib/` services, return `ok` / `fail` from `lib/api/response.ts`.
- **Business logic stays in `lib/`** — never in React components or route files.
- **No custom architecture framework** — standard Next.js App Router layout with clear folder responsibilities.

## Multi-client architecture

- **Backend first** — domain logic lives in `lib/` (services, validations, auth). Route handlers are thin HTTP adapters; pages and components must not own business rules.
- **REST API is the contract** — new features that serve users should expose stable JSON endpoints under `app/api/v1/`. Design payloads and auth so a React Native app (and any other client) can call them without browser-only assumptions.
- **Client-agnostic responses** — use `lib/api/response.ts` (`ok`, `fail`, `withRoute`). Return JSON with predictable `{ data }` / `{ error }` shapes; avoid coupling API behavior to Next.js pages or server-rendered UI state.
- **Auth for non-browser clients** — mobile and API clients use **JWT** from `/api/v1/auth/*` (`Authorization: Bearer`). The web app uses **httpOnly cookies** set by the same routes. NextAuth is **Google OAuth transport only**; web session truth is REST cookies via `ensureRestSession()` — see [equus/docs/engineering/auth.md](../engineering/auth.md). Do not rely on NextAuth `useSession()` alone for `isAuthenticated`.
- **RSC user id** — `getServerUserId()` (layouts) tries the access cookie, then a valid refresh cookie. Never seed a guest horse view over an owner cache when access is merely expired (`PreferHydrationBoundary` + skip seed when refresh exists but identity unresolved).
- **Web UI is not the source of truth** — treat `app/page.tsx` and future web screens as API consumers, same as React Native will be.
- **Versioning** — keep breaking API changes behind new version prefixes (e.g. `v2`); existing mobile builds must keep working against `v1`.
