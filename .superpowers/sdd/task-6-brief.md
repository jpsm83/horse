# Task 6: Visibility comment / SoT cleanup in code

**Files:**
- Modify: `equus/lib/horses/horseVisibilityAccess.ts`
- Modify: `equus/lib/horses/hubSections.ts`
- Modify: `equus/lib/services/horseService.ts` (Hub DTO comment already updated in Task 2)

**Interfaces:**
- Consumes: nothing new.
- Produces: accurate file-header comments describing L1 / tabs / L2 and the full Hub-facing key set.

- [ ] **Step 1: Update `horseVisibilityAccess.ts` header**

Replace lines 1-14 (the file header) with:

```ts
/**
 * Horse visibility — single source of truth for audiences and checks.
 *
 * Three independent controls:
 * 1. Layer 1: `Horse.profileVisibility` — can the viewer open the horse at all?
 *    Deny → 404.
 * 2. Tabs: `viewerRole` → `allowedTabs` — which management pages appear
 *    (role-based; see `deriveAllowedTabs` in horseService).
 * 3. Layer 2: `Horse.hubSections[key].mode` — which Hub blocks appear.
 *
 * Modes (Layers 1 and 2): `public` | `relationship` | `owner`
 * Nested inclusion: owner ⊆ relationship ⊆ public
 *
 * Audience:
 * - owner team: main owner + co-owners + responsibles (`userOwnsEntity`)
 * - relationship: owner team + accepted horse Relationship + active workplace
 *   collaborators on related host entity profiles (stable / breeder / transport / ridingClub)
 */
```

- [ ] **Step 2: Update `hubSections.ts` header**

Replace lines 1-6 (the file header) with:

```ts
/**
 * Horse section visibility — shared Zod shapes and defaults.
 *
 * Keys match Profile/Admin section responsibilities (not parent form state).
 * All keys are Hub-facing: `buildHorseHubSections` projects cheap keys and
 * `attachHubSocialSections` projects list keys when Layer 2 allows.
 */
```

- [ ] **Step 3: Verify `horseService.ts` Hub DTO comments are accurate**

Grep for stale "Admin-only" / "not Hub-facing" wording:
Run: `rg -n "not Hub-facing|Admin-only|Hub-facing" equus/lib/services/horseService.ts equus/lib/horses/horseVisibilityAccess.ts equus/lib/horses/hubSections.ts`
Expected: no "not Hub-facing" or "Admin-only" for the three now-Hub-facing keys. The Task 2 comment update already covers `HorseViewDto`.

- [ ] **Step 4: Run full API test suite**

Run: `npm test -- tests/lib/services/horseHubSections.test.ts tests/lib/services/horseService.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add equus/lib/horses/horseVisibilityAccess.ts equus/lib/horses/hubSections.ts equus/lib/services/horseService.ts
git commit -m "docs: align horse visibility comments with three-control model"
```
