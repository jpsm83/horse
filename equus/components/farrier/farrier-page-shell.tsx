/**
 * FarrierPageShell — auth and ownership gate for farrier sub-page content.
 *
 * Tab chrome and content padding live in FarrierLayoutChrome (layout.tsx).
 * Reads the pre-seeded farrier view from the TanStack cache populated by layout
 * RSC. Farriers are user-linked: requires authentication and, when
 * `requireOwnership` is set, the linked `farrier.userId` (`isOwner` on the view
 * DTO). There is no co-owner / main-owner concept.
 */

"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation.ts";
import { useTranslations } from "next-intl";

import { FarrierPageContentSkeleton } from "@/components/farrier/farrier-page-content-skeleton.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useFarrierView } from "@/hooks/queries/useFarrier.ts";
import { Link } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import type { FarrierViewDto } from "@/lib/services/farrierService.ts";

export type FarrierPageShellRenderProps = {
  farrier: FarrierViewDto;
  isOwner: boolean;
};

type FarrierPageShellProps = {
  farrierId: string;
  requireOwnership?: boolean;
  children: ReactNode | ((props: FarrierPageShellRenderProps) => ReactNode);
};

export function FarrierPageShell({
  farrierId,
  requireOwnership,
  children,
}: FarrierPageShellProps) {
  const t = useTranslations("common");
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAppAuth();
  const { data: view, isLoading: isViewLoading } = useFarrierView(farrierId);

  const isLoading = isAuthLoading || isViewLoading;
  const farrier = view?.farrier;
  const isOwner = farrier?.isOwner === true;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(buildSignInPath("/farriers/" + farrierId));
    }
  }, [isLoading, isAuthenticated, router, farrierId]);

  const blocked =
    !isLoading && Boolean(farrier) && requireOwnership && !isOwner;

  if (isLoading || !farrier) {
    return <FarrierPageContentSkeleton suppressHydrationWarning />;
  }

  if (!isAuthenticated) {
    return <FarrierPageContentSkeleton suppressHydrationWarning />;
  }

  if (blocked) {
    return (
      <div className="mx-auto p-6">
        <p className="text-muted-foreground">{t("permissionDenied")}</p>
        <Link
          href={"/farriers/" + farrierId}
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
        >
          {t("backToHub")}
        </Link>
      </div>
    );
  }

  return typeof children === "function" ? (
    children({ farrier, isOwner })
  ) : (
    children
  );
}
