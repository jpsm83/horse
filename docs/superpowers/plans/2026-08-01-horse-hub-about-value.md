# Horse Hub About + Value + Section Projections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `value`, `proactiveRepresentatives`, and `coOwnerManagement` Hub-facing sections projected into `horse.sections` when Layer 2 allows; wire the Hub About section to show the profile description; rename the Hub Description section to Value with a read-only view of the Admin Horse Value fields; and update all docs to reflect the current behavior.

**Architecture:** Keep three separate controls: (1) `viewerRole` / `allowedTabs` for tab edit access (role-based, unchanged), (2) Layer 1 `profileVisibility` for horse open (404), (3) Layer 2 `hubSections[key]` for Hub content. Remove the "Admin-only / not Hub-facing" carve-out for `value`, `proactiveRepresentatives`, `coOwnerManagement`. Cheap keys go through `buildHorseHubSections` + async enrichment in `getHorseView`; list keys stay on `GET …/hub-social`.

**Tech Stack:** Next.js App Router, TypeScript, TanStack Query (`useHorseView`), Vitest, next-intl, shadcn `Section` / `EntityChip`.

## Global Constraints

- Follow `rules.md` + `equus/AGENTS.md` (AGENTS wins on conflicts).
- Hub renders only keys present in `horse.sections` — never ship forbidden data and hide in React.
- Guest with `hubSections.value.mode = "public"` must receive `sections.value` without Admin tab access.
- Defaults unchanged: `value` / `proactiveRepresentatives` / `coOwnerManagement` default to `owner`.
- No visibility popovers on Hub; Eyes stay on Profile/Admin/Media/Planning/Connect.
- i18n: no hardcoded Hub copy; update `en.json` + `es.json`.
- Admin flat fields (`estimatedValue`, `coOwners`, `responsibles`, etc.) stay as today for management tabs.
- Owner-team root fields remain in `if (audience.isOwnerTeam)` block; sections projections are L2-only.
- Hub value fields = exact Admin HorseValueSection subset (read-only): saleStatus, askingPrice, estimatedValue, valueCurrency, acquisitionDate, acquisitionSourceUser.
- Hub projections never include phone or email for non-owner-team viewers.

---

### Task 1: Failing API tests (TDD)

**Files:**
- Modify: `equus/tests/lib/services/horseHubSections.test.ts`

**Interfaces:**
- Consumes: existing `buildHorseHubSections(horseDoc, audience)` and `HorseViewerAudience` fixtures (`guest`, `related`, `ownerTeam`).
- Produces: failing test cases that will pass after Task 2.

- [ ] **Step 1: Add `value` / `proactiveRepresentatives` / `coOwnerManagement` fields to the shared `horse` fixture**

Locate the `horse` fixture at the top of `describe("buildHorseHubSections", ...)` (line 21). Replace the fixture object so it includes commercial + team fields:

```ts
  const horse = {
    _id: "507f1f77bcf86cd799439011",
    color: "Bay",
    heightHands: 16,
    disciplines: ["Dressage"],
    description: "Friendly",
    registryId: "REG-1",
    microchipId: "CHIP-1",
    passportNumber: "PASS-1",
    coOwners: [{ userId: "x" }],
    responsibles: [{ userId: "y" }],
    pedigree: { sireName: "Sire", damName: "Dam" },
    saleStatus: "for_sale",
    askingPrice: 12000,
    estimatedValue: 15000,
    valueCurrency: "USD",
    acquisitionDate: new Date("2021-06-01T00:00:00.000Z"),
    hubSections: {
      identity: { mode: "public" },
      identification: { mode: "relationship" },
      pedigree: { mode: "relationship" },
      about: { mode: "owner" },
      ownership: { mode: "relationship" },
      value: { mode: "owner" },
      proactiveRepresentatives: { mode: "owner" },
      coOwnerManagement: { mode: "owner" },
    },
  };
```

