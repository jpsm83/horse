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
| Data | Pending `Relationship` + `WorkplaceRelationship` invites |
| UI | Welcome hero + **action inbox** (accept/decline + deep links); empty → Horse/Stable modules |

Waiting-transfer rows omitted until the horse flag exists.

---

## Target

Same as shipped, plus waiting-transfer horses when the flag ships. No roster, favorites catalog, or last-used module on home.
