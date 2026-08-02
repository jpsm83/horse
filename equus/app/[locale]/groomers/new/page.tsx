import type { Metadata } from "next";

import { GroomCreateClient } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/groomers/new", "metadata.groomCreate");
}

export default function CreateGroomPage() {
  return <GroomCreateClient />;
}
