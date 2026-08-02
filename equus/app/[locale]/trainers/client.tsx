/**
 * TrainerListClient — thin client boundary for the trainer list page
 * (`/trainers`).
 */

"use client";

import { TrainerListContent } from "@/components/trainer/list/trainer-list-content.tsx";

export function TrainerListClient() {
  return <TrainerListContent />;
}
