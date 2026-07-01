/**
 * Map a riding club document to a public discovery card payload.
 *
 * Called by ridingClubService after discovery access checks pass. Business contact
 * comes from entity fields (not User.preferences).
 */

export type PublicRidingClubContact = {
  email?: string;
  phone?: string;
};

export type PublicRidingClubCard = {
  id: string;
  clubName: string;
  description?: string;
  city?: string;
  country?: string;
  disciplines?: string[];
  facilities?: string[];
  membershipInfo?: string;
  membershipFee?: number;
  acceptsNewMembers?: boolean;
  isPublic?: boolean;
  contact: PublicRidingClubContact;
};

export function buildPublicRidingClubCard(
  ridingClub: Record<string, unknown>,
): PublicRidingClubCard {
  const address = (ridingClub.address ?? {}) as Record<string, unknown>;

  return {
    id: String(ridingClub._id),
    clubName: ridingClub.clubName as string,
    description: ridingClub.description as string | undefined,
    city: address.city as string | undefined,
    country: address.country as string | undefined,
    disciplines: ridingClub.disciplines as string[] | undefined,
    facilities: ridingClub.facilities as string[] | undefined,
    membershipInfo: ridingClub.membershipInfo as string | undefined,
    membershipFee: ridingClub.membershipFee as number | undefined,
    acceptsNewMembers: ridingClub.acceptsNewMembers as boolean | undefined,
    isPublic: ridingClub.isPublic as boolean | undefined,
    contact: {
      email: ridingClub.email as string | undefined,
      phone: ridingClub.phoneNumber as string | undefined,
    },
  };
}
