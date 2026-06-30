/**
 * Map a transport document to a public discovery card payload.
 *
 * Called by transportService after discovery access checks pass. Business contact
 * comes from entity fields (not User.preferences).
 */

export type PublicTransportContact = {
  email?: string;
  phone?: string;
  emergencyPhone?: string;
};

export type PublicTransportCard = {
  id: string;
  companyName: string;
  description?: string;
  city?: string;
  country?: string;
  specialties?: string[];
  serviceAreas?: string[];
  acceptsNewBookings?: boolean;
  isPublic?: boolean;
  contact: PublicTransportContact;
};

export function buildPublicTransportCard(
  transport: Record<string, unknown>,
): PublicTransportCard {
  const address = (transport.address ?? {}) as Record<string, unknown>;

  return {
    id: String(transport._id),
    companyName: transport.companyName as string,
    description: transport.description as string | undefined,
    city: address.city as string | undefined,
    country: address.country as string | undefined,
    specialties: transport.specialties as string[] | undefined,
    serviceAreas: transport.serviceAreas as string[] | undefined,
    acceptsNewBookings: transport.acceptsNewBookings as boolean | undefined,
    isPublic: transport.isPublic as boolean | undefined,
    contact: {
      email: transport.email as string | undefined,
      phone: transport.phoneNumber as string | undefined,
      emergencyPhone: transport.emergencyPhoneNumber as string | undefined,
    },
  };
}
