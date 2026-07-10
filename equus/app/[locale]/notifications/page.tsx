import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

import { NotificationsPlaceholderPage } from "@/components/layout/notifications-placeholder-page.tsx";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/notifications", "metadata.notifications");
}

export default function NotificationsPage() {
  return <NotificationsPlaceholderPage />;
}
