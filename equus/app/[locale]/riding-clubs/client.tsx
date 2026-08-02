/**
 * RidingClubListClient — thin client boundary for the riding clubs list page
 * (`/riding-clubs`).
 */

"use client";

import { RidingClubListContent } from "@/components/riding-club/list/riding-club-list-content.tsx";

export function RidingClubListClient() {
  return <RidingClubListContent />;
}
