/**
 * Coach layout — entity chrome only. View loads via useCoachView → GET /api/v1/coaches/:id.
 */
import type { ReactNode } from "react";

import { CoachLayoutChrome } from "@/components/coach/coach-layout-chrome.tsx";

type CoachLayoutProps = {
  children: ReactNode;
  params: Promise<{ coachId: string; locale: string }>;
};

export default async function CoachLayout({ children, params }: CoachLayoutProps) {
  const { coachId } = await params;
  return <CoachLayoutChrome coachId={coachId}>{children}</CoachLayoutChrome>;
}
