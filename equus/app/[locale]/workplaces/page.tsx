"use client";

import { useTranslations } from "next-intl";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AuthPageShell } from "@/components/auth/auth-page-shell.tsx";
import { InviteHubListSkeleton } from "@/components/layout/entity-placeholder-skeleton.tsx";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { Link, useRouter } from "@/i18n/navigation.ts";
import {
  acceptWorkplaceInvitation,
  declineWorkplaceInvitation,
  fetchCurrentUser,
  fetchWorkplaces,
  isApiClientError,
} from "@/lib/api/authClient.ts";
import type { PublicWorkplace } from "@/lib/services/workplaceRelationshipService.ts";
import { cn } from "@/lib/utils";

function WorkplacesLoadingShell({ children }: { children?: React.ReactNode }) {
  const t = useTranslations("invites.workplaces");
  const tCommon = useTranslations("common");

  return (
    <AuthPageShell
      title={t("title")}
      description={tCommon("loading")}
      footer={
        <Link href="/" className="font-medium text-foreground underline-offset-4 hover:underline">
          {tCommon("home")}
        </Link>
      }
    >
      {children ?? <InviteHubListSkeleton />}
    </AuthPageShell>
  );
}

function WorkplacesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("invites.workplaces");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const toast = useAppToast();
  const highlightInvitationId = searchParams.get("membership");

  const [workplaces, setWorkplaces] = useState<PublicWorkplace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const loadWorkplaces = useCallback(async () => {
    await fetchCurrentUser();
    return fetchWorkplaces();
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadWorkplaces()
      .then((data) => {
        if (!cancelled) setWorkplaces(data);
      })
      .catch(() => {
        if (cancelled) return;
        const next = highlightInvitationId
          ? `/workplaces?membership=${encodeURIComponent(highlightInvitationId)}`
          : "/workplaces";
        router.replace(`/signin?next=${encodeURIComponent(next)}`);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [highlightInvitationId, loadWorkplaces, router]);

  async function handleAccept(invitationId: string) {
    setActingId(invitationId);

    try {
      await acceptWorkplaceInvitation(invitationId);
      toast.success(t("accepted"));
      setWorkplaces(await loadWorkplaces());
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

  async function handleDecline(invitationId: string) {
    setActingId(invitationId);

    try {
      await declineWorkplaceInvitation(invitationId);
      toast.success(t("declined"));
      setWorkplaces(await loadWorkplaces());
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

  if (isLoading) {
    return <WorkplacesLoadingShell />;
  }

  return (
    <AuthPageShell
      title={t("title")}
      description={t("description")}
      footer={
        <Link href="/" className="font-medium text-foreground underline-offset-4 hover:underline">
          {tCommon("home")}
        </Link>
      }
    >
      {workplaces.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="space-y-3">
          {workplaces.map((workplace) => {
            const isHighlighted =
              highlightInvitationId &&
              workplace.membershipId === highlightInvitationId;
            const isInvited = workplace.status === "invited";
            const invitationId = workplace.membershipId;

            return (
              <li
                key={`${workplace.roleType}-${workplace.roleProfileId}-${workplace.membershipId ?? "owner"}`}
                className={cn(
                  "rounded-lg border p-4",
                  isHighlighted && "border-primary ring-1 ring-primary/30",
                )}
              >
                <div className="space-y-1">
                  <p className="font-medium">
                    {workplace.profileName ?? workplace.roleType}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {workplace.access === "owner"
                      ? tCommon("owner")
                      : (workplace.hierarchyLevel ?? workplace.staffRole)}
                    {workplace.status ? ` · ${workplace.status}` : ""}
                  </p>
                  {isInvited ? (
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      {t("invited")}
                    </p>
                  ) : null}
                </div>

                {isInvited && invitationId ? (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      disabled={actingId === invitationId}
                      onClick={() => void handleAccept(invitationId)}
                    >
                      {t("accept")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actingId === invitationId}
                      onClick={() => void handleDecline(invitationId)}
                    >
                      {t("decline")}
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </AuthPageShell>
  );
}

export default function WorkplacesPage() {
  return (
    <Suspense fallback={<WorkplacesLoadingShell />}>
      <WorkplacesContent />
    </Suspense>
  );
}
