"use client";

import {
  ConfirmActionDialog,
  type ConfirmActionDialogProps,
} from "@/components/shared/confirm-action-dialog.tsx";

type ConfirmDeleteDialogProps = Omit<ConfirmActionDialogProps, "variant">;

/** Shared destructive confirmation dialog (Media / Documents / Admin remove). */
export function ConfirmDeleteDialog(props: ConfirmDeleteDialogProps) {
  return <ConfirmActionDialog {...props} variant="destructive" />;
}
