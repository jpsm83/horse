/**
 * TrainerPageShell — auth and ownership gate for trainer sub-page content.
 *
 * Tab chrome and content padding live in TrainerLayoutChrome (layout.tsx).
 * Reads the trainer view via `useTrainerView` (`GET /api/v1/trainers/:id`).
 * User-linked ownership: the view DTO's `isOwner` flag (computed by the
 * service from `Trainer.userId`) gates the profile tab; there is no co-owner or
 * admin concept.
 */

"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation.ts";
import { useTranslations } from "next-intl";

import { TrainerPageContentSkeleton } from "@/components/trainer/trainer-page-content-skeleton.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useTrainerView } from "@/hooks/queries/useTrainer.ts";
import { Link } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import type { TrainerViewDto } from "@/lib/services/trainerService.ts";

export type TrainerPageShellRenderProps = {
  trainer: TrainerViewDto;
  isOwner: boolean;
};

type TrainerPageShellProps = {
  trainerId: string;
  children: ReactNode | ((props: TrainerPageShellRenderProps) => ReactNode);
};

export function TrainerPageShell({ trainerId, children }: TrainerPageShellProps) {
  const t = useTranslations("common");
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAppAuth();
  const { data: view, isLoading: isViewLoading } = useTrainerView(trainerId);

  const isLoading = isAuthLoading || isViewLoading;
  const trainer = view?.trainer;
  const isOwner = trainer?.isOwner === true;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(buildSignInPath("/trainers/" + trainerId));
    }
  }, [isLoading, isAuthenticated, router, trainerId]);

  if (isLoading || !trainer) {
    return <TrainerPageContentSkeleton suppressHydrationWarning />;
  }

  if (!isAuthenticated) {
    return <TrainerPageContentSkeleton suppressHydrationWarning />;
  }

  if (!isOwner) {
    return (
      <div className="mx-auto p-6">
        <p className="text-muted-foreground">{t("permissionDenied")}</p>
        <Link
          href={"/trainers/" + trainerId}
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
        >
          {t("backToHub")}
        </Link>
      </div>
    );
  }

  return typeof children === "function" ? (
    children({ trainer, isOwner })
  ) : (
    children
  );
}
