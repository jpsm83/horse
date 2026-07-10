# Task 11 Report: Add metadata to private/auth pages (noindex)

## Summary

Added `generateMetadata` exports using `generatePrivateMetadata` (noindex) to all 20 private/auth pages.

## Files modified

| # | File | Route | Title Key |
|---|------|-------|-----------|
| 1 | `app/[locale]/signin/page.tsx` | `/signin` | `metadata.signin` |
| 2 | `app/[locale]/signup/page.tsx` | `/signup` | `metadata.signup` |
| 3 | `app/[locale]/forgot-password/page.tsx` | `/forgot-password` | `metadata.forgotPassword` |
| 4 | `app/[locale]/reset-password/page.tsx` | `/reset-password` | `metadata.resetPassword` |
| 5 | `app/[locale]/confirm-email/page.tsx` | `/confirm-email` | `metadata.confirmEmail` |
| 6 | `app/[locale]/resend-confirmation/page.tsx` | `/resend-confirmation` | `metadata.resendConfirmation` |
| 7 | `app/[locale]/profile/page.tsx` | `/profile` | `metadata.profile` |
| 8 | `app/[locale]/notifications/page.tsx` | `/notifications` | `metadata.notifications` |
| 9 | `app/[locale]/not-allowed/page.tsx` | `/not-allowed` | `metadata.notAllowed` |
| 10 | `app/[locale]/horses/new/page.tsx` | `/horses/new` | `metadata.horses` |
| 11 | `app/[locale]/stables/new/page.tsx` | `/stables/new` | `metadata.stables` |
| 12 | `app/[locale]/breeders/new/page.tsx` | `/breeders/new` | `metadata.breeders` |
| 13 | `app/[locale]/transport/new/page.tsx` | `/transport/new` | `metadata.transport` |
| 14 | `app/[locale]/trainers/new/page.tsx` | `/trainers/new` | `metadata.trainers` |
| 15 | `app/[locale]/groomers/new/page.tsx` | `/groomers/new` | `metadata.groomers` |
| 16 | `app/[locale]/riders/new/page.tsx` | `/riders/new` | `metadata.riders` |
| 17 | `app/[locale]/coaches/new/page.tsx` | `/coaches/new` | `metadata.coaches` |
| 18 | `app/[locale]/farriers/new/page.tsx` | `/farriers/new` | `metadata.farriers` |
| 19 | `app/[locale]/veterinaries/new/page.tsx` | `/veterinaries/new` | `metadata.veterinaries` |
| 20 | `app/[locale]/riding-clubs/new/page.tsx` | `/riding-clubs/new` | `metadata.ridingClubs` |

## Pattern applied

Each file received:
- `import type { Metadata } from "next";`
- `import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";`
- `type PageProps = { params: Promise<{ locale: string }> };`
- `export async function generateMetadata` using `generatePrivateMetadata` (noindex)

## Verification

- `npx tsc --noEmit` passes (pre-existing test errors unrelated)
- Committed as `552f839` with message `feat(seo): add noindex metadata to private/auth pages`
