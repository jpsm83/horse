/**
 * TanStack Query key factory — centralized cache keys for targeted invalidation.
 *
 * Usage:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.horses.view(id) })
 *   queryClient.invalidateQueries({ queryKey: queryKeys.horses.lists() })
 */

export const queryKeys = {
  users: {
    detail: (userId: string) => ["users", userId] as const,
    me: ["users", "me"] as const,
    /** Role-aware owner view — GET /api/v1/users/:id/view via useUserView. */
    view: (userId: string) => ["users", userId, "view"] as const,
    /** Audience-filtered user hub sections (public profile page). */
    hub: (userId: string) => ["users", userId, "hub"] as const,
    navigation: ["users", "me", "navigation"] as const,
    workplaces: ["users", "me", "workplaces"] as const,
    notifications: (userId: string) => ["users", userId, "notifications"] as const,
  },
  horses: {
    all: ["horses"] as const,
    lists: () => [...queryKeys.horses.all, "list"] as const,
    view: (horseId: string) => [...queryKeys.horses.all, horseId, "view"] as const,
    /** Paginated Hub Media gallery. */
    hubGallery: (
      horseId: string,
      params: { page: number; pageSize: number; type: string },
    ) =>
      [
        ...queryKeys.horses.all,
        horseId,
        "hub-gallery",
        params.page,
        params.pageSize,
        params.type,
      ] as const,
    relationships: (horseId: string) => [...queryKeys.horses.all, horseId, "relationships"] as const,
    providers: (horseId: string) => [...queryKeys.horses.all, horseId, "providers"] as const,
    ownershipTransfers: (horseId: string) => [...queryKeys.horses.all, horseId, "ownership-transfers"] as const,
    ownershipHistory: (horseId: string) => [...queryKeys.horses.all, horseId, "ownership-history"] as const,
    reviews: (horseId: string) => [...queryKeys.horses.all, horseId, "reviews"] as const,
    planning: (horseId: string) => [...queryKeys.horses.all, horseId, "planning"] as const,
    media: (horseId: string) => [...queryKeys.horses.all, horseId, "media"] as const,
    audit: (horseId: string) => [...queryKeys.horses.all, horseId, "audit"] as const,
  },
  stables: {
    all: ["stables"] as const,
    lists: () => [...queryKeys.stables.all, "list"] as const,
    detail: (stableId: string) => [...queryKeys.stables.all, stableId] as const,
    view: (stableId: string) => [...queryKeys.stables.all, stableId, "view"] as const,
  },
  breeders: {
    all: ["breeders"] as const,
    lists: () => [...queryKeys.breeders.all, "list"] as const,
    detail: (breederId: string) => [...queryKeys.breeders.all, breederId] as const,
    view: (breederId: string) => [...queryKeys.breeders.all, breederId, "view"] as const,
  },
  transports: {
    all: ["transports"] as const,
    lists: () => [...queryKeys.transports.all, "list"] as const,
    detail: (transportId: string) => [...queryKeys.transports.all, transportId] as const,
    view: (transportId: string) => [...queryKeys.transports.all, transportId, "view"] as const,
  },
  ridingClubs: {
    all: ["riding-clubs"] as const,
    lists: () => [...queryKeys.ridingClubs.all, "list"] as const,
    detail: (clubId: string) => [...queryKeys.ridingClubs.all, clubId] as const,
    view: (clubId: string) => [...queryKeys.ridingClubs.all, clubId, "view"] as const,
  },
  trainers: {
    all: ["trainers"] as const,
    lists: () => [...queryKeys.trainers.all, "list"] as const,
    detail: (trainerId: string) => [...queryKeys.trainers.all, trainerId] as const,
    view: (trainerId: string) => [...queryKeys.trainers.all, trainerId, "view"] as const,
  },
  veterinaries: {
    all: ["veterinaries"] as const,
    lists: () => [...queryKeys.veterinaries.all, "list"] as const,
    detail: (vetId: string) => [...queryKeys.veterinaries.all, vetId] as const,
    view: (vetId: string) => [...queryKeys.veterinaries.all, vetId, "view"] as const,
  },
  grooms: {
    all: ["grooms"] as const,
    lists: () => [...queryKeys.grooms.all, "list"] as const,
    detail: (groomId: string) => [...queryKeys.grooms.all, groomId] as const,
    view: (groomId: string) => [...queryKeys.grooms.all, groomId, "view"] as const,
  },
  farriers: {
    all: ["farriers"] as const,
    lists: () => [...queryKeys.farriers.all, "list"] as const,
    detail: (farrierId: string) => [...queryKeys.farriers.all, farrierId] as const,
    view: (farrierId: string) => [...queryKeys.farriers.all, farrierId, "view"] as const,
  },
  coaches: {
    all: ["coaches"] as const,
    lists: () => [...queryKeys.coaches.all, "list"] as const,
    detail: (coachId: string) => [...queryKeys.coaches.all, coachId] as const,
    view: (coachId: string) => [...queryKeys.coaches.all, coachId, "view"] as const,
  },
  riders: {
    all: ["riders"] as const,
    lists: () => [...queryKeys.riders.all, "list"] as const,
    detail: (riderId: string) => [...queryKeys.riders.all, riderId] as const,
    view: (riderId: string) => [...queryKeys.riders.all, riderId, "view"] as const,
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
  pedigreeConnections: {
    all: ["pedigree-connections"] as const,
    pending: () => [...queryKeys.pedigreeConnections.all, "pending"] as const,
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
  search: {
    entities: (q: string) => ["search", "entities", q] as const,
    horses: (q: string) => ["search", "horses", q] as const,
    users: (q: string) => ["search", "users", q] as const,
  },
  billing: {
    current: ["billing", "current"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    lists: () => [...queryKeys.notifications.all, "list"] as const,
    list: (page: number) => [...queryKeys.notifications.all, "list", page] as const,
  },
};
