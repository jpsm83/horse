import type { Metadata } from "next";

import { TransportCreateClient } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/transport/new", "metadata.transportCreate");
}

export default function CreateTransportPage() {
  return <TransportCreateClient />;
}
