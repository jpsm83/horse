import type { Metadata } from "next";

import { TrainerHubContent } from "./client";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ trainerId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/trainers/[trainerId]", "metadata.trainerHub");
}

export default async function TrainerHubPage({ params }: PageProps) {
  const { trainerId } = await params;
  return <TrainerHubContent trainerId={trainerId} />;
}
