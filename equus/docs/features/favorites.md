# Favorites

Private shortcuts. **Not** a follow graph, **not** a relationship, **not** people search.

Product: [`equus/docs/product/graph-and-identity.md`](../product/graph-and-identity.md). Lists: [`horseModule.md`](horseModule.md), [`stableModule.md`](stableModule.md). Home does **not** list all favorites — [`myGraph.md`](myGraph.md).

---

## Rules

- Stored on **`User`**, not on the entity.
- **Do not favorite Users.** People are not a searchable module.
- Any **entity type that has a list + filter** can be favorited (horse, stable, veterinary, trainer, groom, …).
- Favoriting does **not** unlock ops, reviews, or roster seats.
- Each entity index/search **filter bar** includes **Favorites** (intersect with that page’s type).
- Entity detail pages may show a star that writes the same field.

## Data (spec)

```ts
// User
favorites: Array<{ entityType: string; entityId: ObjectId; createdAt: Date }>
```

Unique per `(userId, entityType, entityId)`. Unfavorite = pull.

## Feature IDs

| ID | Feature | Status |
|----|---------|--------|
| FAV-01 | `User.favorites[]` persistence + API | planned |
| FAV-02 | Star on entity detail | planned |
| FAV-03 | Favorites filter on every entity list that has filters | planned |
| FAV-04 | Horse + stable lists: Favorites is a filter, not the default (default is **mine**) | planned |
