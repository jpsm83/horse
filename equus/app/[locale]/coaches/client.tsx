/**
 * CoachListClient — thin client boundary for the coach list page (`/coaches`).
 */

"use client";

import { CoachListContent } from "@/components/coach/list/coach-list-content.tsx";

export function CoachListClient() {
  return <CoachListContent />;
}
