"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";

import { EntityTabs, type EntityTab } from "@/components/ui/entity-tabs.tsx";
import { Button } from "@/components/ui/button";
import { HorseHubPageSkeleton } from "@/components/horses/horse-hub-page-skeleton.tsx";
import { Link } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { useOwnerHorse, useHorseProviders } from "@/hooks/queries/useHorse.ts";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useEndRelationship } from "@/hooks/queries/useRelationship.ts";
import { isFetchError } from "@/lib/api/fetchWithAuth";
import { useAppToast } from "@/hooks/use-app-toast";
import type { PublicRelationship } from "@/lib/services/relationshipService";

type Props = { horseId: string };

function formatDate(date: Date | undefined, locale: string): string {
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(date));
}

function ProviderCard({
  relationship,
  isOwner,
  typeLabel,
  locale,
  onEnd,
}: {
  relationship: PublicRelationship;
  isOwner: boolean;
  typeLabel: string;
  locale: string;
  onEnd: (id: string) => void;
}) {
  const t = useTranslations("horseRelations");
  const label = relationship.receiverLabel ?? relationship.invitedEmail ?? typeLabel;

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-1">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{typeLabel}</p>
        <p className="text-xs text-muted-foreground">
          {relationship.status === "ended" && relationship.endedAt
            ? t("endedLabel", { date: formatDate(relationship.endedAt, locale) })
            : relationship.respondedAt
              ? t("sinceLabel", { date: formatDate(relationship.respondedAt, locale) })
              : null}
        </p>
      </div>
      {isOwner && relationship.status === "accepted" ? (
        <Button variant="outline" size="sm" onClick={() => onEnd(relationship.id)}>
          {t("endButton")}
        </Button>
      ) : null}
    </div>
  );
}

export function HorseRelationsPageContent({ horseId }: Props) {
  const router = useRouter();
  const t = useTranslations("horseRelations");
  const tTypes = useTranslations("invites.horseProviders.types");
  const locale = useLocale();
  const { isAuthenticated, isLoading: isAuthLoading } = useAppAuth();
  const { data: horse, isLoading: isHorseLoading, error: horseError } = useOwnerHorse(horseId);
  const { data: currentProviders = [], isLoading: isCurrentLoading } = useHorseProviders(horseId, "accepted");
  const { data: pastProviders = [], isLoading: isPastLoading } = useHorseProviders(horseId, "ended");
  const endMutation = useEndRelationship();
  const toast = useAppToast();

  const isLoading = isAuthLoading || isHorseLoading || isCurrentLoading || isPastLoading;

  if (!isLoading && !isAuthenticated) {
    router.replace(buildSignInPath(`/horses/${horseId}/relations`));
    return null;
  }

  if (horseError) {
    if (isFetchError(horseError) && horseError.statusCode === 403) {
      router.push("/not-allowed?reason=wrong_account");
      return null;
    }
    router.replace("/horses");
    return null;
  }

  if (isLoading || !horse) {
    return <HorseHubPageSkeleton />;
  }

  const isOwner = horse?.isMainOwner === true;
  const horseTabs: EntityTab[] = [
    { id: "hub", label: "Hub", href: `/horses/${horseId}` },
    { id: "edit", label: "Edit", href: `/horses/${horseId}/edit`, requireOwnership: true },
    { id: "discovery", label: "Discovery", href: `/horses/${horseId}/discovery`, requireOwnership: true },
    { id: "history", label: "History", href: `/horses/${horseId}/history` },
    { id: "relations", label: "Relations", href: `/horses/${horseId}/relations` },
  ];

  function handleEnd(relationshipId: string) {
    endMutation.mutate(relationshipId, {
      onSuccess: () => {
        toast.success(t("endedSuccess"));
      },
      onError: () => {
        toast.error(t("endError"));
      },
    });
  }

  const displayLocale = locale;

  return (
    <>
      <EntityTabs tabs={horseTabs} isOwner={isOwner} variant="header" />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-4 sm:py-6">

      <div>
        <Link href={`/horses/${horseId}`} className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">
          &larr; Back
        </Link>
        <h1 className="text-2xl font-semibold mt-2">{t("title")}</h1>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("currentProviders")}</h2>
        {currentProviders.length === 0 ? (
          <p className="text-muted-foreground">{t("noCurrentProviders")}</p>
        ) : (
          <div className="space-y-3">
            {currentProviders.map((rel) => (
              <ProviderCard
                key={rel.id}
                relationship={rel}
                isOwner={isOwner}
                typeLabel={tTypes(rel.relationshipType)}
                locale={displayLocale}
                onEnd={handleEnd}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("pastProviders")}</h2>
        {pastProviders.length === 0 ? (
          <p className="text-muted-foreground">{t("noPastProviders")}</p>
        ) : (
          <div className="space-y-3">
            {pastProviders.map((rel) => (
              <ProviderCard
                key={rel.id}
                relationship={rel}
                isOwner={isOwner}
                typeLabel={tTypes(rel.relationshipType)}
                locale={displayLocale}
                onEnd={handleEnd}
              />
            ))}
          </div>
        )}
      </section>
    </div>
    </>
  );
}
