/**
 * Discover query validation — provider search for invite pickers.
 */

import { z } from "zod";
import { relationshipTypeEnums } from "../../utils/enums.ts";

export const discoverScopeEnums = ["horse", "host"] as const;

export const horseDiscoverProviderTypes = relationshipTypeEnums;

export const hostDiscoverProviderTypes = [
  "veterinary",
  "trainer",
  "groom",
  "farrier",
  "coach",
  "rider",
] as const;

export const discoverProvidersQuerySchema = z.object({
  type: z.enum(relationshipTypeEnums),
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  scope: z.enum(discoverScopeEnums).optional().default("horse"),
});

export type DiscoverProvidersQuery = z.infer<typeof discoverProvidersQuerySchema>;

export function assertTypeAllowedForScope(
  type: (typeof relationshipTypeEnums)[number],
  scope: (typeof discoverScopeEnums)[number],
): void {
  if (scope === "host" && !(hostDiscoverProviderTypes as readonly string[]).includes(type)) {
    throw new Error("HOST_SCOPE_TYPE_NOT_ALLOWED");
  }
}
