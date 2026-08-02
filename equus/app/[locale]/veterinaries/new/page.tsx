import type { Metadata } from "next";

import { VeterinaryCreateClient } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/veterinaries/new", "metadata.veterinaryCreate");
}

export default function CreateVeterinaryPage() {
  return <VeterinaryCreateClient />;
}
