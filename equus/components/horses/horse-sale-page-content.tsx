"use client";

import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { HorseSaleForm } from "@/components/horses/horse-sale-form.tsx";
import {
  useHorseOwnershipHistory,
} from "@/hooks/queries/useHorse.ts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { queryKeys } from "@/lib/api/queryKeys";

type HorseSalePageContentProps = {
  horseId: string;
};

export function HorseSalePageContent({ horseId }: HorseSalePageContentProps) {
  const t = useTranslations("horseSale");
  const queryClient = useQueryClient();
  const { data: ownershipHistory = [] } = useHorseOwnershipHistory(horseId);

  return (
    <HorsePageShell horseId={horseId} title={t("pageTitle")} requireOwnership>
      {({ horse, isOwner }) => (
        <>
          <HorseSaleForm
            horseId={horseId}
            horse={horse}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.horses.owner(horseId) });
            }}
          />

          {isOwner ? (
            <>
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
            </>
          ) : null}
        </>
      )}
    </HorsePageShell>
  );
}
