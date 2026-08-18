/**
 * Favorite service — add/remove/list private entity bookmarks on User.
 *
 * v1 entity types: horse, stable. View check reuses getHorseView / getStableView
 * (404 when the requester cannot see the entity).
 */

import mongoose from "mongoose";

import Horse from "@/models/Horse.ts";
import Stable from "@/models/Stable.ts";
import User from "@/models/User.ts";
import { ApiError } from "@/lib/api/errors.ts";
import type { FavoriteEntityType } from "@/lib/validations/favorite.ts";
import * as horseService from "@/lib/services/horseService.ts";
import * as stableService from "@/lib/services/stableService.ts";

export type FavoriteEntry = {
  entityType: FavoriteEntityType;
  entityId: string;
  createdAt: string;
  label?: string;
};

type UserFavoriteDoc = {
  entityType: FavoriteEntityType;
  entityId: mongoose.Types.ObjectId;
  createdAt?: Date;
};

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

async function assertCanFavoriteEntity(
  userId: string,
  entityType: FavoriteEntityType,
  entityId: string,
): Promise<void> {
  try {
    if (entityType === "horse") {
      await horseService.getHorseView(entityId, userId);
      return;
    }
    await stableService.getStableView(entityId, userId);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      throw new ApiError(404, "Entity not found", "NOT_FOUND");
    }
    throw error;
  }
}

function hasFavorite(
  favorites: UserFavoriteDoc[],
  entityType: FavoriteEntityType,
  entityId: string,
): boolean {
  return favorites.some(
    (entry) => entry.entityType === entityType && String(entry.entityId) === entityId,
  );
}

async function resolveFavoriteLabel(
  entityType: FavoriteEntityType,
  entityId: string,
): Promise<string | undefined> {
  if (entityType === "horse") {
    const horse = await Horse.findById(entityId).select("name").lean();
    return horse?.name as string | undefined;
  }
  const stable = await Stable.findById(entityId).select("tradeName").lean();
  return stable?.tradeName as string | undefined;
}

function toFavoriteEntry(entry: UserFavoriteDoc, label?: string): FavoriteEntry {
  return {
    entityType: entry.entityType,
    entityId: String(entry.entityId),
    createdAt: (entry.createdAt ?? new Date()).toISOString(),
    ...(label ? { label } : {}),
  };
}

export async function addFavorite(
  userId: string,
  entityType: FavoriteEntityType,
  entityId: string,
): Promise<void> {
  ensureObjectId(userId, "user id");
  ensureObjectId(entityId, "entity id");

  await assertCanFavoriteEntity(userId, entityType, entityId);

  const user = await User.findById(userId).select("favorites").lean();
  if (!user) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  const favorites = (user.favorites ?? []) as UserFavoriteDoc[];
  if (hasFavorite(favorites, entityType, entityId)) {
    return;
  }

  await User.findByIdAndUpdate(userId, {
    $push: {
      favorites: {
        entityType,
        entityId: new mongoose.Types.ObjectId(entityId),
        createdAt: new Date(),
      },
    },
  });
}

export async function removeFavorite(
  userId: string,
  entityType: FavoriteEntityType,
  entityId: string,
): Promise<void> {
  ensureObjectId(userId, "user id");
  ensureObjectId(entityId, "entity id");

  await User.findByIdAndUpdate(userId, {
    $pull: {
      favorites: {
        entityType,
        entityId: new mongoose.Types.ObjectId(entityId),
      },
    },
  });
}

export async function listFavorites(
  userId: string,
  entityType?: FavoriteEntityType,
): Promise<FavoriteEntry[]> {
  ensureObjectId(userId, "user id");

  const user = await User.findById(userId).select("favorites").lean();
  if (!user) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  let favorites = (user.favorites ?? []) as UserFavoriteDoc[];
  if (entityType) {
    favorites = favorites.filter((entry) => entry.entityType === entityType);
  }

  return Promise.all(
    favorites.map(async (entry) => {
      const label = await resolveFavoriteLabel(entry.entityType, String(entry.entityId));
      return toFavoriteEntry(entry, label);
    }),
  );
}

export async function getFavoriteIdSet(
  userId: string,
  entityType: FavoriteEntityType,
): Promise<Set<string>> {
  ensureObjectId(userId, "user id");

  const user = await User.findById(userId).select("favorites").lean();
  if (!user) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  const favorites = (user.favorites ?? []) as UserFavoriteDoc[];
  return new Set(
    favorites
      .filter((entry) => entry.entityType === entityType)
      .map((entry) => String(entry.entityId)),
  );
}

export async function isFavorited(
  userId: string,
  entityType: FavoriteEntityType,
  entityId: string,
): Promise<boolean> {
  ensureObjectId(userId, "user id");
  ensureObjectId(entityId, "entity id");

  const user = await User.findById(userId).select("favorites").lean();
  if (!user) {
    return false;
  }

  const favorites = (user.favorites ?? []) as UserFavoriteDoc[];
  return hasFavorite(favorites, entityType, entityId);
}
