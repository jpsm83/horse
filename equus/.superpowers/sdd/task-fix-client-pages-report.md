# Fix: Split client pages to enable generateMetadata exports

## Summary

Split 10 page files that had `"use client"` AND exported `generateMetadata` into Server Component pages + client component files.

## Changes

### New client component files (10)

| File | Exported component |
|------|-------------------|
| `components/auth/sign-in-content.tsx` | `SignInContent` |
| `components/auth/sign-up-content.tsx` | `SignUpContent` |
| `components/auth/forgot-password-content.tsx` | `ForgotPasswordContent` |
| `components/auth/reset-password-content.tsx` | `ResetPasswordContent` |
| `components/auth/confirm-email-content.tsx` | `ConfirmEmailContent` |
| `components/auth/resend-confirmation-content.tsx` | `ResendConfirmationContent` |
| `components/status/not-allowed-content.tsx` | `NotAllowedContent` |
| `components/invites/workplaces-content.tsx` | `WorkplacesContent` + `WorkplacesLoadingShell` |
| `components/invites/relationships-content.tsx` | `RelationshipsContent` + `RelationshipsLoadingShell` |
| `components/invites/ownership-transfers-content.tsx` | `OwnershipTransfersContent` + `OwnershipTransfersLoadingShell` + helpers |

### Rewritten page files (10)

Each page now imports `Suspense`, the content component, `Metadata`, and the metadata factory — no `"use client"`, no client hooks.

| Page | Suspense |
|------|----------|
| `app/[locale]/signin/page.tsx` | `fallback={null}` |
| `app/[locale]/signup/page.tsx` | `fallback={null}` |
| `app/[locale]/forgot-password/page.tsx` | None (no `useSearchParams`) |
| `app/[locale]/reset-password/page.tsx` | `fallback={null}` |
| `app/[locale]/confirm-email/page.tsx` | `fallback={null}` |
| `app/[locale]/resend-confirmation/page.tsx` | None (no `useSearchParams`) |
| `app/[locale]/not-allowed/page.tsx` | `fallback={null}` |
| `app/[locale]/workplaces/page.tsx` | `fallback={null}` |
| `app/[locale]/relationships/page.tsx` | `fallback={null}` |
| `app/[locale]/ownership-transfers/page.tsx` | `fallback={null}` |

### Verification

- `npx tsc --noEmit` passes (only pre-existing test file errors remain)
- No functionality was changed — all imports, hooks, JSX, and logic preserved in client components
