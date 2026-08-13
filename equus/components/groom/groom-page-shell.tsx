/**
 * GroomPageShell — auth and ownership gate for groom sub-page content.
 *
 * Tab chrome and content padding live in GroomLayoutChrome (layout.tsx). Reads
 * the groom view via `useGroomView` (`GET /api/v1/grooms/:id`).
 * Grooms are user-linked: requires authentication and, when `requireOwnership`
 * is set, the linked `groom.userId` (`isOwner` on the view DTO). There is no
 * co-owner / main-owner concept.
 */

"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation.ts";
import { useTranslations } from "next-intl";

import { GroomPageContentSkeleton } from "@/components/groom/groom-page-content-skeleton.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useGroomView } from "@/hooks/queries/useGroom.ts";
import { Link } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import type { GroomViewDto } from "@/lib/services/groomService.ts";

export type GroomPageShellRenderProps = {
  groom: GroomViewDto;
  isOwner: boolean;
};

type GroomPageShellProps = {
  groomId: string;
  requireOwnership?: boolean;
  children: ReactNode | ((props: GroomPageShellRenderProps) => ReactNode);
};

export function GroomPageShell({
  groomId,
  requireOwnership,
  children,
}: GroomPageShellProps) {
  const t = useTranslations("common");
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAppAuth();
  const { data: view, isLoading: isViewLoading } = useGroomView(groomId);

  const isLoading = isAuthLoading || isViewLoading;
  const groom = view?.groom;
  const isOwner = groom?.isOwner === true;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(buildSignInPath("/groomers/" + groomId));
    }
  }, [isLoading, isAuthenticated, router, groomId]);

  const blocked =
    !isLoading && Boolean(groom) && requireOwnership && !isOwner;

  if (isLoading || !groom) {
    return <GroomPageContentSkeleton suppressHydrationWarning />;
  }

  if (!isAuthenticated) {
    return <GroomPageContentSkeleton suppressHydrationWarning />;
  }

  if (blocked) {
    return (
      <div className="mx-auto p-6">
        <p className="text-muted-foreground">{t("permissionDenied")}</p>
        <Link
          href={"/groomers/" + groomId}
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
        >
          {t("backToHub")}
        </Link>
      </div>
    );
  }

  return typeof children === "function" ? (
    children({ groom, isOwner })
  ) : (
    children
  );
}
