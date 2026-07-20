# PII anonymization (User)

Regulatory **erasure** without hard-deleting the `User` document. Product rule: [`documentation/dataLifecycle.md`](../../documentation/dataLifecycle.md).

---

## When to use

| Flow | Purpose |
|------|---------|
| **`softDelete`** | User closes account — tombstone, revoke sessions, keep PII for referential integrity |
| **`anonymizeUserPii`** | GDPR / legal erasure — scrub personal PII on an **already deactivated** user |

**Order:** `softDelete` → (optional) `anonymizeUserPii`. Anonymization **requires** `isActive: false`.

There is **no public self-service API** yet — call from admin tooling, support scripts, or a future authenticated erasure request flow.

---

## What is scrubbed

On `User`:

- `personalDetails` — name, phone, address, ID, bio, avatar URL, username, etc.
- `personalDetails.email` → deterministic placeholder `anonymized.{userId}@anonymized.equus`
- Auth — `password`, `googleSubjectId`, verification/reset tokens
- `preferences` → `private` / `nobody`
- `emailVerified` → `false`
- Cloudinary avatar — best-effort delete before DB scrub

Audit fields set: `piiAnonymizedAt`, `piiAnonymizedByUserId`. Session revoke: `$inc refreshSessionVersion`.

---

## What is **not** removed

- `User._id` — all `userId` foreign keys remain valid
- Horse-attached `Document`, future health events, `Relationship` history — unchanged; attribution uses snapshots on those documents
- Entity ownership refs (`mainOwnerUserId`, etc.) — unchanged (operator may still need transfer before anonymize in product policy)

---

## API (service layer)

```ts
import * as userService from "@/lib/services/userService.ts";

await userService.softDelete(userId);
await userService.anonymizeUserPii(userId, { anonymizedByUserId: actorUserId });
```

Low-level: `lib/lifecycle/anonymizeUserPii.ts` — `applyUserPiiAnonymization`, `buildAnonymizedEmail`, `isUserPiiAnonymized`.

---

## Related

- [`profile.md`](./profile.md) — account deactivation (`DELETE /users/me`)
- [`dataLifecycle.md`](./dataLifecycle.md) — engineering lifecycle conventions
- [`userAuthTodo.md`](./userAuthTodo.md) — UA-31
