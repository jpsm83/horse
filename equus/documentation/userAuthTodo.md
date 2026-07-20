# User & authentication readiness — execution plan

Living checklist derived from [`../../documentation/userModule.md`](../../documentation/userModule.md) (2026-06-30), cross-checked against `equus/` implementation.

**Scope:** `User` model, credentials/OAuth auth, personal profile, privacy preferences, and user-centric APIs/UI.  
**Out of scope here:** horse/stable/vet modules, entity discover directories, create flows for other roles, chat/DM product, activity assignment — those ship with their modules.

**Legend:** `[ ]` not started · `[~]` partial · `[x]` done

---

## Summary

| Area | Doc status | Actual readiness |
|------|------------|------------------|
| §1 Identity & auth | All `done` | **Strong** — inactive users blocked on refresh and protected routes |
| §2 Personal profile | All `done` | **Strong** — profile edit + account deactivation on `/profile` |
| §3 Privacy | U-PRIV-05 `done` | **Strong** — public read API + entity-linked profile page shipped |
| §4 Ownership | U-ROLE-06/07 `planned` | **Gap** — `coOwners[]` on models (done); `OwnershipTransfer` collection + inbox not built |
| §6–7 Inboxes | APIs `done` | **Done** — `/relationships`, `/workplaces`, and `/ownership-transfers` UI shipped |

**Verdict:** Auth, personal profile (including account deactivation), and public user profile (U-PRIV-05) are usable today. To call the **user slice production-ready**, finish **`OwnershipTransfer`** (U-ROLE-06/07) when sale/partnership flows are in MVP scope, and any remaining discovery lifecycle gaps beyond UA-29 baseline.

**Data lifecycle:** [`../../documentation/dataLifecycle.md`](../../documentation/dataLifecycle.md) — no hard deletes; tombstone fields on models; status enums on links.

**Ownership spec:** [`../../documentation/ownershipTransfer.md`](../../documentation/ownershipTransfer.md) — `transfer_main`, `remove_co_owner`, `promote_co_owner`; entity-owned only (horse + host businesses); never services.

---

## Already implemented (no action)

### §1 Identity & authentication (U-ID-01 … U-ID-08)

- Credentials register/login, Google OAuth + REST session bridge, JWT refresh, logout
- Email verification + resend, password reset (anonymous + authenticated request from profile)
- Browse-first signup (no roles on create), referral link on signup (`ref` for relationship invites)
- Session probe (`tryFetchCurrentUser`), token refresh in `apiFetch`, session-expired redirect
- Docs: [`auth.md`](auth.md)

### §2 Personal profile (U-PROF-01 … U-PROF-06)

- `GET` / `PATCH` / multipart avatar on `/api/v1/users/me`
- Geocoded address, `profileComplete` computation, preferred language + `NEXT_LOCALE` sync
- Full `/profile` UI (skeleton, `LoadingOverlay`, incomplete-profile alert on that page)
- Password set/change via email reset from profile form

### §3 Privacy — partial (U-PRIV-01 … U-PRIV-04)

- `profileVisibility` + `allowDirectMessagesFrom` stored and editable on `/profile`
- `lib/privacy/userVisibility.ts` helpers + tests
- Enforcement on **horse owner contact** (`resolveHorsePublicContact`) and **workplace roster labels**
- Entity-only discovery policy locked (no user search / no `searchable` on User)

### §6–7 User inboxes (API + UI)

- `GET /api/v1/users/me/relationships`, accept/decline — UI at `/relationships`
- `GET /api/v1/users/me/workplaces`, workplace invitation accept/decline — UI at `/workplaces`
- `GET /api/v1/users/me/navigation` + header "My own" links

### User model foundations

- One `User` per email, `*ProfileId` for user-linked roles, entity ownership via `mainOwnerUserId` / `coOwners[]` on entities (not on User)
- `isActive`, `refreshSessionVersion`, `emailVerified`, `authProvider`, preferences embed
- `DELETE /api/v1/users/me` → `softDelete` (`isActive: false`) — **API exists, not documented in userModule**

---

## Gaps — execute in order

### P0 — Data lifecycle foundation (integrity)

