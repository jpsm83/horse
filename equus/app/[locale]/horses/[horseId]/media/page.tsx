import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { MediaContent } from "./client";

type PageProps = { params: Promise<{ horseId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/horses/[horseId]/media", "metadata.horseMedia");
}

export default async function HorseMediaPage({ params }: PageProps) {
  const { horseId } = await params;
  return <MediaContent horseId={horseId} />;
}
