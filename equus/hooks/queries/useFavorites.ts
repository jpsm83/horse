/**
 * TanStack Query hooks for user favorites.
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { FavoriteEntry } from "@/lib/services/favoriteService.ts";
import type { FavoriteEntityType } from "@/lib/validations/favorite.ts";

async function fetchFavorites(entityType?: FavoriteEntityType): Promise<FavoriteEntry[]> {
  const params = entityType ? `?entityType=${encodeURIComponent(entityType)}` : "";
  const response = await fetchWithAuth(`/api/v1/users/me/favorites${params}`);
  const data = await parseApiResponse<{ favorites: FavoriteEntry[] }>(response);
  return data.favorites;
}

async function addFavoriteApi(entityType: FavoriteEntityType, entityId: string) {
  const response = await fetchWithAuth("/api/v1/users/me/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entityType, entityId }),
  });
  return parseApiResponse<{ success: boolean }>(response);
}

async function removeFavoriteApi(entityType: FavoriteEntityType, entityId: string) {
  const response = await fetchWithAuth("/api/v1/users/me/favorites", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entityType, entityId }),
  });
  return parseApiResponse<{ success: boolean }>(response);
}

export function useFavorites(entityType?: FavoriteEntityType) {
  return useQuery({
    queryKey: queryKeys.favorites.list(entityType),
    queryFn: () => fetchFavorites(entityType),
    staleTime: 30_000,
  });
}

export function useIsFavorited(entityType: FavoriteEntityType, entityId: string | undefined) {
  const { data: favorites = [] } = useFavorites(entityType);
  if (!entityId) return false;
  return favorites.some((entry) => entry.entityId === entityId);
}

type ToggleFavoriteInput = {
  entityType: FavoriteEntityType;
  entityId: string;
  favorited: boolean;
};

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entityType, entityId, favorited }: ToggleFavoriteInput) =>
      favorited
        ? removeFavoriteApi(entityType, entityId)
        : addFavoriteApi(entityType, entityId),
    onMutate: async ({ entityType, entityId, favorited }) => {
      const listKey = queryKeys.favorites.list(entityType);
      const allKey = queryKeys.favorites.list();
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.all });

      const previousTyped = queryClient.getQueryData<FavoriteEntry[]>(listKey);
      const previousAll = queryClient.getQueryData<FavoriteEntry[]>(allKey);

      const updateList = (entries: FavoriteEntry[] | undefined) => {
        const current = entries ?? [];
        if (favorited) {
          return current.filter((entry) => entry.entityId !== entityId);
        }
        if (current.some((entry) => entry.entityId === entityId)) {
          return current;
        }
        return [
          ...current,
          {
            entityType,
            entityId,
            createdAt: new Date().toISOString(),
          },
        ];
      };

      queryClient.setQueryData(listKey, updateList(previousTyped));
      queryClient.setQueryData(allKey, updateList(previousAll));

      return { previousTyped, previousAll, listKey, allKey };
    },
    onError: (_error, _input, context) => {
      if (!context) return;
      if (context.previousTyped !== undefined) {
        queryClient.setQueryData(context.listKey, context.previousTyped);
      }
      if (context.previousAll !== undefined) {
        queryClient.setQueryData(context.allKey, context.previousAll);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stables.lists() });
    },
  });
}
