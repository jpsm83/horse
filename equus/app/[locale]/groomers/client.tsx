/**
 * GroomListClient — thin client boundary for the groomers list page (`/groomers`).
 */

"use client";

import { GroomListContent } from "@/components/groom/list/groom-list-content.tsx";

export function GroomListClient() {
  return <GroomListContent />;
}
