/**
 * Map a rider document to a public discovery card payload.
 *
 * Called by riderService after discovery access checks pass. Business contact
 * comes from entity fields (not User.preferences).
 */

export type PublicRiderContact = {
  email?: string;
  phone?: string;
};

export type PublicRiderCard = {
  id: string;
  displayName: string;
  bio?: string;
  city?: string;
  country?: string;
  disciplines?: string[];
  experienceYears?: number;
  competitionHighlights?: string[];
  acceptsNewClients?: boolean;
  isPublic?: boolean;
  contact: PublicRiderContact;
};

export function buildPublicRiderCard(rider: Record<string, unknown>): PublicRiderCard {
  const address = (rider.address ?? {}) as Record<string, unknown>;

  return {
    id: String(rider._id),
    displayName: rider.displayName as string,
    bio: rider.bio as string | undefined,
    city: address.city as string | undefined,
    country: address.country as string | undefined,
    disciplines: rider.disciplines as string[] | undefined,
    experienceYears: rider.experienceYears as number | undefined,
    competitionHighlights: rider.competitionHighlights as string[] | undefined,
    acceptsNewClients: rider.acceptsNewClients as boolean | undefined,
    isPublic: rider.isPublic as boolean | undefined,
    contact: {
      email: rider.email as string | undefined,
      phone: rider.phoneNumber as string | undefined,
    },
  };
}
