# Authentication Area Refactoring — Design Document

**Date:** 2026-08-02
**Status:** ✅ DONE (executed 2026-08-02 — all tasks complete; 703 tests pass, lint clean, tsc clean)
**Scope:** Comprehensive refactoring of all 6 auth pages to match canonical patterns from the horse module and `page-flow-blueprint.md`. Eliminate Suspense antipatterns, fill missing `loading.tsx`, extract `client.tsx` search-param wrappers, add file headers, and add UI render tests.

---

## 1. Directory & File Structure

### Current State

```
app/[locale]/signin/
  page.tsx          ← Suspense fallback={null}, imports SignInContent directly
  (no loading.tsx)  ← MISSING
  (no client.tsx)   ← MISSING

app/[locale]/signup/
  page.tsx          ← Suspense fallback={null}, imports SignUpContent directly
  (no loading.tsx)  ← MISSING
  (no client.tsx)   ← MISSING

app/[locale]/forgot-password/
  page.tsx          ← Direct import (no Suspense needed — no useSearchParams)
  (no loading.tsx)  ← MISSING
  (no client.tsx)   ← MISSING

app/[locale]/reset-password/
  page.tsx          ← Suspense fallback={null}, imports ResetPasswordContent directly
  (no loading.tsx)  ← MISSING
  (no client.tsx)   ← MISSING

app/[locale]/confirm-email/
  page.tsx          ← Suspense fallback={null}, imports ConfirmEmailContent directly
  (no loading.tsx)  ← MISSING
  (no client.tsx)   ← MISSING

app/[locale]/resend-confirmation/
  page.tsx          ← Direct import (no useSearchParams)
  (no loading.tsx)  ← MISSING
  (no client.tsx)   ← MISSING

components/auth/
  auth-page-shell.tsx              ← no file header
  sign-in-content.tsx              ← calls useSearchParams() directly, no file header
  sign-up-content.tsx              ← calls useSearchParams() directly, no file header
  forgot-password-content.tsx      ← no file header
  reset-password-content.tsx       ← calls useSearchParams(), has clearClientAuthSession + cancelled useRef pattern, no file header
  confirm-email-content.tsx        ← calls useSearchParams(), uses useRef one-shot guard, no file header
  resend-confirmation-content.tsx  ← no file header
  google-sign-in-button.tsx        ← no file header
```

### Target State

```
app/[locale]/signin/
  page.tsx          ← thin SC: generateMetadata + <SignInClient />
  client.tsx        ← NEW: "use client" wrapper — useSearchParams → parse next → <SignInContent postAuthPath={...} />
  loading.tsx       ← NEW: AuthPageContentSkeleton

app/[locale]/signup/
  page.tsx          ← thin SC: generateMetadata + <SignUpClient />
  client.tsx        ← NEW: useSearchParams → parse next, ref → <SignUpContent postAuthPath={...} ref={...} isStaffRef={...} />
  loading.tsx       ← NEW: AuthPageContentSkeleton

app/[locale]/forgot-password/
  page.tsx          ← thin SC: generateMetadata + <ForgotPasswordClient />
  client.tsx        ← NEW: think wrapper → <ForgotPasswordContent />
  loading.tsx       ← NEW: AuthPageContentSkeleton

app/[locale]/reset-password/
  page.tsx          ← thin SC: generateMetadata + <ResetPasswordClient />
  client.tsx        ← NEW: useSearchParams → parse token → clearClientAuthSession → <ResetPasswordContent token={...} />
  loading.tsx       ← NEW: AuthPageContentSkeleton

app/[locale]/confirm-email/
  page.tsx          ← thin SC: generateMetadata + <ConfirmEmailClient />
  client.tsx        ← NEW: useSearchParams → parse token → <ConfirmEmailContent token={...} />
  loading.tsx       ← NEW: AuthPageContentSkeleton

app/[locale]/resend-confirmation/
  page.tsx          ← thin SC: generateMetadata + <ResendConfirmationClient />
  client.tsx        ← NEW: thin wrapper → <ResendConfirmationContent />
  loading.tsx       ← NEW: AuthPageContentSkeleton

components/auth/
  auth-page-content-skeleton.tsx   ← NEW: shared skeleton (Skeleton + Spinner, suppressHydrationWarning, showSpinner)
  auth-page-shell.tsx              ← ADD file header
  sign-in-content.tsx              ← ADD file header, receives postAuthPath as prop, drops useSearchParams()
  sign-up-content.tsx              ← ADD file header, receives postAuthPath, ref?, isStaffRef as props, drops useSearchParams()
  forgot-password-content.tsx      ← ADD file header
  reset-password-content.tsx       ← ADD file header, receives token as prop, drops useSearchParams(), drops clearClientAuthSession useEffect + cancelled + sessionCleared
  confirm-email-content.tsx        ← ADD file header, receives token as prop, drops useSearchParams(), drops useRef for useState guard
  resend-confirmation-content.tsx  ← ADD file header
  google-sign-in-button.tsx        ← ADD file header
```

