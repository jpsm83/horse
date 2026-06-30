/**
 * Map a farrier document to a public discovery card payload.
 *
 * Called by farrierService after discovery access checks pass. Business contact
 * comes from entity fields (not User.preferences).
 */

export type PublicFarrierContact = {
  email?: string;
  phone?: string;
};

export type PublicFarrierCard = {
  id: string;
  displayName: string;
  bio?: string;
  city?: string;
  country?: string;
  experienceYears?: number;
  serviceAreaKm?: number;
  acceptsNewClients?: boolean;
  isPublic?: boolean;
  contact: PublicFarrierContact;
};

export function buildPublicFarrierCard(farrier: Record<string, unknown>): PublicFarrierCard {
  const address = (farrier.address ?? {}) as Record<string, unknown>;

  return {
    id: String(farrier._id),
    displayName: farrier.displayName as string,
    bio: farrier.bio as string | undefined,
    city: address.city as string | undefined,
    country: address.country as string | undefined,
    experienceYears: farrier.experienceYears as number | undefined,
    serviceAreaKm: farrier.serviceAreaKm as number | undefined,
    acceptsNewClients: farrier.acceptsNewClients as boolean | undefined,
    isPublic: farrier.isPublic as boolean | undefined,
    contact: {
      email: farrier.email as string | undefined,
      phone: farrier.phoneNumber as string | undefined,
    },
  };
}
