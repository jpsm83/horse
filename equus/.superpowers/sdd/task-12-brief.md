### Task 12: Add dynamic entity metadata to entity detail pages

**Files:**
- Modify: `app/[locale]/horses/[horseId]/page.tsx`
- Modify: `app/[locale]/users/[userId]/page.tsx`

- [ ] **Step 1: Add generateHorseMetadata to horse detail page**

Add to `app/[locale]/horses/[horseId]/page.tsx`:

```typescript
import type { Metadata } from "next";
import { generateHorseMetadata } from "@/lib/seo/entity-metadata.ts";
import Horse from "@/models/Horse.ts";

type HorseHubPageProps = {
  params: Promise<{ horseId: string; locale: string }>;
};

export async function generateMetadata({ params }: HorseHubPageProps): Promise<Metadata> {
  const { horseId, locale } = await params;
  try {
    const horse = await Horse.findById(horseId).select("name breed dateOfBirth location description profileImageUrl").lean();
    if (!horse) return { title: "Horse Not Found | Equus", robots: "noindex, nofollow" };
    return generateHorseMetadata({
      name: horse.name,
      breed: horse.breed,
      age: horse.dateOfBirth ? new Date().getFullYear() - new Date(horse.dateOfBirth).getFullYear() : undefined,
      location: horse.location,
      description: horse.description,
      image: horse.profileImageUrl,
    }, locale, horseId);
  } catch {
    return { title: "Horse Not Found | Equus", robots: "noindex, nofollow" };
  }
}
```

- [ ] **Step 2: Add generateUserMetadata to user profile page**

Add to `app/[locale]/users/[userId]/page.tsx`:

```typescript
import type { Metadata } from "next";
import { generateUserMetadata } from "@/lib/seo/entity-metadata.ts";
import User from "@/models/User.ts";

type UserProfilePageProps = {
  params: Promise<{ userId: string; locale: string }>;
};

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const { userId, locale } = await params;
  try {
    const user = await User.findById(userId).select("personalDetails").lean();
    if (!user) return { title: "User Not Found | Equus", robots: "noindex, nofollow" };
    const pd = user.personalDetails;
    const displayName = [pd?.firstName, pd?.lastName].filter(Boolean).join(" ") || "User";
    return generateUserMetadata({
      displayName,
      bio: pd?.bio,
      image: pd?.imageUrl,
    }, locale, userId);
  } catch {
    return { title: "User Not Found | Equus", robots: "noindex, nofollow" };
  }
}
```

**Important:** Keep all existing code in the page files. Only add the new imports and `generateMetadata` function.

- [ ] **Step 3: Run typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add "app/[locale]/horses/[horseId]/page.tsx" "app/[locale]/users/[userId]/page.tsx"
git commit -m "feat(seo): add dynamic entity metadata to detail pages"
```
