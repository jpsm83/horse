# Data lifecycle — engineering reference

Implements product rule: [`documentation/dataLifecycle.md`](../../documentation/dataLifecycle.md).

---

## Shared schema

```ts
// models/sharedSchemas/deactivationAudit.ts
deactivationAuditFields → isActive, deactivatedAt, deactivatedByUserId, deactivationReason
```

Spread into top-level Mongoose schemas. **Do not** use on nested embeds that already use `isActive` for “enabled in catalog” semantics.

---

## Models by pattern

### Tombstone (`deactivationAuditFields`)

`User`, `Horse`, `Stable`, `Breeder`, `Transport`, `RidingClub`, `Trainer`, `Groom`, `Veterinary`, `Farrier`, `Coach`, `Rider`, `Booking`, `Invoice`, `Notification`, `Rating`

### Status lifecycle (no entity-level `isActive` required)

| Model | End / hide via |
|-------|----------------|
| `Relationship` | `status: ended` + `endedAt` + `historicalReference` |
| `WorkplaceRelationship` | `status` + `endedAt` + `endedReason` |

### Special cases

| Model | Notes |
|-------|--------|
| `Booking` / `Invoice` | Domain `status` enum is primary; `isActive: false` for admin void / hide from lists |
| `Notification` | `readByUserIds` for read state; `isActive: false` to retract/dismiss globally |
| `Media` | **Exception**: hard-delete from MongoDB + Cloudinary. No inbound refs. Direct delete: main owner, co-owner, or responsible. Non-admins use `MediaDeletionRequest` (decision recipients: responsibles first, else main/co-owners). |
| `Document` | **Exception**: hard-delete from MongoDB + Cloudinary (same as Media — storage URL must not dangle). Direct delete: main owner, co-owner, or responsible. Non-admins use `DocumentDeletionRequest` (same decision-recipient rule). |

---

## Services (conventions)

1. **Never** `findByIdAndDelete` / `deleteOne` on domain documents except **compensating rollback** inside the same request (e.g. groom profile create race).
2. **Deactivate** via `lib/lifecycle/deactivateDocument.ts` (`deactivateDocument`, `mergeDeactivationUpdate`) — sets tombstone audit fields; optional extra operators (e.g. User `refreshSessionVersion` bump).
3. **End link** helpers set status + `endedAt` on `Relationship` / `WorkplaceRelationship`.
4. **List queries** add `{ isActive: { $ne: false } }` (or `isActive: true`) for discovery paths — implemented via `lib/lifecycle/activeQuery.ts` (`mergeActiveOnly`, `assertPublicReadAllowed`).

### User account

`userService.softDelete` → `deactivateDocument(User, …)` with `$inc refreshSessionVersion`.

| Surface | Entry | Notes |
|---------|-------|-------|
| API | `DELETE /api/v1/users/me` | `softDelete` + `authService.logout` (clear cookies) — `app/api/v1/users/me/route.ts` |
| Web | `/profile` → Account section | `profile-deactivate-account.tsx` → `deactivateCurrentUserAccount()` in `lib/api/authClient.ts` |
| Post-action | Redirect `/signin` | REST cache cleared; NextAuth `signOut` (best effort) |

Auth hardening after deactivate: [`auth.md`](./auth.md) (refresh reject, live `isActive` on `requireAuthFromRequest`). Product flow: [`profile.md`](./profile.md) § Account deactivation.

### Horse-attached reads (planned)

Discovery/public paths use `activeQuery` to hide inactive providers. **Horse owner timeline and document APIs** (not built yet) must **not** filter out records solely because `uploadedByUserId` or the linked `Veterinary` is inactive — only revoke future provider writes. See product rule in [`documentation/dataLifecycle.md`](../../documentation/dataLifecycle.md) § horse-attached records and [`horseModule.md`](../../documentation/horseModule.md) H-DASH-07, H-HEALTH-*, H-DOC-*.

### PII anonymization (UA-31)

`userService.anonymizeUserPii` after `softDelete` — see [`piiAnonymization.md`](./piiAnonymization.md).

---

## Hard delete — allowed only

| Case | Example |
|------|---------|
| Compensating transaction | `Groom.findByIdAndDelete` when `User.groomProfileId` link fails after insert |
| Invite email failure | `WorkplaceRelationship.deleteOne` when email send fails before invite is durable |
| Test teardown | `tests/setup.ts` `deleteMany` on memory DB |
| Media delete (admin authorized) | `Media.findByIdAndDelete` after Cloudinary `destroy` — no incoming references |
| Document delete (admin authorized) | `Document.findByIdAndDelete` after Cloudinary `destroy` — no incoming references |

---

## Related docs

- [`auth.md`](./auth.md) — session revoke on deactivate
- [`profile.md`](./profile.md) — account deactivation API + web UI
- [`userAuthTodo.md`](./userAuthTodo.md) — UA-00, UA-27+
