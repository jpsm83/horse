# Plan: Media Hard-Delete + Owner-Gated Deletion Requests

## Phase 1 — Documentation Updates

Files to update:

1. **`documentation/dataLifecycle.md`** — Add a new section "Media files (Cloudinary)" explaining that media is an exception to the never-hard-delete rule because (a) nothing references Media documents, (b) asset bytes on Cloudinary incur real storage cost, and (c) only the horse owner can authorize deletion.

2. **`equus/documentation/dataLifecycle.md`** — Update the engineering reference table. Add a `Media` row: "Hard-delete from MongoDB + Cloudinary. Gated by owner consent only. MediaDeletionRequest tracks who requested/approved."

3. **`equus/documentation/horses.md`** — Add new endpoints under the Media section:
   - `GET /api/v1/horses/:id/media-deletion-requests` — list pending requests
   - `POST /api/v1/horses/:id/media-deletion-requests` — request deletion (non-owners)
   - `PATCH /api/v1/horses/:id/media-deletion-requests/:requestId` — approve/decline (owners)
   - `DELETE /api/v1/horses/:id/media-deletion-requests/:requestId` — cancel own request
   - Update existing `DELETE /api/v1/horses/:id/media/:mediaId` docs to note: **owner-only, hard-deletes.**

4. **`equus/AGENTS.md`** — In the "Data lifecycle (no hard deletes)" section, add a Media exception note.

---

## Phase 2 — Fix Existing Security Gap (current DELETE route)

**File: `equus/app/api/v1/horses/[id]/media/[mediaId]/route.ts`**

The current DELETE handler has a critical bug: **no ownership check at all**. Any authenticated user can delete any media. Before adding new features, fix this:

- Add ownership validation using `ownedByUserQuery(actorUserId)` scoped to the `[id]` horse
- Validate that the media record's `horseId` matches the route's `[id]` (currently it doesn't even scope the lookup to the horse)
- Add `horseAuditService.recordAudit({ actionType: "media.deleted" })`
- Add `deactivatedAt`, `deactivatedByUserId` to the service call (using `deactivateDocument` helper)

---

## Phase 3 — Hard-Delete for Owner-Initiated Deletion

**File: `equus/lib/services/mediaService.ts`**

Modify `deleteMedia()`:
- Replace `Media.findByIdAndUpdate(mediaId, { isActive: false })` with `Media.findByIdAndDelete(mediaId)` — **hard-delete from MongoDB**
- Cloudinary destroy stays (already does this)
- Add `horseAuditService.recordAudit({ actionType: "media.deleted", ... })` with full context

**File: `equus/app/api/v1/horses/[id]/media/[mediaId]/route.ts`**

- After ownership check passes, call updated `mediaService.deleteMedia()`
- Return `ok({ deleted: true })`

---

## Phase 4 — Deletion Request Flow (for non-owners)

Mirrors the existing `OwnershipTransfer` pattern.

### 4a. New model: `models/MediaDeletionRequest.ts`

```typescript
status: "pending" | "approved" | "declined" | "cancelled"
horseId: ObjectId          // ref: "Horse"
mediaId: ObjectId          // ref: "Media"
requesterUserId: ObjectId  // ref: "User" — the non-owner requesting deletion
decisionByUserId: ObjectId // ref: "User" — the owner who approved/declined (set on action)
requestMessage?: string    // why they want it deleted
responseMessage?: string   // owner's response
requestedAt: Date
respondedAt?: Date
appliedAt?: Date           // when the actual delete happened
...deactivationAuditFields // own lifecycle tombstone
{ timestamps: true }
```

Exported as a Mongoose model (`mediadeletionrequests` collection).

### 4b. New validation: `lib/validations/mediaDeletion.ts`

```typescript
createMediaDeletionRequestSchema  → { mediaId, requestMessage? }
respondMediaDeletionRequestSchema → { status: "approved" | "declined", responseMessage? }
```

### 4c. New service: `lib/services/mediaDeletionService.ts`

| Function | Actor | Logic |
|----------|-------|-------|
| `createDeletionRequest(userId, horseId, mediaId, message)` | Any authenticated user | Validates media exists, belongs to horse, requester is NOT an owner. Creates pending request. Creates notification for owners. |
| `approveDeletionRequest(userId, requestId)` | Owner/co-owner | Verifies ownership via `userOwnsEntity`, verifies request is pending, calls `mediaService.deleteMedia()`, sets status. Notifies requester. |
| `declineDeletionRequest(userId, requestId)` | Owner/co-owner | Verifies ownership, sets `status: "declined"`, notifies requester. Does NOT delete the media. |
| `cancelDeletionRequest(userId, requestId)` | Original requester | Only the requester can cancel their own pending request. Sets `status: "cancelled"`. |
| `listPendingRequests(userId, horseId)` | Owner/co-owner | Returns pending requests for a horse, ownership-gated. |

### 4d. New route handlers: `app/api/v1/horses/[id]/media-deletion-requests/`

| Method | Path | Who | Returns |
|--------|------|-----|---------|
| `GET` | `.../media-deletion-requests?status=pending` | Owner/co-owner | List of pending requests |
| `POST` | `.../media-deletion-requests` | Non-owner | Created request |
| `PATCH` | `.../media-deletion-requests/:requestId` | Owner/co-owner | Approved or declined request |
| `DELETE` | `.../media-deletion-requests/:requestId` | Requester | Cancelled request |

All follow the thin-handler pattern: `connectDb()` → `requireAuthFromRequest()` → Zod parse → call service → `ok(...)`.

---

## Phase 5 — Notification Service

**File: `lib/services/notificationService.ts`** (new)

The `Notification` model exists but has no service yet. Create a minimal service:

```typescript
createNotification(input: {
  recipientUserIds: string[],
  senderUserId: string,
  notificationType: NotificationType,
  title: string,
  message: string,
  horseId?: string,
  actionUrl?: string,
  metadata?: Record<string, unknown>,
}) → Notification
```

Add `"media_deletion"` to the `NotificationType` enum.

Wire into `mediaDeletionService`:
- On request created: notify all owners/co-owners
- On approve/decline/cancel: notify the requester

---

## Phase 6 — Unit Tests

| Test file | Covers |
|-----------|--------|
| `tests/lib/services/mediaService.test.ts` | Update: hard-delete instead of soft-delete, ownership gating |
| `tests/lib/services/mediaDeletionService.test.ts` | New: create, approve, decline, cancel, owner-only gates |
| `tests/lib/services/notificationService.test.ts` | New: create notification, list for user |

---

## Summary: What gets hard-deleted vs. soft-deleted

| Item | Lifecycle | Reason |
|------|-----------|--------|
| **Cloudinary asset** | Hard-delete | Owner consented, real storage cost, no referential dependency |
| **Media document (MongoDB)** | Hard-delete | Nothing references it, zero DB integrity risk |
| **MediaDeletionRequest** | Soft-delete (`isActive: false`) | Links users + history; follows OwnershipTransfer pattern |
| **Notification** | Soft-delete | Inbox history, follows existing model pattern |
