/**
 * Riding club layout — entity chrome only. View loads via useRidingClubView → GET /api/v1/riding-clubs/:id.
 */
import type { ReactNode } from "react";

import { RidingClubLayoutChrome } from "@/components/riding-club/riding-club-layout-chrome.tsx";

type RidingClubLayoutProps = {
  children: ReactNode;
  params: Promise<{ clubId: string; locale: string }>;
};

export default async function RidingClubLayout({ children, params }: RidingClubLayoutProps) {
  const { clubId } = await params;
  return <RidingClubLayoutChrome clubId={clubId}>{children}</RidingClubLayoutChrome>;
}
