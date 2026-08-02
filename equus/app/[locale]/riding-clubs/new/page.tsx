import type { Metadata } from "next";

import { RidingClubCreateClient } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/riding-clubs/new", "metadata.ridingClubCreate");
}

export default function CreateRidingClubPage() {
  return <RidingClubCreateClient />;
}
