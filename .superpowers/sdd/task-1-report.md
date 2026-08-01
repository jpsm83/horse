# Task 1 Report: Failing API tests (TDD RED)

## What I implemented
Transcribed the task brief verbatim into `equus/tests/lib/services/horseHubSections.test.ts`:

1. **Step 1** — Extended the shared `horse` fixture with `responsibles`, commercial fields (`saleStatus: "for_sale"`, `askingPrice: 12000`, `estimatedValue: 15000`, `valueCurrency: "USD"`, `acquisitionDate: new Date("2021-06-01T00:00:00.000Z")`), and the three new `hubSections` keys (`value`, `proactiveRepresentatives`, `coOwnerManagement`, all `{ mode: "owner" }`).
2. **Step 2** — Replaced the owner-team test's 5-key expectation with the 8-key sorted expectation plus value/team assertions.
3. **Step 3** — Appended 5 new test cases after the bloodlineNotes test: public-value-for-guests, omit-value-for-guests, value-for-related, omit-team-for-guests, public-team-for-guests.

No implementation files touched.

## What I tested and test results
Command (from `equus/`): `npm test -- tests/lib/services/horseHubSections.test.ts`

Result: **17 tests | 4 failed | 13 passed**. All 4 failures are exactly the expected missing projections — no syntax errors, no broken fixtures. The negative "omit" cases pass (they assert `undefined`, matching current behavior), confirming the fixtures are valid.

## TDD Evidence (RED)
```
 FAIL  tests/lib/services/horseHubSections.test.ts > buildHorseHubSections > includes all profile sections for owner team
AssertionError: expected [ 'about', 'identification', …(3) ] to deeply equal [ 'about', 'coOwnerManagement', …(6) ]
- Expected / + Received:
  ["about", -"coOwnerManagement", "identification", "identity", "ownership", "pedigree", -"proactiveRepresentatives", -"value"]

 FAIL  tests/lib/services/horseHubSections.test.ts > buildHorseHubSections > includes value section for guests when value is public
AssertionError: expected undefined to deeply equal { saleStatus: 'for_sale', …(4) }

 FAIL  tests/lib/services/horseHubSections.test.ts > buildHorseHubSections > includes value section for related viewers when value is relationship
AssertionError: expected undefined to be 15000

 FAIL  tests/lib/services/horseHubSections.test.ts > buildHorseHubSections > includes proactive/co-owner sections for guests when public
AssertionError: expected undefined to deeply equal { members: [] }

Test Files  1 failed (1)
     Tests  4 failed | 13 passed (17)
```

Failures are all "expected undefined to..." / "expected array to equal..." for the new keys — matching the task expectation. `buildHorseHubSections` (lib/services/horseService.ts:969) currently projects only identity/identification/pedigree/about/ownership.

## Files changed
- `equus/tests/lib/services/horseHubSections.test.ts` (+67 lines) — the only file in the commit.

## Self-review findings
- All values transcribed exactly: 8-key array order, `saleStatus: "for_sale"`, `askingPrice: 12000`, `estimatedValue: 15000`, `valueCurrency: "USD"`, `acquisitionDate: "2021-06-01T00:00:00.000Z"`, `members: []`, `coOwnerCount: 1 / soleOwner: false` preserved.
- New cases FAIL for the right reason (missing projections, not syntax/fixtures); negative cases pass.
- No implementation files modified (verified via `git status` before commit).

## Issues or concerns
- None. The owner-team test failure and the three projection failures are all expected RED-state.
