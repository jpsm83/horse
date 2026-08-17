# My Graph — `/home` inbox

**Job:** Signed-in home is an **action inbox**, not a roster.  
**Upstream:** [`../features/myGraph.md`](../features/myGraph.md)  
**Status:** **drift**  
**Code roots:** `app/[locale]/home/`, `components/home/`, `lib/navigation/postAuthRedirect.ts` (`USER_HOME_PATH`)

---

## Shipped

| Piece | Behavior |
|-------|----------|
| Route | `/home` after login (`resolvePostAuthPath`) |
| Gate | Unauthenticated → sign-in |
| Data | `useUserProfile` + `useUserNavigation` |
| UI | Welcome hero, **add horse** card, **owned-entity subsection** cards (horses/stables/…) |

This is a personal roster / create hub. It is **not** pending invites + waiting-transfer.

---

## Target

Home shows **only**:

1. Pending horse↔provider `Relationship` invites  
2. Pending `WorkplaceRelationship` invites  
3. Horses this user still `mainOwner`s that are **waiting-transfer** (barn-created, real owner not claimed)

Deep-link those rows to Connect / ownership-transfer / horse. Empty copy points to Horse and Stable **modules** (lists default **mine**).

**Do not** put “all my horses”, “all my stables”, or the favorites catalog on home. Last-used module is not home.

Waiting-transfer is **not** in the codebase yet (`Horse` has no waiting-transfer flag). Inbox APIs already exist: [`relationships.md`](relationships.md), [`workplace.md`](workplace.md), [`ownershipTransfer.md`](ownershipTransfer.md).
