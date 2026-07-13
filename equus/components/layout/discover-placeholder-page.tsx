"use client";

import { useTranslations } from "next-intl";

import type { NavigationEntityKey } from "@/components/layout/navigation-config.ts";

type DiscoverPlaceholderPageProps = {
  entity: NavigationEntityKey;
};

/** Public directory placeholder — left burger menu destinations. */
export function DiscoverPlaceholderPage({ entity }: DiscoverPlaceholderPageProps) {
  const t = useTranslations("header");
  const tDiscover = useTranslations("header.discover");
  const entityLabel = tDiscover(entity);

  return (
    <div className="mx-auto flex w-full  flex-1 flex-col gap-4 px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{entityLabel}</h1>
      <p className="text-muted-foreground">
        {t("discoverDescription", { entity: entityLabel })}
      </p>
      <p className="text-sm text-muted-foreground">{t("comingSoon")}</p>
    </div>
  );
}