- [ ] **Step 2: Update the "includes all profile sections for owner team" test**

The existing owner-team test (lines 73-83) currently expects exactly 5 keys. Replace it with the 8-key expectation and value assertions:

```ts
  it("includes all profile sections for owner team", () => {
    const sections = buildHorseHubSections(horse, ownerTeam);
    expect(Object.keys(sections).sort()).toEqual([
      "about",
      "coOwnerManagement",
      "identification",
      "identity",
      "ownership",
      "pedigree",
      "proactiveRepresentatives",
      "value",
    ]);
    expect(sections.about?.description).toBe("Friendly");
    expect(sections.value?.saleStatus).toBe("for_sale");
    expect(sections.value?.askingPrice).toBe(12000);
    expect(sections.value?.estimatedValue).toBe(15000);
    expect(sections.value?.valueCurrency).toBe("USD");
    expect(sections.proactiveRepresentatives).toEqual({ members: [] });
    expect(sections.coOwnerManagement).toEqual({ members: [] });
  });
```

- [ ] **Step 3: Add new failing test cases for value section projections**

Append these tests inside `describe("buildHorseHubSections", ...)` (after the bloodlineNotes test):

```ts
  it("includes value section for guests when value is public", () => {
    const publicValue = {
      ...horse,
      hubSections: { ...horse.hubSections, value: { mode: "public" } },
    };
    const sections = buildHorseHubSections(publicValue, guest);
    expect(sections.value).toEqual({
      saleStatus: "for_sale",
      askingPrice: 12000,
      estimatedValue: 15000,
      valueCurrency: "USD",
      acquisitionDate: "2021-06-01T00:00:00.000Z",
    });
  });

  it("omits value section for guests by default (owner mode)", () => {
    const sections = buildHorseHubSections(horse, guest);
    expect(sections.value).toBeUndefined();
  });

  it("includes value section for related viewers when value is relationship", () => {
    const relationshipValue = {
      ...horse,
      hubSections: { ...horse.hubSections, value: { mode: "relationship" } },
    };
    const sections = buildHorseHubSections(relationshipValue, related);
    expect(sections.value?.estimatedValue).toBe(15000);
  });

  it("omits proactive/co-owner sections for guests by default", () => {
    const sections = buildHorseHubSections(horse, guest);
    expect(sections.proactiveRepresentatives).toBeUndefined();
    expect(sections.coOwnerManagement).toBeUndefined();
  });

  it("includes proactive/co-owner sections for guests when public", () => {
    const publicTeam = {
      ...horse,
      hubSections: {
        ...horse.hubSections,
        proactiveRepresentatives: { mode: "public" },
        coOwnerManagement: { mode: "public" },
      },
    };
    const sections = buildHorseHubSections(publicTeam, guest);
    expect(sections.proactiveRepresentatives).toEqual({ members: [] });
    expect(sections.coOwnerManagement).toEqual({ members: [] });
  });
```

- [ ] **Step 4: Run the test to verify the new cases fail**

Run: `npm test -- tests/lib/services/horseHubSections.test.ts`
Expected: FAIL — the new value/proactive/co-owner assertions fail because `buildHorseHubSections` does not yet project these keys.

- [ ] **Step 5: Commit**

```bash
git add equus/tests/lib/services/horseHubSections.test.ts
git commit -m "test: failing cases for hub value + team section projections"
```

---

### Task 2: Hub DTO types + `buildHorseHubSections` projections

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

---

### Task 3: Async enrichment in `getHorseView`

**Files:**
- Modify: `equus/lib/services/horseService.ts`
- Modify: `equus/tests/lib/services/horseService.test.ts`

**Interfaces:**
- Consumes: `buildHorseHubSections` output (Task 2), `resolveUserDetails(userId)` (already in file), `horseDoc` fields.
- Produces: `sections.value.acquisitionSourceUser` resolved; `sections.proactiveRepresentatives.members` / `sections.coOwnerManagement.members` resolved with name+image (no email/phone). This enrichment must NOT require `audience.isOwnerTeam`.

