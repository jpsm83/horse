"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useIsFavorited, useToggleFavorite } from "@/hooks/queries/useFavorites.ts";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { cn } from "@/lib/utils";
import type { FavoriteEntityType } from "@/lib/validations/favorite.ts";

type FavoriteStarButtonProps = {
  entityType: FavoriteEntityType;
  entityId: string;
  className?: string;
};

export function FavoriteStarButton({
  entityType,
  entityId,
  className,
}: FavoriteStarButtonProps) {
  const t = useTranslations("favorites");
  const { isAuthenticated } = useAppAuth();
  const favorited = useIsFavorited(entityType, entityId);
  const toggleFavorite = useToggleFavorite();

  if (!isAuthenticated) {
    return null;
  }

  const label = favorited ? t("removeFavorite") : t("addFavorite");

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "size-9 shrink-0 text-muted-foreground hover:text-foreground",
        favorited && "text-primary hover:text-primary",
        className,
      )}
      aria-label={label}
      aria-pressed={favorited}
      disabled={toggleFavorite.isPending}
      onClick={() => {
        toggleFavorite.mutate({ entityType, entityId, favorited });
      }}
    >
      <Star className={cn("size-5", favorited && "fill-current")} aria-hidden />
    </Button>
  );
}
