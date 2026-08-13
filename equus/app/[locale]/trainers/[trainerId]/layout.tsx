/**
 * Trainer layout — entity chrome only. View loads via useTrainerView → GET /api/v1/trainers/:id.
 */
import type { ReactNode } from "react";

import { TrainerLayoutChrome } from "@/components/trainer/trainer-layout-chrome.tsx";

type TrainerLayoutProps = {
  children: ReactNode;
  params: Promise<{ trainerId: string; locale: string }>;
};

export default async function TrainerLayout({ children, params }: TrainerLayoutProps) {
  const { trainerId } = await params;
  return <TrainerLayoutChrome trainerId={trainerId}>{children}</TrainerLayoutChrome>;
}
