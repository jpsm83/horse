import type { Metadata } from "next";

import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { ProfileContent } from "./client";

type PageProps = { params: Promise<{ userId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/user/[userId]/profile", "metadata.profile");
}

export default async function UserProfilePage({ params }: PageProps) {
  const { userId } = await params;
  return <ProfileContent userId={userId} />;
}
