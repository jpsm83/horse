"use client";

import { useTranslations } from "next-intl";
import { EntityTabs, type EntityTab } from "@/components/ui/entity-tabs.tsx";
import { useOwnerHorse } from "@/hooks/queries/useHorse.ts";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useRouter } from "next/navigation";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { HorseHubPageSkeleton } from "@/components/horses/horse-hub-page-skeleton.tsx";
import { Link } from "@/i18n/navigation";

type Props = { horseId: string };

export function HorseRelationsPageContent({ horseId }: Props) {
  const t = useTranslations("horseRelations");
  const { isAuthenticated, isLoading: isAuthLoading } = useAppAuth();
  const { data: horse, isLoading: isHorseLoading } = useOwnerHorse(horseId);
  const router = useRouter();

  const isLoading = isAuthLoading || isHorseLoading;

  if (!isLoading && !isAuthenticated) {
    router.replace(buildSignInPath(`/horses/${horseId}/relations`));
    return null;
  }

  if (isLoading || !horse) return <HorseHubPageSkeleton />;

  const isOwner = horse?.isMainOwner === true;
  const horseTabs: EntityTab[] = [
    { id: "hub", label: "Hub", href: `/horses/${horseId}` },
    { id: "edit", label: "Edit", href: `/horses/${horseId}/edit`, requireOwnership: true },
    { id: "discovery", label: "Discovery", href: `/horses/${horseId}/discovery`, requireOwnership: true },
    { id: "history", label: "History", href: `/horses/${horseId}/history` },
    { id: "relations", label: "Relations", href: `/horses/${horseId}/relations` },
  ];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-6 sm:py-12">
      <EntityTabs tabs={horseTabs} isOwner={isOwner} />
      <div>
        <Link href={`/horses/${horseId}`} className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">← Back</Link>
        <h1 className="text-2xl font-semibold mt-2">{t("title")}</h1>
      </div>
      <p className="text-muted-foreground">{t("comingSoon")}</p>
    </div>
  );
}
