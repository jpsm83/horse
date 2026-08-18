# My Graph — `/home` inbox

**Job:** Signed-in home is an **action inbox**, not a roster.  
**Upstream:** [`../features/myGraph.md`](../features/myGraph.md)  
**Status:** **aligned**  
**Code roots:** `app/[locale]/home/`, `components/home/`, `lib/navigation/postAuthRedirect.ts` (`USER_HOME_PATH`)

---

## Shipped

| Piece | Behavior |
|-------|----------|
| Route | `/home` after login (`resolvePostAuthPath`) |
| Gate | Unauthenticated → sign-in |
| Data | Pending `Relationship` + `WorkplaceRelationship` invites + waiting-transfer horses (`GET /api/v1/users/me/waiting-transfer-horses`) |
| UI | Welcome hero + **action inbox** (accept/decline + deep links); waiting-transfer section; empty → Horse/Stable modules |

---

## Target

Same as shipped. No roster, favorites catalog, or last-used module on home.
