/**
 * Map a trainer document to a public discovery card payload.
 *
 * Called by trainerService after discovery access checks pass. Business contact
 * comes from entity fields (not User.preferences).
 */

export type PublicTrainerContact = {
  email?: string;
  phone?: string;
};

export type PublicTrainerCard = {
  id: string;
  displayName: string;
  bio?: string;
  city?: string;
  country?: string;
  specialties?: string[];
  acceptsNewClients?: boolean;
  isPublic?: boolean;
  contact: PublicTrainerContact;
};

export function buildPublicTrainerCard(trainer: Record<string, unknown>): PublicTrainerCard {
  const address = (trainer.address ?? {}) as Record<string, unknown>;

  return {
    id: String(trainer._id),
    displayName: trainer.displayName as string,
    bio: trainer.bio as string | undefined,
    city: address.city as string | undefined,
    country: address.country as string | undefined,
    specialties: trainer.specialties as string[] | undefined,
    acceptsNewClients: trainer.acceptsNewClients as boolean | undefined,
    isPublic: trainer.isPublic as boolean | undefined,
    contact: {
      email: trainer.email as string | undefined,
      phone: trainer.phoneNumber as string | undefined,
    },
  };
}
