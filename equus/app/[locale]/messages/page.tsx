import type { Metadata } from "next";

import { MessagesClient } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/messages", "metadata.messages");
}

export default function MessagesPage() {
  return <MessagesClient />;
}