- [ ] **Step 1: Write failing enrichment tests**

Append a new `describe("getHorseView hub section enrichment", ...)` block to `equus/tests/lib/services/horseService.test.ts`. Add these tests:

```ts
describe("getHorseView hub section enrichment", () => {
  it("resolves acquisition source and team members for guests when sections are public", async () => {
    const owner = await createUser("hub-enrich-owner@example.com");
    const coOwner = await createUser("hub-enrich-coowner@example.com");
    const responsible = await createUser("hub-enrich-responsible@example.com");
    const created = await horseService.createHorse(String(owner._id), {
      name: "Enriched",
      breed: "Lusitano",
      sex: "Gelding",
      countryOfBirth: "US",
      saleStatus: "for_sale",
      askingPrice: 12000,
      estimatedValue: 15000,
      valueCurrency: "USD",
    });

    await Horse.updateOne(
      { _id: created._id },
      {
        $set: {
          "hubSections.value.mode": "public",
          "hubSections.proactiveRepresentatives.mode": "public",
          "hubSections.coOwnerManagement.mode": "public",
        },
        $push: {
          coOwners: { userId: coOwner._id, ownershipPercentage: 25 },
          responsibles: { userId: responsible._id },
        },
      },
    );

    const view = await horseService.getHorseView(String(created._id));
    expect(view.viewerRole).toBe("guest");
    expect(view.horse.sections.value?.saleStatus).toBe("for_sale");
    expect(view.horse.sections.value?.acquisitionSourceUser).toMatchObject({
      userId: String(owner._id),
      name: expect.any(String),
    });
    expect(view.horse.sections.value?.acquisitionSourceUser?.email).toBeUndefined();
    expect(view.horse.sections.proactiveRepresentatives?.members).toEqual([
      {
        userId: String(responsible._id),
        name: expect.any(String),
        imageUrl: undefined,
      },
    ]);
    expect(view.horse.sections.coOwnerManagement?.members).toEqual([
      {
        userId: String(coOwner._id),
        name: expect.any(String),
        imageUrl: undefined,
      },
    ]);
  });

  it("omits value section for guests when value is owner-only", async () => {
    const owner = await createUser("hub-enrich-private@example.com");
    const created = await horseService.createHorse(String(owner._id), {
      name: "Private",
      breed: "Arabian",
      sex: "Mare",
      countryOfBirth: "US",
      estimatedValue: 5000,
    });

    const view = await horseService.getHorseView(String(created._id));
    expect(view.horse.sections.value).toBeUndefined();
    expect(view.horse.sections.proactiveRepresentatives).toBeUndefined();
    expect(view.horse.sections.coOwnerManagement).toBeUndefined();
  });
});
```

Note: the `createUser` helper and `Horse` import already exist in this test file. If `imageUrl` is undefined, the member object will have `imageUrl: undefined`; use `.toMatchObject` with `{ userId, name }` if exact equality trips on undefined keys.

- [ ] **Step 2: Run the new tests to verify they fail**

Run: `npm test -- tests/lib/services/horseService.test.ts`
Expected: FAIL — `sections.value.acquisitionSourceUser` is undefined, members are `[]`.

- [ ] **Step 3: Implement enrichment in `getHorseView`**

In `getHorseView` (after line 1228 `const sections = buildHorseHubSections(horseDoc, audience);` and before the `horseView` object literal), insert:

