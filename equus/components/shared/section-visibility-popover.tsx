/**
 * SectionVisibilityPopover — reusable popover for per-section visibility control.
 *
 * Attached to section headers across all tabs. Controls who can see the section
 * and (in the future) whether it appears on the Hub feed.
 *
 * Only registered Equus users with claimed entity profiles can be selected
 * as individual viewers — see AGENTS.md business rules.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Users, Globe, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export type VisibilityMode = "owner" | "entities" | "public";

export type SectionVisibility = {
  mode: VisibilityMode;
  entityIds?: string[];
};

type SectionVisibilityPopoverProps = {
  sectionKey: string;
  current: SectionVisibility;
  onChange: (visibility: SectionVisibility) => void;
};

const MODE_ICONS: Record<VisibilityMode, typeof Lock> = {
  owner: Lock,
  entities: Users,
  public: Globe,
};

export function SectionVisibilityPopover({
  sectionKey,
  current,
  onChange,
}: SectionVisibilityPopoverProps) {
  const t = useTranslations("visibility");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<VisibilityMode>(current.mode);

  const Icon = MODE_ICONS[current.mode];

  function handleSave() {
    onChange({ mode, entityIds: current.entityIds });
    setOpen(false);
  }

  const modeLabel = t(`modes.${current.mode}`);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="inline-flex items-center gap-1 text-xs text-muted-foreground h-auto px-1 py-0.5 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
        <Icon className="h-3 w-3" />
        <span className="sr-only sm:not-sr-only">{modeLabel}</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-4">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium">{t("title")}</h4>
            <p className="text-xs text-muted-foreground">{t("description")}</p>
          </div>

          <RadioGroup value={mode} onValueChange={(v) => setMode(v as VisibilityMode)}>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="owner" id={`${sectionKey}-owner`} />
              <Label htmlFor={`${sectionKey}-owner`} className="text-sm">{t("modes.owner")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="entities" id={`${sectionKey}-entities`} />
              <Label htmlFor={`${sectionKey}-entities`} className="text-sm">{t("modes.entities")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="public" id={`${sectionKey}-public`} />
              <Label htmlFor={`${sectionKey}-public`} className="text-sm">{t("modes.public")}</Label>
            </div>
          </RadioGroup>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="button" size="sm" onClick={handleSave}>
              {t("save")}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
