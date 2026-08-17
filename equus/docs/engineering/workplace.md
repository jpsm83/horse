# Workplace collaboration API

**Job:** `WorkplaceRelationship` — User collaborates at a **host role profile** (stable now). Not horse↔provider.  
**Upstream:** [`../features/workplaceRelationship.md`](../features/workplaceRelationship.md)  
**Status:** **aligned**  
**Code roots:** `models/WorkplaceRelationship.ts`, `lib/services/workplaceRelationshipService.ts`, `lib/validations/workplaceRelationship.ts`, `app/api/v1/role-profiles/`, `app/api/v1/users/me/workplaces/`, `app/api/v1/users/me/workplace-invitations/`

Horse↔provider invites: [`relationships.md`](relationships.md).

---

## Shipped

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/role-profiles/:roleType/:roleProfileId/workplace-relationships` | List collaborators on a host |
| `POST` | same | Host owner/admin invites a User (or email) |
| `PATCH` | `…/workplace-relationships/:relationshipId` | Update hierarchy/title |
| `DELETE` | same | End collaboration (`endedAt`) |
| `GET` | `/api/v1/users/me/workplaces` | Hosts this user owns or collaborates at |
| `GET` | `/api/v1/users/me/workplace-invitations` | Pending invites received |
| `POST` | `…/workplace-invitations/:id/accept` (and `decline`) | Invitee response |
| `GET`/`POST` | `…/role-profiles/…/staff` | Legacy aliases of list/invite |

`hierarchyLevel`: `admin` \| `manager` \| `staff`. Collaborators are **Users**; they do not receive `mainOwnerUserId` on the host.

Barn ops on a hosted horse require **both** an accepted horse↔stable `Relationship` **and** an active workplace at that stable. No extra groom↔horse link required for barn staff.

Host types in code: stable, breeder, transport, riding club (`BusinessRoleType`). Launch product: **stable** is the paid host.

UI: `/user/[userId]/workplace`. Email: `lib/email/sendStaffInviteEmail.ts`. Direct horse↔provider (no stable): [`relationships.md`](relationships.md).