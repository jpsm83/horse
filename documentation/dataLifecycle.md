# Data lifecycle — no hard deletes

Cross-cutting product rule for **referential integrity** across horses, ownership, relationships, billing, and audit history.

**Engineering detail:** [`equus/documentation/dataLifecycle.md`](../equus/documentation/dataLifecycle.md)

Related:
- [`userModule.md`](userModule.md) — account deactivation vs profile visibility
- [`ownershipTransfer.md`](ownershipTransfer.md) — consent-based ownership changes (never delete entity)
- [`workplaceRelationship.md`](workplaceRelationship.md) — collaboration lifecycle
- [`../equus/documentation/userAuthTodo.md`](../equus/documentation/userAuthTodo.md) — execution tasks (UA-00, UA-27+)

---

## Principle

**Domain documents are never physically removed from the database** in product-facing flows, **except storage-backed file assets** (`Media`, `Document`) where the Cloudinary object is destroyed and the MongoDB row is hard-deleted so no dangling URL remains. For everything else, the system **changes state** — flags, status enums, or dedicated lifecycle collections — so foreign keys, invoices, ratings, and history remain valid.

Hard `delete` in MongoDB is otherwise allowed **only** for failed compensating transactions (e.g. rolling back a profile row when linking `User.*ProfileId` fails). That is implementation cleanup, not user-facing deletion.

### File asset exception (Media and Documents)

| Asset | Direct delete who | Non-admin path | Decision recipients |
|-------|-------------------|----------------|---------------------|
| `Media` | Main owner, co-owner, responsible | `MediaDeletionRequest` | Responsibles if any; else main + co-owners |
| `Document` | Main owner, co-owner, responsible | `DocumentDeletionRequest` | Same |

See [`equus/documentation/dataLifecycle.md`](../equus/documentation/dataLifecycle.md) and [`equus/documentation/horses.md`](../equus/documentation/horses.md).


---

## Three layers (do not conflate)

| Layer | User intent | Mechanism | Document kept? |
|-------|-------------|-----------|----------------|
| **Account deactivation** | “Close my Equus login” | `User.isActive: false` + session revoke | Yes — `userId` refs stay valid |
| **Visibility / privacy** | “Hide my personal profile” | `User.preferences.profileVisibility` | Yes — separate from login |
| **Operational end** | “Stop working with this vet / leave the barn” | `Relationship.status: ended`, `WorkplaceRelationship` end | Yes — with `endedAt` + snapshots |
| **Ownership change** | “Sell the horse / remove a co-owner” | `OwnershipTransfer` accept → update entity fields | Yes — transfer doc + entity |
| **Entity deactivation** | “Retire this horse listing / close stable profile” | Entity `isActive: false` + audit fields | Yes |
| **Record archive** | “Archive this document / void invoice” | `isActive` or domain status (`isArchived`, `canceled`) | Yes |

### Account deactivation flow (U-PROF-07 — shipped)

| Step | Surface | Behavior |
|------|---------|----------|
| 1 | Web `/profile` → **Account** | Confirm dialog (`components/profile/profile-deactivate-account.tsx`) |
| 2 | Client | `deactivateCurrentUserAccount()` → `DELETE /api/v1/users/me` |
| 3 | API | `userService.softDelete` → tombstone fields + `refreshSessionVersion` bump; `authService.logout` clears REST cookies |
| 4 | Client | Auth cache cleared; NextAuth `signOut`; redirect to `/signin` |
| 5 | Auth | Refresh and protected routes reject inactive user (UA-03, UA-04) |

Product copy: **Deactivate account** — not “delete.” Deactivation closes login; `profileVisibility` only controls who can see personal fields on entity-linked profile views. See [`equus/documentation/profile.md`](../equus/documentation/profile.md) and [`userModule.md`](userModule.md) U-PROF-07.

Product copy should say **deactivate**, **end**, **remove access**, or **archive** — not “permanently delete,” unless referring to regulatory **PII anonymization** (future; still keeps a stub `userId`).

---

## Tombstone fields (entity & user documents)

Top-level collections that represent users, entities, or durable records carry:

| Field | Purpose |
|-------|---------|
| `isActive` | `false` = hidden from discovery and normal operations; document remains |
| `deactivatedAt` | When deactivation happened |
| `deactivatedByUserId` | Who initiated (self, owner, admin) |
| `deactivationReason` | Optional free-text or coded reason |

Defined once in [`equus/models/sharedSchemas/deactivationAudit.ts`](../equus/models/sharedSchemas/deactivationAudit.ts). Writes use [`equus/lib/lifecycle/deactivateDocument.ts`](../equus/lib/lifecycle/deactivateDocument.ts).

