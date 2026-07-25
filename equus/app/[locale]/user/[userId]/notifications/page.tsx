import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { NotificationsContent } from "./client";

type PageProps = { params: Promise<{ userId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/user/[userId]/notifications", "metadata.notifications");
}

export default async function NotificationsPage({ params }: PageProps) {
  const { userId } = await params;
  return <NotificationsContent userId={userId} />;
}
