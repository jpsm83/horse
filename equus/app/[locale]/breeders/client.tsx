/**
 * BreederListClient — thin client boundary for the breeders list page (`/breeders`).
 */

"use client";

import { BreederListContent } from "@/components/breeder/list/breeder-list-content.tsx";

export function BreederListClient() {
  return <BreederListContent />;
}
