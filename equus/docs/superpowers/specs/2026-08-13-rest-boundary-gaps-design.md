# REST Boundary Gaps — Design

Date: 2026-08-13  
Status: approved for planning  
Related: `docs/superpowers/plans/2026-08-13-rest-client-boundary.md`, `docs/superpowers/plans/2026-08-13-rest-view-contract.md`

## Problem

The REST client boundary is implemented: layouts are chrome-only, entity `GET /:id` returns `getXView`, owner hub uses `GET /users/:id/view`. Three gaps remain:

1. Only stables and breeders have dedicated GET-view route tests. Eight other converted entities do not.
2. `getPublicXCard` service wrappers are unused from routes (only their own unit tests call them). That freezes the old card contract.
3. Owner/guest hubs were never clicked in a browser.

## Goal

Close those gaps only. Do not rewrite PATCH, list, search, navigation, relationship routes, or `GET /users/me`.

## Contract under test

`GET /api/v1/<entity>/:id` returns `{ data: { viewerRole, allowedTabs, <entity> } }`.

| Entity | Owner `viewerRole` | Owner tabs | Name field on view | Owner flag |
|--------|--------------------|------------|--------------------|------------|
| stables, breeders, transports, riding-clubs | `main_owner` | `hub`, `profile`, `admin` | `tradeName` / `operationName` / `companyName` / `clubName` | `isMainOwner` |
| coaches, riders, trainers, grooms, farriers, veterinaries | `owner` | `hub`, `profile` | `displayName` or `practiceName` (veterinary) | `isOwner` |

Guest on a public entity: `viewerRole: "guest"`, owner flag falsy. Private entity without access: 404 (covered in service tests via `getXView`, not duplicated on every route).

For stables, breeders, transports, and riding clubs, accepted horse relationships and active workplace collaborations yield `viewerRole: "related"`. Related viewers receive the `profile` tab but not the owner-only `admin` tab.

## Tests

- New GET tests live next to the route: `app/api/v1/<entity>/[id]/__tests__/route.get.test.ts`.
- Committed Vitest include is only `tests/**/*.test.ts`. This work **must** add `**/__tests__/**/*.test.ts` or the new files will not run.
- Move existing stables/breeders GET tests into that `__tests__/` layout.
- Do not migrate the whole `tests/lib/services/` tree. When retargeting card tests, edit those files in place.
- Do not copy stables’ `main_owner` / `admin` assertions onto user-linked profiles.

Each new route file: owner 200 + guest 200, same shape as `tests/app/api/v1/stables/[id]/route.get.test.ts`, with the table above.

Focused Vitest filters treat `[id]` as a glob. Run by directory (`npx vitest run app/api/v1/coaches`) or `npm test`.

## Dead `getPublicXCard`

Production callers of `getPublicStableCard` (and the nine siblings) are none. Each only returns `buildPublicXCard(...)`. After deleting the wrappers, grep `buildPublicXCard`; if the mapper file is then unused, delete it too. Keep `toXView` / list mappers.

`getPublicHorseCard`: delete only if a production-caller grep (routes + services other than its definition) is empty. Do not delete it if list/search still uses it.

Retarget service tests that called `getPublicXCard` to `getXView(id, userId | null)`:

- Public guest → `viewerRole: "guest"` and the view DTO fields (`email` / `phoneNumber`, not nested `contact`).
- Private + no access → reject 404.
- Accepted relationship → `viewerRole: "related"` (or the entity’s equivalent).

## Docs

Entity docs already describe the GET view envelope. After mapper deletion, replace “Public card mapper: `lib/<x>/buildPublicXCard.ts`” with the view function in the service. Nested field lists may stay as a description of the entity payload inside the view.

## Manual QA (human)

Agent does not mark these passed:

1. Guest horse hub; Layer-1 deny still 404.
2. Owner horse tabs match `allowedTabs`.
3. Owner stable hub + profile tab switch.
4. Owner `/user/:id` hub shows sections.
5. Subscription shows the real plan, not Free.
6. Public `/users/:id` metadata does not leak private names.

## Out of scope

PATCH/list/search/navigation/`GET /users/me`, Playwright, architecture-scanner extras, migrating all of `tests/` into `__tests__/`, restoring layout prefetch.
