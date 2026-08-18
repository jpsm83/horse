# Favorites — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship `User.favorites`, REST API, horse/stable list filter, and detail star.

**Architecture:** Mongoose array on `User`; `favoriteService` for add/remove/list; extend `listHorses` / stable list with `favorites` filter; UI uses TanStack Query hooks.

**Tech Stack:** Mongoose, Zod, Vitest, TanStack Query, shadcn Button/toggle patterns.

## Global Constraints

- Spec: [`../specs/2026-08-18-favorites-design.md`](../specs/2026-08-18-favorites-design.md)
- Entity types v1: **horse**, **stable** only
- Never favorite Users; no home favorites catalog
- Work from `equus/`; colocated `__tests__/`

---

### Task 1: User model + favoriteService

**Files:**
- Modify: `equus/models/User.ts`
- Create: `equus/lib/services/favoriteService.ts`
- Create: `equus/lib/validations/favorite.ts`
- Test: `equus/lib/services/__tests__/favoriteService.test.ts`

- [ ] **Step 1: Failing tests** — add favorite, duplicate add idempotent, remove, list by type, cannot add horse user cannot view

- [ ] **Step 2: Implement schema + service**

```ts
export async function addFavorite(userId: string, entityType: FavoriteEntityType, entityId: string)
export async function removeFavorite(userId: string, entityType: FavoriteEntityType, entityId: string)
export async function listFavorites(userId: string, entityType?: FavoriteEntityType)
export async function getFavoriteIdSet(userId: string, entityType: FavoriteEntityType): Promise<Set<string>>
```

View check: reuse horse/stable GET visibility helpers (404 → reject add).

- [ ] **Step 3: Run tests — PASS**

- [ ] **Step 4: Commit**

---

### Task 2: REST routes

**Files:**
- Create: `equus/app/api/v1/users/me/favorites/route.ts`
- Test: `equus/app/api/v1/users/me/favorites/__tests__/route.test.ts`

- [ ] **Step 1: GET/POST/DELETE route tests**

- [ ] **Step 2: Wire routes to favoriteService**

- [ ] **Step 3: Commit**

---

### Task 3: List filter integration

**Files:**
- Modify: `equus/lib/services/horseService.ts` (`HorseListFilters.favorites?: boolean`)
- Modify: `equus/lib/services/stableService.ts` (same)
- Modify: `equus/app/api/v1/horses/route.ts`, `equus/app/api/v1/stables/route.ts`
- Test: extend existing list tests or add `horseService.listFavorites.test.ts`

- [ ] **Step 1: Test `favorites=true` returns intersection**

- [ ] **Step 2: Implement filter in list queries**

- [ ] **Step 3: Commit**

---

### Task 4: UI — list filters + star

**Files:**
- Modify: `equus/components/horses/list/horse-list-page.tsx`
- Modify: stable list page component (find via `components/stables/list/`)
- Create: `equus/components/shared/favorite-star-button.tsx`
- Modify: horse hub + stable hub headers (locate via grep `HorseHub` / stable hub)
- Create: `equus/hooks/queries/useFavorites.ts`
- Modify: `equus/messages/en.json`, `equus/messages/es.json`

- [ ] **Step 1: FavoriteStarButton with optimistic mutation**

- [ ] **Step 2: Add favorites toggle to both list pages**

- [ ] **Step 3: Add star to detail surfaces**

- [ ] **Step 4: Commit**

---

### Task 5: Docs

**Files:**
- Modify: `equus/docs/engineering/favorites.md` → **aligned**
- Add note to `equus/docs/engineering/horses.md` and `stables.md` Target rows (favorites filter shipped)

- [ ] **Step 1: Update docs + commit**

---

### Task 6: Verification

- [ ] `npm test` && `npm run lint`
- [ ] Manual: favorite horse → filter list → unfavorite from star
