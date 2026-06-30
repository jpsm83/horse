/**
 * Map a stable document to a public discovery card payload.
 *
 * Called by stableService after discovery access checks pass. Business contact
 * comes from entity fields (not User.preferences).
 */

export type PublicStableContact = {
  email?: string;
  phone?: string;
};

export type PublicStableCard = {
  id: string;
  tradeName: string;
  description?: string;
  city?: string;
  country?: string;
  disciplines?: string[];
  services?: string[];
  acceptsNewHorses?: boolean;
  isPublic?: boolean;
  contact: PublicStableContact;
};

export function buildPublicStableCard(stable: Record<string, unknown>): PublicStableCard {
  const address = (stable.address ?? {}) as Record<string, unknown>;

  return {
    id: String(stable._id),
    tradeName: stable.tradeName as string,
    description: stable.description as string | undefined,
    city: address.city as string | undefined,
    country: address.country as string | undefined,
    disciplines: stable.disciplines as string[] | undefined,
    services: stable.services as string[] | undefined,
    acceptsNewHorses: stable.acceptsNewHorses as boolean | undefined,
    isPublic: stable.isPublic as boolean | undefined,
    contact: {
      email: stable.email as string | undefined,
      phone: stable.phoneNumber as string | undefined,
    },
  };
}
