### Task 11: Add metadata to private/auth pages (noindex)

**Files:** (modify 20 files)
- Auth: `signin`, `signup`, `forgot-password`, `reset-password`, `confirm-email`, `resend-confirmation`
- Profile: `profile`, `notifications`, `not-allowed`
- Entity new pages: `horses/new`, `stables/new`, `breeders/new`, `transport/new`, `trainers/new`, `groomers/new`, `riders/new`, `coaches/new`, `farriers/new`, `veterinaries/new`, `riding-clubs/new`

Each page needs a `generateMetadata` export. Pattern using `generatePrivateMetadata` (noindex):

```typescript
import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "ROUTE", "metadata.TITLE_KEY");
}
```

Route-to-key mapping:
- `/signin` → route: `"/signin"`, key: `"metadata.signin"`
- `/signup` → route: `"/signup"`, key: `"metadata.signup"`
- `/forgot-password` → route: `"/forgot-password"`, key: `"metadata.forgotPassword"`
- `/reset-password` → route: `"/reset-password"`, key: `"metadata.resetPassword"`
- `/confirm-email` → route: `"/confirm-email"`, key: `"metadata.confirmEmail"`
- `/resend-confirmation` → route: `"/resend-confirmation"`, key: `"metadata.resendConfirmation"`
- `/profile` → route: `"/profile"`, key: `"metadata.profile"`
- `/notifications` → route: `"/notifications"`, key: `"metadata.notifications"`
- `/not-allowed` → route: `"/not-allowed"`, key: `"metadata.notAllowed"`
- `/horses/new` → route: `"/horses/new"`, key: `"metadata.horses"`
- `/stables/new` → route: `"/stables/new"`, key: `"metadata.stables"`
- `/breeders/new` → route: `"/breeders/new"`, key: `"metadata.breeders"`
- `/transport/new` → route: `"/transport/new"`, key: `"metadata.transport"`
- `/trainers/new` → route: `"/trainers/new"`, key: `"metadata.trainers"`
- `/groomers/new` → route: `"/groomers/new"`, key: `"metadata.groomers"`
- `/riders/new` → route: `"/riders/new"`, key: `"metadata.riders"`
- `/coaches/new` → route: `"/coaches/new"`, key: `"metadata.coaches"`
- `/farriers/new` → route: `"/farriers/new"`, key: `"metadata.farriers"`
- `/veterinaries/new` → route: `"/veterinaries/new"`, key: `"metadata.veterinaries"`
- `/riding-clubs/new` → route: `"/riding-clubs/new"`, key: `"metadata.ridingClubs"`

**Important:** Use `generatePrivateMetadata` (not `generatePublicMetadata`). Only add the export — keep all existing code.

- [ ] **Step 1: Run typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 2: Stage and commit**

```bash
git add app/[locale]/signin/page.tsx app/[locale]/signup/page.tsx app/[locale]/forgot-password/page.tsx app/[locale]/reset-password/page.tsx app/[locale]/confirm-email/page.tsx app/[locale]/resend-confirmation/page.tsx app/[locale]/profile/page.tsx app/[locale]/notifications/page.tsx app/[locale]/not-allowed/page.tsx app/[locale]/horses/new/page.tsx app/[locale]/stables/new/page.tsx app/[locale]/breeders/new/page.tsx app/[locale]/transport/new/page.tsx app/[locale]/trainers/new/page.tsx app/[locale]/groomers/new/page.tsx app/[locale]/riders/new/page.tsx app/[locale]/coaches/new/page.tsx app/[locale]/farriers/new/page.tsx app/[locale]/veterinaries/new/page.tsx app/[locale]/riding-clubs/new/page.tsx
git commit -m "feat(seo): add noindex metadata to private/auth pages"
```
