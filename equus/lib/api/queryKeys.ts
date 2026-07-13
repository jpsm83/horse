/**
 * TanStack Query key factory — centralized cache keys for targeted invalidation.
 *
 * Usage:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.horses.detail(id) })
 *   queryClient.invalidateQueries({ queryKey: queryKeys.horses.lists() })
 */

export const queryKeys = {
  users: {
    detail: (userId: string) => ["users", userId] as const,
    me: ["users", "me"] as const,
    navigation: ["users", "me", "navigation"] as const,
    workplaces: ["users", "me", "workplaces"] as const,
  },
  horses: {
    all: ["horses"] as const,
    lists: () => [...queryKeys.horses.all, "list"] as const,
    detail: (horseId: string) => [...queryKeys.horses.all, horseId] as const,
    owner: (horseId: string) => [...queryKeys.horses.all, horseId, "owner"] as const,
    relationships: (horseId: string) => [...queryKeys.horses.all, horseId, "relationships"] as const,
    providers: (horseId: string) => [...queryKeys.horses.all, horseId, "providers"] as const,
    ownershipTransfers: (horseId: string) => [...queryKeys.horses.all, horseId, "ownership-transfers"] as const,
    ownershipHistory: (horseId: string) => [...queryKeys.horses.all, horseId, "ownership-history"] as const,
    reviews: (horseId: string) => [...queryKeys.horses.all, horseId, "reviews"] as const,
    health: (horseId: string) => [...queryKeys.horses.all, horseId, "health"] as const,
    feed: (horseId: string) => [...queryKeys.horses.all, horseId, "feed"] as const,
    events: (horseId: string) => [...queryKeys.horses.all, horseId, "events"] as const,
  },
  stables: {
    all: ["stables"] as const,
    lists: () => [...queryKeys.stables.all, "list"] as const,
    detail: (stableId: string) => [...queryKeys.stables.all, stableId] as const,
  },
  relationships: {
    all: ["relationships"] as const,
    pending: () => [...queryKeys.relationships.all, "pending"] as const,
  },
  discover: {
    providers: (type: string, q?: string) => ["discover", "providers", type, q ?? ""] as const,
  },
  ownershipTransfers: {
    all: ["ownership-transfers"] as const,
    pending: () => [...queryKeys.ownershipTransfers.all, "pending"] as const,
  },
  roleProfiles: {
    staff: (roleType: string, roleProfileId: string) =>
      ["role-profiles", roleType, roleProfileId, "staff"] as const,
    workplaceRelationships: (roleType: string, roleProfileId: string) =>
      ["role-profiles", roleType, roleProfileId, "workplace-relationships"] as const,
  },
  invites: {
    preview: (ref: string) => ["invites", "preview", ref] as const,
  },
};
