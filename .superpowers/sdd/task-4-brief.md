# Task 4: Wire Hub About section

**Files:**
- Modify: `equus/components/horses/hub/horse-hub-about.tsx`
- Modify: `equus/app/[locale]/horses/[horseId]/client.tsx`

**Interfaces:**
- Consumes: `HorseViewDto` from `@/lib/services/horseService.ts` (already passed as `horse` to `HorseHubHero`).
- Produces: `HorseHubAbout({ horse, className })` — returns `null` when `sections.about` absent; shows description text or `aboutEmpty`.

- [ ] **Step 1: Rewrite `HorseHubAbout` to render `sections.about`**

Replace the entire contents of `equus/components/horses/hub/horse-hub-about.tsx`:

```tsx
/**
 * HorseHubAbout — Hub tab About card. Shows the horse profile description
 * when the Layer-2 `about` section allows it; renders nothing otherwise.
 *
 * Assembled by HubContent. Reads `horse.sections.about` from useHorseView.
 */

"use client";

import { useTranslations } from "next-intl";

import { Section } from "@/components/shared/section.tsx";
import type { HorseViewDto } from "@/lib/services/horseService.ts";
import { cn } from "@/lib/utils";

type HorseHubAboutProps = {
  horse: HorseViewDto;
  className?: string;
};

export function HorseHubAbout({ horse, className }: HorseHubAboutProps) {
  const t = useTranslations("horseHub");
  const about = horse.sections.about;
  if (!about) return null;

  return (
    <Section title={t("about")} className={cn(className)}>
      <p className="text-sm text-muted-foreground">
        {about.description?.trim() ? about.description : t("aboutEmpty")}
      </p>
    </Section>
  );
}
```

- [ ] **Step 2: Pass `horse` to `HorseHubAbout` in `client.tsx`**

In `equus/app/[locale]/horses/[horseId]/client.tsx`, change:

```tsx
<HorseHubAbout />
```
to:
```tsx
<HorseHubAbout horse={horse} />
```

- [ ] **Step 3: Run lint**

Run: `npm run lint -- "app/[locale]/horses/[horseId]/client.tsx" "components/horses/hub/horse-hub-about.tsx"`
Expected: PASS (no errors).

- [ ] **Step 4: Commit**

```bash
git add "equus/app/[locale]/horses/[horseId]/client.tsx" equus/components/horses/hub/horse-hub-about.tsx
git commit -m "feat: wire hub about section to horse description"
```
