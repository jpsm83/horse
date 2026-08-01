# Task 1: Failing API tests (TDD)

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
