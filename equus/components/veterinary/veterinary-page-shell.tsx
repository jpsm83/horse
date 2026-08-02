/**
 * VeterinaryPageShell — auth and ownership gate for veterinary sub-page content.
 *
 * Tab chrome and content padding live in VeterinaryLayoutChrome (layout.tsx).
 * Reads the pre-seeded veterinary view from the TanStack cache populated by
 * layout RSC. User-linked ownership: the view DTO's `isOwner` flag (computed by
 * the service from `Veterinary.userId`) gates the profile tab; there is no
 * co-owner or admin concept.
 */

"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation.ts";
import { useTranslations } from "next-intl";

import { VeterinaryPageContentSkeleton } from "@/components/veterinary/veterinary-page-content-skeleton.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useVeterinaryView } from "@/hooks/queries/useVeterinary.ts";
import { Link } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import type { VeterinaryViewDto } from "@/lib/services/veterinaryService.ts";

export type VeterinaryPageShellRenderProps = {
  veterinary: VeterinaryViewDto;
  isOwner: boolean;
};

type VeterinaryPageShellProps = {
  veterinaryId: string;
  children: ReactNode | ((props: VeterinaryPageShellRenderProps) => ReactNode);
};

export function VeterinaryPageShell({ veterinaryId, children }: VeterinaryPageShellProps) {
  const t = useTranslations("common");
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAppAuth();
  const { data: view, isLoading: isViewLoading } = useVeterinaryView(veterinaryId);

  const isLoading = isAuthLoading || isViewLoading;
  const veterinary = view?.veterinary;
  const isOwner = veterinary?.isOwner === true;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(buildSignInPath("/veterinaries/" + veterinaryId));
    }
  }, [isLoading, isAuthenticated, router, veterinaryId]);

  if (isLoading || !veterinary) {
    return <VeterinaryPageContentSkeleton suppressHydrationWarning />;
  }

  if (!isAuthenticated) {
    return <VeterinaryPageContentSkeleton suppressHydrationWarning />;
  }

  if (!isOwner) {
    return (
      <div className="mx-auto p-6">
        <p className="text-muted-foreground">{t("permissionDenied")}</p>
        <Link
          href={"/veterinaries/" + veterinaryId}
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
        >
          {t("backToHub")}
        </Link>
      </div>
    );
  }

  return typeof children === "function" ? (
    children({ veterinary, isOwner })
  ) : (
    children
  );
}
