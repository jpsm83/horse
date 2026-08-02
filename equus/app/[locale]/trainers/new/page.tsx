import type { Metadata } from "next";

import { TrainerCreateClient } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/trainers/new", "metadata.trainerCreate");
}

export default function CreateTrainerPage() {
  return <TrainerCreateClient />;
}
