"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { EntityPlaceholderSkeleton } from "@/components/layout/entity-placeholder-skeleton.tsx";
import type { NavigationEntityKey } from "@/components/layout/navigation-config.ts";
import { CREATE_LINKS, MY_OWN_LINKS, PLURAL_OWNED_CREATE_ENTITIES } from "@/components/layout/navigation-config.ts";
import { useRouter } from "@/i18n/navigation.ts";
import { fetchCurrentUser } from "@/lib/api/auth/session";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";

type AuthEntityPlaceholderMode = "owned" | "create";

type MyPlaceholderPageProps = {
  entity: NavigationEntityKey;
  /** `owned` = /my/* hub; `create` = /create/* subsection setup */
  mode?: AuthEntityPlaceholderMode;
};

/** Auth-gated placeholder for /my/* and /create/* entity routes. */
export function MyPlaceholderPage({ entity, mode = "owned" }: MyPlaceholderPageProps) {
  const router = useRouter();
  const t = useTranslations("header");
  const tMyOwn = useTranslations("header.myOwn");
  const tCreate = useTranslations("createSubsection");
  const tCreateEntityLabels = useTranslations("createSubsection.entityLabels");
  const links = mode === "owned" ? MY_OWN_LINKS : CREATE_LINKS;
  const href = links.find((item) => item.key === entity)?.href ?? "/";
  const title = mode === "owned" ? tMyOwn(entity) : tCreate(entity);
  const createEntityLabel = tCreateEntityLabels(entity);

  const [isLoading, setIsLoading] = useState(true);

  const verifyAuth = useCallback(async () => {
    try {
      await fetchCurrentUser();
    } catch {
      router.replace(buildSignInPath(href));
    } finally {
      setIsLoading(false);
    }
  }, [href, router]);

  useEffect(() => {
    void verifyAuth();
  }, [verifyAuth]);

  if (isLoading) {
    return <EntityPlaceholderSkeleton />;
  }

  return (
    <div className="mx-auto flex w-full  flex-1 flex-col gap-4 px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">
        {mode === "owned"
          ? t("myOwnDescription", { entity: title })
          : PLURAL_OWNED_CREATE_ENTITIES.has(entity)
            ? tCreate("descriptionPlural", { entity: createEntityLabel })
            : tCreate("descriptionSingular", { entity: createEntityLabel })}
      </p>
      <p className="text-sm text-muted-foreground">{t("comingSoon")}</p>
    </div>
  );
}
