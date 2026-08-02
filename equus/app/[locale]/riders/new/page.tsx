import type { Metadata } from "next";

import { RiderCreateClient } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/riders/new", "metadata.riderCreate");
}

export default function CreateRiderPage() {
  return <RiderCreateClient />;
}
