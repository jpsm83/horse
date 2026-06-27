"use client";

import { useTranslations } from "next-intl";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AuthPageShell } from "@/components/auth/auth-page-shell.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { Link, useRouter } from "@/i18n/navigation.ts";
import {
  acceptMembership,
  declineMembership,
  fetchCurrentUser,
  fetchWorkplaces,
  isApiClientError,
} from "@/lib/api/authClient.ts";
import type { PublicWorkplace } from "@/lib/services/roleMembershipService.ts";
import { cn } from "@/lib/utils";

function WorkplacesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("invites.workplaces");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const toast = useAppToast();
  const highlightMembershipId = searchParams.get("membership");

  const [workplaces, setWorkplaces] = useState<PublicWorkplace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const loadWorkplaces = useCallback(async () => {
    try {
      await fetchCurrentUser();
      const data = await fetchWorkplaces();
      setWorkplaces(data);
    } catch {
      const next = highlightMembershipId
        ? `/workplaces?membership=${encodeURIComponent(highlightMembershipId)}`
        : "/workplaces";
      router.replace(`/signin?next=${encodeURIComponent(next)}`);
    } finally {
      setIsLoading(false);
    }
  }, [highlightMembershipId, router]);

  useEffect(() => {
    void loadWorkplaces();
  }, [loadWorkplaces]);

  async function handleAccept(membershipId: string) {
    setActingId(membershipId);

    try {
      await acceptMembership(membershipId);
      toast.success(t("accepted"));
      await loadWorkplaces();
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

  async function handleDecline(membershipId: string) {
    setActingId(membershipId);

    try {
      await declineMembership(membershipId);
      toast.success(t("declined"));
      await loadWorkplaces();
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
    return (
      <AuthPageShell
        title={t("title")}
        description={tCommon("loading")}
        footer={<span>{tCommon("loading")}</span>}
      >
        <Alert>
          <AlertDescription>{tCommon("loading")}</AlertDescription>
        </Alert>
      </AuthPageShell>
    );
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
              highlightMembershipId &&
              workplace.membershipId === highlightMembershipId;
            const isInvited = workplace.status === "invited";
            const membershipId = workplace.membershipId;

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
                    {workplace.access === "owner" ? tCommon("owner") : workplace.staffRole}
                    {workplace.status ? ` · ${workplace.status}` : ""}
                  </p>
                  {isInvited ? (
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      {t("invited")}
                    </p>
                  ) : null}
                </div>

                {isInvited && membershipId ? (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      disabled={actingId === membershipId}
                      onClick={() => void handleAccept(membershipId)}
                    >
                      {t("accept")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actingId === membershipId}
                      onClick={() => void handleDecline(membershipId)}
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
  const t = useTranslations("invites.workplaces");
  const tCommon = useTranslations("common");

  return (
    <Suspense
      fallback={
        <AuthPageShell
          title={t("title")}
          description={tCommon("loading")}
          footer={<span>{tCommon("loading")}</span>}
        />
      }
    >
      <WorkplacesContent />
    </Suspense>
  );
}
