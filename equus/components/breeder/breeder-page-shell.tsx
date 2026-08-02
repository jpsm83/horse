/**
 * BreederPageShell — auth and ownership gate for breeder sub-page content.
 *
 * Tab chrome and content padding live in BreederLayoutChrome (layout.tsx). Reads
 * the pre-seeded breeder view from the TanStack cache populated by layout RSC.
 * Requires authentication for non-hub tabs; gates admin behind `requireMainOwner`.
 */

"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation.ts";
import { useTranslations } from "next-intl";

import { BreederPageContentSkeleton } from "@/components/breeder/breeder-page-content-skeleton.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useBreederView } from "@/hooks/queries/useBreeder.ts";
import { Link } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import type { BreederViewDto } from "@/lib/services/breederService.ts";

export type BreederPageShellRenderProps = {
  breeder: BreederViewDto;
  isOwner: boolean;
};

type BreederPageShellProps = {
  breederId: string;
  requireOwnership?: boolean;
  requireMainOwner?: boolean;
  children: ReactNode | ((props: BreederPageShellRenderProps) => ReactNode);
};

export function BreederPageShell({
  breederId,
  requireOwnership,
  requireMainOwner,
  children,
}: BreederPageShellProps) {
  const t = useTranslations("common");
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAppAuth();
  const { data: view, isLoading: isViewLoading } = useBreederView(breederId);

  const isLoading = isAuthLoading || isViewLoading;
  const breeder = view?.breeder;
  const isAdmin = breeder?.isAdmin === true;
  const isMainOwner = breeder?.isMainOwner === true;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(buildSignInPath("/breeders/" + breederId));
    }
  }, [isLoading, isAuthenticated, router, breederId]);

  const blocked =
    !isLoading &&
    Boolean(breeder) &&
    ((requireMainOwner && !isMainOwner) || (requireOwnership && !isAdmin));

  if (isLoading || !breeder) {
    return <BreederPageContentSkeleton suppressHydrationWarning />;
  }

  if (!isAuthenticated) {
    return <BreederPageContentSkeleton suppressHydrationWarning />;
  }

  if (blocked) {
    return (
      <div className="mx-auto p-6">
        <p className="text-muted-foreground">{t("permissionDenied")}</p>
        <Link
          href={"/breeders/" + breederId}
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
        >
          {t("backToHub")}
        </Link>
      </div>
    );
  }

  return typeof children === "function" ? (
    children({ breeder, isOwner: isMainOwner })
  ) : (
    children
  );
}
