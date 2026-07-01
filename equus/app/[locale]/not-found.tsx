import { getTranslations } from "next-intl/server";

import { AuthAwareStatusActions } from "@/components/status/auth-aware-status-actions.tsx";
import { StatusPageShell } from "@/components/status/status-page-shell.tsx";

export default async function NotFoundPage() {
  const t = await getTranslations("status.notFound");

  return (
    <StatusPageShell title={t("title")} description={t("description")}>
      <AuthAwareStatusActions />
    </StatusPageShell>
  );
}
