import { Suspense } from "react";
import { HorseSalePageContent } from "@/components/horses/horse-sale-page-content.tsx";
import { HorseHubPageSkeleton } from "@/components/horses/horse-hub-page-skeleton.tsx";
import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = {
  params: Promise<{ locale: string; horseId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/horses/[horseId]/sale", "metadata.horseSale");
}

export default async function HorseSalePage({ params }: PageProps) {
  const { horseId } = await params;
  return (
    <Suspense fallback={<HorseHubPageSkeleton />}>
      <HorseSalePageContent horseId={horseId} />
    </Suspense>
  );
}
