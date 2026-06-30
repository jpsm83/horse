/**
 * Resolve public horse contact based on horse contactDisplay + owner visibility policy.
 */

import {
  toPublicUserIdentity,
  type UserVisibilityAudience,
} from "@/lib/privacy/userVisibility.ts";

export type PublicHorseContact = {
  useOwnerContact: boolean;
  name?: string;
  phone?: string;
  email?: string;
};

function joinName(firstName?: string, lastName?: string): string | undefined {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name || undefined;
}

export function resolveHorsePublicContact(
  horse: Record<string, unknown>,
  ownerUser: Record<string, unknown> | null | undefined,
  audience: UserVisibilityAudience,
): PublicHorseContact {
  const contactDisplay = (horse.contactDisplay ?? {}) as Record<string, unknown>;
  const useOwnerContact = contactDisplay.useOwnerContact !== false;

  if (!useOwnerContact) {
    return {
      useOwnerContact: false,
      name: contactDisplay.name as string | undefined,
      phone: contactDisplay.phone as string | undefined,
      email: contactDisplay.email as string | undefined,
    };
  }

  const ownerIdentity = toPublicUserIdentity(ownerUser, audience);
  return {
    useOwnerContact: true,
    name: joinName(ownerIdentity?.firstName, ownerIdentity?.lastName),
    phone: ownerIdentity?.phone,
    email: ownerIdentity?.email,
  };
}

