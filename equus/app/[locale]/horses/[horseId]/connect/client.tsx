"use client";

import { useTranslations } from "next-intl";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { InviteSection } from "@/components/horses/connect/invite-section.tsx";
import { ConnectionsTableSection } from "@/components/horses/connections-table-section.tsx";

type ConnectContentProps = {
  horseId: string;
};

export function ConnectContent({ horseId }: ConnectContentProps) {
  const t = useTranslations("horseConnect");

  return (
    <HorsePageShell horseId={horseId} requireOwnership>
      <Section title={t("inviteSection")} description={t("description")}>
        <InviteSection horseId={horseId} />
      </Section>

      <div className="min-w-full">
      <Section
        title={t("connectionsSection")}
        sectionKey="connect-connections"
        visibility={{ mode: "owner" }}
        onVisibilityChange={() => {}}
        fill
      >
          <ConnectionsTableSection horseId={horseId} />
        </Section>
      </div>
    </HorsePageShell>
  );
}
