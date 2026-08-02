import type { Metadata } from "next";

import { RidingClubAdminContent } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ clubId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(
    locale,
    "/riding-clubs/[clubId]/admin",
    "metadata.ridingClubAdmin",
  );
}

export default async function RidingClubAdminPage({ params }: PageProps) {
  const { clubId } = await params;
  return <RidingClubAdminContent clubId={clubId} />;
}
