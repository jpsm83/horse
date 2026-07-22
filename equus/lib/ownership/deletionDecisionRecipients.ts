/**
 * Recipients who approve/decline Media and Document deletion requests.
 * Prefer proactive representatives; fall back to main owner + co-owners.
 */
import Horse from "@/models/Horse.ts";

type ArrayEntry = { userId?: unknown };

export async function getDeletionDecisionRecipients(horseId: string): Promise<string[]> {
  const horse = await Horse.findById(horseId)
    .select("mainOwnerUserId coOwners responsibles")
    .lean();
  if (!horse) return [];

  const responsibles = (horse.responsibles as ArrayEntry[] | undefined) ?? [];
  const responsibleIds = responsibles
    .filter((entry) => entry.userId != null)
    .map((entry) => String(entry.userId));

  if (responsibleIds.length > 0) {
    return [...new Set(responsibleIds)];
  }

  const ids: string[] = [String(horse.mainOwnerUserId)];
  const coOwners = (horse.coOwners as ArrayEntry[] | undefined) ?? [];
  for (const co of coOwners) {
    if (co.userId) ids.push(String(co.userId));
  }
  return [...new Set(ids)];
}

/** True when actor may approve/decline a pending deletion request for this horse. */
export async function canDecideDeletionRequest(
  actorUserId: string,
  horseId: string,
): Promise<boolean> {
  const recipients = await getDeletionDecisionRecipients(horseId);
  return recipients.includes(actorUserId);
}
