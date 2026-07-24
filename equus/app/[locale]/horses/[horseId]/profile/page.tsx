import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { ProfileContent } from "./client";

type PageProps = { params: Promise<{ horseId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/horses/[horseId]/profile", "metadata.horseProfile");
}

export default async function HorseProfilePage({ params }: PageProps) {
  const { horseId } = await params;
  return <ProfileContent horseId={horseId} />;
}
