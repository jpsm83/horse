"use client";

/**
 * Branded loading spinner and full-area overlay — used by pages/forms during async work.
 * `LoadingOverlay` — backdrop on the relative parent; spinner fixed at viewport center.
 */

import { PulseLoader } from "react-spinners";

import { cn } from "@/lib/utils";

const DEFAULT_SPINNER_COLOR = "#914d21";

type AppSpinnerProps = {
  className?: string;
  color?: string;
  size?: number;
};

/** PulseLoader color — matches `--primary` in `globals.css` (`#914d21`). */
export function AppSpinner({
  className,
  color = DEFAULT_SPINNER_COLOR,
  size = 14,
}: AppSpinnerProps) {
  return (
    <PulseLoader
      color={color}
      size={size}
      margin={4}
      speedMultiplier={0.9}
      className={className}
      aria-hidden
    />
  );
}

type LoadingOverlayProps = {
  active: boolean;
  /** Screen reader label when the overlay is visible. */
  label?: string;
  className?: string;
};

/** Backdrop covers the relative parent; spinner is fixed at the viewport center (below header z-50). */
export function LoadingOverlay({ active, label, className }: LoadingOverlayProps) {
  if (!active) {
    return null;
  }

  return (
    <>
      <div
        className={cn("absolute inset-0 z-10 bg-background/80", className)}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        <AppSpinner />
      </div>
    </>
  );
}
