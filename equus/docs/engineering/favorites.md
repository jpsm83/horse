# Favorites

**Job:** Private `User.favorites[]` shortcuts. Not a relationship, not follow, not people search.  
**Upstream:** [`../features/favorites.md`](../features/favorites.md)  
**Status:** **drift** (not built)  
**Code roots:** none (`User` has no `favorites` field; no matches in app code)

---

## Shipped

Nothing. Entity lists have no Favorites filter. Detail pages have no star.

---

## Target

| Piece | Contract |
|-------|----------|
| Storage | `User.favorites: Array<{ entityType, entityId, createdAt }>` — unique per `(userId, entityType, entityId)` |
| API | Add/remove on current user (e.g. `PATCH /api/v1/users/me/favorites` or equivalent). Unfavorite = pull. |
| What | Any entity type that has a list + filter (horse, stable, later vet/trainer/…). **Never Users.** |
| Lists | Favorites is a **filter** on Horse/Stable indexes. Default filter remains **mine**. |
| Effect | Does **not** unlock ops, reviews, or roster seats. |
| Home | Do **not** dump the favorites catalog on [`myGraph.md`](myGraph.md). |
