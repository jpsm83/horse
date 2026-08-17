# Frontend error layers

**Job:** Which error-boundary files exist and what they catch.  
**Upstream:** n/a (platform)  
**Status:** **aligned**  
**Code roots:** `app/global-error.tsx`, `app/[locale]/error.tsx`, `components/errors/`

How to write new boundaries: [`../conventions/error-handling.md`](../conventions/error-handling.md). Loading: [`page-flow-blueprint.md`](page-flow-blueprint.md).

---

## Shipped

| Layer | File | Catches |
|-------|------|---------|
| Global | `app/global-error.tsx` | Root layout / document (no i18n) |
| Locale | `app/[locale]/error.tsx` | Uncaught errors in locale tree |
| App tree | `components/errors/app-error-boundary.tsx` | Client render inside `AppProviders` |
| Section | `components/errors/section-error-boundary.tsx` | One section; tabs/header survive |

Recovery page: `components/errors/error-recovery-page.tsx`. Section fallback: `inline-error-fallback.tsx`. Logging: `lib/errors/logClientError.ts`.

**Not** for: API 4xx/5xx (toast/redirect), session expired ([`auth.md`](auth.md)), RHF/Zod, `loading.tsx`, `notFound()`.
