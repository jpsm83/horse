# Favorites — Design

Date: 2026-08-18  
Status: approved for planning  
Related: [`../../features/favorites.md`](../../features/favorites.md) · [`../../engineering/favorites.md`](../../engineering/favorites.md) · [`../../features/horseModule.md`](../../features/horseModule.md) H-DISC-08 · [`../../features/stableModule.md`](../../features/stableModule.md) S-LIST-01

## Problem

Favorites are specified (`User.favorites[]`, list filter, detail star) but have zero implementation. Users cannot bookmark horses or stables for quick return.

## Goal

Ship **FAV-01 through FAV-04** for **Horse + Stable only** in v1:

1. Persist favorites on `User`.
2. REST API to add/remove/list favorites for current user.
3. **Favorites** filter on horse and stable list pages (default remains **mine**).
4. Star toggle on horse and stable detail/hub surfaces.
5. Document extension pattern for future entity modules (vet, trainer, …).

## Non-goals

- Favorite Users (forbidden permanently).
- Favorites catalog on `/home`.
- Favorites unlocking ops, reviews, or roster seats.
- Favorites on entity types without list pages in v1.

---

## Data model

```ts
// User document — new field
favorites: Array<{
  entityType: "horse" | "stable";  // extend enum as modules ship
  entityId: ObjectId;
  createdAt: Date;
}>
```

- Unique per `(userId, entityType, entityId)` — enforce in service layer + compound index on User: `{ _id: 1, "favorites.entityType": 1, "favorites.entityId": 1 }` (application-level dedupe on add).
- Unfavorite = `$pull` matching entry.

---

## API

### `GET /api/v1/users/me/favorites`

Query: `entityType=horse|stable` (optional filter).

Response:

```ts
{
  favorites: Array<{
    entityType: "horse" | "stable";
    entityId: string;
    createdAt: string;
    // optional denormalized label for UI
    label?: string;
  }>;
}
```

### `POST /api/v1/users/me/favorites`

Body: `{ entityType, entityId }`

- Verify entity exists and requester **can view** it (404 if not found / no access — do not leak private entities).
- Idempotent add (no duplicate entries).

### `DELETE /api/v1/users/me/favorites`

Body: `{ entityType, entityId }` — or RESTful `DELETE .../favorites/:entityType/:entityId`

### List filters

**`GET /api/v1/horses`** — new query param: `favorites=true` (requires auth).

When set: intersect result with user's favorited horse ids (still apply other filters). Default `mine=true` unchanged when param absent.

**`GET /api/v1/stables`** — same `favorites=true`.

Implementation: load favorite ids for type, `$in` query on `_id`.

---

## UI

### Horse list (`components/horses/list/horse-list-page.tsx`)

- Add toggle filter **Favorites** alongside **Mine** (authenticated only).
- URL param: `favorites=true`.

### Stable list (equivalent component)

- Same pattern.

### Detail star

- Horse hub header + stable hub header: star button.
- Optimistic toggle via TanStack Query mutation → favorites API.
- Filled star when favorited.

---

## Future entity extension (docs only in v1)

Add to each future engineering doc when that module ships:

> **Favorites:** extend `entityType` enum; add filter to list; star on detail. Never favorite Users.

Files to touch later: `veterinaries.md`, `trainers.md`, etc.

---

## Acceptance criteria

- [ ] User favorites/unfavorites horse and stable via API
- [ ] Cannot favorite entity user cannot view
- [ ] Cannot favorite Users
- [ ] List filter `favorites=true` returns only favorited entities of that type
- [ ] Star on horse + stable detail reflects state
- [ ] Default list behavior unchanged
- [ ] Engineering `favorites.md` status **aligned**
