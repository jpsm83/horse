/**
 * Horse hub — main-owner actions to transfer ownership or manage co-owners.
 *
 * Calls ownership transfer REST APIs; receivers accept at `/ownership-transfers`.
 */

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import {
  cancelOwnershipTransfer,
  createOwnershipTransfer,
  isApiClientError,
  type PublicOwnershipTransfer,
} from "@/lib/api/authClient.ts";
import type { OwnerHorseSummary } from "@/lib/api/horseClient.ts";
import { cn } from "@/lib/utils";

type HorseOwnershipHubProps = {
  horseId: string;
  horse: OwnerHorseSummary;
  pendingTransfers: PublicOwnershipTransfer[];
  onChanged: () => Promise<void>;
};

function pendingForCoOwner(
  transfers: PublicOwnershipTransfer[],
  userId: string,
  kind: "remove_co_owner" | "promote_co_owner",
): PublicOwnershipTransfer | undefined {
  return transfers.find(
    (transfer) =>
      transfer.transferKind === kind && transfer.targetCoOwnerUserId === userId,
  );
}

function pendingTransferMain(
  transfers: PublicOwnershipTransfer[],
): PublicOwnershipTransfer | undefined {
  return transfers.find((transfer) => transfer.transferKind === "transfer_main");
}

function transferTargetLabel(transfer: PublicOwnershipTransfer): string {
  if (transfer.transferKind === "transfer_main") {
    return transfer.receiverLabel ?? transfer.invitedEmail ?? transfer.receiverUserId ?? "";
  }
  return transfer.targetCoOwnerLabel ?? transfer.targetCoOwnerUserId ?? "";
}

export function HorseOwnershipHub({
  horseId,
  horse,
  pendingTransfers,
  onChanged,
}: HorseOwnershipHubProps) {
  const t = useTranslations("horseHub.ownership");
  const tKinds = useTranslations("invites.ownershipTransfers.transferKinds");
  const tStatus = useTranslations("status");
  const toast = useAppToast();

  const [invitedEmail, setInvitedEmail] = useState("");
  const [invitedName, setInvitedName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actingTransferId, setActingTransferId] = useState<string | null>(null);
  const [actingCoOwnerId, setActingCoOwnerId] = useState<string | null>(null);

  if (!horse.isMainOwner) {
    return null;
  }

  const pendingMain = pendingTransferMain(pendingTransfers);
  const hasCoOwners = horse.coOwners.length > 0;

  async function handleCreateTransfer(
    input: Parameters<typeof createOwnershipTransfer>[0],
    successMessage: string,
  ) {
    setIsSubmitting(true);
    try {
      await createOwnershipTransfer(input);
      toast.success(successMessage);
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tStatus("requestFailed"));
    } finally {
      setIsSubmitting(false);
      setActingCoOwnerId(null);
    }
  }

  async function handleTransferMain(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = invitedEmail.trim();
    if (!email) return;

    await handleCreateTransfer(
      {
        entityType: "horse",
        entityId: horseId,
        transferKind: "transfer_main",
        invitedEmail: email,
        invitedName: invitedName.trim() || undefined,
      },
      t("transferSent"),
    );
    setInvitedEmail("");
    setInvitedName("");
  }

  async function handleRemoveCoOwner(userId: string) {
    setActingCoOwnerId(userId);
    await handleCreateTransfer(
      {
        entityType: "horse",
        entityId: horseId,
        transferKind: "remove_co_owner",
        targetCoOwnerUserId: userId,
      },
      t("removeSent"),
    );
  }

  async function handlePromoteCoOwner(userId: string) {
    setActingCoOwnerId(userId);
    await handleCreateTransfer(
      {
        entityType: "horse",
        entityId: horseId,
        transferKind: "promote_co_owner",
        targetCoOwnerUserId: userId,
      },
      t("promoteSent"),
    );
  }

  async function handleCancel(transferId: string) {
    setActingTransferId(transferId);
    try {
      await cancelOwnershipTransfer(transferId);
      toast.success(t("cancelled"));
      await onChanged();
    } catch (err) {
      if (isApiClientError(err) && err.statusCode === 403) {
        toast.error(tStatus("requestFailed"));
        return;
      }
      toast.error(err instanceof Error ? err.message : tStatus("requestFailed"));
    } finally {
      setActingTransferId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      {pendingTransfers.length > 0 ? (
        <ul className="space-y-2">
          {pendingTransfers.map((transfer) => (
            <li
              key={transfer.id}
              className="flex flex-col gap-2 rounded-lg border border-dashed p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {tKinds(transfer.transferKind as "transfer_main")} · {t("pending")}
                </p>
                <p className="text-sm text-muted-foreground">{transferTargetLabel(transfer)}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={actingTransferId === transfer.id}
                onClick={() => void handleCancel(transfer.id)}
              >
                {t("cancelPending")}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {hasCoOwners ? (
        <div className="space-y-3">
          <div>
            <h3 className="font-medium">{t("coOwnersTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("coOwnersDescription")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("coOwnersBlockTransfer")}</p>
          </div>
          <ul className="space-y-3">
            {horse.coOwners.map((coOwner) => {
              const pendingRemove = pendingForCoOwner(
                pendingTransfers,
                coOwner.userId,
                "remove_co_owner",
              );
              const pendingPromote = pendingForCoOwner(
                pendingTransfers,
                coOwner.userId,
                "promote_co_owner",
              );
              const isActing = actingCoOwnerId === coOwner.userId || isSubmitting;

              return (
                <li
                  key={coOwner.userId}
                  className={cn("rounded-lg border p-4", pendingRemove || pendingPromote ? "opacity-80" : "")}
                >
                  <div className="space-y-1">
                    <p className="font-medium">{coOwner.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("ownershipPercentage", { percentage: coOwner.ownershipPercentage })}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isActing || Boolean(pendingRemove) || Boolean(pendingPromote)}
                      onClick={() => void handleRemoveCoOwner(coOwner.userId)}
                    >
                      {pendingRemove ? t("pending") : t("removeCoOwner")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isActing || Boolean(pendingRemove) || Boolean(pendingPromote)}
                      onClick={() => void handlePromoteCoOwner(coOwner.userId)}
                    >
                      {pendingPromote ? t("pending") : t("promoteCoOwner")}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <h3 className="font-medium">{t("transferTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("transferDescription")}</p>
          </div>
          {pendingMain ? null : (
            <form className="space-y-3 rounded-lg border p-4" onSubmit={(e) => void handleTransferMain(e)} noValidate>
              <div className="space-y-2">
                <Label htmlFor="transfer-email">{t("emailLabel")}</Label>
                <Input
                  id="transfer-email"
                  type="email"
                  autoComplete="email"
                  value={invitedEmail}
                  disabled={isSubmitting}
                  onChange={(event) => setInvitedEmail(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer-name">{t("nameLabel")}</Label>
                <Input
                  id="transfer-name"
                  value={invitedName}
                  disabled={isSubmitting}
                  onChange={(event) => setInvitedName(event.target.value)}
                />
              </div>
              <Button type="submit" size="sm" disabled={isSubmitting || !invitedEmail.trim()}>
                {t("sendTransfer")}
              </Button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
