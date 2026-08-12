# Pedigree Connection — Horse-to-Horse Sire/Dam Invitation System

## Problem

The Profile tab's Pedigree section currently has four plain text inputs (`sireName`, `sireId`, `damName`, `damId`). These should be replaced with a connection system that links to real horse profiles in the app — either existing horses (with owner consent) or invited horses (via owner email).

## Data Model

### Pedigree Schema (`models/sharedSchemas/pedigree.ts`)

| Old Field | Change | New Field | Type |
|-----------|--------|-----------|------|
| `sireName` | kept | `sireName` | `String` (denormalized display name) |
| `sireId` | **removed** | — | — |
| `damName` | kept | `damName` | `String` (denormalized display name) |
| `damId` | **removed** | — | — |
| — | added | `sireHorseId` | `Schema.Types.ObjectId`, ref `"Horse"` |
| — | added | `damHorseId` | `Schema.Types.ObjectId`, ref `"Horse"` |

Kept unchanged: `breederAccountId`, `bloodlineNotes`, `registryUrl`.

`sireName`/`damName` remain as denormalized snapshots — set when the connection is established (from the referenced horse's name or the invited horse name). They provide display resilience if the referenced horse is soft-deleted.

### OwnershipTransfer Model

New enum values in `ownershipTransferKindEnums`:
- `"connect_sire"` — invite to connect as sire
- `"connect_dam"` — invite to connect as dam

New optional fields on the `OwnershipTransfer` schema:
- `pedigreeRole`: `{ type: String, enum: ["sire", "dam"] }` — which role the invited horse fills
- `connectedHorseId`: `{ type: Schema.Types.ObjectId, ref: "Horse" }` — the existing sire/dam horse ID (set when the horse is already in the system)
- `connectedHorseName`: `{ type: String }` — the horse name to use (from search result, or user-provided for email fallback)

### Horse Model (`models/Horse.ts`)

No explicit changes needed — it uses `pedigreeSchema` which updates automatically.

## Consent Flow

Every pedigree connection requires explicit consent from the sire/dam horse owner (data integrity — prevents false pedigree claims).

### Flow: Existing Horse Found

```
User searches for sire/dam
  → finds existing horse
  → clicks "Connect as Sire/Dam"
  → POST /api/v1/ownership-transfers
    { entityType: "horse", entityId: myHorseId,
      transferKind: "connect_sire" | "connect_dam",
      receiverUserId: ownerOfFoundHorse,
      connectedHorseId: foundHorseId,
      connectedHorseName: foundHorseName,
      pedigreeRole: "sire" | "dam" }
  → OwnershipTransfer created (status: "pending")
  → Sire/dam owner sees in their inbox at /ownership-transfers
  → Accepts:
    1. Sets myHorse.pedigree.sireHorseId = foundHorseId
    2. Sets myHorse.pedigree.sireName = foundHorseName
    3. Sets OwnershipTransfer status to "accepted"
  → Declines: nothing changes
```

### Flow: Horse Not Found (Email Invite)

```
User searches for sire/dam (no results)
  → enters owner email + horse name in email fallback
  → clicks "Invite"
  → POST /api/v1/ownership-transfers
    { entityType: "horse", entityId: myHorseId,
      transferKind: "connect_sire" | "connect_dam",
      invitedEmail: owner@email.com,
      invitedName: ownerName,
      connectedHorseName: requestedHorseName,
      pedigreeRole: "sire" | "dam" }
  → OwnershipTransfer created (status: "pending")
  → Owner receives email with signup/accept link
  → Signs up (if no account) + accepts
  → On accept:
    1. Creates new Horse document (name from connectedHorseName, mainOwnerUserId = invited owner)
    2. Sets myHorse.pedigree.sireHorseId = newHorse._id
    3. Sets myHorse.pedigree.sireName = connectedHorseName
    4. Sets OwnershipTransfer status to "accepted"
```

### OwnershipTransfer Service Changes

In `applyEntityOwnershipChange` (ownershipTransferService.ts), add cases for `"connect_sire"` and `"connect_dam"`:

- If `connectedHorseId` is set (existing horse): verify the horse exists, then update the requesting horse's pedigree with the reference and denormalized name.
- If `connectedHorseId` is not set (invite): create a new Horse document using `connectedHorseName` as the name, set the requesting user as the creator, set the invited user as `mainOwnerUserId`, then update the requesting horse's pedigree.

## New API: Horse Search

### `GET /api/v1/horses/search?q=...`

Searches across: `name`, `registeredName`, `registryId`, `microchipId`, `passportNumber`, and the owner's email (via populate or lookup).

**Response:**
```json
{
  "results": [
    {
      "id": "horseId",
      "name": "Horse Name",
      "registeredName": "Registered Name",
      "ownerName": "Owner Name",
      "ownerEmail": "owner@email.com",
      "ownerId": "userId"
    }
  ]
}
```

**Auth:** Any authenticated user can search.

**Limits:** Max 20 results, minimum 2 chars query.

## New Hook: `useHorseSearch`

Location: `hooks/queries/useHorseSearch.ts`

Parallel to `useEntitySearch`:
```ts
export function useHorseSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.search.horses(query),
    queryFn: () => fetchHorseSearch(query),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
```

## New Component: `HorseInviteSection`

Location: `components/shared/horse-invite-section.tsx`

UI pattern matches `UserInviteSection` but adapted for horse search:

```ts
type HorseInviteSectionProps = {
  role: "sire" | "dam";
  currentHorseId?: string;
  currentHorseName?: string;
  isConnecting: boolean;
  onConnect: (horseId: string, horseName: string, ownerId: string) => void;
  onInviteOwner: (email: string, ownerName: string, horseName: string) => void;
  onDisconnect: () => void;
  labels: HorseInviteLabels;
};
```

States:
- **Empty/no connection:** Show search input
- **Searching:** Show spinner + results
- **No results:** Show email fallback toggle, then email + horse name inputs
- **Connected:** Show current horse card with name + "Disconnect" button

Component is self-contained (owns search state, debounce). Does not use React Hook Form — it calls mutations directly.

## PedigreeSection Changes

Location: `components/horses/profile/pedigree-section.tsx`

Replaces the 4 text fields with two `HorseInviteSection` instances (Sire + Dam). `bloodlineNotes` textarea stays.

The section is no longer a pure form section — it uses its own mutations for connect/disconnect and only uses React Hook Form for `bloodlineNotes`.

### Profile Form Changes

- `pedigreeFormSchema` in validations: remove `sireId`, `damId`
- `buildPedigreePatch` in `horseProfilePatch.ts`: remove `sireId`, `damId` from the patch builder
- `emptyProfileFormValues` / `toProfileFormValues`: remove `sireId`, `damId`

### Profile Client Changes

The `PedigreeSection` now needs `horseId` and the horse data (to show current connections). Pass these as props instead of only `control`.

## Form & Validation Updates

### Client-side (`horseForms.ts`)

```ts
const pedigreeFormSchema = z.object({
  sireName: optionalTrimmedString(120),
  damName: optionalTrimmedString(120),
  bloodlineNotes: optionalTrimmedString(1000),
});
```

Removed: `sireId`, `damId`.

### Server-side (`horse.ts` — API Zod)

```ts
const horsePedigreeSchema = z.object({
  sireName: z.string().trim().max(120).optional(),
  damName: z.string().trim().max(120).optional(),
  sireHorseId: z.string().optional(),
  damHorseId: z.string().optional(),
  bloodlineNotes: z.string().trim().optional(),
}).optional();
```

### OwnershipTransfer Zod (`ownershipTransfer.ts`)

Update `createOwnershipTransferSchema` to:
- Accept `"connect_sire"` and `"connect_dam"` as valid `transferKind` values
- For these kinds: require `pedigreeRole`, require either `receiverUserId` (existing horse) or `invitedEmail` (new horse)
- Allow `connectedHorseId`, `connectedHorseName`

### Enums

Add to `ownershipTransferKindEnums`: `"connect_sire"`, `"connect_dam"`

## i18n Updates

### New messages in `en.json` / `es.json` (horseProfile namespace):

```json
"sireLabel": "Sire (father)",
"sireDescription": "Search by horse name, registered name, registry ID, microchip, passport, or owner email",
"damLabel": "Dam (mother)",
"damDescription": "Search by horse name, registered name, registry ID, microchip, passport, or owner email",
"connectAsSire": "Connect as Sire",
"connectAsDam": "Connect as Dam",
"disconnect": "Disconnect",
"pedigreeConnectInvited": "Invitation sent to {name}",
"pedigreeConnectConnected": "Connected to {name}",
"pedigreeConnectFailed": "Failed to send invitation",
"pedigreeDisconnectFailed": "Failed to disconnect"
```

## Files To Change

| File | Change |
|------|--------|
| `models/sharedSchemas/pedigree.ts` | Add `sireHorseId`, `damHorseId`; remove `sireId`, `damId` |
| `models/OwnershipTransfer.ts` | Add `pedigreeRole`, `connectedHorseId`, `connectedHorseName` fields |
| `utils/enums.ts` | Add `"connect_sire"`, `"connect_dam"` to `ownershipTransferKindEnums` |
| `lib/validations/horseForms.ts` | Remove `sireId`, `damId` from pedigree form schemas |
| `lib/validations/horse.ts` | Add `sireHorseId`, `damHorseId` to `horsePedigreeSchema`; remove `sireId`, `damId` |
| `lib/validations/ownershipTransfer.ts` | Allow new transfer kinds, validate `pedigreeRole`, etc. |
| `lib/services/ownershipTransferService.ts` | Handle `connect_sire`/`connect_dam` in `createOwnershipTransfer` and `applyEntityOwnershipChange` |
| `lib/utils/horseProfilePatch.ts` | Remove `sireId`, `damId` from patch builders |
| `models/Horse.ts` | No changes needed (uses pedigreeSchema) |
| `app/api/v1/horses/search/route.ts` | **New** — horse search endpoint |
| `hooks/queries/useHorseSearch.ts` | **New** — search hook |
| `components/shared/horse-invite-section.tsx` | **New** — reusable horse search+invite component |
| `components/horses/profile/pedigree-section.tsx` | Rewrite — replace text inputs with HorseInviteSection |
| `app/[locale]/horses/[horseId]/profile/client.tsx` | Update PedigreeSection props, remove sireId/damId from form |
| `hooks/queries/useOwnershipTransfer.ts` | Accept new transfer kinds |
| `components/invites/ownership-transfers-content.tsx` | Handle display of `connect_sire`/`connect_dam` invitations |
| `messages/en.json` | Add new keys, remove `sireId`/`damId` |
| `messages/es.json` | Add new keys, remove `sireId`/`damId` |

## Query Keys

Add to `queryKeys.search`:
```ts
horses: (q: string) => ["horse-search", q],
```

## Edge Cases

- **Disconnect:** If a horse is disconnected as sire/dam, set the ref to `undefined` (Mongoose `$unset`). The denormalized name can be cleared or kept as historical record — clear it.
- **Circular reference:** Horse A cannot be its own sire or dam. Validate in the service.
- **Gender validation on site:** Sire should be male, dam should be female. Validate in the service (check `horse.sex`).
- **Same horse connected as both sire and dam:** Invalid. Validate that the same horse cannot be both.
- **Horse already has a sire/dam:** Replacing requires disconnecting first. The UI shows the current connection; the user must disconnect before reconnecting.
- **Soft-deleted horses:** Should not appear in search results (filter by `isActive: true`).
- **Race condition on accept:** `applyEntityOwnershipChange` already re-verifies preconditions at accept time — the same pattern protects pedigree connections.
