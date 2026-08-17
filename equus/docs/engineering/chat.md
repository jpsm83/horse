# Chat

**Job:** WhatsApp-style messaging between **Users**. Independent of horse `Relationship`. Does not grant ops access.  
**Upstream:** [`../features/chat.md`](../features/chat.md)  
**Status:** **drift** (not built)  
**Code roots:** none for threads. `models/Booking.chatThreadId` is unused. Notifications `messages` preference exists on User.

---

## Shipped

No `/api/v1/chat` (or messages) routes. No thread model. Socket.io / `server.ts` is **target transport** only (this file).

---

## Target

| Piece | Contract |
|-------|----------|
| Identity | Threads are User↔User. Respect `preferences.allowDirectMessagesFrom` + blocks. |
| Transport | REST messages first; Socket.io on custom `server.ts` when UX needs live delivery (same Node process). |
| Context | Optional attach: horse, entity, booking, **Planning event**. |
| Planning reply | Owner cannot PATCH another entity’s event. Reply **opens/continues chat** with that entity’s operators + event attached. Entity edits the event on **their** module. |
| Write-lock | Chat **stays up** if the stable is write-locked. |

**Do not** add comments, change-requests, public feed, likes, or follow.
