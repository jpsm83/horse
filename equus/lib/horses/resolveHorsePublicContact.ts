/**
 * Resolve public horse contact from the main owner (subject to owner privacy).
 */

import {
  toPublicUserIdentity,
  type UserVisibilityAudience,
} from "@/lib/privacy/userVisibility.ts";

export type PublicHorseContact = {
  useOwnerContact: true;
  name?: string;
  phone?: string;
  email?: string;
};

function joinName(firstName?: string, lastName?: string): string | undefined {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name || undefined;
}

export function resolveHorsePublicContact(
  _horse: Record<string, unknown>,
  ownerUser: Record<string, unknown> | null | undefined,
  audience: UserVisibilityAudience,
): PublicHorseContact {
  const ownerIdentity = toPublicUserIdentity(ownerUser, audience);
  return {
    useOwnerContact: true,
    name: joinName(ownerIdentity?.firstName, ownerIdentity?.lastName),
    phone: ownerIdentity?.phone,
    email: ownerIdentity?.email,
  };
}
