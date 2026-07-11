"use client";

import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { EntityTabs, type EntityTab } from "@/components/ui/entity-tabs.tsx";
import { HorseDiscoveryForm } from "@/components/horses/horse-discovery-form.tsx";
import { useOwnerHorse } from "@/hooks/queries/useHorse.ts";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useRouter } from "next/navigation";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { HorseHubPageSkeleton } from "@/components/horses/horse-hub-page-skeleton.tsx";
import { Link } from "@/i18n/navigation";
import { queryKeys } from "@/lib/api/queryKeys";

type Props = { horseId: string };

export function HorseDiscoveryPageContent({ horseId }: Props) {
  const t = useTranslations("horseDiscovery");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: isAuthLoading } = useAppAuth();
  const { data: horse, isLoading: isHorseLoading } = useOwnerHorse(horseId);

  const isLoading = isAuthLoading || isHorseLoading;

  if (!isLoading && !isAuthenticated) {
    router.replace(buildSignInPath(`/horses/${horseId}/discovery`));
    return null;
  }

  if (isLoading || !horse) return <HorseHubPageSkeleton />;

  const isOwner = horse?.isMainOwner === true;
  if (!isOwner) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p>You don't have permission to edit discovery settings.</p>
        <Link href={`/horses/${horseId}`} className="text-primary underline">Back to hub</Link>
      </div>
    );
  }

  const horseTabs: EntityTab[] = [
    { id: "hub", label: "Hub", href: `/horses/${horseId}` },
    { id: "edit", label: "Edit", href: `/horses/${horseId}/edit`, requireOwnership: true },
    { id: "sale", label: "Sale", href: `/horses/${horseId}/sale`, requireOwnership: true },
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

      <HorseDiscoveryForm
        horseId={horseId}
        horse={horse}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.horses.owner(horseId) });
        }}
      />
    </div>
  );
}
