import { z } from "zod";

export const favoriteEntityTypeEnums = ["horse", "stable"] as const;

export type FavoriteEntityType = (typeof favoriteEntityTypeEnums)[number];

export const favoriteMutationSchema = z.object({
  entityType: z.enum(favoriteEntityTypeEnums),
  entityId: z.string().trim().min(1),
});

export const listFavoritesQuerySchema = z.object({
  entityType: z.enum(favoriteEntityTypeEnums).optional(),
});

export type FavoriteMutationInput = z.infer<typeof favoriteMutationSchema>;
