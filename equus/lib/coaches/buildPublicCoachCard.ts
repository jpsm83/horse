/**
 * Map a coach document to a public discovery card payload.
 *
 * Called by coachService after discovery access checks pass. Business contact
 * comes from entity fields (not User.preferences).
 */

export type PublicCoachContact = {
  email?: string;
  phone?: string;
};

export type PublicCoachCard = {
  id: string;
  displayName: string;
  bio?: string;
  city?: string;
  country?: string;
  disciplines?: string[];
  competitionLevels?: string[];
  preparationServices?: string[];
  experienceYears?: number;
  acceptsNewClients?: boolean;
  isPublic?: boolean;
  contact: PublicCoachContact;
};

export function buildPublicCoachCard(coach: Record<string, unknown>): PublicCoachCard {
  const address = (coach.address ?? {}) as Record<string, unknown>;

  return {
    id: String(coach._id),
    displayName: coach.displayName as string,
    bio: coach.bio as string | undefined,
    city: address.city as string | undefined,
    country: address.country as string | undefined,
    disciplines: coach.disciplines as string[] | undefined,
    competitionLevels: coach.competitionLevels as string[] | undefined,
    preparationServices: coach.preparationServices as string[] | undefined,
    experienceYears: coach.experienceYears as number | undefined,
    acceptsNewClients: coach.acceptsNewClients as boolean | undefined,
    isPublic: coach.isPublic as boolean | undefined,
    contact: {
      email: coach.email as string | undefined,
      phone: coach.phoneNumber as string | undefined,
    },
  };
}
