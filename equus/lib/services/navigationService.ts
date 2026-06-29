/**
 * User-owned navigation flags — which "My own" header links to show.
 *
 * Called by `GET /api/v1/users/me/navigation`. Collaborations are excluded;
 * only role profiles linked on the User document (and horses via mainOwnerUserId) count.
 */

import Horse from "@/models/Horse.ts";
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
  const user = await User.findById(userId)
    .select(
      "stableProfileIds breederProfileIds ridingClubProfileIds transportProfileIds trainerProfileId veterinaryProfileId coachProfileId groomProfileId farrierProfileId riderProfileId",
    )
    .lean();

  if (!user) {
    return { ...EMPTY_OWNED };
  }

  const ownsHorse = (await Horse.exists({ mainOwnerUserId: userId })) !== null;

  return {
    stables: (user.stableProfileIds?.length ?? 0) > 0,
    veterinaries: Boolean(user.veterinaryProfileId),
    transport: (user.transportProfileIds?.length ?? 0) > 0,
    breeders: (user.breederProfileIds?.length ?? 0) > 0,
    coaches: Boolean(user.coachProfileId),
    horses: ownsHorse,
    ridingClubs: (user.ridingClubProfileIds?.length ?? 0) > 0,
    trainers: Boolean(user.trainerProfileId),
    groomers: Boolean(user.groomProfileId),
    farriers: Boolean(user.farrierProfileId),
    riders: Boolean(user.riderProfileId),
  };
}
