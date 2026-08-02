import type { Metadata } from "next";

import { WorkplacesClient } from "./client";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/workplaces", "metadata.workplaces");
}

export default function WorkplacesPage() {
  return <WorkplacesClient />;
}
