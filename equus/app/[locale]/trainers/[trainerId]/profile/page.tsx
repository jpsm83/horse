import type { Metadata } from "next";

import { TrainerProfileContent } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ trainerId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/trainers/[trainerId]/profile", "metadata.trainerProfile");
}

export default async function TrainerProfilePage({ params }: PageProps) {
  const { trainerId } = await params;
  return <TrainerProfileContent trainerId={trainerId} />;
}
