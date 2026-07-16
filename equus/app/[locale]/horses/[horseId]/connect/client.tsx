"use client";

import { useTranslations } from "next-intl";
import { ErrorBoundary } from "react-error-boundary";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { InviteSection } from "@/components/horses/connect/invite-section.tsx";
import { ConnectionsTableSection } from "@/components/horses/connections-table-section.tsx";

type ConnectContentProps = {
  horseId: string;
};

export function ConnectContent({ horseId }: ConnectContentProps) {
  const t = useTranslations("horseConnect");

  return (
    <HorsePageShell horseId={horseId} requireOwnership>
      <Section
        title={t("inviteSection")}
        description={t("description")}
        className="shrink-0"
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <InviteSection horseId={horseId} />
        </ErrorBoundary>
      </Section>

      <Section
        title={t("connectionsSection")}
        sectionKey="connect-connections"
        visibility={{ mode: "owner" }}
        onVisibilityChange={() => {}}
        className="flex-1"
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <ConnectionsTableSection horseId={horseId} />
        </ErrorBoundary>
      </Section>
    </HorsePageShell>
  );
}