| ID | Task | Why | Touch |
|----|------|-----|-------|
| UA-00 | `[x]` **Document data lifecycle policy** — no hard deletes; tombstone vs status lifecycle | Team rule for referential integrity across modules | `../../documentation/dataLifecycle.md`, `./dataLifecycle.md`, `../../documentation/userModule.md` §principles, `../AGENTS.md` |
| UA-27 | `[x]` **`deactivationAuditFields` on top-level models** — `isActive`, `deactivatedAt`, `deactivatedByUserId`, `deactivationReason` | Consistent schema for "removed" without `deleteOne` | `../models/sharedSchemas/deactivationAudit.ts`, all collection models |
| UA-28 | `[x]` **`softDelete` audit fields** — set `deactivatedAt`, `deactivatedByUserId` (self) on account deactivate | Traceability for support and compliance | `../lib/services/userService.ts`, tests |
| UA-29 | `[x]` **Filter `isActive` in discovery and operator lists** — horses, entities, role profiles; exclude deactivated users from public read | Fields exist on models; services do not filter yet | `horseService`, `discoverService`, entity `*Service` list paths |
| UA-30 | `[x]` **Shared `deactivateDocument` helper** — set tombstone fields consistently | Avoid per-service drift | `../lib/lifecycle/deactivateDocument.ts` |
| UA-31 | `[x]` **PII anonymization pipeline** — `anonymizeUserPii` scrubs PII on inactive `User`; keeps `userId` stub | Soft delete ≠ regulatory erasure | `../lib/lifecycle/anonymizeUserPii.ts`, `userService`, `piiAnonymization.md` |

**Lifecycle collections** (`Relationship`, `WorkplaceRelationship`) use **status + `endedAt`** — documented; no `isActive` on those models.

### P0 — Auth & account lifecycle (security / correctness)

| ID | Task | Why | Touch |
|----|------|-----|-------|
| UA-01 | `[x]` **Harden `softDelete`** — on deactivate: `$inc: { refreshSessionVersion: 1 }`, set `isActive: false` | Deactivated users can still use access JWT until expiry; refresh only fails on next `establishSession` if `isActive` checked — access tokens are not re-validated against DB today | `../lib/services/userService.ts` |
| UA-02 | `[x]` **`DELETE /api/v1/users/me` clears session** — clear auth cookies on response (same as logout) | Client may keep calling API with stale cookies after delete | `../app/api/v1/users/me/route.ts`, `authService.logout` |
| UA-03 | `[x]` **Reject inactive users on refresh** (verify `establishSession` path — already fails via `buildAuthUserSessionFromUserId`; add test) | Confirm regression coverage | `../tests/lib/services/userService.test.ts`, `authService.test.ts` |
| UA-04 | `[x]` **Live `isActive` check on protected routes** — `requireAuthFromRequest` verifies JWT then checks `User.isActive` in DB | Deactivated users could call APIs with a still-valid access token until expiry | `../lib/auth/requireAuth.ts`, `../lib/auth/session.ts` |

### P1 — User profile surface (U-PRIV-05)

| ID | Task | Why | Touch |
|----|------|-----|-------|
| UA-05 | `[x]` **`getPublicUserForRequester` service** — load User by id; resolve requester audience (`public` / `platform` / `relationship` / `collaboration`) via existing relationship + workplace queries; map with `toPublicUserIdentity` + safe fields (avatar, bio if allowed) | Core of entity-linked "view owner" without people search | `../lib/privacy/userPublicProfile.ts` |
| UA-06 | `[x]` **`GET /api/v1/users/:id`** — auth optional; returns filtered public card; 404 when user missing or `profileVisibility` blocks audience | API contract for mobile + web | `../app/api/v1/users/[id]/route.ts`, `../lib/validations/user.ts` |
| UA-07 | `[x]` **Web page `/users/[userId]`** (locale-prefixed) — skeleton, entity-style card, no index/search | U-PRIV-05 UI; entry from future entity owner links | `../app/[locale]/users/[userId]/`, `../components/users/` |
| UA-08 | `[x]` **Tests** — visibility matrix for public read (anonymous vs signed-in vs relationship) | Matches U-PRIV-01 matrix | `../tests/lib/privacy/userPublicProfile.visibilityMatrix.test.ts` |
| UA-09 | `[x]` **Update userModule** — mark U-PRIV-05 `in progress` → `done`; document `GET /users/:id` | Keep spec in sync | `../../documentation/userModule.md` |

**Note:** `allowDirectMessagesFrom` (U-PRIV-03) stays **stored only** until the chat module exists — do not block user/auth readiness on DM enforcement.

### P2 — Account management UX

| ID | Task | Why | Touch |
|----|------|-----|-------|
| UA-10 | `[x]` **Account deactivation UI on `/profile`** — confirm dialog, `DELETE /api/v1/users/me`, logout redirect | API exists; no UI | `../components/profile/`, `../lib/api/authClient.ts` |
| UA-11 | `[x]` **Document account deactivation** — U-PROF-07 in userModule; profile.md + dataLifecycle.md | Shipped with UA-10 UI | `../../documentation/userModule.md`, `./profile.md` |
| UA-12 | `[x]` **Global incomplete-profile banner** (optional) — `AppShell` or post-login nudge when `profileComplete === false` | Today banner only on `/profile`; productFlows may expect onboarding before create-horse | `../components/layout/incomplete-profile-banner.tsx`, `../lib/profile/incompleteProfileBanner.ts` |

