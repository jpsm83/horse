# REST Boundary Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining REST-boundary gaps: `__tests__/` GET coverage for all converted entity views, delete unused `getPublicXCard` wrappers, and leave a human hub checklist.

**Architecture:** Do not change route handlers or view services except deleting dead card wrappers/mappers. Tests assert the existing `{ viewerRole, allowedTabs, <entity> }` envelope. User-linked profiles use `viewerRole: "owner"` and `isOwner`; entity-owned profiles use `main_owner` and `isMainOwner`.

**Tech Stack:** Vitest, mongodb-memory-server (`tests/setup.ts`), Next.js route handlers, existing `authService.register` / `createX` helpers.

## Global Constraints

- Start a new branch `rest-boundary-gaps` from current `main`. Do not mix other WIP (`.cursor/` stays uncommitted).
- Work from `equus/`.
- Do not restore layout `connectDb` / service prefetch.
- Do not change PATCH, list, search, navigation, or `GET /api/v1/users/me`.
- Do not copy stables’ `main_owner` / `admin` assertions onto coaches/riders/trainers/grooms/farriers/veterinaries.
- Do not migrate the whole `tests/` tree. Only move the two existing GET route tests and add new ones under `__tests__/`.
- Do not commit `.cursor/`.
- Focused Vitest path filters treat `[id]` as a glob — run by directory (`npx vitest run app/api/v1/coaches`) or `npm test`.
- Spec: `equus/docs/superpowers/specs/2026-08-13-rest-boundary-gaps-design.md`.

### Shared test address

Use this object in every new route test file:

```ts
const minimalAddress = {
  country: "Portugal",
  city: "Lisbon",
  street: "Main St",
  postCode: "1000",
};
```

---

### Task 1: Make `__tests__/` runnable

**Files:**
- Modify: `equus/vitest.config.ts` (include glob)
- Modify: `equus/docs/conventions/testing.md` (already drafted in the working tree — keep the `__tests__/` convention; do not add unrelated testing policy)

**Interfaces:**
- Consumes: existing `tests/**/*.test.ts` suites
- Produces: Vitest also runs `**/__tests__/**/*.test.ts`

- [ ] **Step 1: Update Vitest include**

In `equus/vitest.config.ts`:

```ts
include: ["tests/**/*.test.ts", "**/__tests__/**/*.test.ts"],
```

If `equus/docs/conventions/testing.md` already describes `__tests__/` next to the owning module (and `tests/` as harness only), keep that text. If HEAD still has the old “mirror under `tests/`” wording, replace the location section with: module tests live in `__tests__/` next to source; `tests/` is setup/helpers only; existing `tests/lib` files run until moved.

- [ ] **Step 2: Run the current suite**

```bash
npm test
```

Expected: PASS (same count as before this branch of work; new `__tests__/` files do not exist yet).

- [ ] **Step 3: Commit**

```bash
git add equus/vitest.config.ts equus/docs/conventions/testing.md
git commit -m "test: run colocated __tests__ folders in Vitest"
```

---

### Task 2: Relocate stables and breeders GET tests

**Files:**
- Create: `equus/app/api/v1/stables/[id]/__tests__/route.get.test.ts`
- Create: `equus/app/api/v1/breeders/[id]/__tests__/route.get.test.ts`
- Delete: `equus/tests/app/api/v1/stables/[id]/route.get.test.ts`
- Delete: `equus/tests/app/api/v1/breeders/[id]/route.get.test.ts`

**Interfaces:**
- Consumes: `GET` from `@/app/api/v1/stables/[id]/route.ts` and breeders equivalent
- Produces: same two owner + guest cases, now colocated

- [ ] **Step 1: Move the files**

Copy the current stables and breeders GET test file contents unchanged into the `__tests__/` paths above, then delete the old files. Do not change assertions.

- [ ] **Step 2: Run by directory**

```bash
npx vitest run app/api/v1/stables app/api/v1/breeders
```

Expected: PASS (4 tests).

- [ ] **Step 3: Commit**

```bash
git add equus/app/api/v1/stables/[id]/__tests__/route.get.test.ts equus/app/api/v1/breeders/[id]/__tests__/route.get.test.ts
git add -u equus/tests/app/api/v1/stables/[id]/route.get.test.ts equus/tests/app/api/v1/breeders/[id]/route.get.test.ts
git commit -m "test: colocate stable and breeder GET view tests"
```

---

### Task 3: GET view tests for user-linked profiles (coach, rider, trainer, groom)

