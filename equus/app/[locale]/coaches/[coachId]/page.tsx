import type { Metadata } from "next";

import { CoachHubContent } from "./client";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ coachId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/coaches/[coachId]", "metadata.coachHub");
}

export default async function CoachHubPage({ params }: PageProps) {
  const { coachId } = await params;
  return <CoachHubContent coachId={coachId} />;
}
