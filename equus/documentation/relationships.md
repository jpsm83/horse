# Horse relationships API

Consent and lifecycle links between a **horse** and a **provider** role profile (`Relationship` collection). Distinct from **workplace collaboration** (`WorkplaceRelationship`) — see [`workplaceRelationship.md`](../../documentation/workplaceRelationship.md).

Product flows: [`productFlows.md`](../../documentation/productFlows.md) Flow 6.

## Invitation policy

| Tier | Initiator | Receiver |
|------|-----------|----------|
| Horse ↔ provider | **Horse owner / co-owner only** | Provider accepts or declines |
| Host ↔ service staff | **Host entity owner / admin** (`WorkplaceRelationship`) | Service User accepts or declines |
| Service profiles | **Never initiate** | Inbox only |

Provider-initiated horse links (e.g. `vetAddedHorse`) are **out of scope**. Email variant `ownerInvitesProvider` is the only create path.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/v1/discover/providers?type=&q=&scope=horse` | Yes | Search provider profiles for invite picker |
| `POST` | `/api/v1/relationships` | Yes | Horse owner sends invite |
| `GET` | `/api/v1/users/me/relationships?status=pending` | Yes | List pending invites **received** by current user (inbox) |
| `GET` | `/api/v1/horses/:id/relationships?status=pending` | Yes | List pending invites **sent** by horse owner for that horse (hub UI) |
| `PATCH` | `/api/v1/relationships/:id` | Yes | Invitee accepts or declines |
| `GET` | `/api/v1/invites/preview?ref=` | No | Signup landing preview (relationship or staff) |

## Create invite (`POST /api/v1/relationships`)

Horse owner (main owner or co-owner) initiates a pending relationship.

**By provider profile id** (entity-owned or user-linked):

```json
{
  "horseId": "…",
  "relationshipType": "veterinary",
  "receiverAccountId": "…"
}
```

**By email** (user-linked types only — groom, trainer, veterinary, etc.):

```json
{
  "horseId": "…",
  "relationshipType": "groom",
  "invitedEmail": "groom@example.com",
  "invitedName": "Sam"
}
```

Entity-owned types (`stable`, `breeder`, `ridingClub`, `transport`) require `receiverAccountId`.

Validation: [`lib/validations/relationship.ts`](../lib/validations/relationship.ts).  
Business logic: [`lib/services/relationshipService.ts`](../lib/services/relationshipService.ts).

## Accept / decline

Invitee calls `PATCH /api/v1/relationships/:id` with `{ "status": "accepted" }` or `{ "status": "declined" }`.

Web UI: `/relationships` (deep link `/relationships?relationship={id}` from email for existing users).

## Email and signup flow

When an invite is created, [`sendRelationshipInviteEmail`](../lib/email/sendRelationshipInviteEmail.ts) sends:

- **New user:** signup link `/signup?ref={referralReference}` → register links invite via referral → redirect to `/relationships`
- **Existing user:** accept link `/relationships?relationship={id}`

Referral references use `REF-{uuid}` (not staff membership ObjectIds).

## Related modules

- Horse hub at `/my/horses/[horseId]` — owner invite pickers call discover + `POST /api/v1/relationships`.
- Barn staff operational access still requires **both** accepted horse ↔ stable `Relationship` and active `WorkplaceRelationship` — see user module §6.

## Discover providers (`GET /api/v1/discover/providers`)

Search profiles for the invite picker.

| Query | Values |
|-------|--------|
| `type` | Provider `relationshipType` (e.g. `veterinary`, `stable`) |
| `q` | Optional name/city filter |
| `limit` | Max results (default 20) |
| `scope` | `horse` (default, all 10 types) \| `host` (service types only, for future host staff UI) |

Returns `{ providers: [{ id, label, subtitle?, imageUrl? }] }`.
