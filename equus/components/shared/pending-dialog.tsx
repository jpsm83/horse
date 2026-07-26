/**
 * PendingDialog — shared blocking Dialog shell with pending Spinner overlay.
 *
 * Use for invite/upload/connect flows. While `pending`, dismiss is blocked and a
 * centered Spinner covers the body. See page-flow-blueprint §5.5.1.
 */

"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type PendingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** When true, shows Spinner overlay and blocks dismiss. */
  pending?: boolean;
  className?: string;
  children: ReactNode;
};

export function PendingDialog({
  open,
  onOpenChange,
  title,
  description,
  pending = false,
  className,
  children,
}: PendingDialogProps) {
  const tCommon = useTranslations("common");

  function handleOpenChange(next: boolean) {
    if (pending && !next) return;
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn("sm:max-w-lg", className)}
        showCloseButton={!pending}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="relative">
          {children}
          {pending ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-popover/80"
              aria-busy="true"
              aria-live="polite"
            >
              <Spinner className="size-8" aria-label={tCommon("loading")} />
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