**Files:**
- Create: `equus/app/api/v1/coaches/[id]/__tests__/route.get.test.ts`
- Create: `equus/app/api/v1/riders/[id]/__tests__/route.get.test.ts`
- Create: `equus/app/api/v1/trainers/[id]/__tests__/route.get.test.ts`
- Create: `equus/app/api/v1/grooms/[id]/__tests__/route.get.test.ts`

**Interfaces:**
- Consumes: `GET` handlers already calling `getXView`; `authService.register`; `createCoach` / `createRider` / `createTrainer` / `createGroom`
- Produces: owner `viewerRole: "owner"`, tabs `hub`+`profile` (no `admin`), guest `viewerRole: "guest"`

These GET handlers already exist and return views. TDD here means write the tests first; they should **pass** against current code (RED only if a file path/import is wrong). If a test fails on `viewerRole` or tabs, fix the **test** to match the service types — do not change production view derivation.

- [ ] **Step 1: Write the coach tests**

Create `equus/app/api/v1/coaches/[id]/__tests__/route.get.test.ts`:

```ts
/**
 * GET /api/v1/coaches/:id — role-aware coach view (viewerRole, allowedTabs, coach).
 */

import { describe, expect, it } from "vitest";
import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import * as authService from "@/lib/services/authService.ts";
import * as coachService from "@/lib/services/coachService.ts";
import { GET } from "@/app/api/v1/coaches/[id]/route.ts";

const minimalAddress = {
  country: "Portugal",
  city: "Lisbon",
  street: "Main St",
  postCode: "1000",
};

describe("GET /api/v1/coaches/:id", () => {
  it("returns the role-aware view shape for the owner", async () => {
    const owner = await authService.register({
      email: "coach-view-owner@example.com",
      password: "TestPass1!",
    });

    const coach = await coachService.createCoach(owner.user.id, {
      displayName: "View Coach",
      bio: "Owner view test",
      email: "view-coach@example.com",
      phoneNumber: "+351911111111",
      address: minimalAddress,
    });

    const request = new Request(`http://localhost:3000/api/v1/coaches/${coach._id}`, {
      headers: {
        Cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=${owner.accessToken}`,
      },
    });

    const response = await GET(request, {
      params: Promise.resolve({ id: String(coach._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      viewerRole: "owner",
      allowedTabs: expect.arrayContaining(["hub", "profile"]),
      coach: expect.objectContaining({
        displayName: "View Coach",
        isOwner: true,
      }),
    });
    expect(body.data.allowedTabs).not.toContain("admin");
  });

  it("returns a guest-scoped view for anonymous viewers of a public coach", async () => {
    const owner = await authService.register({
      email: "coach-view-guest-owner@example.com",
      password: "TestPass1!",
    });

    const coach = await coachService.createCoach(owner.user.id, {
      displayName: "Guest View Coach",
      bio: "Guest view test",
      email: "guest-coach@example.com",
      phoneNumber: "+351911111112",
      address: minimalAddress,
      isPublic: true,
    });

    const request = new Request(`http://localhost:3000/api/v1/coaches/${coach._id}`);
    const response = await GET(request, {
      params: Promise.resolve({ id: String(coach._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.viewerRole).toBe("guest");
    expect(body.data.coach.displayName).toBe("Guest View Coach");
    expect(body.data.coach.isOwner).toBeFalsy();
  });
});
```

- [ ] **Step 2: Write the rider tests**

Create `equus/app/api/v1/riders/[id]/__tests__/route.get.test.ts` with the same two cases:

- `createRider(owner.user.id, { displayName, email, bio: "Owner view test" })` (address/phone optional)
- emails: `rider-view-owner@example.com` / `rider-view-guest-owner@example.com`
- GET `@/app/api/v1/riders/[id]/route.ts`
- assert `body.data.viewerRole === "owner"`, `rider.displayName`, `rider.isOwner: true`, tabs contain `hub`+`profile`, not `admin`
- guest: `viewerRole: "guest"`, `isOwner` falsy

- [ ] **Step 3: Write the trainer tests**

Create `equus/app/api/v1/trainers/[id]/__tests__/route.get.test.ts`:

- `createTrainer` requires `displayName`, `bio`, `email`, `phoneNumber`, `address: minimalAddress`
- emails: `trainer-view-owner@example.com` / `trainer-view-guest-owner@example.com`
- assert `trainer.displayName`, `isOwner`, `viewerRole: "owner"`, no `admin`

- [ ] **Step 4: Write the groom tests**

Create `equus/app/api/v1/grooms/[id]/__tests__/route.get.test.ts`:

- `createGroom(owner.user.id, { displayName, email, bio: "Owner view test" })`
- emails: `groom-view-owner@example.com` / `groom-view-guest-owner@example.com`
- assert `groom.displayName`, `isOwner`, `viewerRole: "owner"`, no `admin`

- [ ] **Step 5: Run the four directories**

```bash
npx vitest run app/api/v1/coaches app/api/v1/riders app/api/v1/trainers app/api/v1/grooms
```

Expected: PASS (8 tests).

- [ ] **Step 6: Commit**

```bash
git add equus/app/api/v1/coaches/[id]/__tests__/route.get.test.ts equus/app/api/v1/riders/[id]/__tests__/route.get.test.ts equus/app/api/v1/trainers/[id]/__tests__/route.get.test.ts equus/app/api/v1/grooms/[id]/__tests__/route.get.test.ts
git commit -m "test: cover user-linked entity GET views"
```

---

### Task 4: GET view tests for farrier, veterinary, transport, riding club

**Files:**
- Create: `equus/app/api/v1/farriers/[id]/__tests__/route.get.test.ts`
- Create: `equus/app/api/v1/veterinaries/[id]/__tests__/route.get.test.ts`
- Create: `equus/app/api/v1/transports/[id]/__tests__/route.get.test.ts`
- Create: `equus/app/api/v1/riding-clubs/[id]/__tests__/route.get.test.ts`

**Interfaces:**
- Farrier/veterinary: `viewerRole: "owner"`, tabs `hub`+`profile`, flag `isOwner`
- Transport/riding club: `viewerRole: "main_owner"`, tabs include `hub`+`profile`+`admin`, flag `isMainOwner`

- [ ] **Step 1: Farrier**

Same two-case file as coach, but:

- `createFarrier(owner.user.id, { displayName: "View Farrier", email: "view-farrier@example.com" })`
- emails: `farrier-view-owner@example.com` / `farrier-view-guest-owner@example.com`
- assert `farrier.displayName`, `isOwner`, `viewerRole: "owner"`, no `admin`

- [ ] **Step 2: Veterinary**

- `createVeterinary(owner.user.id, { practiceName: "View Vet", description: "Owner view test", email: "view-vet@example.com", phoneNumber: "+351922222221", address: minimalAddress })`
- emails: `vet-view-owner@example.com` / `vet-view-guest-owner@example.com`
- assert `veterinary.practiceName`, `isOwner`, `viewerRole: "owner"`, no `admin`

- [ ] **Step 3: Transport**

Create `equus/app/api/v1/transports/[id]/__tests__/route.get.test.ts`:

```ts
/**
 * GET /api/v1/transports/:id — role-aware transport view.
 */

import { describe, expect, it } from "vitest";
import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import * as authService from "@/lib/services/authService.ts";
import * as transportService from "@/lib/services/transportService.ts";
import { GET } from "@/app/api/v1/transports/[id]/route.ts";

const minimalAddress = {
  country: "Portugal",
  city: "Lisbon",
  street: "Main St",
  postCode: "1000",
};

describe("GET /api/v1/transports/:id", () => {
  it("returns the role-aware view shape for the main owner", async () => {
    const owner = await authService.register({
      email: "transport-view-owner@example.com",
      password: "TestPass1!",
    });

    const transport = await transportService.createTransport(owner.user.id, {
      companyName: "View Transport",
      description: "Owner view test",
      email: "view-transport@example.com",
      phoneNumber: "+351933333331",
      address: minimalAddress,
    });

    const request = new Request(
      `http://localhost:3000/api/v1/transports/${transport._id}`,
      {
        headers: {
          Cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=${owner.accessToken}`,
        },
      },
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: String(transport._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      viewerRole: "main_owner",
      allowedTabs: expect.arrayContaining(["hub", "profile", "admin"]),
      transport: expect.objectContaining({
        companyName: "View Transport",
        isMainOwner: true,
      }),
    });
  });

  it("returns a guest-scoped view for anonymous viewers of a public transport", async () => {
    const owner = await authService.register({
      email: "transport-view-guest-owner@example.com",
      password: "TestPass1!",
    });

    const transport = await transportService.createTransport(owner.user.id, {
      companyName: "Guest View Transport",
      description: "Guest view test",
      email: "guest-transport@example.com",
      phoneNumber: "+351933333332",
      address: minimalAddress,
      isPublic: true,
    });

    const request = new Request(
      `http://localhost:3000/api/v1/transports/${transport._id}`,
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: String(transport._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.viewerRole).toBe("guest");
    expect(body.data.transport.companyName).toBe("Guest View Transport");
    expect(body.data.transport.isMainOwner).toBeFalsy();
  });
});
```

- [ ] **Step 4: Riding club**

Same as transport, but:

- `createRidingClub` with `clubName: "View Club"`, `description`, `email`, `phoneNumber`, `address`
- emails: `club-view-owner@example.com` / `club-view-guest-owner@example.com`
- GET `@/app/api/v1/riding-clubs/[id]/route.ts`
- assert `ridingClub.clubName`, `isMainOwner`, `viewerRole: "main_owner"`, tabs include `admin`

- [ ] **Step 5: Run**

```bash
npx vitest run app/api/v1/farriers app/api/v1/veterinaries app/api/v1/transports app/api/v1/riding-clubs
```

Expected: PASS (8 tests).

- [ ] **Step 6: Commit**

```bash
git add equus/app/api/v1/farriers/[id]/__tests__/route.get.test.ts equus/app/api/v1/veterinaries/[id]/__tests__/route.get.test.ts equus/app/api/v1/transports/[id]/__tests__/route.get.test.ts equus/app/api/v1/riding-clubs/[id]/__tests__/route.get.test.ts
git commit -m "test: cover remaining entity GET views"
```

---

### Task 5: Delete unused `getPublicXCard` and retarget service tests

**Files:**
- Modify: `equus/lib/services/{stable,breeder,coach,rider,trainer,groom,farrier,veterinary,transport,ridingClub}Service.ts` — remove `getPublicXCard` and unused `buildPublicXCard` / `PublicXCard` imports
- Delete mapper files only after grep shows no remaining imports: `equus/lib/{stables,breeders,coaches,riders,trainers,grooms,farriers,veterinaries,transports,riding-clubs}/buildPublic*Card.ts`
- Modify: `equus/tests/lib/services/{stable,breeder,coach,rider,trainer,groom,farrier,veterinary,transport,ridingClub}Service.test.ts` — call `getXView` instead
- Horse: modify `horseService.ts` / `horseService.test.ts` **only if** Step 1 finds no production callers of `getPublicHorseCard`

**Interfaces:**
- Consumes: existing `getXView(id, userId | null)`
- Produces: no exported `getPublicXCard` except horse if still used

- [ ] **Step 1: Audit horse**

From `equus/`:

```bash
rg "getPublicHorseCard" --glob "!**/horseService.ts" --glob "!**/*.test.ts"
```

If any production hit (route or another service), **leave horse alone**. If zero hits, delete `getPublicHorseCard` in the same commit as the others and retarget `tests/lib/services/horseService.test.ts` to `getHorseView` the same way as coaches below.

- [ ] **Step 2: Rewrite coach card tests onto `getCoachView`**

In `equus/tests/lib/services/coachService.test.ts`, replace the public-card example with:

```ts
  it("returns a guest view with business contact for a public coach", async () => {
    const owner = await createUser("coach-public@example.com");
    const created = await coachService.createCoach(String(owner._id), {
      displayName: "Public Coach",
      bio: "Open listing",
      email: "public@example.com",
      phoneNumber: "+351944444444",
      address: minimalAddress,
      disciplines: ["Dressage"],
      competitionLevels: ["national"],
    });

    const view = await coachService.getCoachView(String(created._id), null);

    expect(view.viewerRole).toBe("guest");
    expect(view.coach.displayName).toBe("Public Coach");
    expect(view.coach.email).toBe("public@example.com");
    expect(view.coach.phoneNumber).toBe("+351944444444");
    expect(view.coach.disciplines).toEqual(["Dressage"]);
    expect(view.coach.competitionLevels).toEqual(["national"]);
  });
```

Replace the relationship example’s card call with:

```ts
    const view = await coachService.getCoachView(
      String(coach._id),
      String(horseOwner._id),
    );

    expect(view.viewerRole).toBe("related");
    expect(view.coach.id).toBe(String(coach._id));
    expect(view.coach.isOwner).toBeFalsy();
```

If a file has a private-entity guest 404 against `getPublicXCard`, switch it to:

```ts
await expect(coachService.getCoachView(String(created._id), null)).rejects.toMatchObject({
  statusCode: 404,
});
```

View DTOs use `email` / `phoneNumber`, not `contact.email` / `contact.phone`.

- [ ] **Step 3: Repeat for the other nine service test files**

Same substitutions:

| File | Public call becomes | Relationship call becomes |
|------|---------------------|---------------------------|
| `stableService.test.ts` | `getStableView(id, null)` → `viewerRole: "guest"`, `stable.tradeName` | `getStableView(id, horseOwnerId)` → `viewerRole: "related"` |
| `breederService.test.ts` | `getBreederView` | `getBreederView` |
| `riderService.test.ts` | `getRiderView` | `getRiderView` → `related` |
| `trainerService.test.ts` | `getTrainerView` | `getTrainerView` → `related` |
| `groomService.test.ts` | `getGroomView` | `getGroomView` — groom roles are `owner \| public \| guest`; if a related relationship still grants access, assert the call succeeds and `isOwner` is falsy, not a non-existent `"related"` |
| `farrierService.test.ts` | `getFarrierView` | same as groom (no `related` in the role enum) |
| `veterinaryService.test.ts` | `getVeterinaryView` | `related` |
| `transportService.test.ts` | `getTransportView` | `related` |
| `ridingClubService.test.ts` | `getRidingClubView` | `related` |

Do not invent `contact` on the view DTO. Read `toXView` if a field name is unclear.

- [ ] **Step 4: Delete the wrappers**

Remove each `export async function getPublicXCard(...)` block and any now-unused imports (`buildPublicXCard`, `canViewXDiscovery` **only if** nothing else in that file uses them — `getXView` still uses discovery helpers).

- [ ] **Step 5: Delete unused mapper files**

```bash
rg "buildPublic(Stable|Breeder|Coach|Rider|Trainer|Groom|Farrier|Veterinary|Transport|RidingClub)Card" --glob "!**/buildPublic*.ts"
```

If a mapper has no remaining importers, delete that `buildPublic*Card.ts` file.

- [ ] **Step 6: Run service + route tests**

```bash
npx vitest run tests/lib/services/coachService.test.ts tests/lib/services/stableService.test.ts app/api/v1/coaches app/api/v1/stables
```

Expected: PASS. Then `npm test`. Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add equus/lib/services equus/lib/stables equus/lib/breeders equus/lib/coaches equus/lib/riders equus/lib/trainers equus/lib/grooms equus/lib/farriers equus/lib/veterinaries equus/lib/transports equus/lib/riding-clubs equus/tests/lib/services
git commit -m "refactor: remove unused public entity card wrappers"
```

Stage only files that actually changed. Include horse only if Step 1 deleted it.

---

### Task 6: Docs

**Files:**
- Modify: `equus/docs/engineering/entities/{stables,breeders,coaches,riders,trainers,grooms,farriers,veterinaries,transports,riding-clubs}.md` Implementation / public-card sections

**Interfaces:** none

- [ ] **Step 1: Drop mapper pointers that no longer exist**

Where Implementation lists `Public card mapper: lib/<x>/buildPublicXCard.ts` and that file was deleted, replace with: view DTO is `toXView` / `getXView` in `lib/services/<x>Service.ts`.

Keep nested field lists as a description of the entity object **inside** the view envelope. Do not say GET returns only a `PublicXCard`.

- [ ] **Step 2: Grep**

```bash
rg "getPublic(Stable|Breeder|Coach|Rider|Trainer|Groom|Farrier|Veterinary|Transport|RidingClub)Card" --glob "!docs/superpowers/**"
```

Expected: no hits in living code/docs (superpowers plans that describe the old bug may keep the name).

- [ ] **Step 3: Commit**

```bash
git add equus/docs/engineering/entities
git commit -m "docs: point entity GET at getXView after card removal"
```

---

### Task 7: Verification

**Files:** none unless a test failure forces a one-line fix (commit that separately).

- [ ] **Step 1: Architecture + new GET tests**

```bash
npx vitest run tests/architecture/ui-rest-boundary.test.ts app/api/v1/stables app/api/v1/breeders app/api/v1/coaches app/api/v1/riders app/api/v1/trainers app/api/v1/grooms app/api/v1/farriers app/api/v1/veterinaries app/api/v1/transports app/api/v1/riding-clubs
```

Expected: PASS. Empty allowlist still holds.

- [ ] **Step 2: Full suite**

```bash
npm test
```

Expected: all passing.

- [ ] **Step 3: Manual UI (human — do not claim these passed)**

1. Guest horse hub loads; Layer-1 deny still 404.
2. Owner horse tabs match `allowedTabs`.
3. Owner **stable** hub + profile tab switch.
4. Owner `/user/:id` hub shows sections.
5. Subscription tab shows the real plan, not Free.
6. Public `/users/:id` metadata does not leak private names.

---

## Spec coverage

| Spec item | Task |
|-----------|------|
| Vitest `__tests__/` include | 1 |
| Move stables/breeders GET tests | 2 |
| Eight missing GET route tests | 3, 4 |
| Delete unused `getPublicXCard` + mappers | 5 |
| Retarget service tests to `getXView` | 5 |
| Horse card only if unused | 5 Step 1 |
| Entity docs mapper lines | 6 |
| Full suite + human checklist | 7 |
| No PATCH / `/users/me` rewrite | Global constraints |
