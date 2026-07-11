"use client";

import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { useOwnerHorse, useHorseOwnershipHistory } from "@/hooks/queries/useHorse.ts";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { HorseHubPageSkeleton } from "@/components/horses/horse-hub-page-skeleton.tsx";
import { HorseSaleForm } from "@/components/horses/horse-sale-form.tsx";
import { EntityTabs, type EntityTab } from "@/components/ui/entity-tabs.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { queryKeys } from "@/lib/api/queryKeys";
import { useRouter } from "next/navigation";

type HorseSalePageContentProps = {
  horseId: string;
};

export function HorseSalePageContent({ horseId }: HorseSalePageContentProps) {
  const router = useRouter();
  const t = useTranslations("horseSale");
  const tHub = useTranslations("horseHub");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: isAuthLoading } = useAppAuth();
  const { data: horse, isLoading: isHorseLoading } = useOwnerHorse(horseId);
  const { data: ownershipHistory = [] } = useHorseOwnershipHistory(
    horse?.isMainOwner ? horseId : undefined,
  );

  const isLoading = isAuthLoading || isHorseLoading;

  if (!isLoading && !isAuthenticated) {
    router.replace(buildSignInPath(`/horses/${horseId}/sale`));
    return null;
  }

  if (isLoading || !horse) {
    return <HorseHubPageSkeleton />;
  }

  const isOwner = horse?.isMainOwner === true;
  if (!isOwner) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p>You don't have permission to view this page.</p>
        <Link href={`/horses/${horseId}`} className="text-primary underline">{tHub("backToHorses")}</Link>
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
    <>
      <EntityTabs tabs={horseTabs} isOwner={isOwner} variant="header" />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-4 sm:py-6">

      <div>
        <Link
          href={`/horses/${horseId}`}
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl mt-2">{t("pageTitle")}</h1>
      </div>

      <HorseSaleForm
        horseId={horseId}
        horse={horse}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.horses.owner(horseId) });
        }}
      />

      <hr className="my-4" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("ownershipHistory")}</h2>

        {ownershipHistory.length === 0 ? (
          <p className="text-muted-foreground">{t("noHistory")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("historyDate")}</TableHead>
                <TableHead>{t("historyType")}</TableHead>
                <TableHead>{t("historyFrom")}</TableHead>
                <TableHead>{t("historyTo")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ownershipHistory.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell>
                    {transfer.respondedAt
                      ? new Date(transfer.respondedAt).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {transfer.transferKind === "transfer_main"
                      ? t("kind.transfer_main")
                      : transfer.transferKind === "promote_co_owner"
                        ? t("kind.promote_co_owner")
                        : transfer.transferKind === "remove_co_owner"
                          ? t("kind.remove_co_owner")
                          : transfer.transferKind}
                  </TableCell>
                  <TableCell>{transfer.initiatorLabel ?? "-"}</TableCell>
                  <TableCell>
                    {transfer.receiverLabel ?? transfer.targetCoOwnerLabel ?? "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
    </>
  );
}
