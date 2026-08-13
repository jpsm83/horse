/**
 * User layout — entity chrome only. View loads via useUserView → GET /api/v1/users/:id/view.
 */
import type { ReactNode } from "react";

import { UserLayoutChrome } from "@/components/user/user-layout-chrome.tsx";

type UserLayoutProps = {
  children: ReactNode;
  params: Promise<{ userId: string; locale: string }>;
};

export default async function UserLayout({ children, params }: UserLayoutProps) {
  const { userId } = await params;
  return <UserLayoutChrome userId={userId}>{children}</UserLayoutChrome>;
}
