/**
 * TransportPageShell — auth and ownership gate for transport sub-page content.
 *
 * Tab chrome and content padding live in TransportLayoutChrome (layout.tsx).
 * Reads the transport view via `useTransportView` (`GET /api/v1/transports/:id`).
 * Requires authentication for non-hub tabs; gates admin behind
 * `requireMainOwner`.
 */

"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation.ts";
import { useTranslations } from "next-intl";

import { TransportPageContentSkeleton } from "@/components/transport/transport-page-content-skeleton.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useTransportView } from "@/hooks/queries/useTransport.ts";
import { Link } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import type { TransportViewDto } from "@/lib/services/transportService.ts";

export type TransportPageShellRenderProps = {
  transport: TransportViewDto;
  isOwner: boolean;
};

type TransportPageShellProps = {
  transportId: string;
  requireOwnership?: boolean;
  requireMainOwner?: boolean;
  children: ReactNode | ((props: TransportPageShellRenderProps) => ReactNode);
};

export function TransportPageShell({
  transportId,
  requireOwnership,
  requireMainOwner,
  children,
}: TransportPageShellProps) {
  const t = useTranslations("common");
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAppAuth();
  const { data: view, isLoading: isViewLoading } = useTransportView(transportId);

  const isLoading = isAuthLoading || isViewLoading;
  const transport = view?.transport;
  const isAdmin = transport?.isAdmin === true;
  const isMainOwner = transport?.isMainOwner === true;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(buildSignInPath("/transport/" + transportId));
    }
  }, [isLoading, isAuthenticated, router, transportId]);

  const blocked =
    !isLoading &&
    Boolean(transport) &&
    ((requireMainOwner && !isMainOwner) || (requireOwnership && !isAdmin));

  if (isLoading || !transport) {
    return <TransportPageContentSkeleton suppressHydrationWarning />;
  }

  if (!isAuthenticated) {
    return <TransportPageContentSkeleton suppressHydrationWarning />;
  }

  if (blocked) {
    return (
      <div className="mx-auto p-6">
        <p className="text-muted-foreground">{t("permissionDenied")}</p>
        <Link
          href={"/transport/" + transportId}
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
        >
          {t("backToHub")}
        </Link>
      </div>
    );
  }

  return typeof children === "function" ? (
    children({ transport, isOwner: isMainOwner })
  ) : (
    children
  );
}
