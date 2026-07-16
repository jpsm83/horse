"use client";

import { useTranslations } from "next-intl";
import { ErrorBoundary } from "react-error-boundary";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { InviteSection } from "@/components/horses/connect/invite-section.tsx";
import { ConnectionsTableSection } from "@/components/horses/connections-table-section.tsx";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";

type ConnectContentProps = {
  horseId: string;
};

export function ConnectContent({ horseId }: ConnectContentProps) {
  const t = useTranslations("horseConnect");

  return (
    <HorsePageShell horseId={horseId} requireOwnership>
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{t("inviteSection")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <InviteSection horseId={horseId} />
        </ErrorBoundary>
      </section>

      <section className="space-y-4 h-full">
        <h2 className="text-xl font-semibold">{t("connectionsSection")}</h2>
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <ConnectionsTableSection horseId={horseId} />
        </ErrorBoundary>
      </section>
    </HorsePageShell>
  );
}
