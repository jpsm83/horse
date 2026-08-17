# Chat

WhatsApp-style messaging between **Users**. Independent of horse `Relationship` status. Does **not** grant ops access.

Product: [`equus/docs/product/graph-and-identity.md`](../product/graph-and-identity.md). Planning reply: [`horseModule.md`](horseModule.md).

---

## Rules

- Any user may start a conversation with another user (subject to `allowDirectMessagesFrom` / block rules on `User.preferences`).
- Threads may attach **context**: horse, stable, booking, **Planning event**.
- **Planning reply:** owner cannot edit another entity’s event; “reply” opens/continues chat with that entity’s operators with the event attached. The entity edits the event on **their** module.
- Chat **stays up** if a stable is write-locked.
- No public feed, likes, or follow.

## Feature IDs

| ID | Feature | Status |
|----|---------|--------|
| CHAT-01 | User-to-user threads (REST; Socket.io when UX requires) | planned |
| CHAT-02 | Attach horse / entity / booking / planning-event context | planned |
| CHAT-03 | Planning “reply” = chat + event, not comments or change-requests | planned |
| CHAT-04 | Respect DM preference / blocks | planned |
