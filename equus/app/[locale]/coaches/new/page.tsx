import type { Metadata } from "next";

import { CoachCreateClient } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/coaches/new", "metadata.coachCreate");
}

export default function CreateCoachPage() {
  return <CoachCreateClient />;
}
