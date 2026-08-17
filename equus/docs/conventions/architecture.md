# Architecture — how to write layers

**Job:** Layer rules for UI vs REST vs `lib/`. Not the stack inventory.  
**Also open (only if needed):** folders / `v1` policy → [`../engineering/stack.md`](../engineering/stack.md). Session cookies/JWT → [`../engineering/auth.md`](../engineering/auth.md). New Query hook → [`data-fetching.md`](data-fetching.md). New model file → [`mongodb-models.md`](mongodb-models.md). App Router/`use client` → [`nextjs-conventions.md`](nextjs-conventions.md).

- **Route handlers are thin** — `app/api/v1/**/route.ts`: parse input, call `lib/` services, return `ok` / `fail` from `lib/api/response.ts`. Only this layer may import services or models at runtime.
- **Business logic stays in `lib/`** — never in React components, pages, or layouts.
- **No custom architecture framework** — standard Next.js App Router with those responsibilities.
- **REST is the product API** — new user-facing features expose JSON under `app/api/v1/`. Payloads and auth must work for React Native (no browser-only assumptions). The web UI is a client of that API, not a backdoor into `lib/`.
- **UI is an API consumer** — `app/[locale]/` pages, layouts, `components/`, and `hooks/` load and mutate through `/api/v1`. Do not runtime-import `@/lib/services/*` or `@/models/*`. `import type` from services is allowed.
- **Responses** — predictable `{ data }` / `{ error }` via `ok` / `fail` / `withRoute`. Do not couple API behavior to a page or RSC payload.
- **No Server Actions as the product API** — they are not usable from React Native. Do not add them as a parallel write path.
- **Web auth in UI** — do not treat NextAuth `useSession()` as `isAuthenticated`. Session truth is REST cookies / JWT.
