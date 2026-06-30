/**
 * Map a groom document to a public discovery card payload.
 *
 * Called by groomService after discovery access checks pass. Business contact
 * comes from entity fields (not User.preferences).
 */

export type PublicGroomContact = {
  email?: string;
  phone?: string;
};

export type PublicGroomCard = {
  id: string;
  displayName: string;
  bio?: string;
  city?: string;
  country?: string;
  specialties?: string[];
  experienceYears?: number;
  acceptsNewClients?: boolean;
  isPublic?: boolean;
  contact: PublicGroomContact;
};

export function buildPublicGroomCard(groom: Record<string, unknown>): PublicGroomCard {
  const address = (groom.address ?? {}) as Record<string, unknown>;

  return {
    id: String(groom._id),
    displayName: groom.displayName as string,
    bio: groom.bio as string | undefined,
    city: address.city as string | undefined,
    country: address.country as string | undefined,
    specialties: groom.specialties as string[] | undefined,
    experienceYears: groom.experienceYears as number | undefined,
    acceptsNewClients: groom.acceptsNewClients as boolean | undefined,
    isPublic: groom.isPublic as boolean | undefined,
    contact: {
      email: groom.email as string | undefined,
      phone: groom.phoneNumber as string | undefined,
    },
  };
}