### P3 — Entity ownership (`OwnershipTransfer`) — U-ROLE-06, U-ROLE-07

Product rules: [`../../documentation/ownershipTransfer.md`](../../documentation/ownershipTransfer.md). API sketch: [`./ownershipTransfer.md`](./ownershipTransfer.md).

`coOwners[]` embed exists on Horse, Stable, RidingClub, Breeder, Transport. **Pending and consent logic must not live on the entity** — use a dedicated collection modeled like `Relationship`.

| ID | Task | Why | Touch |
|----|------|-----|-------|
| UA-13 | `[x]` **`OwnershipTransfer` Mongoose model** — `entityType`, `entityId`, `transferKind`, `status`, `initiatorUserId`, `receiverUserId`, `targetCoOwnerUserId`, optional email invite fields, `historicalReference` | U-ROLE-06 foundation | `../models/OwnershipTransfer.ts`, `../utils/enums.ts` |
| UA-14 | `[x]` **`ownershipTransferService`** — create with preconditions; accept/decline/cancel; atomic apply to entity | Business rules | `../lib/services/ownershipTransferService.ts` |
| UA-15 | `[x]` **`transfer_main`** — reject create when `coOwners.length > 0`; on accept set `mainOwnerUserId`, former main loses access | Sale / external handoff | Service + tests |
| UA-16 | `[x]` **`remove_co_owner`** — main initiates; target co-owner accepts; `$pull` from `coOwners[]` | Syndicate wind-down before sale | Service + tests |
| UA-17 | `[x]` **`promote_co_owner`** — main initiates; target accepts; swap main, pull promoted from `coOwners[]`, **keep other co-owners** | Partner takeover | Service + tests |
| UA-18 | `[x]` **REST routes** — `POST /ownership-transfers`, `GET /users/me/ownership-transfers`, `PATCH /ownership-transfers/:id`, cancel pending | Mobile + web contract | `../app/api/v1/ownership-transfers/` |
| UA-19 | `[x]` **Inbox UI** `/ownership-transfers` — accept/decline like `/relationships` | U-ROLE-07 | `../app/[locale]/ownership-transfers/`, i18n |
| UA-20 | `[x]` **Hub entry points** — "Transfer ownership" / "Manage co-owners" on horse hub (and stable hub when shipped) | Initiator UX | Horse/stable components |
| UA-21 | `[x]` **Horse billing hook** — on `transfer_main` accept, reassign subscription payer to new `mainOwnerUserId` | H-BILL-03 | `horseService` / subscription module |
| UA-22 | `[x]` **Integration tests** — full flows: remove all co-owners → transfer_main; promote with remaining co-owners | Regression | `../tests/lib/services/ownershipTransferService.test.ts` |

**Out of scope for OwnershipTransfer:** trainer, veterinary, groom, farrier, coach, rider (user-linked; not transferable entities).

*Implement service + API before hub UI (UA-18 before UA-19–20).*

### P4 — Polish & data integrity (lower priority)

| ID | Task | Why | Touch |
|----|------|-----|-------|
| UA-23 | `[x]` **Username uniqueness** — sparse unique index or service check if username is shown on public profile | `personalDetails.username` has no uniqueness constraint today | `../models/PersonalDetails.ts`, `../userService.updatePersonalDetails` |
| UA-24 | `[x]` **Credentials ↔ Google linking** — if same email, merge or block duplicate | Edge case for multi-provider accounts | `../userService.findOrCreateFromGoogle`, auth docs |
| UA-25 | `[x]` **`lastActiveAt` updates** — touch on authenticated API use | Field exists on User; may be unused | Middleware or `requireAuth` hook |
| UA-26 | `[x]` **Riding club baseline API** — listed §8 as `planned` | Host entity gap; not strictly auth but affects `User` navigation flags | `POST /api/v1/riding-clubs` — **role module**; track separately |

---

## Explicitly deferred (other modules)

| userModule ID | Item | Owner module |
|---------------|------|----------------|
| U-NAV-04 | Create flows for other role types (web) | Per-role modules |
| U-NAV-05 | `/<entity>` owned hubs with real lists | Horse, stable, etc. |
| U-WORK-06 | `assign_activities` | Stable / activity |
| U-DIFF-04/06/07 | Network dashboard, portable record UI | Horse / owner dashboard |
| §8 discover directories | `/stables`, `/veterinaries`, … search UI | Entity discover |
| U-PRIV-03 enforcement | DM policy | Chat / messaging |
| Notifications | `notifications` page is placeholder; embed deferred on User | Notifications module |

