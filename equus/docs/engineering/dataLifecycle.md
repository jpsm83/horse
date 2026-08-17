# Data lifecycle — implementation

**Job:** Tombstones, status-end links, allowed hard-delete exceptions.  
**Upstream:** [`../features/dataLifecycle.md`](../features/dataLifecycle.md)  
**Status:** **aligned**  
**Code roots:** `models/sharedSchemas/deactivationAudit.ts`, `lib/lifecycle/deactivateDocument.ts`, `lib/lifecycle/activeQuery.ts`, `lib/lifecycle/anonymizeUserPii.ts`

PII: [`piiAnonymization.md`](piiAnonymization.md). Account UI: [`profile.md`](profile.md). How to name models / deactivate: [`../conventions/mongodb-models.md`](../conventions/mongodb-models.md).

---

## Shipped

`deactivationAuditFields` → `isActive`, `deactivatedAt`, `deactivatedByUserId`, `deactivationReason` on User, Horse, host/user-linked profiles, Booking, Invoice, Notification, Rating.

| Model | End via |
|-------|---------|
| `Relationship` | `status: ended` + `endedAt` + snapshots |
| `WorkplaceRelationship` | `status` + `endedAt` + `endedReason` |
| `User` | `userService.softDelete` → `DELETE /api/v1/users/me` + logout |
| Discovery lists | `lib/lifecycle/activeQuery.ts` (`mergeActiveOnly`) |

**Hard delete allowed:** compensating rollback in the same request; test teardown; **Media** and **Document** after Cloudinary destroy (no inbound refs). Direct file delete: main owner / co-owner / responsible. Others: `MediaDeletionRequest` / `DocumentDeletionRequest`.

Never `findByIdAndDelete` on domain docs except those cases.

---

## Target

Horse owner timeline / document **reads** must not hide rows solely because `uploadedByUserId` or a linked provider is inactive — only revoke **future** provider writes. Entity write-lock ([`billing.md`](billing.md)) is not delete.
