import type { Metadata } from "next";

import { CoachProfileContent } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ coachId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/coaches/[coachId]/profile", "metadata.coachProfile");
}

export default async function CoachProfilePage({ params }: PageProps) {
  const { coachId } = await params;
  return <CoachProfileContent coachId={coachId} />;
}
