# Chat — Design

Date: 2026-08-18  
Status: approved for planning  
Related: [`../../features/chat.md`](../../features/chat.md) · [`../../engineering/chat.md`](../../engineering/chat.md) · [`../../features/horseModule.md`](../../features/horseModule.md) H-PLAN-04, H-COM-01

## Problem

User-to-user messaging is documented (WhatsApp-style) but not built. Planning “reply” requires chat with prefilled context. `Booking.chatThreadId` is unused.

## Goal

Ship **CHAT-01, CHAT-03, CHAT-04** in v1; **CHAT-02** as **textual context prefix** (not structured attachments):

1. **1:1 threads** between Users.
2. **REST** send/list messages (working end-to-end first).
3. **Socket.io** live delivery as **final task** in same implementation plan.
4. Dedicated **`/messages`** module + entry points (calendar event → open thread with prefilled context line).
5. Desktop: **floating conversation popover** over app shell; full page reserved for future mobile.
6. **`allowDirectMessagesFrom`** + **user block list** enforced.
7. Chat **stays available** when stable is write-locked.

## Non-goals

- Group threads.
- Public feed, likes, follow, comments on events.
- Structured message attachments (images/files in v1 — text only).
- Push notifications for messages (preference key exists; wiring optional stub).

---

## Data model

### ChatThread

```ts
{
  participantUserIds: [ObjectId, ObjectId];  // exactly 2, sorted for lookup
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
  lastMessagePreview?: string;  // truncated
}
```

Index: `{ participantUserIds: 1 }` (hash of sorted pair for find-or-create).

### ChatMessage

```ts
{
  threadId: ObjectId;
  senderUserId: ObjectId;
  body: string;               // max 4000 chars
  contextPrefix?: string;     // prefilled line e.g. "Re: Vaccination appt on Star (Mar 12)"
  createdAt: Date;
  readByUserIds: ObjectId[];  // v1: mark read on thread open
}
```

Context is **plain text** stored on first message when opened from an entry point — not a foreign key.

### User.blocks (new)

```ts
blocks: Array<{ blockedUserId: ObjectId; createdAt: Date }>
```

Unique per blocked user. Blocked users cannot create threads or send messages.

---

## API

Base: `/api/v1/chat`

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/threads` | List current user's threads (paginated, sorted by `lastMessageAt`) |
| `POST` | `/threads` | Find-or-create 1:1 `{ targetUserId, contextPrefix?, initialBody? }` |
| `GET` | `/threads/:id/messages` | Paginated messages (`before` cursor) |
| `POST` | `/threads/:id/messages` | Send `{ body }` |
| `PATCH` | `/threads/:id/read` | Mark messages read for session user |
| `GET` | `/users/me/blocks` | List blocked user ids |
| `POST` | `/users/me/blocks` | `{ blockedUserId }` |
| `DELETE` | `/users/me/blocks/:userId` | Unblock |

### DM policy (`canDirectMessage`)

Before create/send:

1. If either user blocked the other → 403.
2. Check sender against target's `allowDirectMessagesFrom`:
   - `everyone` → allow
   - `nobody` → deny
   - `relationships` → require at least one **accepted** graph link (Relationship, WorkplaceRelationship, or co-ownership on same entity) — implement shared helper in `lib/privacy/directMessageAccess.ts`

### Planning reply entry (CHAT-03)

On horse Planning event with `sourceEntityId` (entity-created event):

- Show **Message** button for owner viewers.
- Resolve operator User(s) for source entity (stable main owner or workplace admin — v1: stable `mainOwnerUserId`).
- Open `/messages` or popover via `POST /threads` with `contextPrefix` built from event title + date + horse name.
- Owner does **not** PATCH the event.

---

## Real-time (Socket.io)

- Custom Node entry (`server.ts`) wrapping Next.js — per [`../../engineering/stack.md`](../../engineering/stack.md) target.
- Authenticate socket with same session cookie / JWT as REST.
- Events: `message:new`, `thread:updated`.
- **Task order:** REST fully working first; Socket.io last task in plan.

---

## UI

### `/messages` module

- Thread list (left / top on narrow).
- Selected thread message list + composer.
- Route: `app/[locale]/messages/page.tsx` + layout in app shell.

### Floating popover (desktop)

- `ChatPopoverProvider` in authenticated layout.
- Entry points call `openChat({ targetUserId, contextPrefix })`.
- Popover shows active thread; link to open full `/messages` module.

### Entry points v1

- Horse Planning event row (entity-sourced events only — when aggregation exists; stub button hidden until `sourceEntityId` present).
- Stable hub “Contact” / user profile where DM allowed.

---

## Wire `Booking.chatThreadId`

On booking accept (if booking module exists): optional find-or-create thread between owner and stable operator; store id on booking. **Low priority** — implement if booking routes exist; otherwise leave documented unused.

---

## Acceptance criteria

- [ ] Two users exchange messages via REST
- [ ] DM preference + blocks enforced
- [ ] `/messages` lists threads and sends messages
- [ ] Popover opens from entry point with context prefix on first message
- [ ] Socket.io delivers new messages without full page refresh (final task)
- [ ] Chat works when stable subscription write-locked
- [ ] `engineering/chat.md` **aligned**
