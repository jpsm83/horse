"use client";

/**
 * Horse owner hub — horse summary and provider invitation pickers.
 */

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { HorseProviderInvites } from "@/components/invites/horse-provider-invites.tsx";
import { HorseHubPageSkeleton } from "@/components/horses/horse-hub-page-skeleton.tsx";
import { Link, useRouter } from "@/i18n/navigation.ts";
import {
  fetchCurrentUser,
  isApiClientError,
  type PublicRelationship,
} from "@/lib/api/authClient.ts";
import {
  fetchHorseForOwner,
  fetchPendingSentRelationships,
  HorseClientError,
} from "@/lib/api/horseClient.ts";
import type { OwnerHorseSummary } from "@/lib/api/horseClient.ts";

type HorseHubPageContentProps = {
  horseId: string;
};

export function HorseHubPageContent({ horseId }: HorseHubPageContentProps) {
  const router = useRouter();
  const t = useTranslations("horseHub");
  const tCommon = useTranslations("common");

  const [horse, setHorse] = useState<OwnerHorseSummary | null>(null);
  const [pendingRelationships, setPendingRelationships] = useState<PublicRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPage = useCallback(async () => {
    await fetchCurrentUser();
    const [horseData, relationships] = await Promise.all([
      fetchHorseForOwner(horseId),
      fetchPendingSentRelationships(horseId),
    ]);
    setHorse(horseData);
    setPendingRelationships(relationships);
  }, [horseId]);

  useEffect(() => {
    let cancelled = false;

    loadPage()
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof HorseClientError && err.statusCode === 403) {
          router.push("/not-allowed?reason=wrong_account");
          return;
        }
        if (isApiClientError(err) && err.statusCode === 401) {
          router.replace(`/signin?next=${encodeURIComponent(`/my/horses/${horseId}`)}`);
          return;
        }
        router.replace("/my/horses");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [horseId, loadPage, router]);

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

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{t("connectTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("connectDescription")}</p>
        </div>
        <HorseProviderInvites
          horseId={horseId}
          pendingRelationships={pendingRelationships}
          onInvited={() => void loadPage()}
        />
      </section>
    </div>
  );
}