```ts
  // Hub-safe enrichment for value / proactive / co-owner sections (L2 + L1 only —
  // NOT gated by isOwnerTeam). No email or phone on Hub projections.
  if (sections.value) {
    const acquisitionSourceUserId = horseDoc.acquisitionSourceUserId
      ? String(horseDoc.acquisitionSourceUserId)
      : undefined;
    const acquisitionSourceDetails = acquisitionSourceUserId
      ? await resolveUserDetails(acquisitionSourceUserId)
      : await resolveUserDetails(String(horseDoc.mainOwnerUserId));
    sections.value.acquisitionSourceUser = {
      userId: acquisitionSourceUserId ?? String(horseDoc.mainOwnerUserId),
      name: acquisitionSourceDetails.label,
      imageUrl: acquisitionSourceDetails.imageUrl,
    };
  }

  if (sections.proactiveRepresentatives) {
    const rawResponsibles = (
      Array.isArray(horseDoc.responsibles) ? horseDoc.responsibles : []
    ).filter((r) => r.userId != null);
    const details = await Promise.all(
      rawResponsibles.map((r) => resolveUserDetails(String(r.userId))),
    );
    sections.proactiveRepresentatives.members = rawResponsibles.map((entry, i) => ({
      userId: String(entry.userId),
      name: details[i]?.label,
      imageUrl: details[i]?.imageUrl,
    }));
  }

  if (sections.coOwnerManagement) {
    const rawCoOwners = (
      Array.isArray(horseDoc.coOwners) ? horseDoc.coOwners : []
    ).filter((c) => c.userId != null);
    const details = await Promise.all(
      rawCoOwners.map((c) => resolveUserDetails(String(c.userId))),
    );
    sections.coOwnerManagement.members = rawCoOwners.map((entry, i) => ({
      userId: String(entry.userId),
      name: details[i]?.label,
      imageUrl: details[i]?.imageUrl,
    }));
  }
```

Note: `resolveUserDetails` returns `{ label, email, phone?, imageUrl? }`. We only project `label` as `name` + `imageUrl` on Hub.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- tests/lib/services/horseService.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add equus/lib/services/horseService.ts equus/tests/lib/services/horseService.test.ts
git commit -m "feat: enrich value and team hub sections in getHorseView"
```

---

### Task 4: Wire Hub About section

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

---

### Task 5: Rename Description → Value (files + Hub UI)

**Files:**
- Delete: `equus/components/horses/hub/horse-hub-description.tsx`
- Create: `equus/components/horses/hub/horse-hub-value.tsx`
- Modify: `equus/app/[locale]/horses/[horseId]/client.tsx`
- Modify: `equus/messages/en.json`
- Modify: `equus/messages/es.json`

**Interfaces:**
- Consumes: `horse.sections.value` (`HorseHubValueSection`), `horseSale` + `horseHub` i18n namespaces, `EntityChip`, `Section`.
- Produces: `HorseHubValue({ horse, className })` — returns `null` when `sections.value` absent; read-only display of Admin Horse Value fields.

- [ ] **Step 1: Create `horse-hub-value.tsx`**

Create `equus/components/horses/hub/horse-hub-value.tsx`:

```tsx
/**
 * HorseHubValue — Hub tab Value card. Read-only view of the Admin Horse Value
 * fields (sale status, asking price, estimated value, acquisition date,
 * acquisition source) when the Layer-2 `value` section allows it.
 *
 * Assembled by HubContent. Reads `horse.sections.value` from useHorseView.
 * No visibility popovers on Hub.
 */

"use client";

import { useLocale, useTranslations } from "next-intl";

import { EntityChip } from "@/components/shared/entity-chip.tsx";
import { Section } from "@/components/shared/section.tsx";
import type { AppLocale } from "@/i18n/resolveLocale.ts";
import type { HorseViewDto } from "@/lib/services/horseService.ts";
import { cn } from "@/lib/utils";

type HorseHubValueProps = {
  horse: HorseViewDto;
  className?: string;
};

