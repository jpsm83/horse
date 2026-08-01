/**
 * EntityChip — shared identity card for users, horses, and future entities.
 *
 * Presentational: callers supply title/subtitle/image. Always links to the
 * entity hub via entityHubPath (entityId is required).
 *
 * Display conventions:
 * - user: title = username (or display name), subtitle = email → /user/:id
 * - horse: title = horse name, subtitle = owner email → /horses/:id
 */

"use client";

import { Link2Off } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FlagIcon } from "@/components/shared/country-flag.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TableIconAction } from "@/components/table";
import {
  entityHubPath,
  type EntityChipEntityType,
} from "@/lib/navigation/entityPaths.ts";
import { cn } from "@/lib/utils";

export type { EntityChipEntityType };

export type EntityChipProps = {
  entityType: EntityChipEntityType;
  /** Required — chips always navigate to the entity hub. */
  entityId: string;
  /** Primary line: username (user) or horse name (horse). */
  title: string;
  /** Secondary line: user email, or owner email for a horse. */
  subtitle?: string;
  imageUrl?: string;
  /** ISO alpha-2 country code; shows a circular flag badge on the avatar. */
  countryCode?: string;
  clearLabel?: string;
  clearTooltip?: string;
  onClear?: () => void;
  clearDisabled?: boolean;
  className?: string;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function EntityChip({
  entityType,
  entityId,
  title,
  subtitle,
  imageUrl,
  countryCode,
  clearLabel,
  clearTooltip,
  onClear,
  clearDisabled = false,
  className,
}: EntityChipProps) {
  const href = entityHubPath(entityType, entityId);

  const identity = (
    <div className="flex items-center gap-6">
      <div className="relative size-18 shrink-0 overflow-visible">
        <Avatar className="size-18 rounded-full">
          {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
          <AvatarFallback className="bg-muted text-xs text-muted-foreground">
            {initialsFromName(title)}
          </AvatarFallback>
        </Avatar>
        {countryCode ? (
          <span className="pointer-events-none absolute bottom-1 -right-3 z-10 flex size-8 items-center justify-center rounded-full border-2 border-card bg-card shadow-sm">
            <FlagIcon code={countryCode} sizeClass="size-full" withBorder={false} />
          </span>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-md font-medium text-foreground">{title}</span>
        {subtitle ? (
          <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
        ) : null}
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-md border border-border p-2 hover:bg-accent/50",
        className,
      )}
    >
      {href ? (
        <Link
          href={href}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md"
        >
          {identity}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{identity}</div>
      )}
      {onClear && clearLabel ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <TableIconAction
                className="text-destructive hover:text-destructive-foreground"
                aria-label={clearLabel}
                disabled={clearDisabled}
                onClick={onClear}
              >
                <Link2Off className="h-4 w-4" />
              </TableIconAction>
            }
          />
          <TooltipContent>
            {clearTooltip ?? clearLabel}
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}
