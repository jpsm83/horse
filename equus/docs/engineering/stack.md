# Technical stack

**Job:** Runtime, folders, and API shape. Not product scope.  
**Upstream:** [`../product/mvpScope.md`](../product/mvpScope.md)  
**Status:** **aligned**  
**Code roots:** `app/api/v1/`, `app/[locale]/`, `lib/`, `models/`, `hooks/`, `components/`

Launch modules: `mvpScope.md`. Chat: [`chat.md`](chat.md). Billing: [`billing.md`](billing.md). Auth: [`auth.md`](auth.md).

---

## Shipped

| Layer | Choice |
|-------|--------|
| Web | Next.js App Router + TypeScript + React 19 |
| API | REST `app/api/v1/*` — web and future RN |
| Auth web | REST httpOnly cookies; NextAuth = Google transport only |
| Auth mobile | JWT Bearer (same `/api/v1/auth/*`) |
| Validation | Zod in `lib/validations/` |
| UI | shadcn/ui + Tailwind; TanStack Query in `hooks/` |
| DB | MongoDB Atlas + Mongoose (`models/`) |
| Media | Cloudinary |
| i18n | next-intl — see [`i18n.md`](i18n.md) |

```
app/api/v1/    → REST
app/[locale]/  → web UI
components/    → shadcn + feature UI
hooks/         → TanStack Query
lib/           → services, auth, validations, api helpers
models/        → Mongoose
```

**Request flow:** authenticate → Zod parse → `lib/services` → `ok` / `fail` (`lib/api/response.ts`). Layer rules (UI must not import services; no Server Actions as the product API): [`../conventions/architecture.md`](../conventions/architecture.md).

Breaking API changes after a mobile client ships use a new prefix (`v2`). Until then, `v1` may change in place.

**Not in stack:** NestJS, separate Fastify server, Redis (until multi-instance Socket.io), Clerk/Better Auth, PostgreSQL for MVP.

---

## Pointers

| Topic | File |
|-------|------|
| Layer rules | [`../conventions/architecture.md`](../conventions/architecture.md) |
| App Router | [`../conventions/nextjs-conventions.md`](../conventions/nextjs-conventions.md) |
| Query hooks | [`../conventions/data-fetching.md`](../conventions/data-fetching.md) |