export function HorseHubValue({ horse, className }: HorseHubValueProps) {
  const t = useTranslations("horseHub");
  const tSale = useTranslations("horseSale");
  const locale = useLocale() as AppLocale;
  const value = horse.sections.value;
  if (!value) return null;

  const saleStatusLabel = value.saleStatus
    ? tSale(`saleStatusOptions.${value.saleStatus}` as "saleStatusOptions.for_sale")
    : undefined;

  const acquisitionDateLabel = value.acquisitionDate
    ? new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(value.acquisitionDate))
    : undefined;

  const estimatedValueLabel =
    value.estimatedValue != null
      ? value.valueCurrency
        ? `${value.estimatedValue} ${value.valueCurrency}`
        : String(value.estimatedValue)
      : undefined;

  return (
    <Section title={t("value")} className={cn(className)}>
      <dl className="flex flex-col gap-3">
        {saleStatusLabel ? (
          <div className="flex flex-col gap-1">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {tSale("saleStatus")}
            </dt>
            <dd className="text-sm text-foreground">{saleStatusLabel}</dd>
          </div>
        ) : null}
        {value.saleStatus === "for_sale" && value.askingPrice != null ? (
          <div className="flex flex-col gap-1">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {tSale("askingPrice")}
            </dt>
            <dd className="text-sm text-foreground">{value.askingPrice}</dd>
          </div>
        ) : null}
        {estimatedValueLabel ? (
          <div className="flex flex-col gap-1">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {tSale("estimatedValue")}
            </dt>
            <dd className="text-sm text-foreground">{estimatedValueLabel}</dd>
          </div>
        ) : null}
        {acquisitionDateLabel ? (
          <div className="flex flex-col gap-1">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {tSale("acquisitionDate")}
            </dt>
            <dd className="text-sm text-foreground">{acquisitionDateLabel}</dd>
          </div>
        ) : null}
        {value.acquisitionSourceUser ? (
          <div className="flex flex-col gap-1">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {tSale("acquisitionSource")}
            </dt>
            <dd>
              <EntityChip
                entityType="user"
                entityId={value.acquisitionSourceUser.userId}
                title={value.acquisitionSourceUser.name ?? ""}
                subtitle={undefined}
                imageUrl={value.acquisitionSourceUser.imageUrl}
              />
            </dd>
          </div>
        ) : null}
      </dl>
    </Section>
  );
}
```

Note: the `tSale("saleStatusOptions.${...}")` cast to `"saleStatusOptions.for_sale"` works because the type is a union of the two valid status keys; cast to `"saleStatusOptions.for_sale"` (or `"saleStatusOptions.not_for_sale"`) is safe here.

- [ ] **Step 2: Delete `horse-hub-description.tsx`**

Delete `equus/components/horses/hub/horse-hub-description.tsx`.

- [ ] **Step 3: Update `client.tsx` imports and layout order**

In `equus/app/[locale]/horses/[horseId]/client.tsx`:

Change the import:
```tsx
import { HorseHubDescription } from "@/components/horses/hub/horse-hub-description.tsx";
```
to:
```tsx
import { HorseHubValue } from "@/components/horses/hub/horse-hub-value.tsx";
```

Change the left-column usage (currently `<HorseHubDescription />`):
```tsx
<HorseHubValue horse={horse} />
```

The left column order becomes: About → Disciplines → Value.

- [ ] **Step 4: Update i18n keys — rename `description` → `value` + add `valueEmpty`**

In `equus/messages/en.json`, inside `horseHub`:
- Rename `"description": "Description"` → `"value": "Value"`
- Add `"valueEmpty": "No value information yet."` (place it right after `"value"`)

In `equus/messages/es.json`, inside `horseHub`:
- Rename `"description": "Descripción"` → `"value": "Valor"`
- Add `"valueEmpty": "Aún no hay información de valor."` (place it right after `"value"`)

Keep `"aboutEmpty"` unchanged (used by About).

- [ ] **Step 5: Grep for stale `HorseHubDescription` / `horse-hub-description` references**

Run: `rg -n "HorseHubDescription|horse-hub-description" equus/app equus/components equus/documentation`
Expected: only doc references remain (Task 7 fixes those). No code references.

- [ ] **Step 6: Run lint**

Run: `npm run lint -- "app/[locale]/horses/[horseId]/client.tsx" "components/horses/hub/horse-hub-value.tsx"`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add "equus/app/[locale]/horses/[horseId]/client.tsx" equus/components/horses/hub/ equus/messages/en.json equus/messages/es.json
git commit -m "feat: rename hub description section to value with read-only display"
```

