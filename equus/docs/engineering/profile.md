# Profile and preferences

**Job:** Account settings UI + `PATCH /api/v1/users/me`. Not the signed-in home.  
**Upstream:** [`../features/userModule.md`](../features/userModule.md)  
**Status:** **aligned**  
**Code roots:** `app/[locale]/user/[userId]/{profile,preferences}/`, `components/user/profile/`, `lib/validations/user.ts`, `lib/services/userService.ts`, `app/api/v1/users/me/route.ts`

Hub/view APIs: [`users.md`](users.md). Tabs: [`userTabs.md`](userTabs.md). Locale cookie: [`i18n.md`](i18n.md).

---

## Shipped

| Route | Owns |
|-------|------|
| `/user/[userId]/profile` | Identity, address, photo, security, deactivate |
| `/user/[userId]/preferences` | Theme, language, `profileVisibility`, DM audience |
| `/profile` | Redirect → `/user/{me}/profile` |

`userId` must match the session user. Unauthenticated → sign-in.

| Method | Path | Purpose |
|--------|------|---------|
| `GET`/`PATCH` | `/api/v1/users/me` | JSON or multipart avatar |
| `PATCH` | `/api/v1/users/me/hub-sections` | Layer-2 hub section modes |
| `DELETE` | `/api/v1/users/me` | Soft-deactivate + logout |

**PATCH:** dirty fields only; `""` → `$unset` (`userService.updatePersonalDetails`). Theme/language preview live; cookies + DB **on Save**. Discard restores theme + locale.

**Deactivate:** tombstone, not hard delete — [`dataLifecycle.md`](dataLifecycle.md). Copy: deactivate, not “delete account.”

**`profileComplete`:** banner in `AppShell` except account settings paths → `/user/{id}/profile`.
