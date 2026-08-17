"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { UserPlus } from "lucide-react";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { HorseConnectInviteDialog } from "@/components/horses/connect/horse-connect-invite-dialog.tsx";
import { HorseConnectionsTableSection } from "@/components/horses/connect/horse-connections-table-section.tsx";
import { HorseSectionVisibility } from "@/components/horses/shared/horse-section-visibility.tsx";
import { Section } from "@/components/shared/section.tsx";
import { SectionTitleAction } from "@/components/shared/section-title-action.tsx";
import type { OwnerHorseSummary } from "@/lib/services/horseService.ts";
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
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <>
      <Section
        title={t("connectionsSection")}
        className="flex-1"
        titleAddon={
          <SectionTitleAction onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-3" />
            {t("invite")}
          </SectionTitleAction>
        }
        visibilityControl={
          <HorseSectionVisibility
            horseId={horseId}
            sectionKey="connections"
            mode={hubSections.connections.mode}
            uiSectionKey="connect-connections"
          />
        }
      >
        <SectionErrorBoundary resetKeys={[horseId]}>
          <HorseConnectionsTableSection horseId={horseId} />
        </SectionErrorBoundary>
      </Section>

      <HorseConnectInviteDialog
        horseId={horseId}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />
    </>
  );
}
