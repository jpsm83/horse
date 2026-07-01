/**
 * User-owned navigation flags — which "My own" header links to show.
 *
 * Called by `GET /api/v1/users/me/navigation`. Collaborations are excluded.
 * Entity-owned roles use mainOwnerUserId / coOwners[] queries; position-linked roles
 * use `*ProfileId` on User. Inactive tombstones are excluded from operator nav.
 */

import { ownedByUserQuery } from "@/lib/ownership/entityOwnership.ts";
import { mergeActiveOnly, profileLinkIsActive } from "@/lib/lifecycle/activeQuery.ts";
import Breeder from "@/models/Breeder.ts";
import Coach from "@/models/Coach.ts";
import Farrier from "@/models/Farrier.ts";
import Groom from "@/models/Groom.ts";
import Horse from "@/models/Horse.ts";
import RidingClub from "@/models/RidingClub.ts";
import Rider from "@/models/Rider.ts";
import Stable from "@/models/Stable.ts";
import Trainer from "@/models/Trainer.ts";
import Transport from "@/models/Transport.ts";
import User from "@/models/User.ts";
import Veterinary from "@/models/Veterinary.ts";

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

  const [user, ownsHorse, ownsStable, ownsRidingClub, ownsTransport, ownsBreeder] =
    await Promise.all([
      User.findById(userId)
        .select(
          "trainerProfileId veterinaryProfileId coachProfileId groomProfileId farrierProfileId riderProfileId isActive",
        )
        .lean(),
      Horse.exists(mergeActiveOnly(ownershipQuery)),
      Stable.exists(mergeActiveOnly(ownershipQuery)),
      RidingClub.exists(mergeActiveOnly(ownershipQuery)),
      Transport.exists(mergeActiveOnly(ownershipQuery)),
      Breeder.exists(mergeActiveOnly(ownershipQuery)),
    ]);

  if (!user || user.isActive === false) {
    return { ...EMPTY_OWNED };
  }

  const [hasTrainer, hasVeterinary, hasCoach, hasGroom, hasFarrier, hasRider] =
    await Promise.all([
      profileLinkIsActive(Trainer, user.trainerProfileId),
      profileLinkIsActive(Veterinary, user.veterinaryProfileId),
      profileLinkIsActive(Coach, user.coachProfileId),
      profileLinkIsActive(Groom, user.groomProfileId),
      profileLinkIsActive(Farrier, user.farrierProfileId),
      profileLinkIsActive(Rider, user.riderProfileId),
    ]);

  return {
    stables: ownsStable !== null,
    veterinaries: hasVeterinary,
    transport: ownsTransport !== null,
    breeders: ownsBreeder !== null,
    coaches: hasCoach,
    horses: ownsHorse !== null,
    ridingClubs: ownsRidingClub !== null,
    trainers: hasTrainer,
    groomers: hasGroom,
    farriers: hasFarrier,
    riders: hasRider,
  };
}
