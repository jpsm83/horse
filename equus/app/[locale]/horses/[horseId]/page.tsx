import type { Metadata } from "next";

import { HubContent } from "./client.tsx";
import { generateHorseMetadata } from "@/lib/seo/entity-metadata.ts";
import { fetchApiJson } from "@/lib/seo/fetchApiJson.ts";
import type { HorseViewResponse } from "@/lib/services/horseService.ts";

type HorseHubPageProps = {
  params: Promise<{ horseId: string; locale: string }>;
};

export async function generateMetadata({ params }: HorseHubPageProps): Promise<Metadata> {
  const { horseId, locale } = await params;
  const view = await fetchApiJson<HorseViewResponse>(
    `/api/v1/horses/${encodeURIComponent(horseId)}`,
  );
  const horse = view?.horse;
  if (!horse?.name) {
    return { title: "Horse Not Found | Equus", robots: "noindex, nofollow" };
  }
  return generateHorseMetadata(
    {
      name: horse.name,
      breed: horse.breed,
      age:
        horse.sections?.identity?.age ??
        (horse.dateOfBirth
          ? new Date().getFullYear() - new Date(horse.dateOfBirth).getFullYear()
          : undefined),
      description: horse.sections?.about?.description ?? horse.description,
      image: horse.profileImageUrl,
    },
    locale,
    horseId,
  );
}

export default async function HorseHubPage({ params }: HorseHubPageProps) {
  const { horseId } = await params;
  return <HubContent horseId={horseId} />;
}
