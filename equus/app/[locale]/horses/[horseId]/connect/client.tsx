"use client";

import { useTranslations } from "next-intl";
import { ErrorBoundary } from "react-error-boundary";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { HorseConnectInviteSection } from "@/components/horses/connect/horse-invite-section.tsx";
import { HorseConnectionsTableSection } from "@/components/horses/connect/horse-connections-table-section.tsx";
import { HorseSectionVisibility } from "@/components/horses/shared/horse-section-visibility.tsx";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { Section } from "@/components/shared/section.tsx";
import type { OwnerHorseSummary } from "@/lib/api/horseClient.ts";
import { normalizeHubSections } from "@/lib/horses/hubSections.ts";

type ConnectContentProps = {
  horseId: string;
};

export function ConnectContent({ horseId }: ConnectContentProps) {
  return (
    <HorsePageShell horseId={horseId} requireOwnership>
      {({ horse }) => <ConnectSections horseId={horseId} horse={horse} />}
    </HorsePageShell>
  );
}

type ConnectSectionsProps = {
  horseId: string;
  horse: OwnerHorseSummary;
};

function ConnectSections({ horseId, horse }: ConnectSectionsProps) {
  const t = useTranslations("horseConnect");
  const hubSections = normalizeHubSections(horse.hubSections);

  return (
    <>
      <Section
        title={t("inviteSection")}
        description={t("description")}
        className="shrink-0"
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <HorseConnectInviteSection horseId={horseId} />
        </ErrorBoundary>
      </Section>

      <Section
        title={t("connectionsSection")}
        className="flex-1"
        visibilityControl={
          <HorseSectionVisibility
            horseId={horseId}
            sectionKey="connections"
            mode={hubSections.connections.mode}
            uiSectionKey="connect-connections"
          />
        }
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <HorseConnectionsTableSection horseId={horseId} />
        </ErrorBoundary>
      </Section>
    </>
  );
}
