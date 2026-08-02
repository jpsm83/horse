/**
 * VeterinaryListClient — thin client boundary for the veterinary list page
 * (`/veterinaries`).
 */

"use client";

import { VeterinaryListContent } from "@/components/veterinary/list/veterinary-list-content.tsx";

export function VeterinaryListClient() {
  return <VeterinaryListContent />;
}
