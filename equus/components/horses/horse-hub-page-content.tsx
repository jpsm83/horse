"use client";

/**
 * Horse owner hub — horse summary and provider invitation pickers.
 * Data fetching and mutations handled by TanStack Query.
 */

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { HorseProviderInvites } from "@/components/invites/horse-provider-invites.tsx";
import { HorseOwnershipHub } from "@/components/horses/horse-ownership-hub.tsx";
import { HorseHubPageSkeleton } from "@/components/horses/horse-hub-page-skeleton.tsx";
import { Link } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import {
  useOwnerHorse,
  useHorsePendingRelationships,
  useHorseOwnershipTransfers,
} from "@/hooks/queries/useHorse.ts";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { isFetchError } from "@/lib/api/fetchWithAuth";

type HorseHubPageContentProps = {
  horseId: string;
};

export function HorseHubPageContent({ horseId }: HorseHubPageContentProps) {
  const router = useRouter();
  const t = useTranslations("horseHub");
  const tCommon = useTranslations("common");

  const { isAuthenticated, isLoading: isAuthLoading } = useAppAuth();
  const { data: horse, isLoading: isHorseLoading, error: horseError } = useOwnerHorse(horseId);
  const { data: relationships = [] } = useHorsePendingRelationships(horseId);
  const { data: ownershipTransfers = [] } = useHorseOwnershipTransfers(
    horse?.isMainOwner ? horseId : undefined,
  );

  const isLoading = isAuthLoading || isHorseLoading;

  if (!isLoading && !isAuthenticated) {
    router.replace(buildSignInPath(`/my/horses/${horseId}`));
    return null;
  }

  if (horseError) {
    if (isFetchError(horseError) && horseError.statusCode === 403) {
      router.push("/not-allowed?reason=wrong_account");
      return null;
    }
    router.replace("/my/horses");
    return null;
  }

  if (isLoading || !horse) {
    return <HorseHubPageSkeleton />;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-6 sm:py-12">
      <div className="space-y-2">
        <Link
          href="/my/horses"
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("backToHorses")}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {horse.name ?? tCommon("horseFallback")}
        </h1>
        <p className="text-muted-foreground">
          {[horse.breed, horse.sex].filter(Boolean).join(" · ") || t("subtitle")}
        </p>
      </div>

      <HorseOwnershipHub
        horseId={horseId}
        horse={horse}
        pendingTransfers={ownershipTransfers}
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{t("connectTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("connectDescription")}</p>
        </div>
        <HorseProviderInvites
          horseId={horseId}
          pendingRelationships={relationships}
        />
      </section>
    </div>
  );
}