**Nested** `isActive` on embeds (e.g. stable pricing tier, fleet vehicle) means “this sub-item is offered” — not entity tombstone.

---

## Lifecycle collections (status instead of `isActive`)

Some models use **status enums** + timestamps instead of a boolean tombstone:

| Model | End state | History |
|-------|-----------|---------|
| `Relationship` | `status: ended` | `endedAt`, `historicalReference` |
| `WorkplaceRelationship` | `status: ended` / `declined` | `endedAt`, `endedReason` |
| `Booking` | `status: canceled` / `completed` | `canceledAt`, `completedAt` |
| `Invoice` | `status: void` / `paid` | `paidAt`, status transitions |

Do not hard-delete these when a link ends.

---

## Horse-attached records (health, documents, timeline)

**Product rule:** Data created **in the context of a horse** (vaccinations, treatments, uploaded certificates, invoices, timeline entries) belongs to the **horse record** and its owners — not to the provider’s user account.

When a vet (or any provider) **deactivates their account**, **closes their practice profile**, or **ends a relationship** with a horse:

| What changes | What does **not** change |
|--------------|---------------------------|
| Provider cannot log in (`User.isActive: false`) | Horse-linked documents and future health events **stay in the database** |
| Provider hidden from discover / public cards | Owners (and authorized co-owners) **retain read access** to historical entries on that horse |
| No new writes on that horse via that provider | Entries keep **attribution** (`uploadedByUserId`, `relationshipId`, optional label snapshots on `Relationship.historicalReference`) |

`isActive: false` on `User` or `Veterinary` means **withdraw from discovery and operations** — it does **not** mean delete clinical or document history on horses the provider served.

**Implementation status:** Models support this shape today (`Document.horseId`, `Relationship` history fields). Health events, vaccination rules, unified timeline, and owner read APIs are **planned** in [`horseModule.md`](horseModule.md) (§5–7, especially H-DASH-07, H-HEALTH-*, H-DOC-*). Build those features against this rule.

**GDPR (UA-31):** `userService.anonymizeUserPii` scrubs personal PII on an inactive `User`; horse-attached records keep **service-time labels** on those documents. See [`equus/documentation/piiAnonymization.md`](../equus/documentation/piiAnonymization.md).

---

## Queries and APIs

- **Default reads** for discovery and operator lists exclude `isActive: false` unless the caller is admin or viewing historical context. Implemented in `lib/lifecycle/activeQuery.ts` and entity/discover services (UA-29).
- **Auth** must treat `User.isActive: false` as logged out (refresh + session rebuild + live access-token DB check in `requireAuthFromRequest` — UA-03, UA-04).
- **GDPR erasure** is **`anonymizeUserPii`** — scrub PII on an inactive `User` row, not `deleteOne`. Implemented in `lib/lifecycle/anonymizeUserPii.ts` (UA-31).

---

---
## Media and Document files (Cloudinary) — exception

**User-uploaded media and horse documents** stored on Cloudinary are an exception to the never-hard-delete rule. Reasons:

1. **No referential integrity risk** — No other model stores a foreign key pointing to the `Media` or `Document` collections for these file rows. Nothing depends on the record existing once the Cloudinary URL is gone.
2. **Storage cost** — Cloudinary charges for asset storage. Keeping deleted files indefinitely incurs real operational cost with zero product value.
3. **Admin consent** — Direct hard-delete is allowed for main owner, co-owner, or proactive representative. Non-admins must use the deletion request flow.

**What gets deleted:**
- Cloudinary asset: **hard-deleted** via `cloudinary.uploader.destroy()`
- MongoDB `Media` / `Document` row: **hard-deleted** via `findByIdAndDelete()`

**What stays:**
- `MediaDeletionRequest` / `DocumentDeletionRequest`: status lifecycle (pending / approved / declined / cancelled) — preserves audit trail of who requested and who decided.
- Audit log entries: unchanged.

**Decision recipients:** If the horse has any `responsibles[]`, only those users are notified and may approve/decline. Otherwise main owner and co-owners.

**Rule:** If no other document has a foreign key to a record, and the record's primary value is an external file URL, hard-delete is acceptable with admin (or approved request) consent. This applies to `Media` and `Document` only.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-30 | Initial policy — tombstone fields on models, lifecycle doc, userAuthTodo UA-00 / UA-27+ |
| 2026-06-30 | Horse-attached records section — provider deactivation does not remove owner-visible horse history |
| 2026-06-30 | UA-31 — `anonymizeUserPii` pipeline documented and implemented |
| 2026-07-21 | Media **and Document** hard-delete exception; representative-first deletion-request recipients |
