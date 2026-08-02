/**
 * TransportOwnershipSection — main owner display for the Transport Admin tab.
 * Links to the ownership-transfer inbox for managing main/co-owner changes.
 */

"use client";

import { useTranslations } from "next-intl";

import { buttonVariants } from "@/components/ui/button.tsx";
import { Link } from "@/i18n/navigation.ts";
import { cn } from "@/lib/utils";

export function TransportOwnershipSection() {
  const t = useTranslations("transport.admin");

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t("ownershipDescription")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/ownership-transfers"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          {t("manageOwnership")}
        </Link>
      </div>
    </div>
  );
}
