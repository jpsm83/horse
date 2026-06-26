"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import type { NavigationEntityKey } from "@/components/layout/navigation-config.ts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "@/i18n/navigation.ts";
import { fetchCurrentUser } from "@/lib/api/authClient.ts";

type MyPlaceholderPageProps = {
  entity: NavigationEntityKey;
};

/** Auth-gated owned-profile placeholder — right avatar “My own” destinations. */
export function MyPlaceholderPage({ entity }: MyPlaceholderPageProps) {
  const router = useRouter();
  const t = useTranslations("header");
  const tMyOwn = useTranslations("header.myOwn");
  const tCommon = useTranslations("common");
  const entityLabel = tMyOwn(entity);

  const [isLoading, setIsLoading] = useState(true);

  const verifyAuth = useCallback(async () => {
    try {
      await fetchCurrentUser();
    } catch {
      router.replace(`/signin?next=${encodeURIComponent(`/my/${entityPath(entity)}`)}`);
    } finally {
      setIsLoading(false);
    }
  }, [entity, router]);

  useEffect(() => {
    void verifyAuth();
  }, [verifyAuth]);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-12">
        <Alert>
          <AlertDescription>{tCommon("loading")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{entityLabel}</h1>
      <p className="text-muted-foreground">{t("myOwnDescription", { entity: entityLabel })}</p>
      <p className="text-sm text-muted-foreground">{t("comingSoon")}</p>
    </div>
  );
}

function entityPath(entity: NavigationEntityKey): string {
  if (entity === "ridingClubs") return "riding-clubs";
  return entity;
}
