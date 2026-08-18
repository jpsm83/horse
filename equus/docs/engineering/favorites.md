# Favorites

**Job:** Private `User.favorites[]` shortcuts. Not a relationship, not follow, not people search.  
**Upstream:** [`../features/favorites.md`](../features/favorites.md)  
**Status:** **aligned**  
**Code roots:** `models/User.ts` (`favorites[]`), `lib/services/favoriteService.ts`, `app/api/v1/users/me/favorites/route.ts`, `components/shared/favorite-star-button.tsx`, `hooks/queries/useFavorites.ts`

---

## Shipped

| Piece | Contract |
|-------|----------|
| Storage | `User.favorites: Array<{ entityType, entityId, createdAt }>` — unique per `(userId, entityType, entityId)` via service dedupe + compound index |
| API | `GET/POST/DELETE /api/v1/users/me/favorites` — add/remove/list for current user |
| What | **Horse + Stable** in v1. **Never Users.** |
| Lists | `favorites=true` query param on `GET /api/v1/horses` and `GET /api/v1/stables` |
| UI | Favorites toggle on horse and stable list pages; star on horse and stable hub headers |
| Effect | Does **not** unlock ops, reviews, or roster seats |
| Home | No favorites catalog on [`myGraph.md`](myGraph.md) |

View check on add: reuses `getHorseView` / `getStableView` — 404 when requester cannot see the entity.

---

## Target

Extend `entityType` enum and list filter + detail star when new entity modules ship (vet, trainer, …). Never favorite Users.

Add to each future engineering doc when that module ships:

> **Favorites:** extend `entityType` enum; add filter to list; star on detail. Never favorite Users.
