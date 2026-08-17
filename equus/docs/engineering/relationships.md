# Horse ↔ provider relationships

**Job:** `Relationship` collection — horse to a provider **role profile**. Not workplace.  
**Upstream:** [`../features/horseModule.md`](../features/horseModule.md), [`../product/graph-and-identity.md`](../product/graph-and-identity.md)  
**Status:** **aligned**  
**Code roots:** `models/Relationship.ts`, `lib/services/relationshipService.ts`, `lib/validations/relationship.ts`, `app/api/v1/relationships/`, `app/api/v1/horses/[id]/relationships/`

Workplace: [`workplace.md`](workplace.md). Inbox on home: [`myGraph.md`](myGraph.md).

---

## Shipped

Horse owner / co-owner **only** creates. Provider accepts/declines. Provider-initiated horse links are out of scope. Established rows are permanent (`ended` keeps history).

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/discover/providers?type=&q=&scope=horse` | Invite picker |
| `POST` | `/api/v1/relationships` | Owner sends invite (`receiverAccountId` or `invitedEmail`) |
| `GET` | `/api/v1/users/me/relationships?status=pending` | Received inbox |
| `GET` | `/api/v1/horses/:id/relationships?status=pending` | Sent by owner |
| `PATCH` | `/api/v1/relationships/:id` | `{ status: accepted \| declined }` |
| `GET` | `/api/v1/invites/preview?ref=` | Signup landing (unauth) |

Entity-owned types (`stable`, `breeder`, `ridingClub`, `transport`) require `receiverAccountId`. Email: `sendRelationshipInviteEmail` (`/signup?ref=` or `/relationships?relationship=`).

Stable staff ops dual-gate: [`workplace.md`](workplace.md).