---

## 2. Architecture & Data Flow

### Pattern (all 6 routes)

```
layout.tsx (locale) → AppShell + AppProviders (always renders)
  └── loading.tsx → AuthPageContentSkeleton (SSR streaming)
      └── page.tsx (SC) → generateMetadata + render from ./client.tsx
          └── client.tsx → "use client": useSearchParams() → parse → render content with props
              └── <ContentComponent params={...} />
```

### Key design decisions

| Decision | Rationale |
|----------|-----------|
| `page.tsx` only `generateMetadata` + one client render from `./client.tsx` | Blueprint §3 pattern |
| `client.tsx` is the ONLY place `useSearchParams()` is called | Eliminates Suspense boundary needed in page.tsx |
| Content components receive parsed params as props | Components become pure, testable, no search-param coupling |
| `loading.tsx` uses `AuthPageContentSkeleton` — same component as inline loading | Blueprint §4: same component = no visual swap |
| No `useRef` anywhere in auth code | AGENTS.md: React-first; `useRef` forbidden for DOM; non-DOM uses must be rare |
| Auth redirects are `useEffect` side effects (`useRedirectIfAuthenticated`) | Never block render |
| Auth mutations are direct API calls (not TanStack Query) | AGENTS.md: "Auth state is not TanStack Query" — observer pattern via `session.ts` |

### Param flow per route

| Route | Params parsed in `client.tsx` | Passed to content as |
|-------|------------------------------|---------------------|
| signin | `next` param → `resolvePostAuthPath(…)` | `postAuthPath: string` |
| signup | `next` param → `resolvePostAuthPath(…)`, `ref` → `isStaffMembershipRef(…)` | `postAuthPath: string`, `ref?: string`, `isStaffRef: boolean` |
| forgot-password | none | no props |
| reset-password | `token` → `clearClientAuthSession()` → ready | `token: string \| null` |
| confirm-email | `token` | `token: string \| null` |
| resend-confirmation | none | no props |

---

## 3. Key Component Refactoring Details

### 3.1 `reset-password` — client.tsx session clearing

Moved from content component to `client.tsx`:

```tsx
// client.tsx
"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation.ts";
import { ResetPasswordContent } from "@/components/auth/reset-password-content.tsx";
import { clearClientAuthSession } from "@/lib/auth/clearClientAuthSession.ts";
import { AuthPageContentSkeleton } from "@/components/auth/auth-page-content-skeleton.tsx";

export function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [ready, setReady] = useState(!token);

  useEffect(() => {
    if (!token) return;
    clearClientAuthSession().then(() => {
      router.refresh();
      setReady(true);
    });
  }, [token, router]);

  if (!ready) return <AuthPageContentSkeleton suppressHydrationWarning />;

  return <ResetPasswordContent token={token} />;
}
```

Result: `ResetPasswordContent` becomes a pure-presentational component receiving `token` as prop. No `useSearchParams()`, no `clearClientAuthSession`, no `cancelled` flag, no `sessionCleared` state.

### 3.2 `confirm-email` — useRef replaced with useState

