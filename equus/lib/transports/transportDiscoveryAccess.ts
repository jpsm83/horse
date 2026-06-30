/**
 * Transport discovery visibility checks.
 *
 * Determines whether a requester may view a transport company in discovery contexts
 * using `Transport.isPublic` plus ownership/collaboration/relationship context.
 */

import { userOwnsEntity } from "@/lib/ownership/entityOwnership.ts";

export type TransportDiscoveryRequesterContext = {
  requesterUserId?: string;
  hasAcceptedHorseTransportRelationship?: boolean;
  hasActiveCollaboration?: boolean;
};

export function canViewTransportDiscovery(
  transport: Record<string, unknown>,
  context: TransportDiscoveryRequesterContext,
): boolean {
  const requesterUserId = context.requesterUserId;
  const isOwner =
    typeof requesterUserId === "string" &&
    requesterUserId.length > 0 &&
    userOwnsEntity(requesterUserId, transport);

  if (isOwner) {
    return true;
  }

  const isPublic = transport.isPublic !== false;
  if (isPublic) {
    return true;
  }

  return (
    context.hasAcceptedHorseTransportRelationship === true ||
    context.hasActiveCollaboration === true
  );
}
