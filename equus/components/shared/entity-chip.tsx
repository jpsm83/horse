/**
 * EntityChip — shared identity card for users, horses, and future entities.
 *
 * Presentational: callers supply title/subtitle/image. Links via entityHubPath
 * when entityId is set and a hub route exists for that type.
 *
 * Display conventions:
 * - user: title = username (or display name), subtitle = email → /user/:id
 * - horse: title = horse name, subtitle = owner email → /horses/:id
 */

"use client";

import { Link2Off } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  entityId?: string;
  /** Primary line: username (user) or horse name (horse). */
  title: string;
  /** Secondary line: user email, or owner email for a horse. */
  subtitle?: string;
  imageUrl?: string;
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
  clearLabel,
  clearTooltip,
  onClear,
  clearDisabled = false,
  className,
}: EntityChipProps) {
  const href = entityHubPath(entityType, entityId);

  const identity = (
    <>
      <Avatar className="size-10 shrink-0 rounded-full">
        {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
        <AvatarFallback className="bg-muted text-xs text-muted-foreground">
          {initialsFromName(title)}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-foreground">{title}</span>
        {subtitle ? (
          <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
        ) : null}
      </div>
    </>
  );

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-md border border-border px-2 py-1.5 hover:bg-accent/50",
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
