/**
 * TrainerCreateClient — thin client boundary for the create-trainer page
 * (`/trainers/new`).
 */

"use client";

import { TrainerCreateContent } from "@/components/trainer/create/trainer-create-content.tsx";

export function TrainerCreateClient() {
  return <TrainerCreateContent />;
}
