import type { Metadata } from "next";

import { VeterinaryListClient } from "./client";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/veterinaries", "metadata.veterinaries");
}

export default function VeterinariesPage() {
  return <VeterinaryListClient />;
}
