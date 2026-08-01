# Task 2: Hub DTO types + `buildHorseHubSections` projections

**Files:**
- Modify: `equus/lib/services/horseService.ts`

**Interfaces:**
- Consumes: `canViewHorseHubSection(horseDoc, key, audience)`, `horseHubSectionKeys` concepts, existing `HorseHubDto["sections"]` shape.
- Produces:
  - `HorseHubValueSection`, `HorseHubProactiveRepresentativesSection`, `HorseHubCoOwnerManagementSection`, `HorseHubMemberSummary` types.
  - `HorseHubDto["sections"]` extended with `value?`, `proactiveRepresentatives?`, `coOwnerManagement?`.
  - `buildHorseHubSections` now projects these keys when L2 allows.

- [ ] **Step 1: Add Hub member/value section types**

Insert these types right after `HorseHubOwnershipSection` (line ~225) and before `HorseHubGalleryItem`:

```ts
export type HorseHubMemberSummary = {
  userId: string;
  name?: string;
  imageUrl?: string;
};

export type HorseHubValueSection = {
  saleStatus?: string;
  askingPrice?: number;
  estimatedValue?: number;
  valueCurrency?: string;
  acquisitionDate?: string; // ISO date string
  /** Resolved acquisition source (falls back to current owner when unset). */
  acquisitionSourceUser?: HorseHubMemberSummary;
};

export type HorseHubProactiveRepresentativesSection = {
  members: HorseHubMemberSummary[];
};

export type HorseHubCoOwnerManagementSection = {
  members: HorseHubMemberSummary[];
};
```

- [ ] **Step 2: Extend `HorseHubDto["sections"]`**

In the `HorseHubDto` type (line ~257), add the three keys after `ownership` and before `gallery`:

```ts
  sections: {
    identity?: HorseHubIdentitySection;
    identification?: HorseHubIdentificationSection;
    pedigree?: HorseHubPedigreeSection;
    about?: HorseHubAboutSection;
    ownership?: HorseHubOwnershipSection;
    value?: HorseHubValueSection;
    proactiveRepresentatives?: HorseHubProactiveRepresentativesSection;
    coOwnerManagement?: HorseHubCoOwnerManagementSection;
    gallery?: HorseHubGalleryItem[];
    planning?: HorseHubPlanningItem[];
    connections?: HorseHubConnectionItem[];
  };
```

- [ ] **Step 3: Update the `HorseViewDto` doc comment**

Replace lines 269-275 (the JSDoc above `HorseViewDto`) with:

```ts
/**
 * Unified role-scoped horse view DTO (shared chrome for all horse tabs).
 * Owner-only fields are populated when the viewer is on the ownership team.
 * `sections` holds cheap Hub projections (identity, identification, pedigree,
 * about, ownership, value, proactiveRepresentatives, coOwnerManagement)
 * filtered by L1+L2. Gallery / planning / connections lists are NOT populated
 * here — use `getHorseHubSocial` / GET …/hub-social.
 */
```

- [ ] **Step 4: Extend `buildHorseHubSections` with the three projections**

Inside `buildHorseHubSections` (lines 969-1034), after the `ownership` block and before `return sections;`, add:

```ts
  if (canViewHorseHubSection(horseDoc, "value", audience)) {
    sections.value = {
      saleStatus: horseDoc.saleStatus as string | undefined,
      askingPrice: horseDoc.askingPrice as number | undefined,
      estimatedValue: horseDoc.estimatedValue as number | undefined,
      valueCurrency: horseDoc.valueCurrency as string | undefined,
      acquisitionDate:
        horseDoc.acquisitionDate instanceof Date
          ? horseDoc.acquisitionDate.toISOString()
          : typeof horseDoc.acquisitionDate === "string"
            ? horseDoc.acquisitionDate
            : undefined,
    };
  }

  if (canViewHorseHubSection(horseDoc, "proactiveRepresentatives", audience)) {
    sections.proactiveRepresentatives = { members: [] };
  }

  if (canViewHorseHubSection(horseDoc, "coOwnerManagement", audience)) {
    sections.coOwnerManagement = { members: [] };
  }
```

Note: `members: []` is a sync stub — member summaries are enriched in Task 3 (`getHorseView`).

- [ ] **Step 5: Run the test to verify the new cases pass**

Run: `npm test -- tests/lib/services/horseHubSections.test.ts`
Expected: PASS — all 8 keys present for owner team, value projected per L2 mode, team sections projected per L2 mode.

- [ ] **Step 6: Commit**

```bash
git add equus/lib/services/horseService.ts equus/tests/lib/services/horseHubSections.test.ts
git commit -m "feat: project value and team hub sections through buildHorseHubSections"
```
