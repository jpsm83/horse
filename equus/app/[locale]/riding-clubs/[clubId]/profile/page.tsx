import type { Metadata } from "next";

import { RidingClubProfileContent } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ clubId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(
    locale,
    "/riding-clubs/[clubId]/profile",
    "metadata.ridingClubProfile",
  );
}

export default async function RidingClubProfilePage({ params }: PageProps) {
  const { clubId } = await params;
  return <RidingClubProfileContent clubId={clubId} />;
}
