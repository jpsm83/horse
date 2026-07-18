"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PublicMedia } from "@/lib/services/horseMediaService";

type LightboxDialogProps = {
  items: PublicMedia[];
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function LightboxDialog({
  items,
  currentIndex,
  open,
  onOpenChange,
  onPrevious,
  onNext,
}: LightboxDialogProps) {
  const t = useTranslations("horseMedia");
  const item = items[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] h-[95vh] max-h-[95vh] p-0 gap-0 bg-black/95 border-0">
        <DialogTitle className="sr-only">
          {item.title ?? t("addMedia")}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {item.description ?? ""}
        </DialogDescription>

        <div className="relative flex items-center justify-center w-full h-full">
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

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 text-white hover:bg-white/20 rounded-full"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-6" />
          </Button>
        </div>

        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          {item.title && (
            <p className="text-base font-medium text-white">{item.title}</p>
          )}
          {item.description && (
            <p className="text-sm text-white/80 mt-1">{item.description}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
