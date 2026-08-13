# REST View Contract Finish Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the incomplete rest-client-boundary work so chrome-only layouts actually get role-aware views from REST, then commit and verify in small slices.

**Architecture:** Do not restore RSC layout prefetch. Keep UI as a REST client. `GET /api/v1/<entity>/[id]` must return `getXView` (horse pattern: `{ viewerRole, allowedTabs, <entity> }`). Owner user hub uses a new `GET /api/v1/users/:id/view` so `GET /api/v1/users/me` stays a profile card.

**Tech Stack:** Next.js route handlers, existing `getXView` / `getUserView` services, Vitest, TanStack Query hooks.

## Why this plan exists

The first plan (`2026-08-13-rest-client-boundary.md`) removed layout seeding. Final review found that most `useXView` hooks called GET endpoints that still returned **public cards**, so owner hubs/shells would hang on skeletons. A single fixer tried to patch all of that at once and was interrupted.

**Current branch:** `rest-client-boundary` (HEAD `9d2314e`). Most of the fix is already in the **uncommitted working tree**. This plan finishes, tests, and commits that WIP. Do not re-implement routes that already match the horse pattern.

## Global Constraints

- Work from `equus/`. Run tests with `npm test`.
- Do not restore RSC `connectDb` / `getXView` in layouts.
- Do not change `GET /api/v1/users/me` response shape (`toPublicUser` for the profile form).
- Do not migrate the old `tests/` tree into `__tests__/`.
- Do not commit `equus/docs/conventions/testing.md`, `equus/vitest.config.ts`, or `.cursor/` (unrelated WIP).
- Do not rewrite dated `docs/superpowers/` plans except adding this file.
- Keep each implementer to **one task** (one commit theme, one focused test command). Never batch C1+C2+I1+I2+I3 into a single subagent.
- Commit on `rest-client-boundary` after each task that changes code.

## Starting inventory (do not redo if already true)

Uncommitted WIP already appears to include:

| Area | Expected state |
|------|----------------|
| 10 entity GET routes | `readOptionalAuthFromRequest` + `getXView` + `ok(view)` |
| 10 `useXView` hooks | `parseApiResponse<XViewResponse>(response)` with no `.stable` unwrap |
| `app/api/v1/users/[id]/view/route.ts` | `getUserView` + `ok(view)` |
| `useUserView` | `GET /api/v1/users/:id/view` |
| `fetchApiJson` | try/catch → `null` |
| Horse `generateMetadata` | `sections.about.description` and `sections.identity.age` fallbacks |
| Tests | `tests/app/api/v1/stables/[id]/route.get.test.ts`, `breeders/[id]/route.get.test.ts`, `users/[id]/view/route.get.test.ts` |

If a file does not match, fix it in the matching task below.

---

### Task 1: Confirm and commit entity view GET + hooks

**Files (already modified; commit these only):**
- `equus/app/api/v1/stables/[id]/route.ts`
- `equus/app/api/v1/breeders/[id]/route.ts`
- `equus/app/api/v1/transports/[id]/route.ts`
- `equus/app/api/v1/riding-clubs/[id]/route.ts`
- `equus/app/api/v1/trainers/[id]/route.ts`
- `equus/app/api/v1/grooms/[id]/route.ts`
- `equus/app/api/v1/veterinaries/[id]/route.ts`
- `equus/app/api/v1/farriers/[id]/route.ts`
- `equus/app/api/v1/coaches/[id]/route.ts`
- `equus/app/api/v1/riders/[id]/route.ts`
- Matching `equus/hooks/queries/useStable.ts` (and useBreeder, useTransport, useRidingClub, useTrainer, useGroom, useVeterinary, useFarrier, useCoach, useRider)
- Create if missing / keep: `equus/tests/app/api/v1/stables/[id]/route.get.test.ts`
- Create if missing / keep: `equus/tests/app/api/v1/breeders/[id]/route.get.test.ts`

**Interfaces:**
- Consumes: `getStableView(id, userId | null): Promise<StableViewResponse>` where `StableViewResponse = { viewerRole, allowedTabs, stable }`
- Produces: `GET /api/v1/stables/:id` → `{ data: StableViewResponse }` (same for other entities)
- Hook: `fetchStableView` returns `StableViewResponse`, not `data.stable`

- [ ] **Step 1: Audit one route against horse**

Open `equus/app/api/v1/horses/[id]/route.ts` GET and `equus/app/api/v1/stables/[id]/route.ts` GET. Stable GET must look like:

```ts
const requester = await readOptionalAuthFromRequest(request);
const view = await stableService.getStableView(id, requester.id ?? null);
return ok(view);
```

PATCH must still call `updateStableProfile` and `ok({ stable })`.

- [ ] **Step 2: Audit the other nine GET handlers**

Each must call the matching `getXView` (not `getPublicXCard`) and `ok(view)`. If any still returns `ok({ stable })` / `ok({ breeder })` as a public card, change it to the horse pattern.

- [ ] **Step 3: Audit the ten view hooks**

