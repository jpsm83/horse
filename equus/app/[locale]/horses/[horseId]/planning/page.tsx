import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { PlanningContent } from "./client";

type PageProps = { params: Promise<{ horseId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/horses/[horseId]/planning", "metadata.horsePlanning");
}

export default async function HorsePlanningPage({ params }: PageProps) {
  const { horseId } = await params;
  return <PlanningContent horseId={horseId} />;
}
