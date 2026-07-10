# Fix: Split "use client" pages that export generateMetadata

## Problem

10 page files have `"use client"` at the top AND export `generateMetadata`. Next.js requires `generateMetadata` to be exported from Server Components only.

## Files to fix (all 10 pages)

1. `app/[locale]/signin/page.tsx`
2. `app/[locale]/signup/page.tsx`
3. `app/[locale]/forgot-password/page.tsx`
4. `app/[locale]/reset-password/page.tsx`
5. `app/[locale]/confirm-email/page.tsx`
6. `app/[locale]/resend-confirmation/page.tsx`
7. `app/[locale]/not-allowed/page.tsx`
8. `app/[locale]/workplaces/page.tsx`
9. `app/[locale]/relationships/page.tsx`
10. `app/[locale]/ownership-transfers/page.tsx`

## Fix Pattern (for each page)

For each file, the pattern is:
1. Remove `"use client"` from the page
2. Extract all the client-side component code (imports + Content component + default export) into a new file under `components/` with `"use client"`
3. The page becomes a Server Component that imports and renders the client component

Here's the detailed pattern:

### Before (signin/page.tsx):
```tsx
"use client";
import ... from "...";  // all client imports
import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: PageProps): Promise<Metadata> { ... }

function SignInContent() { /* client hooks, JSX */ }

export default function SignInPage() {
  return <Suspense fallback={null}><SignInContent /></Suspense>;
}
```

### After (signin/page.tsx):
```tsx
import { Suspense } from "react";
import { SignInContent } from "@/components/auth/sign-in-content.tsx";
import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/signin", "metadata.signin");
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  );
}
```

### New file (components/auth/sign-in-content.tsx):
```tsx
"use client";
// all the client imports and component code from the original page
// the SignInContent function (renamed to named export)
export function SignInContent() { /* same code */ }
```

## Component file naming convention

Use existing component directories when possible:
- Auth pages → `components/auth/`
- Status pages → `components/status/`
- Relationship/transfer/workplace → `components/invites/`

| Page | Content component name | File path |
|------|----------------------|-----------|
| signin | `SignInContent` | `components/auth/sign-in-content.tsx` |
| signup | `SignUpContent` | `components/auth/sign-up-content.tsx` |
| forgot-password | `ForgotPasswordContent` | `components/auth/forgot-password-content.tsx` |
| reset-password | `ResetPasswordContent` | `components/auth/reset-password-content.tsx` |
| confirm-email | `ConfirmEmailContent` | `components/auth/confirm-email-content.tsx` |
| resend-confirmation | `ResendConfirmationContent` | `components/auth/resend-confirmation-content.tsx` |
| not-allowed | `NotAllowedContent` | `components/status/not-allowed-content.tsx` |
| workplaces | `WorkplacesContent` | `components/invites/workplaces-content.tsx` |
| relationships | `RelationshipsContent` | `components/invites/relationships-content.tsx` |
| ownership-transfers | `OwnershipTransfersContent` | `components/invites/ownership-transfers-content.tsx` |

## Important

1. Keep ALL existing imports, hooks, JSX, and logic in the client component file
2. The page file should only import `Suspense`, the content component, `Metadata`, and the metadata factory
3. Run `npx tsc --noEmit` after all files are changed
4. Run `npm run build` to verify the build succeeds

Working directory: C:\Users\jpdesouza\Documents\code\horse\equus