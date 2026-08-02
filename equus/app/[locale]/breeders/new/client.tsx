/**
 * BreederCreateClient — thin client boundary for the create-breeder page
 * (`/breeders/new`).
 */

"use client";

import { BreederCreateContent } from "@/components/breeder/create/breeder-create-content.tsx";

export function BreederCreateClient() {
  return <BreederCreateContent />;
}
