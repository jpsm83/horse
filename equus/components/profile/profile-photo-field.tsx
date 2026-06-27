"use client";

/**
 * Profile photo picker — circular preview, hover camera overlay, local file validation.
 * Parent owns upload state and submits via `updateUserProfile`.
 */

import { Camera, Trash2 } from "lucide-react";
import { useEffect, useId } from "react";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { cn } from "@/lib/utils";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type ProfilePhotoFieldProps = {
  imageUrl?: string;
  previewUrl?: string;
  initials: string;
  disabled?: boolean;
  onFileSelect: (file: File | undefined) => void;
  onPreviewClear: () => void;
};

export function ProfilePhotoField({
  imageUrl,
  previewUrl,
  initials,
  disabled = false,
  onFileSelect,
  onPreviewClear,
}: ProfilePhotoFieldProps) {
  const t = useTranslations("profile");
  const toast = useAppToast();
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
      toast.error(t("photoInvalidType"));
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(t("photoTooLarge"));
      return;
    }

    onFileSelect(file);
  }

  function handleRemovePreview() {
    onPreviewClear();
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-6">
      <div className="relative">
        <div
          className={cn(
            "size-24 overflow-hidden rounded-full sm:size-32",
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
                <AvatarFallback className="text-lg sm:text-xl">{initials}</AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>

        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity",
            !disabled && "hover:opacity-100",
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
            className={cn(
              "flex size-full cursor-pointer flex-col items-center justify-center gap-1 text-center",
              disabled && "cursor-not-allowed",
            )}
          >
            <Camera className="size-8 sm:size-9" aria-hidden />
            <span className="text-xs font-medium">{t("photoChange")}</span>
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
            title={t("photoRemovePreview")}
            aria-label={t("photoRemovePreview")}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>

      <div className="space-y-1 text-center sm:text-left">
        <p className="text-sm font-medium">{t("photoLabel")}</p>
        <p className="text-sm text-muted-foreground">{t("photoHint")}</p>
      </div>
    </div>
  );
}
