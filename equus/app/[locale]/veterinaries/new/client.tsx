/**
 * VeterinaryCreateClient — thin client boundary for the create-veterinary page
 * (`/veterinaries/new`).
 */

"use client";

import { VeterinaryCreateContent } from "@/components/veterinary/create/veterinary-create-content.tsx";

export function VeterinaryCreateClient() {
  return <VeterinaryCreateContent />;
}
