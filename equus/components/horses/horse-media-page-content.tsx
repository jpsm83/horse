"use client";

import { useTranslations } from "next-intl";
import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { SectionVisibilityPopover } from "@/components/ui/section-visibility-popover.tsx";
import { Button } from "@/components/ui/button";
import { useHorseMedia } from "@/hooks/queries/useHorseMedia.ts";

type Props = { horseId: string };

export function HorseMediaPageContent({ horseId }: Props) {
  const t = useTranslations("horseMedia");
  const { data: media = [] } = useHorseMedia(horseId);

  return (
    <HorsePageShell horseId={horseId} title={t("title")}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        <SectionVisibilityPopover
          sectionKey="media"
          current={{ mode: "public" }}
          onChange={() => {}}
        />
      </div>

      {media.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noMedia")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {media.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-lg border">
              {item.type === "image" ? (
                <img
                  src={item.thumbnailUrl ?? item.url}
                  alt={item.title ?? ""}
                  className="h-40 w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-40 items-center justify-center bg-muted">
                  <span className="text-muted-foreground">{item.type}</span>
                </div>
              )}
              {item.title && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-xs text-white truncate">{item.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </HorsePageShell>
  );
}
