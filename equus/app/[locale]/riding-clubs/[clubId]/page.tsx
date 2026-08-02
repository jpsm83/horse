import type { Metadata } from "next";

import { RidingClubHubContent } from "./client";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ clubId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/riding-clubs/[clubId]", "metadata.ridingClubHub");
}

export default async function RidingClubHubPage({ params }: PageProps) {
  const { clubId } = await params;
  return <RidingClubHubContent clubId={clubId} />;
}
