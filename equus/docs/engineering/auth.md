# Authentication (web + API)

**Job:** Session truth for web cookies and mobile JWT. Same services, different transport.  
**Upstream:** [`../features/userModule.md`](../features/userModule.md) (identity)  
**Status:** **aligned**  
**Code roots:** `app/api/v1/auth/`, `lib/services/authService.ts`, `lib/auth/`, `lib/api/auth/`

Post-login landing content: [`myGraph.md`](myGraph.md) (`/home` path is shipped; inbox is not). Profile: [`profile.md`](profile.md).

---

## Shipped

| Client | Session | Verified by |
|--------|---------|-------------|
| Web | httpOnly `access_token` + `refresh_token` | `requireAuthFromRequest` |
| Mobile (future) | `Authorization: Bearer` | Same |

Web `isAuthenticated` = `GET /api/v1/auth/me` succeeding — never NextAuth `useSession()` alone.

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/auth/register` | Credentials signup |
| `POST` | `/api/v1/auth/login` | Credentials; sets REST cookies |
| `POST` | `/api/v1/auth/logout` | Clear REST cookies |
| `POST` | `/api/v1/auth/refresh` | Rotate access; rejects `isActive: false` |
| `GET` | `/api/v1/auth/me` | Session probe |
| `POST` | `/api/v1/auth/session` | Google bridge → REST cookies |
| `POST` | `/api/v1/auth/confirm-email` | Email confirm |
| `POST` | `/api/v1/auth/request-email-confirmation` | Resend |
| `POST` | `/api/v1/auth/request-password-reset` | Start reset |
| `POST` | `/api/v1/auth/reset-password` | Finish reset |

**Credentials:** `loginWithCredentials` → cookies; redirect `/home` or safe `?next=` (`lib/navigation/postAuthRedirect.ts`). `/` is guest landing.

**Google:** NextAuth is **transport only** → `findOrCreateFromGoogle` → client `ensureRestSession({ nextAuthUserId })` when `/auth/me` is 401. Linking: [`lib/auth/googleAccountLinking.ts`](../../lib/auth/googleAccountLinking.ts).

**Client:** `useAppAuth()` = session observer (`lib/api/auth/session.ts`). Profile/nav = TanStack (`useUserProfile`, `useUserNavigation`). `apiFetch` retries once on 401 via refresh. Do not retry refresh on login/register/logout/session/`/auth/me`.

**Deactivate:** `requireAuthFromRequest` live-checks `User.isActive`. Refresh also rejects inactive users. `DELETE /users/me` bumps `refreshSessionVersion`.

**Logout:** navigate to `/` first → NextAuth `signOut({ redirect: false })` if needed → `POST /auth/logout`. Never land on `/signin`.

Do not reintroduce RSC service prefetch that seeds entity views (expired access cookie looked like a guest).
