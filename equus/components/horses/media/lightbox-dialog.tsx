"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, X, Eye, EyeOff, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PublicMedia } from "@/lib/services/mediaService";

type LightboxDialogProps = {
  items: PublicMedia[];
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleVisibility: () => void;
  onRequestDelete: () => void;
};

export function LightboxDialog({
  items,
  currentIndex,
  open,
  onOpenChange,
  onPrevious,
  onNext,
  onToggleVisibility,
  onRequestDelete,
}: LightboxDialogProps) {
  const t = useTranslations("horseMedia");
  const item = items[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none sm:max-w-none w-[90vw] h-[90vh] p-0 gap-0 bg-black/95 border-0 overflow-hidden">
        <DialogTitle className="sr-only">
          {item.title ?? t("addMedia")}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {item.description ?? ""}
        </DialogDescription>

        <div className="absolute inset-0 flex items-center justify-center">
          {hasPrev && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 z-10 text-white hover:bg-white/20 rounded-full"
              onClick={onPrevious}
            >
              <ChevronLeft className="size-8" />
            </Button>
          )}

          {item.type === "video" ? (
            <video
              src={item.url}
              controls
              className="max-w-full max-h-full object-contain"
              autoPlay
            />
          ) : (
            <img
              src={item.thumbnailUrl ?? item.url}
              alt={item.title ?? ""}
              className="max-w-full max-h-full object-contain"
            />
          )}

          {hasNext && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 z-10 text-white hover:bg-white/20 rounded-full"
              onClick={onNext}
            >
              <ChevronRight className="size-8" />
            </Button>
          )}

          <div className="absolute top-2 right-2 z-10 flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility();
              }}
            >
              {item.isVisibleOnHub !== false ? (
                <Eye className="size-5" />
              ) : (
                <EyeOff className="size-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onRequestDelete();
              }}
            >
              <Trash2 className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full"
              onClick={(e) => {e.stopPropagation(); onOpenChange(false)}}
            >
              <X className="size-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