`fetchXView` must be:

```ts
const response = await fetchWithAuth(`/api/v1/stables/${encodeURIComponent(stableId)}`);
return parseApiResponse<StableViewResponse>(response);
```

Do **not** unwrap `.stable` / `.breeder`. Leave create-mutation unwraps (`parseApiResponse<{ stable: { id: string } }>`) alone.

- [ ] **Step 4: Ensure the two route tests exist**

`equus/tests/app/api/v1/stables/[id]/route.get.test.ts` must assert owner body:

```ts
expect(body.data).toMatchObject({
  viewerRole: "main_owner",
  allowedTabs: expect.arrayContaining(["hub", "profile", "admin"]),
  stable: expect.objectContaining({
    tradeName: "View Stable",
    isMainOwner: true,
  }),
});
```

And a guest case with `viewerRole: "guest"` and `isMainOwner` falsy.

`equus/tests/app/api/v1/breeders/[id]/route.get.test.ts` must assert the same shape with `breeder` instead of `stable` (inspect `BreederViewResponse` / createBreeder fields if names differ).

Do not add eight more entity route tests in this task.

- [ ] **Step 5: Run focused tests**

From `equus/`:

```bash
npm test -- tests/app/api/v1/stables/[id]/route.get.test.ts tests/app/api/v1/breeders/[id]/route.get.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add equus/app/api/v1/stables/[id]/route.ts equus/app/api/v1/breeders/[id]/route.ts equus/app/api/v1/transports/[id]/route.ts equus/app/api/v1/riding-clubs/[id]/route.ts equus/app/api/v1/trainers/[id]/route.ts equus/app/api/v1/grooms/[id]/route.ts equus/app/api/v1/veterinaries/[id]/route.ts equus/app/api/v1/farriers/[id]/route.ts equus/app/api/v1/coaches/[id]/route.ts equus/app/api/v1/riders/[id]/route.ts equus/hooks/queries/useStable.ts equus/hooks/queries/useBreeder.ts equus/hooks/queries/useTransport.ts equus/hooks/queries/useRidingClub.ts equus/hooks/queries/useTrainer.ts equus/hooks/queries/useGroom.ts equus/hooks/queries/useVeterinary.ts equus/hooks/queries/useFarrier.ts equus/hooks/queries/useCoach.ts equus/hooks/queries/useRider.ts equus/tests/app/api/v1/stables/[id]/route.get.test.ts equus/tests/app/api/v1/breeders/[id]/route.get.test.ts
git commit -m "fix: return role-aware views from entity GET routes"
```

---

### Task 2: Confirm and commit owner user view REST

**Files:**
- `equus/app/api/v1/users/[id]/view/route.ts` (untracked — add)
- `equus/tests/app/api/v1/users/[id]/view/route.get.test.ts` (untracked — add)
- `equus/hooks/queries/useCurrentUser.ts`
- `equus/lib/services/userService.ts` (comment only, if still mentioning layout prefetch)
- `equus/components/user/subscription/user-subscription-plan-section.tsx` (comment pointing at `/view`, if already updated)

**Interfaces:**
- Consumes: `getUserView(userId, viewerUserId): Promise<UserViewDto>`
- Produces: `GET /api/v1/users/:id/view` → `{ data: UserViewDto }`
- `useUserView` fetches that URL; `useUserProfile` still uses `GET /api/v1/users/me`

- [ ] **Step 1: Confirm the view route**

File must:

```ts
const parsedId = userIdParamSchema.safeParse(id);
if (!parsedId.success) throw new ApiError(400, "Invalid user id", "VALIDATION_ERROR");
const requester = await readOptionalAuthFromRequest(request);
const view = await userService.getUserView(parsedId.data, requester.id ?? null);
return ok(view);
```

Do not alter `equus/app/api/v1/users/me/route.ts`.

- [ ] **Step 2: Confirm the hook**

```ts
async function fetchUserView(userId: string): Promise<UserViewDto> {
  const response = await fetchWithAuth(`/api/v1/users/${encodeURIComponent(userId)}/view`);
  return parseApiResponse<UserViewDto>(response);
}
```

`fetchUserProfile` must still hit `/api/v1/users/me`.

- [ ] **Step 3: Confirm tests**

Owner case: `body.data.isOwner === true` and `body.data.user.sections` defined.
Anonymous case: owner-only `sections` omitted / not the self hub.

- [ ] **Step 4: Run tests**

```bash
npm test -- tests/app/api/v1/users/[id]/view/route.get.test.ts tests/app/api/v1/users/me/route.delete.test.ts
```

Expected: PASS (`me` delete test still works; GET me shape unchanged).

- [ ] **Step 5: Commit**

```bash
git add equus/app/api/v1/users/[id]/view/route.ts equus/tests/app/api/v1/users/[id]/view/route.get.test.ts equus/hooks/queries/useCurrentUser.ts equus/lib/services/userService.ts equus/components/user/subscription/user-subscription-plan-section.tsx
git commit -m "fix: load owner user view via GET /api/v1/users/:id/view"
```

