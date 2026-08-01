/**
 * SectionVisibilityPopover — dumb UI for per-section visibility modes.
 *
 * Does not persist. Parent (`SectionVisibilityControl`) owns onChange behavior.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, Users, Globe, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type {
  SectionVisibility,
  VisibilityMode,
} from "@/lib/visibility/sectionVisibility.ts";

export type { SectionVisibility, VisibilityMode };

type SectionVisibilityPopoverProps = {
  sectionKey: string;
  current: SectionVisibility;
  onChange: (visibility: SectionVisibility) => void;
  isPending?: boolean;
};

const MODE_ICONS: Record<VisibilityMode, typeof Lock> = {
  owner: Lock,
  relationship: Users,
  public: Globe,
};

export function SectionVisibilityPopover({
  sectionKey,
  current,
  onChange,
  isPending = false,
}: SectionVisibilityPopoverProps) {
  const t = useTranslations("visibility");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<VisibilityMode>(current.mode);
  const [lastCurrentMode, setLastCurrentMode] = useState(current.mode);

  // Re-sync the local draft to the persisted mode when the source value changes
  // (adjusting state during render — the recommended replacement for a
  // setState-in-effect sync; see React docs "You Might Not Need an Effect").
  if (lastCurrentMode !== current.mode) {
    setLastCurrentMode(current.mode);
    setMode(current.mode);
  }

  const Icon = MODE_ICONS[current.mode] ?? Eye;

  function handleModeChange(next: VisibilityMode) {
    setMode(next);
    if (next === current.mode) {
      setOpen(false);
      return;
    }
    onChange({ mode: next });
    setOpen(false);
  }

  const modeLabel = t(`modes.${current.mode}`);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={isPending}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground h-auto px-1 py-0.5 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors disabled:opacity-50"
      >
        <Icon className="h-3 w-3" />
        <span className="sr-only sm:not-sr-only">{modeLabel}</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-4">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium">{t("title")}</h4>
            <p className="text-xs text-muted-foreground">{t("description")}</p>
          </div>

          <RadioGroup
            value={mode}
            onValueChange={(v) => handleModeChange(v as VisibilityMode)}
            disabled={isPending}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="owner" id={`${sectionKey}-owner`} />
              <Label htmlFor={`${sectionKey}-owner`} className="text-sm">{t("modes.owner")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="relationship" id={`${sectionKey}-relationship`} />
              <Label htmlFor={`${sectionKey}-relationship`} className="text-sm">
                {t("modes.relationship")}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="public" id={`${sectionKey}-public`} />
              <Label htmlFor={`${sectionKey}-public`} className="text-sm">{t("modes.public")}</Label>
            </div>
          </RadioGroup>

          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
