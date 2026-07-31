/**
 * Profile photo picker — circular avatar or rectangular cover preview.
 * Parent owns upload state and submit.
 * Fully reusable — accepts display strings via `labels` prop, no i18n namespace coupling.
 *
 * Used by:
 * - `ProfileForm` (profile page)
 * - `CreateHorseForm` (horse create page)
 * - `HorseHubHero` (avatar + cover variants)
 */

"use client";

import { Camera, Trash2 } from "lucide-react";
import { useEffect, useId } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type ProfilePhotoFieldLabels = {
  photoChange?: string;
  photoRemovePreview?: string;
  photoInvalidType?: string;
  photoTooLarge?: string;
};

export type ProfilePhotoFieldProps = {
  imageUrl?: string;
  previewUrl?: string;
  initials: string;
  disabled?: boolean;
  /** `avatar` (default) = circular; `cover` = full-width hero band. */
  variant?: "avatar" | "cover";
  /** When `cover` + `fill`, the band fills its parent (hero full-bleed). */
  fill?: boolean;
  /** Avatar diameter only (`cover` ignores this). Default `lg` (8rem). */
  avatarSize?: "sm" | "md" | "lg" | "xl";
  className?: string;
  onFileSelect: (file: File | undefined) => void;
  onPreviewClear: () => void;
  onError?: (message: string) => void;
  labels?: ProfilePhotoFieldLabels;
};

const defaultLabels: Required<ProfilePhotoFieldLabels> = {
  photoChange: "Change photo",
  photoRemovePreview: "Remove preview",
  photoInvalidType: "Only image files are allowed",
  photoTooLarge: "File size exceeds 5 MB limit",
};

export function ProfilePhotoField({
  imageUrl,
  previewUrl,
  initials,
  disabled = false,
  variant = "avatar",
  fill = false,
  avatarSize = "lg",
  className,
  onFileSelect,
  onPreviewClear,
  onError,
  labels: labelsProp,
}: ProfilePhotoFieldProps) {
  const labels = { ...defaultLabels, ...labelsProp };
  const inputId = useId();
  const displayImageUrl = previewUrl ?? imageUrl;
  const hasNewPreview = Boolean(previewUrl);
  const isCover = variant === "cover";
  const avatarSizeClass =
    avatarSize === "sm" ? "size-20" : avatarSize === "md" ? "size-24" : avatarSize === "lg" ? "size-32" : "size-40";

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onError?.(labels.photoInvalidType);
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      onError?.(labels.photoTooLarge);
      return;
    }

    onFileSelect(file);
  }

  function handleRemovePreview() {
    onPreviewClear();
  }

  return (
    <div
      className={cn(
        isCover ? "w-full" : "flex flex-col items-center gap-3 sm:items-start sm:gap-6",
        className,
      )}
    >
      <div className={cn("relative", isCover ? cn("w-full", fill && "h-full") : undefined)}>
        <div
          className={cn(
            "overflow-hidden",
            isCover
              ? cn("w-full rounded-none", fill ? "h-full" : "h-36 sm:h-48")
              : cn(avatarSizeClass, "rounded-full"),
            !displayImageUrl && "bg-muted",
          )}
        >
          {displayImageUrl ? (
            isCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayImageUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <Avatar className="size-full rounded-full">
                <AvatarImage src={displayImageUrl} alt="" className="object-cover" />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            )
          ) : isCover ? (
            <div className="flex size-full items-center justify-center bg-muted">
              <Camera className="size-8 text-muted-foreground" aria-hidden />
            </div>
          ) : (
            <div className="flex size-full items-center justify-center">
              <Avatar className="size-full rounded-full">
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>

        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center bg-overlay/40 text-overlay-foreground opacity-0 transition-opacity",
            isCover ? "rounded-none" : "rounded-full",
            !disabled && "sm:hover:opacity-100",
            !disabled && "max-sm:opacity-100 max-sm:bg-overlay/25",
          )}
        >
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={disabled}
            onChange={handleImageChange}
          />
          <label
            htmlFor={inputId}
            aria-label={labels.photoChange}
            className={cn(
              "flex size-full cursor-pointer flex-col items-center justify-center gap-1 text-center",
              disabled && "cursor-not-allowed",
            )}
          >
            <Camera className={cn(isCover ? "size-8" : "size-9")} aria-hidden />
            <span className="text-xs font-medium">{labels.photoChange}</span>
          </label>
        </div>

        {hasNewPreview ? (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className={cn(
              "absolute size-8 rounded-full",
              isCover ? "bottom-2 left-2" : "bottom-0 left-0",
            )}
            onClick={handleRemovePreview}
            disabled={disabled}
            title={labels.photoRemovePreview}
            aria-label={labels.photoRemovePreview}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
