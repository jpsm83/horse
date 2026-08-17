import { redirect } from "@/i18n/navigation.ts";

type PageProps = { params: Promise<{ locale: string }> };

/** Legacy owner-tier route — billing lives on Stable Admin (Block 26). */
export default async function SubscriptionPage({ params }: PageProps) {
  const { locale } = await params;
  redirect({ href: "/home", locale });
}
