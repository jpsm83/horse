"use client";

import { UserPageShell } from "@/components/user/user-page-shell.tsx";
import { UserHubContent } from "@/components/user/hub/user-hub-content.tsx";
import { UserPageContentSkeleton } from "@/components/user/user-page-content-skeleton.tsx";
import { useUserView } from "@/hooks/queries/useCurrentUser.ts";

type Props = { userId: string };

export function HubContent({ userId }: Props) {
  return (
    <UserPageShell userId={userId}>
      <OwnerHubContent userId={userId} />
    </UserPageShell>
  );
}

function OwnerHubContent({ userId }: Props) {
  const { data: view } = useUserView(userId);
  const sections = view?.user?.sections;

  if (!sections) {
    return <UserPageContentSkeleton suppressHydrationWarning />;
  }

  return <UserHubContent sections={sections} />;
}
