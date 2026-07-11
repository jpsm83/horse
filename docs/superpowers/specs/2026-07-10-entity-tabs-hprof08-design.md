# Entity Tab Navigation & H-PROF-08 Implementation — Design

**Date:** 2026-07-10
**Project:** Equus (Next.js 16)

---

## Goal

Add a reusable entity tab navigation component for module-specific sub-pages (Hub, Edit, Discovery, History, Relations) and fully implement H-PROF-08 (horse profile PATCH endpoint + edit page).

---

## Architecture

`
/horses/[horseId]               → Hub (existing, +tab bar)
/horses/[horseId]/edit          → Edit profile (H-PROF-08 — full)
/horses/[horseId]/discovery     → Discovery visibility (scaffold)
/horses/[horseId]/history       → Timeline (scaffold)
/horses/[horseId]/relations     → Relationships (scaffold)
`

---

## Files to Create

| File | Purpose |
|------|---------|
| components/ui/entity-tabs.tsx | Reusable shadcn Tabs-based navigation |
| app/[locale]/horses/[horseId]/edit/page.tsx | Edit page server component |
| components/horses/horse-edit-page-content.tsx | Edit form client component |
| app/[locale]/horses/[horseId]/discovery/page.tsx | Discovery scaffold |
| components/horses/horse-discovery-page-content.tsx | Discovery placeholder |
| app/[locale]/horses/[horseId]/history/page.tsx | History scaffold |
| components/horses/horse-history-page-content.tsx | History placeholder |
| app/[locale]/horses/[horseId]/relations/page.tsx | Relations scaffold |
| components/horses/horse-relations-page-content.tsx | Relations placeholder |

## Files to Modify

| File | Change |
|------|--------|
| app/[locale]/horses/[horseId]/page.tsx | Add EntityTabs above content |
| app/api/v1/horses/[id]/route.ts | Add PATCH handler |
| lib/services/horseService.ts | Add updateHorseProfile() |
| lib/validations/horse.ts | Add updateHorseProfileSchema |
| documentation/horseModule.md | Mark H-PROF-08 done, add tab section |
| messages/en.json + es.json | Tab labels + edit page translations |

---

## EntityTabs Component

Reusable tab bar using shadcn Tabs + TabsList + TabsTrigger.

Props:
- tabs: EntityTab[] — array of { id, label, href, requireOwnership? }
- basePath: string — the entity root path
- isOwner: boolean — whether user owns/co-owns

Behavior:
- Ownership-required tabs hidden when isOwner is false
- Current tab determined from pathname
- Each tab renders as a Link via asChild

---

## EntityTabs Interface

`	ypescript
export interface EntityTab {
  id: string;
  label: string;
  href: string;
  requireOwnership?: boolean;
}

interface EntityTabsProps {
  tabs: EntityTab[];
  basePath: string;
  isOwner: boolean;
  isPending?: boolean;
}
`

---

## H-PROF-08: Edit Profile

### Validation Schema (lib/validations/horse.ts)

All fields from createHorseSchema (minus discovery fields) as .optional().

### Service Function (lib/services/horseService.ts)

export async function updateHorseProfile(actorUserId, horseId, input):
1. Fetch horse, check exists
2. Verify actor is mainOwnerUserId or in coOwners[]
3. Strip undefined, build 
4. Horse.findByIdAndUpdate(horseId, {  })
5. Return horse

### Route (app/api/v1/horses/[id]/route.ts)

Add PATCH to existing file:
- requireAuthFromRequest
- validate with updateHorseProfileSchema
- call service
- return ok({ horse })

---

## Documentation

horseModule.md:
- Mark H-PROF-08 as "done"
- Add section describing entity tab navigation pattern
- Reference EntityTabs for reuse by other modules
