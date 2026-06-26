import { getTranslations } from "next-intl/server";

import { StatusPageShell } from "@/components/status/status-page-shell.tsx";

export default async function NotFound() {
  const t = await getTranslations("status.notFound");
  const common = await getTranslations("common");

  return (
    <StatusPageShell
      title={t("title")}
      description={t("description")}
      actions={[
        { label: common("home"), href: "/" },
        { label: common("signIn"), href: "/signin", variant: "outline" },
      ]}
    />
  );
}
