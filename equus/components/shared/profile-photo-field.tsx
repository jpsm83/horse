"use client";

/**
 * Profile photo picker — circular preview, hover overlay on desktop, tap-to-change on mobile.
 * Parent owns upload state and submit.
 * Fully reusable — accepts display strings via `labels` prop, no i18n namespace coupling.
 *
 * Used by:
 * - `ProfileForm` (profile page)
 * - `CreateHorseForm` (horse create page)
 */

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
  onFileSelect,
  onPreviewClear,
  onError,
  labels: labelsProp,
}: ProfilePhotoFieldProps) {
  const labels = { ...defaultLabels, ...labelsProp };
  const inputId = useId();
  const displayImageUrl = previewUrl ?? imageUrl;
  const hasNewPreview = Boolean(previewUrl);

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
    <div className="flex flex-col items-center gap-3 sm:items-start sm:gap-6">
      <div className="relative">
        <div
          className={cn(
            "size-32 overflow-hidden rounded-full",
            !displayImageUrl && "bg-muted",
          )}
        >
          {displayImageUrl ? (
            <Avatar className="size-full rounded-full">
              <AvatarImage src={displayImageUrl} alt="" className="object-cover" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
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
            "absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity",
            !disabled && "sm:hover:opacity-100",
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
            <Camera className="size-9" aria-hidden />
            <span className="text-xs font-medium">{labels.photoChange}</span>
          </label>
        </div>

        {hasNewPreview ? (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute bottom-0 left-0 size-8 rounded-full"
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