---

### Task 6: Visibility comment / SoT cleanup in code

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

---

### Task 7: Documentation

**Files:**
- Modify: `equus/documentation/horses.md`
- Modify: `equus/documentation/horseTabs.md`
- Modify: `equus/documentation/page-flow-blueprint.md`
- Modify: `equus/AGENTS.md`

**Interfaces:**
- Consumes: nothing new.
- Produces: docs that reflect the current three-control model and the full Hub-facing key set.

- [ ] **Step 1: Update `horses.md`**

In `equus/documentation/horses.md`:

1. In the `hubSections` code block (lines 136-148), remove the `(not Hub-facing)` annotations for `value`, `proactiveRepresentatives`, `coOwnerManagement`:
   - `value: { mode },                    // default owner — Admin Horse Value (not Hub-facing)` → `// default owner — Admin Horse Value + Hub`
   - `proactiveRepresentatives: { mode }, // default owner — Admin (not Hub-facing)` → `// default owner — Admin + Hub`
   - `coOwnerManagement: { mode },        // default owner — Admin (not Hub-facing)` → `// default owner — Admin + Hub`

2. Replace the "Hub-facing data" sentence (line 151) with:
   > Keys match section responsibility (1:1 with Profile/Admin/Media/Planning/Connect sections that have popovers). **Hub-facing cheap keys:** `identity` | `identification` | `pedigree` | `about` | `ownership` | `value` | `proactiveRepresentatives` | `coOwnerManagement` projected on `GET …/horses/:id`; **list keys** on `GET …/hub-social` (`gallery`, `planning`, `connections`). No per-section `entityIds`.

3. Update the `horse.sections` note under `GET /api/v1/horses/:id` (line 50) to include the new cheap keys.

4. In the Hub component tree (lines 84-97), change `HorseHubDescription  — biography text` to `HorseHubValue  — read-only sale/value fields` and `HorseHubAbout  — metadata / identity details list` to `HorseHubAbout  — profile description`.

5. In the **Three-control visibility model** area, add a sentence distinguishing tabs from Layer 1:
   > Tabs are a separate, role-based control (`viewerRole` → `allowedTabs`); Layer 1 only gates whether the horse opens at all (404). Layer 2 (`hubSections[key]`) gates which content blocks appear, independent of viewer role.

- [ ] **Step 2: Update `horseTabs.md`**

In `equus/documentation/horseTabs.md`:
1. In the Hub data-split list (line 61), expand the cheap sections list:
   `cheap horse.sections` (`identity`, `identification`, `pedigree`, `about`, `ownership`, `value`, `proactiveRepresentatives`, `coOwnerManagement`).
2. In the component tree (line 73), change `HorseHubDescription — biography text` to `HorseHubValue — read-only sale/value fields`.

- [ ] **Step 3: Update `page-flow-blueprint.md`**

In `equus/documentation/page-flow-blueprint.md` line 276, replace:
```
- **Hub-facing keys only on Hub** — Hub renders `identity` | `identification` | `pedigree` | `about` | `ownership` | `gallery` | `planning` | `connections`. Admin-only keys (`value` | `proactiveRepresentatives` | `coOwnerManagement`) persist via `HorseSectionVisibility` but are not Hub-facing.
```
with:
```
- **Hub-facing keys only on Hub** — Hub renders `identity` | `identification` | `pedigree` | `about` | `ownership` | `value` | `proactiveRepresentatives` | `coOwnerManagement` | `gallery` | `planning` | `connections`. All keys persist via `HorseSectionVisibility` and project to the Hub when Layer 2 allows.
```

