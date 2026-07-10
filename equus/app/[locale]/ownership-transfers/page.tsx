"use client";

import { useTranslations } from "next-intl";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AuthPageShell } from "@/components/auth/auth-page-shell.tsx";
import { InviteHubPageSkeleton } from "@/components/layout/entity-placeholder-skeleton.tsx";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { AppHomeLink } from "@/components/navigation/app-home-link.tsx";
import { useRouter } from "@/i18n/navigation.ts";
import {
  useAcceptOwnershipTransfer,
  useDeclineOwnershipTransfer,
} from "@/hooks/queries/useOwnershipTransfer.ts";
import { useAppAuth } from "@/hooks/use-app-auth";
import { usePendingOwnershipTransfers } from "@/hooks/queries/useAuthData";
import { isApiClientError } from "@/lib/api/auth/session";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/ownership-transfers", "metadata.ownershipTransfers");
}

function OwnershipTransfersLoadingShell() {
  return <InviteHubPageSkeleton titleNamespace="invites.ownershipTransfers" />;
}

function OwnershipTransfersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("invites.ownershipTransfers");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const toast = useAppToast();
  const highlightTransferId = searchParams.get("transfer");

  const { isAuthenticated, isLoading: authLoading } = useAppAuth();
  const { data: transfers = [], isPending } = usePendingOwnershipTransfers();
  const acceptMutation = useAcceptOwnershipTransfer();
  const declineMutation = useDeclineOwnershipTransfer();

  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const next = highlightTransferId
        ? `/ownership-transfers?transfer=${encodeURIComponent(highlightTransferId)}`
        : "/ownership-transfers";
      router.replace(buildSignInPath(next));
    }
  }, [authLoading, isAuthenticated, highlightTransferId, router]);

  async function handleAccept(transferId: string) {
    setActingId(transferId);

    try {
      await acceptMutation.mutateAsync(transferId);
      toast.success(t("accepted"));
    } catch (err) {
      if (isApiClientError(err) && err.statusCode === 403) {
        router.push("/not-allowed?reason=wrong_account");
        return;
      }
      toast.error(err instanceof Error ? err.message : tStatus("requestFailed"));
    } finally {
      setActingId(null);
    }
  }

  async function handleDecline(transferId: string) {
    setActingId(transferId);

    try {
      await declineMutation.mutateAsync(transferId);
      toast.success(t("declined"));
    } catch (err) {
      if (isApiClientError(err) && err.statusCode === 403) {
        router.push("/not-allowed?reason=wrong_account");
        return;
      }
      toast.error(err instanceof Error ? err.message : tStatus("requestFailed"));
    } finally {
      setActingId(null);
    }
  }

  function entityLabel(transfer: { entityName?: string; entityType: string }): string {
    if (transfer.entityName?.trim()) {
      return transfer.entityName.trim();
    }
    return t(`entityTypes.${transfer.entityType}` as "entityTypes.horse");
  }

  function transferKindLabel(transfer: { transferKind: string }): string {
    return t(`transferKinds.${transfer.transferKind}` as "transferKinds.transfer_main");
  }

  if (isPending || authLoading) {
    return <OwnershipTransfersLoadingShell />;
  }

  return (
    <AuthPageShell
      title={t("title")}
      description={t("description")}
      footer={
        <AppHomeLink className="font-medium text-foreground underline-offset-4 hover:underline">
          {tCommon("home")}
        </AppHomeLink>
      }
    >
      {transfers.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="space-y-3">
          {transfers.map((transfer) => {
            const isHighlighted =
              highlightTransferId && transfer.id === highlightTransferId;

            return (
              <li
                key={transfer.id}
                id={`ownership-transfer-${transfer.id}`}
                className={cn(
                  "rounded-lg border p-4",
                  isHighlighted && "border-primary ring-1 ring-primary/30",
                )}
              >
                <div className="space-y-1">
                  <p className="font-medium">
                    {entityLabel(transfer)} · {transferKindLabel(transfer)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t(`entityTypes.${transfer.entityType}` as "entityTypes.horse")}
                  </p>
                  {transfer.initiatorLabel ? (
                    <p className="text-sm text-muted-foreground">
                      {tCommon("from", { label: transfer.initiatorLabel })}
                    </p>
                  ) : null}
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    disabled={actingId === transfer.id}
                    onClick={() => void handleAccept(transfer.id)}
                  >
                    {t("accept")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actingId === transfer.id}
                    onClick={() => void handleDecline(transfer.id)}
                  >
                    {t("decline")}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AuthPageShell>
  );
}

export default function OwnershipTransfersPage() {
  return (
    <Suspense fallback={<OwnershipTransfersLoadingShell />}>
      <OwnershipTransfersContent />
    </Suspense>
  );
}
