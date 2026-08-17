/**
 * HomeActionInbox — pending relationship and workplace invites on `/home`.
 *
 * Action inbox only (not a roster). Waiting-transfer rows are omitted until
 * that flag exists. Accept/decline uses the same mutations as dedicated inboxes.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  useAcceptWorkplaceInvitation,
  useDeclineWorkplaceInvitation,
  usePendingRelationships,
  useWorkplaces,
} from "@/hooks/queries/useAuthData";
import {
  useAcceptRelationship,
  useDeclineRelationship,
} from "@/hooks/queries/useRelationship.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { Link, useRouter } from "@/i18n/navigation.ts";
import { cn } from "@/lib/utils";
import { isApiClientError } from "@/lib/api/auth/session";
import type { PublicWorkplace } from "@/lib/services/workplaceRelationshipService.ts";

type HomeActionInboxProps = {
  userId: string;
};

export function HomeActionInbox({ userId }: HomeActionInboxProps) {
  const router = useRouter();
  const t = useTranslations("home");
  const tInvites = useTranslations("invites");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const toast = useAppToast();

  const { data: relationships = [], isPending: isRelationshipsPending } =
    usePendingRelationships();
  const { data: workplaces = [], isPending: isWorkplacesPending } = useWorkplaces();
  const acceptRelationship = useAcceptRelationship();
  const declineRelationship = useDeclineRelationship();
  const acceptWorkplace = useAcceptWorkplaceInvitation();
  const declineWorkplace = useDeclineWorkplaceInvitation();

  const [actingId, setActingId] = useState<string | null>(null);

  const pendingWorkplaces = workplaces.filter(
    (workplace): workplace is PublicWorkplace & { workplaceRelationshipId: string } =>
      workplace.status === "invited" &&
      Boolean(workplace.workplaceRelationshipId ?? workplace.membershipId),
  );

  const isLoading = isRelationshipsPending || isWorkplacesPending;
  const isEmpty = relationships.length === 0 && pendingWorkplaces.length === 0;

  async function handleRelationshipAction(
    relationshipId: string,
    action: "accept" | "decline",
  ) {
    setActingId(relationshipId);
    try {
      if (action === "accept") {
        await acceptRelationship.mutateAsync(relationshipId);
        toast.success(tInvites("relationships.accepted"));
      } else {
        await declineRelationship.mutateAsync(relationshipId);
        toast.success(tInvites("relationships.declined"));
      }
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

  async function handleWorkplaceAction(invitationId: string, action: "accept" | "decline") {
    setActingId(invitationId);
    try {
      if (action === "accept") {
        await acceptWorkplace.mutateAsync(invitationId);
        toast.success(tInvites("workplaces.accepted"));
      } else {
        await declineWorkplace.mutateAsync(invitationId);
        toast.success(tInvites("workplaces.declined"));
      }
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
    return <p className="text-sm text-muted-foreground">{t("inboxLoading")}</p>;
  }

  if (isEmpty) {
    return (
      <div className="space-y-3 rounded-lg border border-dashed p-6">
        <p className="text-sm font-medium">{t("emptyInbox")}</p>
        <p className="text-sm text-muted-foreground">{t("emptyInboxHint")}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href="/horses"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("openHorsesModule")}
          </Link>
          <Link
            href="/stables"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("openStablesModule")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {relationships.length > 0 ? (
        <section aria-labelledby="home-inbox-relationships-heading">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="home-inbox-relationships-heading" className="text-lg font-semibold tracking-tight">
              {t("relationshipsHeading")}
            </h2>
            <Link
              href="/relationships"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("viewAllRelationships")}
            </Link>
          </div>

          <SectionErrorBoundary message={tInvites("relationships.loadFailed")}>
            <ul className="space-y-3">
              {relationships.map((relationship) => (
                <li key={relationship.id} className="rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {relationship.horseName ?? tCommon("horseFallback")} ·{" "}
                      {relationship.relationshipType}
                    </p>
                    {relationship.requesterLabel ? (
                      <p className="text-sm text-muted-foreground">
                        {tCommon("from", { label: relationship.requesterLabel })}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={actingId === relationship.id}
                      onClick={() => void handleRelationshipAction(relationship.id, "accept")}
                    >
                      {tInvites("relationships.accept")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actingId === relationship.id}
                      onClick={() => void handleRelationshipAction(relationship.id, "decline")}
                    >
                      {tInvites("relationships.decline")}
                    </Button>
                    <Link
                      href={`/horses/${relationship.horseId}/connect`}
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                    >
                      {t("openConnect")}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </SectionErrorBoundary>
        </section>
      ) : null}

      {pendingWorkplaces.length > 0 ? (
        <section aria-labelledby="home-inbox-workplaces-heading">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="home-inbox-workplaces-heading" className="text-lg font-semibold tracking-tight">
              {t("workplacesHeading")}
            </h2>
            <Link
              href="/workplaces"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("viewAllWorkplaces")}
            </Link>
          </div>

          <SectionErrorBoundary message={tInvites("workplaces.loadFailed")}>
            <ul className="space-y-3">
              {pendingWorkplaces.map((workplace) => {
                const invitationId =
                  workplace.workplaceRelationshipId ?? workplace.membershipId!;
                return (
                  <li
                    key={invitationId}
                    className="rounded-lg border p-4"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {workplace.profileName ?? workplace.roleType}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {workplace.hierarchyLevel ?? workplace.staffRole}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={actingId === invitationId}
                        onClick={() => void handleWorkplaceAction(invitationId, "accept")}
                      >
                        {tInvites("workplaces.accept")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actingId === invitationId}
                        onClick={() => void handleWorkplaceAction(invitationId, "decline")}
                      >
                        {tInvites("workplaces.decline")}
                      </Button>
                      <Link
                        href={`/user/${userId}/workplace`}
                        className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                      >
                        {t("openWorkplace")}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </SectionErrorBoundary>
        </section>
      ) : null}
    </div>
  );
}
