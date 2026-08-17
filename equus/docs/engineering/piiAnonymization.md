# PII anonymization (User)

**Job:** GDPR erasure without deleting the `User` `_id`.  
**Upstream:** [`../features/dataLifecycle.md`](../features/dataLifecycle.md)  
**Status:** **aligned**  
**Code roots:** `lib/lifecycle/anonymizeUserPii.ts`, `userService.anonymizeUserPii` / `softDelete`

---

## Shipped

Order: `softDelete` → optional `anonymizeUserPii` (requires `isActive: false`). **No** public self-service erasure route yet.

Scrubs: `personalDetails` (email → `anonymized.{userId}@anonymized.equus`), password / Google subject / tokens, preferences → private / nobody, `emailVerified` false, Cloudinary avatar best-effort. Sets `piiAnonymizedAt`, `piiAnonymizedByUserId`; `$inc refreshSessionVersion`.

**Kept:** `User._id`, horse-attached history, entity ownership refs.
