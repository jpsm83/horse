/**
 * User-owned navigation flags — which "My own" header links to show.
 *
 * Called by `GET /api/v1/users/me/navigation`. Collaborations are excluded.
 * Entity-owned roles use mainOwnerUserId / coOwners[] queries; position-linked roles
 * use `*ProfileId` on User.
 */

import { ownedByUserQuery } from "@/lib/ownership/entityOwnership.ts";
import Horse from "@/models/Horse.ts";
import RidingClub from "@/models/RidingClub.ts";
import Stable from "@/models/Stable.ts";
import Transport from "@/models/Transport.ts";
import User from "@/models/User.ts";

export type UserOwnedNavigation = {
  stables: boolean;
  veterinaries: boolean;
  transport: boolean;
  breeders: boolean;
  coaches: boolean;
  horses: boolean;
  ridingClubs: boolean;
  trainers: boolean;
  groomers: boolean;
  farriers: boolean;
  riders: boolean;
};

const EMPTY_OWNED: UserOwnedNavigation = {
  stables: false,
  veterinaries: false,
  transport: false,
  breeders: false,
  coaches: false,
  horses: false,
  ridingClubs: false,
  trainers: false,
  groomers: false,
  farriers: false,
  riders: false,
};

/** Resolve which owned-profile routes the signed-in user may see in the header. */
export async function getUserOwnedNavigation(userId: string): Promise<UserOwnedNavigation> {
  const ownershipQuery = ownedByUserQuery(userId);

  const [user, ownsHorse, ownsStable, ownsRidingClub, ownsTransport] = await Promise.all([
    User.findById(userId)
      .select(
        "breederProfileId trainerProfileId veterinaryProfileId coachProfileId groomProfileId farrierProfileId riderProfileId",
      )
      .lean(),
    Horse.exists(ownershipQuery),
    Stable.exists(ownershipQuery),
    RidingClub.exists(ownershipQuery),
    Transport.exists(ownershipQuery),
  ]);

  if (!user) {
    return { ...EMPTY_OWNED };
  }

  return {
    stables: ownsStable !== null,
    veterinaries: Boolean(user.veterinaryProfileId),
    transport: ownsTransport !== null,
    breeders: Boolean(user.breederProfileId),
    coaches: Boolean(user.coachProfileId),
    horses: ownsHorse !== null,
    ridingClubs: ownsRidingClub !== null,
    trainers: Boolean(user.trainerProfileId),
    groomers: Boolean(user.groomProfileId),
    farriers: Boolean(user.farrierProfileId),
    riders: Boolean(user.riderProfileId),
  };
}
