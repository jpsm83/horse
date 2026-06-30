/**
 * Map a breeder document to a public discovery card payload.
 *
 * Called by breederService after discovery access checks pass. Business contact
 * comes from entity fields (not User.preferences).
 */

export type PublicBreederContact = {
  email?: string;
  phone?: string;
};

export type PublicBreederCard = {
  id: string;
  operationName: string;
  description?: string;
  city?: string;
  country?: string;
  disciplines?: string[];
  bloodlines?: string[];
  isPublic?: boolean;
  contact: PublicBreederContact;
};

export function buildPublicBreederCard(breeder: Record<string, unknown>): PublicBreederCard {
  const address = (breeder.address ?? {}) as Record<string, unknown>;

  return {
    id: String(breeder._id),
    operationName: breeder.operationName as string,
    description: breeder.description as string | undefined,
    city: address.city as string | undefined,
    country: address.country as string | undefined,
    disciplines: breeder.disciplines as string[] | undefined,
    bloodlines: breeder.bloodlines as string[] | undefined,
    isPublic: breeder.isPublic as boolean | undefined,
    contact: {
      email: breeder.email as string | undefined,
      phone: breeder.phoneNumber as string | undefined,
    },
  };
}