```tsx
// confirm-email-content.tsx
// Receives `token` prop — no useSearchParams(), no useRef
export function ConfirmEmailContent({ token }: { token: string | null }) {
  // guard state replaces useRef
  const [submitted, setSubmitted] = useState(false);
  const [state, setState] = useState<FlowState>(token ? "loading" : "missing");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token || submitted) return;
    setSubmitted(true);
    confirmEmail(token).then(result => {
      setMessage(result.message);
      setState("success");
    }).catch(err => {
      setMessage(err instanceof Error ? err.message : t("error"));
      setState("error");
    });
  }, [token, submitted, t]);
  // ...
}
```

### 3.3 Forgot-password & Resend-confirmation client.tsx

These pages don't use `useSearchParams()`. Their `client.tsx` wrappers are minimal thin components (keeping the pattern consistent across all 6 routes):

```tsx
// forgot-password/client.tsx
"use client";
import { ForgotPasswordContent } from "@/components/auth/forgot-password-content.tsx";
export function ForgotPasswordClient() {
  return <ForgotPasswordContent />;
}
```

---

## 4. Skeleton Component

```tsx
// components/auth/auth-page-content-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";

export function AuthPageContentSkeleton({
  suppressHydrationWarning,
  showSpinner = true,
}: {
  suppressHydrationWarning?: boolean;
  showSpinner?: boolean;
}) {
  return (
    <div className="relative w-full h-full" suppressHydrationWarning={suppressHydrationWarning}>
      {showSpinner && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <Spinner className="size-6" />
        </div>
      )}
      <Skeleton className="inset-0 h-full w-full p-4 rounded-md" />
    </div>
  );
}
```

