"use client";

/**
 * Horse owner hub — horse summary and provider invitation pickers.
 */

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { HorseProviderInvites } from "@/components/invites/horse-provider-invites.tsx";
import { HorseOwnershipHub } from "@/components/horses/horse-ownership-hub.tsx";
import { HorseHubPageSkeleton } from "@/components/horses/horse-hub-page-skeleton.tsx";
import { Link, useRouter } from "@/i18n/navigation.ts";
import {
  fetchCurrentUser,
  isApiClientError,
  type PublicRelationship,
  type PublicOwnershipTransfer,
} from "@/lib/api/authClient.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import {
  fetchHorseForOwner,
  fetchPendingSentRelationships,
  fetchPendingSentOwnershipTransfers,
  HorseClientError,
} from "@/lib/api/horseClient.ts";
import type { OwnerHorseSummary } from "@/lib/api/horseClient.ts";

type HorseHubPageContentProps = {
  horseId: string;
};

type HorseHubPageData = {
  horseData: OwnerHorseSummary;
  relationships: PublicRelationship[];
  ownershipTransfers: PublicOwnershipTransfer[];
};

async function fetchHorseHubPageData(horseId: string): Promise<HorseHubPageData> {
  await fetchCurrentUser();
  const horseData = await fetchHorseForOwner(horseId);
  const [relationships, ownershipTransfers] = await Promise.all([
    fetchPendingSentRelationships(horseId),
    horseData.isMainOwner
      ? fetchPendingSentOwnershipTransfers(horseId)
      : Promise.resolve([]),
  ]);

  return { horseData, relationships, ownershipTransfers };
}

export function HorseHubPageContent({ horseId }: HorseHubPageContentProps) {
  const router = useRouter();
  const t = useTranslations("horseHub");
  const tCommon = useTranslations("common");

  const [horse, setHorse] = useState<OwnerHorseSummary | null>(null);
  const [pendingRelationships, setPendingRelationships] = useState<PublicRelationship[]>([]);
  const [pendingOwnershipTransfers, setPendingOwnershipTransfers] = useState<
    PublicOwnershipTransfer[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const applyPageData = useCallback((data: HorseHubPageData) => {
    setHorse(data.horseData);
    setPendingRelationships(data.relationships);
    setPendingOwnershipTransfers(data.ownershipTransfers);
  }, []);

  const loadPage = useCallback(async () => {
    const data = await fetchHorseHubPageData(horseId);
    applyPageData(data);
  }, [applyPageData, horseId]);

  useEffect(() => {
    let cancelled = false;

    fetchHorseHubPageData(horseId)
      .then((data) => {
        if (cancelled) return;
        applyPageData(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof HorseClientError && err.statusCode === 403) {
          router.push("/not-allowed?reason=wrong_account");
          return;
        }
        if (isApiClientError(err) && err.statusCode === 401) {
          router.replace(buildSignInPath(`/my/horses/${horseId}`));
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
  }, [applyPageData, horseId, router]);

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
        pendingTransfers={pendingOwnershipTransfers}
        onChanged={loadPage}
      />

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
