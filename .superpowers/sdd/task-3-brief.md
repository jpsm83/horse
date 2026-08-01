# Task 3: Async enrichment in `getHorseView`

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

In `getHorseView` (after `const sections = buildHorseHubSections(horseDoc, audience);` and before the `horseView` object literal), insert:

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
