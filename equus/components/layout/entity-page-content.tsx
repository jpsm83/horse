"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { useRouter } from "@/i18n/navigation.ts";

type EntityPageContentProps = {
  entity: string;
  owned?: boolean;
  showSignIn?: boolean;
};

function entityToKey(entity: string): string {
  return entity === "riding-clubs" ? "ridingClubs" : entity;
}

export function EntityPageContent({
  entity,
  owned = false,
  showSignIn = true,
}: EntityPageContentProps) {
  const router = useRouter();
  const t = useTranslations("header");
  const tDiscover = useTranslations("header.discover");
  const tMyOwn = useTranslations("header.myOwn");
  const { isAuthenticated, isLoading } = useAppAuth();
  const entityKey = entityToKey(entity);

  const entityLabel = tDiscover(entityKey);
  const title = isAuthenticated && owned ? tMyOwn(entityKey) : entityLabel;

  useEffect(() => {
    if (!isLoading && !isAuthenticated && showSignIn) {
      router.replace(buildSignInPath(`/${entity}`));
    }
  }, [isAuthenticated, isLoading, router, entity, showSignIn]);

  if (isLoading) {
    return <Skeleton className="h-[calc(100vh-5rem)] w-full rounded-none" />;
  }

  return (
    <div className="mx-auto flex w-full  flex-1 flex-col gap-4 px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">
        {isAuthenticated && owned
          ? t("myOwnDescription", { entity: title })
          : t("discoverDescription", { entity: entityLabel })}
      </p>
      <p className="text-sm text-muted-foreground">{t("comingSoon")}</p>
    </div>
  );
}