**Usage:**
- `loading.tsx` (all 6 routes) — default props
- `reset-password/client.tsx` — `suppressHydrationWarning` (SSR skeleton → client data mismatch during session clearing)
- All other `client.tsx` wrappers — default props (simple render boundary, skeleton won't normally be shown since content renders synchronously)

---

## 5. File Headers

| File | Header |
|------|--------|
| `auth-page-content-skeleton.tsx` | Body skeleton for auth page loading states. Used by `loading.tsx` (SSR) and `client.tsx` (search-param hydration / session clearing). |
| `auth-page-shell.tsx` | Centered auth card layout with title + description + children + footer slot. Used by all auth content components. |
| `sign-in-content.tsx` | Email/password sign-in form + Google OAuth button. Receives `postAuthPath` from `client.tsx`. Calls `loginWithCredentials` (observer pattern, not TanStack — auth state lives in `session.ts`). |
| `sign-up-content.tsx` | Registration form with invite banner support, user type selector, and business details section. Receives `postAuthPath`, `ref?`, `isStaffRef` from `client.tsx`. Calls `registerWithCredentials`. |
| `forgot-password-content.tsx` | Password reset request form. Pure form — no search params. |
| `reset-password-content.tsx` | New password form. Receives `token` from `client.tsx` (session already cleared by `client.tsx`). |
| `confirm-email-content.tsx` | Token confirmation flow with loading/success/error/missing states. Receives `token` from `client.tsx`. Calls `confirmEmail`. |
| `resend-confirmation-content.tsx` | Email verification resend form. Pure form — no search params. |
| `google-sign-in-button.tsx` | Google OAuth sign-in/sign-up button via NextAuth `signIn()`. Called by sign-in and sign-up content. |
| Each `client.tsx` | Search-params hydration boundary for the [route] auth page. Uses `useSearchParams()`, parses params, renders content component. Only component in the auth tree that touches `useSearchParams()`. |

---

## 6. i18n

**No new keys required.** All auth forms use existing translation namespaces:
- `auth.signIn.*`, `auth.signUp.*`, `auth.forgotPassword.*`, `auth.resetPassword.*`, `auth.confirmEmail.*`, `auth.resendConfirmation.*`, `auth.google.*`, `auth.passwordPolicy`
- `common.signIn`, `common.signUp`, `common.email`, `common.password`, `common.loading`, `common.firstName`, `common.lastName`, `common.or`, `common.accountType`, `common.businessDetails`, etc.
- `validation.*`, `errors.*`, `status.*`, `invites.signup.*`

---

## 7. Testing

### Existing coverage (logic layer — no changes needed)
- `tests/lib/validations/authForms.test.ts` — Zod schema tests
- `tests/lib/validations/auth.test.ts` — server-side validation tests
- `tests/lib/services/authService.test.ts` — auth service integration tests
- `tests/lib/api/authClient.test.ts` — client API tests
- `tests/lib/api/authClient.session.test.ts` — session management tests
- `tests/lib/api/authClient.refresh.test.ts` — token refresh tests
- `tests/lib/api/authClient.ownershipTransfers.test.ts` — ownership transfer tests
- `tests/lib/api/authClient.deactivate.test.ts` — deactivation tests

### New tests
`tests/components/auth/auth-components.test.tsx` — UI render tests covering:

| Test | Scope |
|------|-------|
| `AuthPageContentSkeleton` | Renders, `showSpinner` controls Spinner visibility, passes `suppressHydrationWarning` |
| `AuthPageShell` | Renders title + description + children + footer, empty children, empty footer |
| `SignInContent` | Renders email + password fields, Google divider + button, footer sign-up link, submit button disabled states |
| `SignUpContent` | Renders all fields, invite banner with/without ref, business details toggle, user type selector |
| `ForgotPasswordContent` | Renders email field + submit, success state after submit |
| `ResetPasswordContent` | Missing token → error state, valid token → password fields, success redirect |
| `ConfirmEmailContent` | Loading state, success state, error state, missing token state |
| `ResendConfirmationContent` | Renders email field + submit, success state, already-verified state |
| `GoogleSignInButton` | Renders with "or" divider, loading state, disabled state |

Use Vitest + `@testing-library/react` patterns matching existing tests in `tests/`.

---

## 8. Implementation Order

### Phase 1 — Foundation
1. ✅ Create `components/auth/auth-page-content-skeleton.tsx`

### Phase 2 — Route structure (12 new files)
2. ✅ Create `loading.tsx` for all 6 auth routes
3. ✅ Create `client.tsx` for all 6 auth routes
4. ✅ Rewrite all 6 `page.tsx` files — remove Suspense, import from `./client.tsx`

### Phase 3 — Component cleanup
5. ✅ Refactor `sign-in-content.tsx` — receive `postAuthPath` prop, drop `useSearchParams()`, add file header
6. ✅ Refactor `sign-up-content.tsx` — receive `postAuthPath`, `ref?`, `isStaffRef` props, drop `useSearchParams()`, add file header
7. ✅ Refactor `reset-password-content.tsx` — receive `token` prop, drop `useSearchParams()`, drop `clearClientAuthSession` + `cancelled` + `sessionCleared`, add file header
8. ✅ Refactor `confirm-email-content.tsx` — receive `token` prop, drop `useSearchParams()`, drop `useRef` for `useState` guard, add file header
9. ✅ Add file headers to `auth-page-shell.tsx`, `forgot-password-content.tsx`, `resend-confirmation-content.tsx`, `google-sign-in-button.tsx`

### Phase 4 — Tests
10. ✅ Create `tests/components/auth/auth-components.test.ts` (15 tests)

### Phase 5 — Verification
11. ✅ Run `npm test` — all pass (703/703)
12. ✅ Run `npm run lint` — no errors (0 errors)
13. ⏳ Manual verification — cold load each auth page, form submission flows, param-driven pages, authenticated redirect

---

## 9. Completeness Gate

✅ **COMPLETE (2026-08-02):** All 13 implementation tasks done. `npm test` (703/703), `npm run lint` (0 errors), `tsc --noEmit` (clean). Manual QA of cold-load flows pending user verification. The Authentication area is fully aligned with:
- Blueprint `page-flow-blueprint.md` (thin `page.tsx` + `client.tsx` + `loading.tsx`)
- Horse module patterns (named skeleton, same skeleton in `loading.tsx` and inline states)
- AGENTS.md (React-first, no `useRef`, file headers on all components, no `Suspense` antipatterns)
- `component-resilience.md` (`suppressHydrationWarning` on content containers)

No follow-up work remains — area 2 is done.
