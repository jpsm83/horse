/**
 * RidingClubCreateClient — thin client boundary for the create-riding-club page
 * (`/riding-clubs/new`).
 */

"use client";

import { RidingClubCreateContent } from "@/components/riding-club/create/riding-club-create-content.tsx";

export function RidingClubCreateClient() {
  return <RidingClubCreateContent />;
}
