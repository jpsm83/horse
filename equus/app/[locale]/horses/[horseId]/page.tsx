import type { Metadata } from "next";
import { Suspense } from "react";

import { HorseHubPageContent } from "@/components/horses/horse-hub-page-content.tsx";
import { HorseHubPageSkeleton } from "@/components/horses/horse-hub-page-skeleton.tsx";
import { generateHorseMetadata } from "@/lib/seo/entity-metadata.ts";
import Horse from "@/models/Horse.ts";

type HorseHubPageProps = {
  params: Promise<{ horseId: string; locale: string }>;
};

export async function generateMetadata({ params }: HorseHubPageProps): Promise<Metadata> {
  const { horseId, locale } = await params;
  try {
    const horse = await Horse.findById(horseId).select("name breed dateOfBirth location description profileImageUrl").lean();
    if (!horse) return { title: "Horse Not Found | Equus", robots: "noindex, nofollow" };
    return generateHorseMetadata({
      name: horse.name,
      breed: horse.breed,
      age: horse.dateOfBirth ? new Date().getFullYear() - new Date(horse.dateOfBirth).getFullYear() : undefined,
      location: horse.location,
      description: horse.description,
      image: horse.profileImageUrl,
    }, locale, horseId);
  } catch {
    return { title: "Horse Not Found | Equus", robots: "noindex, nofollow" };
  }
}

export default async function HorseHubPage({ params }: HorseHubPageProps) {
  const { horseId } = await params;

  return (
    <Suspense fallback={<HorseHubPageSkeleton />}>
      <HorseHubPageContent horseId={horseId} />
    </Suspense>
  );
}
