import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { HorseFeedPageContent } from "@/components/horses/horse-feed-page-content.tsx";

type PageProps = { params: Promise<{ horseId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/horses/[horseId]/feed", "metadata.horseFeed");
}

export default async function HorseFeedPage({ params }: PageProps) {
  const { horseId } = await params;
  return <HorseFeedPageContent horseId={horseId} />;
}
