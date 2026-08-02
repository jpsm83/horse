/**
 * CoachCreateClient — thin client boundary for the create-coach page
 * (`/coaches/new`).
 */

"use client";

import { CoachCreateContent } from "@/components/coach/create/coach-create-content.tsx";

export function CoachCreateClient() {
  return <CoachCreateContent />;
}
