import { Suspense } from "react";
import { HorseAdminPageContent } from "@/components/horses/horse-admin-page-content.tsx";
import { HorseHubPageSkeleton } from "@/components/horses/horse-hub-page-skeleton.tsx";
import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = {
  params: Promise<{ locale: string; horseId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/horses/[horseId]/sale", "metadata.horseAdmin");
}

export default async function HorseAdminPage({ params }: PageProps) {
  const { horseId } = await params;
  return (
    <Suspense fallback={<HorseHubPageSkeleton />}>
      <HorseAdminPageContent horseId={horseId} />
    </Suspense>
  );
}
