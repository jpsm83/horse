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
  useAcceptWorkplaceInvitation,
  useDeclineWorkplaceInvitation,
  useWorkplaces,
} from "@/hooks/queries/useAuthData";
import { useAppAuth } from "@/hooks/use-app-auth";
import { isApiClientError } from "@/lib/api/auth/session";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/workplaces", "metadata.workplaces");
}

function WorkplacesLoadingShell() {
  return <InviteHubPageSkeleton titleNamespace="invites.workplaces" />;
}

function WorkplacesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("invites.workplaces");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const toast = useAppToast();
  const highlightInvitationId = searchParams.get("membership");

  const { isAuthenticated, isLoading: authLoading } = useAppAuth();
  const { data: workplaces = [], isPending } = useWorkplaces();
  const acceptMutation = useAcceptWorkplaceInvitation();
  const declineMutation = useDeclineWorkplaceInvitation();

  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(buildSignInPath("/workplaces"));
    }
  }, [authLoading, isAuthenticated, router]);

  async function handleAccept(invitationId: string) {
    setActingId(invitationId);

    try {
      await acceptMutation.mutateAsync(invitationId);
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

  async function handleDecline(invitationId: string) {
    setActingId(invitationId);

    try {
      await declineMutation.mutateAsync(invitationId);
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

  if (isPending || authLoading) {
    return <WorkplacesLoadingShell />;
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
