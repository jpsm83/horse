### Task 10: Add metadata to all static public listing pages

**Files:** (modify 16 files)
- `app/[locale]/page.tsx` (landing)
- `app/[locale]/home/page.tsx`
- `app/[locale]/horses/page.tsx`
- `app/[locale]/stables/page.tsx`
- `app/[locale]/breeders/page.tsx`
- `app/[locale]/transport/page.tsx`
- `app/[locale]/trainers/page.tsx`
- `app/[locale]/groomers/page.tsx`
- `app/[locale]/riders/page.tsx`
- `app/[locale]/coaches/page.tsx`
- `app/[locale]/farriers/page.tsx`
- `app/[locale]/veterinaries/page.tsx`
- `app/[locale]/riding-clubs/page.tsx`
- `app/[locale]/workplaces/page.tsx`
- `app/[locale]/relationships/page.tsx`
- `app/[locale]/ownership-transfers/page.tsx`

Each page needs a `generateMetadata` export added. The pattern:

```typescript
import type { Metadata } from "next";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "ROUTE", "metadata.TITLE_KEY");
}
```

Route-to-key mapping:
- `app/[locale]/page.tsx` → route: `""`, key: `"metadata.home"`
- `app/[locale]/home/page.tsx` → route: `"/home"`, key: `"metadata.homeDashboard"`
- `app/[locale]/horses/page.tsx` → route: `"/horses"`, key: `"metadata.horses"`
- `app/[locale]/stables/page.tsx` → route: `"/stables"`, key: `"metadata.stables"`
- `app/[locale]/breeders/page.tsx` → route: `"/breeders"`, key: `"metadata.breeders"`
- `app/[locale]/transport/page.tsx` → route: `"/transport"`, key: `"metadata.transport"`
- `app/[locale]/trainers/page.tsx` → route: `"/trainers"`, key: `"metadata.trainers"`
- `app/[locale]/groomers/page.tsx` → route: `"/groomers"`, key: `"metadata.groomers"`
- `app/[locale]/riders/page.tsx` → route: `"/riders"`, key: `"metadata.riders"`
- `app/[locale]/coaches/page.tsx` → route: `"/coaches"`, key: `"metadata.coaches"`
- `app/[locale]/farriers/page.tsx` → route: `"/farriers"`, key: `"metadata.farriers"`
- `app/[locale]/veterinaries/page.tsx` → route: `"/veterinaries"`, key: `"metadata.veterinaries"`
- `app/[locale]/riding-clubs/page.tsx` → route: `"/riding-clubs"`, key: `"metadata.ridingClubs"`
- `app/[locale]/workplaces/page.tsx` → route: `"/workplaces"`, key: `"metadata.workplaces"`
- `app/[locale]/relationships/page.tsx` → route: `"/relationships"`, key: `"metadata.relationships"`
- `app/[locale]/ownership-transfers/page.tsx` → route: `"/ownership-transfers"`, key: `"metadata.ownershipTransfers"`

**Important:** Read each file first to see its current content. Only add the `generateMetadata` export — keep ALL existing code intact. The existing pages export a default component, you are just adding the `generateMetadata` named export alongside it.

- [ ] **Step 1: Run typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 2: Stage and commit**

```bash
git add app/[locale]/page.tsx app/[locale]/home/page.tsx app/[locale]/horses/page.tsx app/[locale]/stables/page.tsx app/[locale]/breeders/page.tsx app/[locale]/transport/page.tsx app/[locale]/trainers/page.tsx app/[locale]/groomers/page.tsx app/[locale]/riders/page.tsx app/[locale]/coaches/page.tsx app/[locale]/farriers/page.tsx app/[locale]/veterinaries/page.tsx app/[locale]/riding-clubs/page.tsx app/[locale]/workplaces/page.tsx app/[locale]/relationships/page.tsx app/[locale]/ownership-transfers/page.tsx
git commit -m "feat(seo): add metadata to all static public pages"
```
