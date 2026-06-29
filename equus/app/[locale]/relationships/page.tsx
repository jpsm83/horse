"use client";

import { useTranslations } from "next-intl";
import { Suspense, useCallback, useEffect, useState } from "react";

import { AuthPageShell } from "@/components/auth/auth-page-shell.tsx";
import { InviteHubListSkeleton } from "@/components/layout/entity-placeholder-skeleton.tsx";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { Link, useRouter } from "@/i18n/navigation.ts";
import {
  acceptRelationship,
  declineRelationship,
  fetchCurrentUser,
  fetchPendingRelationships,
  isApiClientError,
  type PublicRelationship,
} from "@/lib/api/authClient.ts";

function RelationshipsLoadingShell() {
  const t = useTranslations("invites.relationships");
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
      <InviteHubListSkeleton />
    </AuthPageShell>
  );
}

function RelationshipsContent() {
  const router = useRouter();
  const t = useTranslations("invites.relationships");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const toast = useAppToast();

  const [relationships, setRelationships] = useState<PublicRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const loadRelationships = useCallback(async () => {
    await fetchCurrentUser();
    return fetchPendingRelationships();
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadRelationships()
      .then((data) => {
        if (!cancelled) setRelationships(data);
      })
      .catch(() => {
        if (!cancelled) {
          router.replace(`/signin?next=${encodeURIComponent("/relationships")}`);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadRelationships, router]);

  async function handleAccept(relationshipId: string) {
    setActingId(relationshipId);

    try {
      await acceptRelationship(relationshipId);
      toast.success(t("accepted"));
      setRelationships(await loadRelationships());
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

  async function handleDecline(relationshipId: string) {
    setActingId(relationshipId);

    try {
      await declineRelationship(relationshipId);
      toast.success(t("declined"));
      setRelationships(await loadRelationships());
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
    return <RelationshipsLoadingShell />;
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
      {relationships.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="space-y-3">
          {relationships.map((relationship) => (
            <li key={relationship.id} className="rounded-lg border p-4">
              <div className="space-y-1">
                <p className="font-medium">
                  {relationship.horseName ?? tCommon("horseFallback")} · {relationship.relationshipType}
                </p>
                {relationship.requesterLabel ? (
                  <p className="text-sm text-muted-foreground">
                    {tCommon("from", { label: relationship.requesterLabel })}
                  </p>
                ) : null}
              </div>

              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  disabled={actingId === relationship.id}
                  onClick={() => void handleAccept(relationship.id)}
                >
                  {t("accept")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actingId === relationship.id}
                  onClick={() => void handleDecline(relationship.id)}
                >
                  {t("decline")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AuthPageShell>
  );
}

export default function RelationshipsPage() {
  return (
    <Suspense fallback={<RelationshipsLoadingShell />}>
      <RelationshipsContent />
    </Suspense>
  );
}
