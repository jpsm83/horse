/**
 * Legacy `/me` route — redirects to `/home` (signed-in user hub).
 */

import { redirect } from "@/i18n/navigation.ts";
import { USER_HOME_PATH } from "@/lib/navigation/postAuthRedirect.ts";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LegacyMePage({ params }: PageProps) {
  const { locale } = await params;
  redirect({ href: USER_HOME_PATH, locale });
}
