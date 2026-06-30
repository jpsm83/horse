/**
 * Map a veterinary document to a public discovery card payload.
 *
 * Called by veterinaryService after discovery access checks pass. Business contact
 * comes from entity fields (not User.preferences).
 */

export type PublicVeterinaryContact = {
  email?: string;
  phone?: string;
  emergencyPhone?: string;
};

export type PublicVeterinarySpecialization = {
  name: string;
  description?: string;
};

export type PublicVeterinaryCard = {
  id: string;
  practiceName: string;
  description?: string;
  city?: string;
  country?: string;
  equineSpecializations?: PublicVeterinarySpecialization[];
  emergencyAvailability?: boolean;
  serviceAreaKm?: number;
  acceptsNewPatients?: boolean;
  isPublic?: boolean;
  contact: PublicVeterinaryContact;
};

export function buildPublicVeterinaryCard(
  veterinary: Record<string, unknown>,
): PublicVeterinaryCard {
  const address = (veterinary.address ?? {}) as Record<string, unknown>;

  return {
    id: String(veterinary._id),
    practiceName: veterinary.practiceName as string,
    description: veterinary.description as string | undefined,
    city: address.city as string | undefined,
    country: address.country as string | undefined,
    equineSpecializations: veterinary.equineSpecializations as
      | PublicVeterinarySpecialization[]
      | undefined,
    emergencyAvailability: veterinary.emergencyAvailability as boolean | undefined,
    serviceAreaKm: veterinary.serviceAreaKm as number | undefined,
    acceptsNewPatients: veterinary.acceptsNewPatients as boolean | undefined,
    isPublic: veterinary.isPublic as boolean | undefined,
    contact: {
      email: veterinary.email as string | undefined,
      phone: veterinary.phoneNumber as string | undefined,
      emergencyPhone: veterinary.emergencyPhoneNumber as string | undefined,
    },
  };
}