If `userService.ts` / subscription section have no remaining related edits, omit them from `git add`.

---

### Task 3: Confirm fetchApiJson + horse metadata

**Files:**
- `equus/lib/seo/fetchApiJson.ts`
- `equus/lib/seo/__tests__/fetchApiJson.test.ts`
- `equus/app/[locale]/horses/[horseId]/page.tsx`

- [ ] **Step 1: Confirm try/catch**

`fetchApiJson` must catch fetch/json failures and return `null`.

- [ ] **Step 2: Confirm rejection test**

```ts
it("returns null when fetch rejects", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network error"); }));
  const { fetchApiJson } = await import("@/lib/seo/fetchApiJson.ts");
  await expect(fetchApiJson("/api/v1/horses/abc")).resolves.toBeNull();
});
```

- [ ] **Step 3: Confirm guest metadata fallbacks**

In horse `generateMetadata`:

```ts
age: horse.sections?.identity?.age ?? (horse.dateOfBirth ? /* year delta */ : undefined),
description: horse.sections?.about?.description ?? horse.description,
```

Do not invent `location`.

- [ ] **Step 4: Run tests**

```bash
npm test -- lib/seo/__tests__/fetchApiJson.test.ts
```

Expected: PASS (including rejection case).

- [ ] **Step 5: Commit**

```bash
git add equus/lib/seo/fetchApiJson.ts equus/lib/seo/__tests__/fetchApiJson.test.ts equus/app/[locale]/horses/[horseId]/page.tsx
git commit -m "fix: harden fetchApiJson and guest horse metadata"
```

---

### Task 4: Finish leftover prefetch comments

**Files (from current grep + remaining WIP):**
- `equus/app/[locale]/user/[userId]/preferences/client.tsx` — still says HydrationBoundary / layout RSC
- Other already-modified comment files in `git status` (entity `client.tsx`, `*-page-shell.tsx`, `docs/engineering/entities/horses.md`, `users.md`, `component-resilience.md`, `page-flow-blueprint.md`, `lib/api/queryKeys.ts`)

- [ ] **Step 1: Grep living files**

From `equus/`:

```bash
rg "pre-seeded|layout-seeded|layout\\.tsx RSC|HydrationBoundary cache|no extra fetch when layout" --glob "!docs/superpowers/**"
```

- [ ] **Step 2: Replace leftovers**

`preferences/client.tsx` comment becomes:

```ts
  // useUserView → GET /api/v1/users/:id/view
```

Any remaining “layout seeds cache / no extra fetch” comments in shells/clients/docs become “`useXView` → `GET /api/v1/...`”. Do not touch `docs/superpowers/**`.

- [ ] **Step 3: Re-grep**

Same rg command. Expected: no hits outside `docs/superpowers/`.

- [ ] **Step 4: Commit**

```bash
git add equus/app/[locale]/user/[userId]/preferences/client.tsx equus/app/[locale]/*/client.tsx equus/components/**/*-page-shell.tsx equus/docs/engineering/entities/horses.md equus/docs/engineering/users.md equus/docs/engineering/component-resilience.md equus/docs/engineering/page-flow-blueprint.md equus/lib/api/queryKeys.ts
git commit -m "docs: remove leftover layout-prefetch comments"
```

Stage only files that actually changed for this comment sweep. Do not add `testing.md` or `vitest.config.ts`.

---

### Task 5: Verification

**Files:** none unless a test failure forces a one-line fix (then commit that fix separately).

- [ ] **Step 1: Architecture + new route tests**

```bash
npm test -- tests/architecture/ui-rest-boundary.test.ts tests/app/api/v1/stables/[id]/route.get.test.ts tests/app/api/v1/breeders/[id]/route.get.test.ts tests/app/api/v1/users/[id]/view/route.get.test.ts lib/seo/__tests__/fetchApiJson.test.ts
```

Expected: PASS, empty allowlist.

- [ ] **Step 2: Full suite**

```bash
npm test
```

Expected: all passing. If a failure is from this branch, fix in a tiny follow-up commit. If pre-existing, report DONE_WITH_CONCERNS with names.

- [ ] **Step 3: Manual UI (human)**

1. Guest horse hub loads; Layer-1 deny still 404.
2. Owner horse tabs match `allowedTabs`.
3. Owner **stable** hub + profile tab switch (this was the C1 break).
4. Owner `/user/:id` hub shows sections (this was the C2 break).
5. Subscription tab shows the real plan, not a forced Free fallback.
6. Public `/users/:id` still uses hub API; metadata does not leak private names.

Do not claim these browser flows passed unless someone ran them.

---

## Spec coverage

| Finding from final review | Task |
|---------------------------|------|
| C1 entity GET returns public card | 1 |
| C2 useUserView hits `/users/me` | 2 |
| I1 guest horse metadata | 3 |
| I2 fetchApiJson throws | 3 |
| I3 stale prefetch comments | 4 |
| Tests + manual | 5 |
| Do not restore layout seed | Global constraints |
