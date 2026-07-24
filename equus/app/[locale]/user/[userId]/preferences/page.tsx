import type { Metadata } from "next";

import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { PreferencesContent } from "./client";

type PageProps = { params: Promise<{ userId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(
    locale,
    "/user/[userId]/preferences",
    "metadata.preferences",
  );
}

export default async function UserPreferencesPage({ params }: PageProps) {
  const { userId } = await params;
  return <PreferencesContent userId={userId} />;
}
