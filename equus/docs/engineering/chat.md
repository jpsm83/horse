# Chat

**Job:** WhatsApp-style messaging between **Users**. Independent of horse `Relationship`. Does not grant ops access.  
**Upstream:** [`../features/chat.md`](../features/chat.md)  
**Status:** **aligned**  
**Code roots:** `models/ChatThread.ts`, `models/ChatMessage.ts`, `lib/services/chatService.ts`, `app/api/v1/chat/**`, `app/[locale]/messages/**`, `components/chat/**`, `lib/chat/socketServer.ts`, `server.ts`

---

## Shipped

| Piece | Contract |
|-------|----------|
| Identity | 1:1 threads between Users. Enforced via `lib/privacy/directMessageAccess.ts` (`preferences.allowDirectMessagesFrom` + `User.blocks[]`). |
| REST | `GET/POST /api/v1/chat/threads`, `GET/POST …/threads/:id/messages`, `PATCH …/threads/:id/read`, `GET/POST /api/v1/users/me/blocks`, `DELETE …/blocks/:userId`. |
| Context | Optional `contextPrefix` plain text on first message (Planning reply entry). |
| UI | `/messages` module; desktop `ChatPopoverProvider`; Planning event Message button when `sourceEntityId` + `sourceOperatorUserId` present. |
| Blocks | Manage block list on user Preferences page. |
| Write-lock | Chat routes/services do **not** use entity write guard — chat stays up when stable is write-locked. |
| Real-time | Socket.io on custom `server.ts` (`npm run dev` / `npm start`). Events: `message:new`, `thread:updated`. Auth: access JWT cookie or Bearer. |

**Single-instance Socket.io only** — Redis adapter deferred until multi-instance deployment (see [`stack.md`](stack.md)).

`models/Booking.chatThreadId` remains unused (low priority wire on booking accept).

---

## Target

No further chat scope in v1 beyond [`../features/chat.md`](../features/chat.md). Do not add group threads, public feed, or structured attachments.

**Do not** add comments, change-requests, public feed, likes, or follow.