---

## Suggested sprint order

```text
Week A — Data lifecycle + account safety
  UA-00 → UA-27 → UA-28 → UA-01 → UA-02 → UA-03 → (UA-04 if needed) → UA-29

Week B — Public user profile (U-PRIV-05)
  UA-05 → UA-06 → UA-08 → UA-07 → UA-09

Week C — Profile UX + docs
  UA-10 → UA-11 → (UA-12 if product wants global onboarding)

Week D — OwnershipTransfer (U-ROLE-06/07)
  UA-13 → UA-14 → UA-15 → UA-16 → UA-17 → UA-18 → UA-22 → UA-19 → UA-20 → UA-21
```

---

## Acceptance — "user + auth ready"

Use this before marking §1–3 production-ready in userModule:

- [x] Deactivated account cannot refresh session, use protected APIs with surviving access token, or keep cookies after delete (UA-01–UA-04)
- [x] Data lifecycle documented; models have tombstone fields (UA-00, UA-27, UA-28)
- [x] Discovery/list APIs exclude `isActive: false` entities (UA-29)
- [x] `GET /api/v1/users/:id` respects `profileVisibility` for all audiences (UA-05–UA-08)
- [x] `/users/[userId]` page works as entity-linked destination, not search (UA-07; UA-08 matrix tests)
- [x] User can deactivate account from `/profile` (UA-10)
- [x] userModule + profile.md document public user read (UA-09)
- [x] userModule + profile.md document account deactivation UI flow (UA-11)
- [x] (If MVP needs ownership changes) `OwnershipTransfer` three kinds tested end-to-end (UA-13–17, UA-22)
- [x] `transfer_main` blocked until `coOwners[]` empty; `promote_co_owner` preserves other co-owners (UA-15, UA-17)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-30 | Initial plan from userModule audit vs `equus` codebase |
| 2026-06-30 | OwnershipTransfer tasks (UA-13–22) per [`../../documentation/ownershipTransfer.md`](../../documentation/ownershipTransfer.md) |
| 2026-06-30 | Data lifecycle policy (UA-00, UA-27–31); `deactivationAuditFields` on models; `softDelete` audit |
| 2026-06-30 | UA-29: `activeQuery` helpers; filter inactive in discover, public reads, nav, workplaces |
| 2026-06-30 | UA-30: `deactivateDocument` helper; `softDelete` refactored |
| 2026-06-30 | UA-31: `anonymizeUserPii` pipeline + `piiAnonymization.md` |
| 2026-06-30 | UA-03: regression tests for inactive-user rejection on refresh (`establishSession`, `buildAuthUserSessionFromUserId`) |
| 2026-06-30 | UA-04: `requireAuthFromRequest` live `User.isActive` check after JWT verify |
| 2026-06-30 | UA-05: `getPublicUserForRequester` service + visibility audience resolution |
| 2026-06-30 | UA-06: `GET /api/v1/users/:id` public profile card with optional auth |
| 2026-06-30 | UA-07: `/users/[userId]` web page with skeleton, card UI, `userClient` |
| 2026-06-30 | UA-08: U-PRIV-01 visibility matrix tests for `getPublicUserForRequester` and GET `/users/:id` |
| 2026-06-30 | UA-09: userModule U-PRIV-05 `done`; documented `GET /api/v1/users/:id` and `/users/[userId]` |
| 2026-06-30 | UA-10: account deactivation UI on `/profile` with confirm dialog and sign-in redirect |
| 2026-06-30 | UA-11: account deactivation documented in userModule, profile.md, and dataLifecycle.md (U-PROF-07) |
| 2026-06-30 | UA-12: global incomplete-profile banner in AppShell with link to `/profile` |
| 2026-06-30 | UA-13: `OwnershipTransfer` Mongoose model + enums (`ownershipTransfer*Enums`) |
| 2026-06-30 | UA-14: `ownershipTransferService` — create/accept/decline/cancel with entity apply |
| 2026-06-30 | UA-15: `transfer_main` rules + dedicated tests (`ownershipTransferService.transferMain.test.ts`) |
| 2026-06-30 | UA-16: `remove_co_owner` rules + dedicated tests (`ownershipTransferService.removeCoOwner.test.ts`) |
| 2026-06-30 | UA-17: `promote_co_owner` rules + dedicated tests (`ownershipTransferService.promoteCoOwner.test.ts`) |
