import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { HorseHealthPageContent } from "@/components/horses/horse-health-page-content.tsx";

type PageProps = { params: Promise<{ horseId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/horses/[horseId]/health", "metadata.horseHealth");
}

export default async function HorseHealthPage({ params }: PageProps) {
  const { horseId } = await params;
  return <HorseHealthPageContent horseId={horseId} />;
}