- [ ] **Step 4: Update `AGENTS.md`**

In `equus/AGENTS.md` line 64, replace:
```
* **Horse visibility policy** — owner audience = ownership team (`userOwnsEntity`). Relationship audience = team + accepted `Relationship` + active host-entity workplace collaborators (stable/breeder/transport/ridingClub). Flow: Layer 1 (`profileVisibility`) → Layer 2 (`hubSections[key]`). Hub-facing keys: `identity` | `identification` | `pedigree` | `about` | `ownership` | `gallery` | `planning` | `connections`. Admin-only: `value` | `proactiveRepresentatives` | `coOwnerManagement`. Item modes `entities` map to `relationship`. Enforce in `lib/horses/horseVisibilityAccess.ts`; Hub uses filtered `GET …/hub`; media/planning lists enforce L1→L2 (owner team full list).
```
with:
```
* **Horse visibility policy** — owner audience = ownership team (`userOwnsEntity`). Relationship audience = team + accepted `Relationship` + active host-entity workplace collaborators (stable/breeder/transport/ridingClub). Three controls: tabs = `viewerRole` → `allowedTabs` (role-based); Layer 1 = `profileVisibility` (open/404); Layer 2 = `hubSections[key]` (Hub content blocks, independent of role). Hub-facing cheap keys: `identity` | `identification` | `pedigree` | `about` | `ownership` | `value` | `proactiveRepresentatives` | `coOwnerManagement`; list keys: `gallery` | `planning` | `connections` (`GET …/hub-social`). Item modes `entities` map to `relationship`. Enforce in `lib/horses/horseVisibilityAccess.ts`; Hub renders only `horse.sections` keys present; media/planning lists enforce L1→L2 (owner team full list).
```

- [ ] **Step 5: Grep for remaining stale doc references**

Run: `rg -n "not Hub-facing|Admin-only keys|HorseHubDescription|horse-hub-description|Hub description" equus/documentation equus/AGENTS.md`
Expected: no matches (or only legitimately unrelated "Admin-only" phrasing).

- [ ] **Step 6: Commit**

```bash
git add equus/documentation/horses.md equus/documentation/horseTabs.md equus/documentation/page-flow-blueprint.md equus/AGENTS.md
git commit -m "docs: reflect three-control visibility and hub-facing value/team sections"
```

---

### Task 8: Verify

**Files:**
- None (verification only).

- [ ] **Step 1: Run the full targeted test suite**

Run: `npm test -- tests/lib/services/horseHubSections.test.ts tests/lib/services/horseService.test.ts tests/lib/services/horseHubSocial.test.ts`
Expected: PASS.

- [ ] **Step 2: Run the whole test suite**

Run: `npm test`
Expected: PASS (no regressions).

- [ ] **Step 3: Grep for stale strings**

Run: `rg -n "HorseHubDescription|not Hub-facing|Hub description" equus`
Expected: no matches in code or docs.

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 5: Rational check of the user-facing scenarios**

- Guest + L1 public + `about`/`value` public → Hub shows About (description) + Value (read-only); guest has only the Hub tab.
- Guest + `value` default owner → no Value block on Hub.
- Owner + default `value` owner → owner sees Value block on Hub (owner passes L2).
- Owner + `value` public → guests see Value without Admin tab access.
- `proactiveRepresentatives` / `coOwnerManagement` public → data present in API only (no Hub UI yet; People zone later).

- [ ] **Step 6: Final commit (if any leftovers)**

Commit any remaining changes.

---

## Out of Scope

- Wiring Disciplines, Gallery, Pedigree, People Hub zones.
- Hub UI blocks dedicated to `proactiveRepresentatives` / `coOwnerManagement` (API only; People later).
- Changing default modes or Layer 1 semantics.
- Moving list sections into `buildHorseHubSections`.
- Refactoring Admin tab components or the owner-team flat fields.
