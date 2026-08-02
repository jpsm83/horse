import type { Metadata } from "next";

import { BreederCreateClient } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/breeders/new", "metadata.breederCreate");
}

export default function CreateBreederPage() {
  return <BreederCreateClient />;
}
