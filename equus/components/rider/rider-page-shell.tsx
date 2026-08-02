/**
 * RiderPageShell — auth and user-linked ownership gate for rider sub-page
 * content.
 *
 * Tab chrome and content padding live in RiderLayoutChrome (layout.tsx). Reads
 * the pre-seeded rider view from the TanStack cache populated by layout RSC.
 * Gates on `isAuthenticated` and the view DTO's `isOwner` flag (computed by the
 * service when `rider.userId === user.id`). There is no co-owner/admin logic —
 * user-linked profiles have exactly one owner.
 */

"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation.ts";
import { useTranslations } from "next-intl";

import { RiderPageContentSkeleton } from "@/components/rider/rider-page-content-skeleton.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useRiderView } from "@/hooks/queries/useRider.ts";
import { Link } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import type { RiderViewDto } from "@/lib/services/riderService.ts";

export type RiderPageShellRenderProps = {
  rider: RiderViewDto;
  isOwner: boolean;
};

type RiderPageShellProps = {
  riderId: string;
  requireOwnership?: boolean;
  children: ReactNode | ((props: RiderPageShellRenderProps) => ReactNode);
};

export function RiderPageShell({
  riderId,
  requireOwnership,
  children,
}: RiderPageShellProps) {
  const t = useTranslations("common");
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAppAuth();
  const { data: view, isLoading: isViewLoading } = useRiderView(riderId);

  const isLoading = isAuthLoading || isViewLoading;
  const rider = view?.rider;
  const isOwner = rider?.isOwner === true;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(buildSignInPath("/riders/" + riderId));
    }
  }, [isLoading, isAuthenticated, router, riderId]);

  const blocked = !isLoading && Boolean(rider) && requireOwnership && !isOwner;

  if (isLoading || !rider) {
    return <RiderPageContentSkeleton suppressHydrationWarning />;
  }

  if (!isAuthenticated) {
    return <RiderPageContentSkeleton suppressHydrationWarning />;
  }

  if (blocked) {
    return (
      <div className="mx-auto p-6">
        <p className="text-muted-foreground">{t("permissionDenied")}</p>
        <Link
          href={"/riders/" + riderId}
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
        >
          {t("backToHub")}
        </Link>
      </div>
    );
  }

  return typeof children === "function" ? (
    children({ rider, isOwner })
  ) : (
    children
  );
}
